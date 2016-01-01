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

class IsAccessible(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not obj.private:
            return True
        if obj.owner == request.user:
            return True
        else:
            return False


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
