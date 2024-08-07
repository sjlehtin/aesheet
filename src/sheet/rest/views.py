import sheet.models
from sheet.rest import serializers
from rest_framework import generics, viewsets, mixins, permissions
from rest_framework.decorators import action
from django.http import Http404
import sheet.models as models
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from rest_framework import exceptions
from django.db import transaction
from django.db.models import Q
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
        weapon = self.kwargs['firearm']
        try:
            weapon = sheet.models.BaseFirearm.objects.get(name=weapon)
        except sheet.models.BaseFirearm.DoesNotExist:
            raise Http404("Specified firearm does not exist")

        return sheet.models.Ammunition.objects.filter(
            calibre__in=weapon.ammunition_types.all())


class SheetViewSet(mixins.RetrieveModelMixin,
                   mixins.UpdateModelMixin,
                   mixins.ListModelMixin,
                   mixins.DestroyModelMixin,
                   viewsets.GenericViewSet):
    queryset = sheet.models.Sheet.objects.select_related('character__campaign_id').all()
    serializer_class = serializers.SheetSerializer
    permission_classes = [permissions.IsAuthenticated, IsAccessible]

    def get_queryset(self):
        return models.Sheet.objects.prefetch_related('character__edges',
                                                     'character__edges__edge',
                                                     'weapons__base',
                                                     'weapons__quality',
                                                     'ranged_weapons__base',
                                                     'ranged_weapons__quality',
                                                     'miscellaneous_items',
                                                     'character__campaign',
                                                     ).filter(~Q(character__private=True) | Q(character__owner=self.request.user))

    def perform_update(self, serializer):
        instance = self.get_object()
        with transaction.atomic():
            if "stamina_damage" in serializer.validated_data:
                new_value = serializer.validated_data["stamina_damage"]
                old_value = instance.stamina_damage
                change = new_value - old_value
                if change > 0:
                    instance.character.add_log_entry(
                        f"{instance.character.name} received {change} "
                        "points of stamina damage.",
                        sheet=instance, request=self.request)
                elif change < 0:
                    instance.character.add_log_entry(
                        f"{instance.character.name} was healed {-change} "
                        "points of stamina damage.",
                        sheet=instance, request=self.request)

            super(SheetViewSet, self).perform_update(serializer)

    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        # TODO: owner vs user wrt private
        original = self.get_object()
        new = original.clone(request=request)

        return Response(self.get_serializer(new).data)


class SheetSetViewSet(mixins.RetrieveModelMixin,
                   mixins.UpdateModelMixin,
                   mixins.ListModelMixin,
                   mixins.DestroyModelMixin,
                   viewsets.GenericViewSet):
    queryset = sheet.models.SheetSet.objects.all()
    serializer_class = serializers.SheetSetSerializer
    permission_classes = [permissions.IsAuthenticated, IsAccessible]



class CharacterViewSet(mixins.RetrieveModelMixin,
                       mixins.UpdateModelMixin,
                       mixins.ListModelMixin,
                       viewsets.GenericViewSet):
    queryset = sheet.models.Character.objects.all()
    serializer_class = serializers.CharacterSerializer
    permission_classes = [permissions.IsAuthenticated, IsAccessible]

    def get_queryset(self):
        return (models.Character.objects
        .prefetch_related('edges', 'edges__edge',)
        .filter(~Q(private=True) | Q(owner=self.request.user)))

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


class CampaignMixin(object):
    def initialize_request(self, request, *args, **kwargs):
        if 'campaign_pk' in self.kwargs:
            campaign = models.Campaign.objects.get(pk=self.kwargs[
                'campaign_pk'])
            self.tech_levels = [tl['id'] for tl in
                                campaign.tech_levels.values('id')]
        else:
            self.tech_levels = []
        return super(CampaignMixin, self).initialize_request(
                request, *args, **kwargs)

    def get_base_queryset(self):
        return self.serializer_class.Meta.model.objects.all()

    def get_queryset(self):
        qs = self.get_base_queryset()
        if self.tech_levels:
            logger.info("filtering with tech_levels: {}".format(
                    self.tech_levels))
            qs = qs.filter(tech_level__in=self.tech_levels)
        return qs


