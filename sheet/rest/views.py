import sheet.models
from sheet.rest import serializers
from rest_framework import generics
from django.http import Http404

class WeaponAmmunitionList(generics.ListAPIView):
    serializer_class = serializers.AmmunitionSerializer

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