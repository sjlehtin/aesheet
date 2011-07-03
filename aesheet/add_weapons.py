from django.core.management import setup_environ
import settings
setup_environ(settings)

from sheet.models import *

qlty = WeaponQuality.objects.get(name='Normal')

for tmpl in WeaponTemplate.objects.all():
   wpn = Weapon()
   wpn.base = tmpl
   wpn.quality = qlty
   wpn.save()