class SkillViewSet(CampaignMixin, viewsets.ModelViewSet):
    serializer_class = serializers.SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_base_queryset(self):
        return models.Skill.objects.prefetch_related('required_skills',
                                                     'required_edges').all()


class FirearmViewSet(CampaignMixin, viewsets.ModelViewSet):
    serializer_class = serializers.BaseFirearmSerializer
    permission_classes = [permissions.IsAuthenticated]


class WeaponTemplateViewSet(CampaignMixin, viewsets.ModelViewSet):
    serializer_class = serializers.WeaponTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]


class WeaponQualityViewSet(CampaignMixin, viewsets.ModelViewSet):
    serializer_class = serializers.WeaponQualitySerializer
    permission_classes = [permissions.IsAuthenticated]


class RangedWeaponTemplateViewSet(CampaignMixin, viewsets.ModelViewSet):
    serializer_class = serializers.RangedWeaponTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]


class WeaponViewSet(CampaignMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.WeaponCreateSerializer
        else:
            return serializers.WeaponListSerializer

    def get_queryset(self):
        qs = models.Weapon.objects.select_related().all()
        if self.tech_levels:
            logger.info("filtering with tech_levels: {}".format(
                    self.tech_levels))
            qs = qs.filter(base__tech_level__in=self.tech_levels)
            qs = qs.filter(quality__tech_level__in=self.tech_levels)
        return qs


class RangedWeaponViewSet(CampaignMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.RangedWeaponCreateSerializer
        else:
            return serializers.RangedWeaponListSerializer

    def get_queryset(self):
        qs = models.RangedWeapon.objects.select_related().all()
        if self.tech_levels:
            logger.info("filtering with tech_levels: {}".format(
                    self.tech_levels))
            qs = qs.filter(base__tech_level__in=self.tech_levels)
            qs = qs.filter(quality__tech_level__in=self.tech_levels)
        return qs


class ArmorTemplateViewSet(CampaignMixin, viewsets.ModelViewSet):
    serializer_class = serializers.ArmorTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]


class ArmorQualityViewSet(CampaignMixin, viewsets.ModelViewSet):
    serializer_class = serializers.ArmorQualitySerializer
    permission_classes = [permissions.IsAuthenticated]


class ArmorViewSet(CampaignMixin, viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    create_serializer = serializers.ArmorCreateSerializer
    list_serializer = serializers.ArmorListSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return self.create_serializer
        else:
            return self.list_serializer

    def get_queryset(self):
        qs = models.Armor.objects.select_related().all()
        if self.tech_levels:
            logger.info("filtering with tech_levels: {}".format(
                    self.tech_levels))
            qs = qs.filter(base__tech_level__in=self.tech_levels)
            qs = qs.filter(quality__tech_level__in=self.tech_levels)
        return qs


class TransientEffectViewSet(CampaignMixin, viewsets.ModelViewSet):
    serializer_class = serializers.TransientEffectSerializer
    permission_classes = [permissions.IsAuthenticated]


class MiscellaneousItemViewSet(ArmorViewSet):
    create_serializer = serializers.MiscellaneousItemCreateSerializer
    list_serializer = serializers.MiscellaneousItemListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = models.MiscellaneousItem.objects.select_related().all()
        if self.tech_levels:
            logger.info("filtering with tech_levels: {}".format(
                self.tech_levels))
            qs = qs.filter(tech_level__in=self.tech_levels)
        return qs


class FirearmAddOnViewSet(ArmorViewSet):
    create_serializer = serializers.FirearmAddOnCreateSerializer
    list_serializer = serializers.FirearmAddOnListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = models.FirearmAddOn.objects.select_related().all()
        if self.tech_levels:
            logger.info("filtering with tech_levels: {}".format(
                self.tech_levels))
            qs = qs.filter(tech_level__in=self.tech_levels)
        return qs


class ScopeViewSet(ArmorViewSet):
    create_serializer = serializers.ScopeCreateSerializer
    list_serializer = serializers.ScopeListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = models.Scope.objects.select_related().all()
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
        serializer = super(CharacterSkillViewSet, self).get_serializer(
                *args, **kwargs)
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
            serializer.validated_data['character'] = self.character
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


class SheetViewSetMixin(ListPermissionMixin):
    # TODO: until all sheet* objects are handled through intermediate
    # objects, we can't use IsAccessible here.  The implicit tables do not
    # allow for object permissions.
    permission_classes = [permissions.IsAuthenticated]

    def initialize_request(self, request, *args, **kwargs):
        self.sheet = models.Sheet.objects.get(
                pk=self.kwargs['sheet_pk'])
        self.containing_object = self.sheet
        return super(SheetViewSetMixin, self).initialize_request(
                request, *args, **kwargs)


class SheetFirearmViewSet(SheetViewSetMixin, viewsets.ModelViewSet):

    def get_serializer_class(self):
        if self.action == 'create' or self.action == "partial_update":
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.SheetFirearmCreateSerializer
        else:
            return serializers.SheetFirearmListSerializer

    def get_queryset(self):
        return models.SheetFirearm.objects.filter(sheet=self.sheet)
        # self.sheet.firearms.all()

    def get_serializer(self, *args, **kwargs):
        serializer = super(SheetFirearmViewSet, self).get_serializer(
                *args, **kwargs)
        if self.action == 'create' or self.action == "partial_update":
            # ListSerializer does not have the fields.
            serializer.fields['sheet'].default = self.sheet
            serializer.fields['sheet'].read_only = True
            # The effect will not be changed with this API after creation.
            if serializer.instance is not None:
                serializer.fields['base'].read_only = True

        return serializer

    def perform_create(self, serializer):
        serializer.validated_data['sheet'] = self.sheet
        super(SheetFirearmViewSet, self).perform_create(
            serializer)


class SheetWeaponViewSet(SheetViewSetMixin, viewsets.ModelViewSet):

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


class SheetRangedWeaponViewSet(SheetViewSetMixin, viewsets.ModelViewSet):

    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.SheetRangedWeaponCreateSerializer
        else:
            return serializers.SheetRangedWeaponListSerializer

    def get_queryset(self):
        return self.sheet.ranged_weapons.all()

    def perform_update(self, serializer):
        # TODO: not supported for Weapon.  Will be supported for
        # SheetWeapon.
        raise exceptions.MethodNotAllowed("Update not supported yet")

    def perform_create(self, serializer):
        super(SheetRangedWeaponViewSet, self).perform_create(serializer)
        self.sheet.ranged_weapons.add(serializer.instance)

    def perform_destroy(self, instance):
        self.sheet.ranged_weapons.remove(instance)


class SheetArmorViewSet(SheetViewSetMixin, viewsets.ModelViewSet):

    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.SheetArmorCreateSerializer
        else:
            return serializers.SheetArmorListSerializer

    def get_queryset(self):
        return sheet.models.Armor.objects.filter(id=self.sheet.armor_id)

    def perform_update(self, serializer):
        # TODO: not supported for Armor.  Will be supported for
        # SheetArmor.
        raise exceptions.MethodNotAllowed("Update not supported yet")

    def perform_create(self, serializer):
        super(SheetArmorViewSet, self).perform_create(serializer)
        self.sheet.armor = serializer.instance
        self.sheet.save()
        
    def perform_destroy(self, instance):
        self.sheet.armor = None
        self.sheet.save()


class SheetHelmViewSet(SheetViewSetMixin, viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.SheetHelmCreateSerializer
        else:
            return serializers.SheetArmorListSerializer

    def get_queryset(self):
        return sheet.models.Armor.objects.filter(id=self.sheet.helm_id)

    def perform_update(self, serializer):
        # TODO: not supported for Helm.  Will be supported for
        # SheetHelm.
        raise exceptions.MethodNotAllowed("Update not supported yet")

    def perform_create(self, serializer):
        super(SheetHelmViewSet, self).perform_create(serializer)
        self.sheet.helm = serializer.instance
        self.sheet.save()

    def perform_destroy(self, instance):
        self.sheet.helm = None
        self.sheet.save()


class SheetTransientEffectViewSet(SheetViewSetMixin, viewsets.ModelViewSet):
    create_serializer = serializers.SheetTransientEffectCreateSerializer
    list_serializer = serializers.SheetTransientEffectListSerializer
    model = models.SheetTransientEffect

    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return self.create_serializer
        else:
            return self.list_serializer

    def get_serializer(self, *args, **kwargs):
        serializer = super(SheetTransientEffectViewSet, self).get_serializer(
                *args, **kwargs)
        if not kwargs.get('many'):
            # ListSerializer does not have the fields.
            serializer.fields['sheet'].default = self.sheet
            serializer.fields['sheet'].read_only = True
            # The effect will not be changed with this API after creation.
            if serializer.instance is not None:
                serializer.fields['effect'].read_only = True

        return serializer

    def get_queryset(self):
        return self.model.objects.filter(sheet=self.sheet)

    def perform_update(self, serializer):
        # Update should not be allowed for sheet or effect fields, but just
        # the changeable fields.
        raise exceptions.MethodNotAllowed("Update not supported yet")

    def perform_create(self, serializer):
        serializer.validated_data['sheet'] = self.sheet
        super(SheetTransientEffectViewSet, self).perform_create(
            serializer)


class SheetFirearmMagazineViewSet(SheetViewSetMixin, viewsets.ModelViewSet):
    create_serializer = serializers.SheetFirearmMagazineCreateSerializer
    list_serializer = serializers.SheetFirearmMagazineListSerializer
    model = models.SheetFirearmMagazine

    def initialize_request(self, request, *args, **kwargs):
        request = super(SheetFirearmMagazineViewSet, self).initialize_request(
                request, *args, **kwargs)
        self.sheet = models.Sheet.objects.get(
                pk=self.kwargs['sheet_pk'])
        self.sheet_firearm = models.SheetFirearm.objects.get(
                pk=self.kwargs['firearm_pk'])
        if self.sheet_firearm.sheet != self.sheet:
            raise Http404("Invalid magazine")
        self.containing_object = self.sheet
        return request

    def get_serializer_class(self):
        if self.action == 'create' or self.action == "partial_update":
            # When creating new, we do not want the full nested
            # representation, just id's.
            return self.create_serializer
        else:
            return self.list_serializer

    def get_serializer(self, *args, **kwargs):
        serializer = super(SheetFirearmMagazineViewSet, self).get_serializer(
                *args, **kwargs)
        if not kwargs.get('many'):
            # ListSerializer does not have the fields.
            serializer.fields['sheet_firearm'].default = self.sheet_firearm
            serializer.fields['sheet_firearm'].read_only = True

        return serializer

    def get_queryset(self):
        return self.model.objects.filter(sheet_firearm=self.sheet_firearm)

    def perform_create(self, serializer):
        serializer.validated_data['sheet_firearm'] = self.sheet_firearm
        super(SheetFirearmMagazineViewSet, self).perform_create(
            serializer)


class SheetMiscellaneousItemViewSet(SheetTransientEffectViewSet):
    create_serializer = serializers.SheetMiscellaneousItemCreateSerializer
    list_serializer = serializers.SheetMiscellaneousItemListSerializer
    model = models.SheetMiscellaneousItem


class CharacterEdgeViewSet(ListPermissionMixin, viewsets.ModelViewSet):
    serializer_class = serializers.CharacterEdgeCreateSerializer

    def initialize_request(self, request, *args, **kwargs):
        self.character = models.Character.objects.get(
                pk=self.kwargs['character_pk'])
        self.containing_object = self.character
        return super(CharacterEdgeViewSet, self).initialize_request(
                request, *args, **kwargs)

    def get_queryset(self):
        return models.CharacterEdge.objects.filter(character=self.character)

    def get_serializer_class(self):
        if self.action == 'create':
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.CharacterEdgeCreateSerializer
        else:
            return serializers.CharacterEdgeListSerializer

    def get_serializer(self, *args, **kwargs):
        serializer = super(CharacterEdgeViewSet, self).get_serializer(
                *args, **kwargs)
        if self.action == 'create':
            # ListSerializer does not have the fields.
            serializer.fields['character'].default = self.character
            serializer.fields['character'].read_only = True
            # The effect will not be changed with this API after creation.
            if serializer.instance is not None:
                serializer.fields['edge'].read_only = True

        return serializer

    def perform_create(self, serializer):
        with transaction.atomic():
            self.character.add_edge_log_entry(
                serializer.validated_data["edge"],
                request=self.request,
            )

            serializer.validated_data["character"] = self.character
            super(CharacterEdgeViewSet, self).perform_create(serializer)

    def perform_destroy(self, instance):
        with transaction.atomic():
            self.character.add_edge_log_entry(
                instance.edge, request=self.request, removed=True
            )
            super(CharacterEdgeViewSet, self).perform_destroy(instance)


class WoundViewSet(ListPermissionMixin, viewsets.ModelViewSet):
    serializer_class = serializers.WoundSerializer

    def initialize_request(self, request, *args, **kwargs):
        self.character = models.Character.objects.get(
                pk=self.kwargs['character_pk'])
        self.containing_object = self.character
        return super(WoundViewSet, self).initialize_request(
                request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        serializer = super(WoundViewSet, self).get_serializer(
                *args, **kwargs)
        if isinstance(serializer, serializers.WoundSerializer):
            serializer.fields['character'].default = self.character
            serializer.fields['character'].read_only = True

        return serializer

    def get_queryset(self):
        return self.character.wounds.all()

    def map_location(self, location):
        map = dict(models.Wound.LOCATION_CHOICES)
        loc = map.get(location, None)
        if loc is None:
            return location
        return loc

    def perform_update(self, serializer):
        instance = self.get_object()
        with transaction.atomic():
            old_damage = instance.damage - instance.healed

            new_damage = (
                serializer.validated_data.get('damage', instance.damage) -
                serializer.validated_data.get('healed', instance.healed))

            if old_damage > new_damage:
                self.character.add_log_entry(
                    u"{} wound partially healed for {} points.".format(
                        self.map_location(instance.location),
                        old_damage - new_damage),
                    request=self.request)
            elif new_damage > old_damage:
                self.character.add_log_entry(
                    u"{} wound worsened for {} points.".format(
                        self.map_location(instance.location),
                        new_damage - old_damage),
                    request=self.request)
            else:
                self.character.add_log_entry(
                    u"{} wound changed.".format(
                        self.map_location(instance.location)),
                    request=self.request)

            super(WoundViewSet, self).perform_update(serializer)

    def perform_create(self, serializer):
        with transaction.atomic():
            self.character.add_log_entry(
                u"{} was wounded to {} for {} points.".format(
                         self.character.name,
                         self.map_location(serializer.validated_data[
                                           'location']),
                         serializer.validated_data['damage']),
                request=self.request)

            serializer.validated_data['character'] = self.character
            super(WoundViewSet, self).perform_create(serializer)

    def perform_destroy(self, instance):
        with transaction.atomic():
            self.character.add_log_entry(
                u"{} wound was healed.".format(
                    self.map_location(instance.location)),
                request=self.request)
            super(WoundViewSet, self).perform_destroy(instance)


class SheetWoundViewSet(ListPermissionMixin, viewsets.ModelViewSet):
    serializer_class = serializers.WoundSerializer

    def initialize_request(self, request, *args, **kwargs):
        self.sheet = models.Sheet.objects.get(
                pk=self.kwargs['sheet_pk'])
        self.containing_object = self.sheet
        return super(SheetWoundViewSet, self).initialize_request(
                request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        serializer = super(SheetWoundViewSet, self).get_serializer(
                *args, **kwargs)
        if isinstance(serializer, serializers.WoundSerializer):
            serializer.fields['sheet'].default = self.sheet
            serializer.fields['sheet'].read_only = True
            serializer.fields['character'].default = self.sheet.character
            serializer.fields['character'].read_only = True

        return serializer

    def get_queryset(self):
        return self.sheet.wounds.all()

    def map_location(self, location):
        map = dict(models.Wound.LOCATION_CHOICES)
        loc = map.get(location, None)
        if loc is None:
            return location
        return loc

    def perform_update(self, serializer):
        instance = self.get_object()
        with transaction.atomic():
            old_damage = instance.damage - instance.healed

            new_damage = (
                serializer.validated_data.get('damage', instance.damage) -
                serializer.validated_data.get('healed', instance.healed))

            if old_damage > new_damage:
                self.sheet.character.add_log_entry(
                    u"{} wound partially healed for {} points.".format(
                        self.map_location(instance.location),
                        old_damage - new_damage),
                    sheet=self.sheet,
                    request=self.request)
            elif new_damage > old_damage:
                self.sheet.character.add_log_entry(
                    u"{} wound worsened for {} points.".format(
                        self.map_location(instance.location),
                        new_damage - old_damage),
                    sheet=self.sheet,
                    request=self.request)
            else:
                self.sheet.character.add_log_entry(
                    u"{} wound changed.".format(
                        self.map_location(instance.location)),
                    sheet=self.sheet,
                    request=self.request)

            super(SheetWoundViewSet, self).perform_update(serializer)

    def perform_create(self, serializer):
        with transaction.atomic():
            self.sheet.character.add_log_entry(
                u"{} was wounded to {} for {} points.".format(
                         self.sheet.character.name,
                         self.map_location(serializer.validated_data[
                                           'location']),
                         serializer.validated_data['damage']),
                sheet=self.sheet,
                request=self.request)

            serializer.validated_data['character'] = self.sheet.character
            serializer.validated_data['sheet'] = self.sheet
            super(SheetWoundViewSet, self).perform_create(serializer)

    def perform_destroy(self, instance):
        with transaction.atomic():
            self.sheet.character.add_log_entry(
                u"{} wound was healed.".format(
                    self.map_location(instance.location)),
                sheet=self.sheet,
                request=self.request)
            super(SheetWoundViewSet, self).perform_destroy(instance)


class SheetSetSheetViewSetMixin(ListPermissionMixin):
    # TODO: until all sheet* objects are handled through intermediate
    # objects, we can't use IsAccessible here.  The implicit tables do not
    # allow for object permissions.
    permission_classes = [permissions.IsAuthenticated]

    def initialize_request(self, request, *args, **kwargs):
        self.sheet_set = models.SheetSet.objects.get(
                pk=self.kwargs['sheet_set_pk'])
        self.containing_object = self.sheet_set
        return super(SheetSetSheetViewSetMixin, self).initialize_request(
                request, *args, **kwargs)


class SheetSetSheetViewSet(SheetSetSheetViewSetMixin, viewsets.ModelViewSet):
    # TODO: an individual sheet should be in the sheet set only once.
    def get_serializer_class(self):
        if self.action == 'create' or self.action == "partial_update":
            # When creating new, we do not want the full nested
            # representation, just id's.
            return serializers.SheetSetSheetCreateSerializer
        else:
            return serializers.SheetSetSheetListSerializer

    def get_queryset(self):
        return models.SheetSetSheet.objects.filter(sheet_set=self.sheet_set).order_by('order', 'id')
        # self.sheet.firearms.all()

    def get_serializer(self, *args, **kwargs):
        serializer = super(SheetSetSheetViewSet, self).get_serializer(
                *args, **kwargs)
        if self.action == 'create' or self.action == "partial_update":
            # ListSerializer does not have the fields.
            serializer.fields['sheet_set'].default = self.sheet_set
            serializer.fields['sheet_set'].read_only = True

            if serializer.instance is not None:
                serializer.fields['sheet'].read_only = True

        return serializer

    def perform_create(self, serializer):
        serializer.validated_data['sheet_set'] = self.sheet_set
        super(SheetSetSheetViewSet, self).perform_create(
            serializer)