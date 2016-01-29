import sheet.models
from sheet.rest import serializers
from rest_framework import generics, viewsets, mixins, permissions, status
from django.http import Http404
import sheet.models as models
from rest_framework.decorators import detail_route
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from rest_framework import exceptions
from django.db import transaction
from sheet.forms import log_stat_change
import logging

logger = logging.getLogger(__name__)


class IsAccessible(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.access_allowed(request.user)


class WeaponAmmunitionList(generics.ListAPIView):
    serializer_class = serializers.AmmunitionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all the purchases for
        the user as determined by the username portion of the URL.
        """
        weapon = self.kwargs['firearm']
        try:
            weapon = sheet.models.BaseFirearm.objects.get(name=weapon)
        except sheet.models.BaseFirearm.DoesNotExist:
            raise Http404, "Specified firearm does not exist"

        return sheet.models.Ammunition.objects.filter(
            label__in=weapon.get_ammunition_types())


class SheetViewSet(mixins.RetrieveModelMixin,
                   mixins.UpdateModelMixin,
                   mixins.ListModelMixin,
                   viewsets.GenericViewSet):
    queryset = sheet.models.Sheet.objects.all()
    serializer_class = serializers.SheetSerializer
    permission_classes = [permissions.IsAuthenticated, IsAccessible]

    def get_queryset(self):
        return models.Sheet.objects.prefetch_related('character__edges',
                                                     'character__edges__edge',
                                                     'spell_effects',
                                                     'weapons__base',
                                                     'weapons__quality',
                                                     'ranged_weapons__base',
                                                     'ranged_weapons__quality',
                                                     'miscellaneous_items',
                                                     'character__campaign',
                                                     ).all()

    @detail_route(methods=['get'])
    def movement_rates(self, request, pk=None):
        try:
            sheet = models.Sheet.objects.get(pk=pk)
        except models.Sheet.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        rates = sheet.movement_rates()
        return Response(dict([(ff, getattr(rates, ff)())
                              for ff in dir(rates)
                              if not ff.startswith('_') and
                              callable(getattr(rates, ff))]))


class CharacterViewSet(mixins.RetrieveModelMixin,
                       mixins.UpdateModelMixin,
                       mixins.ListModelMixin,
                       viewsets.GenericViewSet):
    queryset = sheet.models.Character.objects.all()
    serializer_class = serializers.CharacterSerializer
    permission_classes = [permissions.IsAuthenticated, IsAccessible]

    def get_queryset(self):
        return models.Character.objects.prefetch_related('edges',
                                                         'edges__edge',).all()

    def perform_update(self, serializer):
        instance = self.get_object()
        with transaction.atomic():
            for field, new_value in serializer.validated_data.items():
                old_value = getattr(instance, field)
                if isinstance(old_value, int):
                    change = new_value - old_value
                else:
                    change = 0
                log_stat_change(instance, self.request, field, change)
            super(CharacterViewSet, self).perform_update(serializer)


class EdgeLevelViewSet(viewsets.ModelViewSet):
    queryset = sheet.models.EdgeLevel.objects.all()
    serializer_class = serializers.EdgeLevelSerializer
    permission_classes = [permissions.IsAuthenticated]


class SkillViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def initialize_request(self, request, *args, **kwargs):
        if 'campaign_pk' in self.kwargs:
            campaign = models.Campaign.objects.get(pk=self.kwargs[
                'campaign_pk'])
            self.tech_levels = [tl['id'] for tl in
                                campaign.tech_levels.values('id')]
        else:
            self.tech_levels = []
        return super(SkillViewSet, self).initialize_request(
                request, *args, **kwargs)

    def get_queryset(self):
        qs = models.Skill.objects.prefetch_related('required_skills',
                                                   'required_edges').all()
        if self.tech_levels:
            logger.info("filtering with tech_levels: {}".format(
                    self.tech_levels))
            qs = qs.filter(tech_level__in=self.tech_levels)
        return qs


class FirearmViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.BaseFirearmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def initialize_request(self, request, *args, **kwargs):
        if 'campaign_pk' in self.kwargs:
            campaign = models.Campaign.objects.get(pk=self.kwargs[
                'campaign_pk'])
            self.tech_levels = [tl['id'] for tl in
                                campaign.tech_levels.values('id')]
        else:
            self.tech_levels = []
        return super(FirearmViewSet, self).initialize_request(
                request, *args, **kwargs)

    def get_queryset(self):
        qs = models.BaseFirearm.objects.all()
        if self.tech_levels:
            logger.info("filtering with tech_levels: {}".format(
                    self.tech_levels))
            qs = qs.filter(tech_level__in=self.tech_levels)
        return qs


class ListPermissionMixin(object):
    """
    The `list` method of ListModelMixin does not check object
    permissions.  I am unsure whether it is a bug or an optimization,
    and therefore intended, but for situations like here, where the
    intention is to hide a private character from other users,
    the mixin does not work in the desired manner.

    This mixin implements the required permission checks.
    """
    permission_classes = [permissions.IsAuthenticated, IsAccessible]

    def list(self, request, *args, **kwargs):
        if not self.containing_object.access_allowed(request.user):
            return Response(data={"detail": "You do not have permission to "
                                           "list these objects."},
                                           status=403)
        else:
            return super(ListPermissionMixin, self).list(request, *args,
                                                         **kwargs)


class CharacterSkillViewSet(ListPermissionMixin, viewsets.ModelViewSet):
    serializer_class = serializers.CharacterSkillSerializer

    def initialize_request(self, request, *args, **kwargs):
        self.character = models.Character.objects.get(
                pk=self.kwargs['character_pk'])
        self.containing_object = self.character
        return super(CharacterSkillViewSet, self).initialize_request(
                request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        serializer = super(CharacterSkillViewSet, self).get_serializer(*args, **kwargs)
        if isinstance(serializer, serializers.CharacterSkillSerializer):
            serializer.fields['character'].default = self.character
            serializer.fields['character'].read_only = True
            # The skill will not be changed with this API after creation.
            if serializer.instance is not None:
                serializer.fields['skill'].read_only = True

        return serializer

    def get_queryset(self):
        return self.character.skills.all()

    def perform_update(self, serializer):
        instance = self.get_object()
        with transaction.atomic():
            if 'level' in serializer.validated_data:
                new_level = serializer.validated_data['level']
                self.character.add_skill_log_entry(
                        instance.skill,
                        new_level,
                        request=self.request,
                        amount=new_level - instance.level)

            super(CharacterSkillViewSet, self).perform_update(serializer)

    def perform_create(self, serializer):
        with transaction.atomic():
            self.character.add_skill_log_entry(serializer.validated_data[
                                                   'skill'],
                                               serializer.validated_data[
                                                   'level'],
                                               request=self.request)
            super(CharacterSkillViewSet, self).perform_create(serializer)

    def perform_destroy(self, instance):
        with transaction.atomic():
            self.character.add_skill_log_entry(instance.skill,
                                               instance.level,
                                               request=self.request,
                                               removed=True)
            super(CharacterSkillViewSet, self).perform_destroy(instance)


class InventoryEntryViewSet(ListPermissionMixin, viewsets.ModelViewSet):
    """
    Inventory for a sheet.

    Requires sheet_pk argument from, e.g., urlconf.
    """
    serializer_class = serializers.InventoryEntrySerializer

    def initialize_request(self, request, *args, **kwargs):
        self.sheet = models.Sheet.objects.select_related(
                'character__owner').get(pk=self.kwargs['sheet_pk'])
        self.containing_object = self.sheet
        return super(InventoryEntryViewSet, self).initialize_request(
                request, *args, **kwargs)

    def get_queryset(self):
        return models.InventoryEntry.objects.select_related(
            'sheet__character__owner').filter(sheet=self.sheet)

    def perform_create(self, serializer):
        serializer.save(sheet=self.sheet)


class SheetFirearmViewSet(viewsets.ModelViewSet):
    #serializer_class = serializers.SheetFirearmListSerializer

    def initialize_request(self, request, *args, **kwargs):
        self.sheet = models.Sheet.objects.get(
                pk=self.kwargs['sheet_pk'])
        self.containing_object = self.sheet
        return super(SheetFirearmViewSet, self).initialize_request(
                request, *args, **kwargs)

    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.SheetFirearmCreateSerializer
        else:
            return serializers.SheetFirearmListSerializer

    def get_queryset(self):
        return self.sheet.firearms.all()

    def perform_update(self, serializer):
        # TODO: not supported for Firearm.  Will be supported for
        # SheetFirearm.
        raise exceptions.MethodNotAllowed("Update not supported yet")

    def perform_create(self, serializer):
        super(SheetFirearmViewSet, self).perform_create(serializer)
        self.sheet.firearms.add(serializer.instance)

    def perform_destroy(self, instance):
        self.sheet.firearms.remove(instance)
        

class SheetWeaponViewSet(viewsets.ModelViewSet):
    #serializer_class = serializers.SheetWeaponListSerializer

    def initialize_request(self, request, *args, **kwargs):
        self.sheet = models.Sheet.objects.get(
                pk=self.kwargs['sheet_pk'])
        self.containing_object = self.sheet
        return super(SheetWeaponViewSet, self).initialize_request(
                request, *args, **kwargs)

    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.SheetWeaponCreateSerializer
        else:
            return serializers.SheetWeaponListSerializer

    def get_queryset(self):
        return self.sheet.weapons.all()

    def perform_update(self, serializer):
        # TODO: not supported for Weapon.  Will be supported for
        # SheetWeapon.
        raise exceptions.MethodNotAllowed("Update not supported yet")

    def perform_create(self, serializer):
        super(SheetWeaponViewSet, self).perform_create(serializer)
        self.sheet.weapons.add(serializer.instance)

    def perform_destroy(self, instance):
        self.sheet.weapons.remove(instance)