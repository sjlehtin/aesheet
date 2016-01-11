import sheet.models
from sheet.rest import serializers
from rest_framework import generics, viewsets, mixins, permissions, status
from django.http import Http404
import sheet.models as models
from rest_framework.decorators import detail_route
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
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

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            for field, new_value in serializer.validated_data.items():
                old_value = getattr(instance, field)
                if isinstance(old_value, int):
                    change = new_value - old_value
                else:
                    change = 0
                log_stat_change(instance, request, field, change)
            self.perform_update(serializer)
        return Response(serializer.data)


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

    def get_queryset(self):
        return self.character.skills.all()


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
