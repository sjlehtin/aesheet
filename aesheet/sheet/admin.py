from sheet.models import Sheet, Character, WeaponTemplate, Weapon
from sheet.models import WeaponQuality, WeaponSpecialQuality
from django.contrib import admin

class WeaponTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'ccv', 'draw_initiative', 'roa', 'num_dice', 
                    'dice', 'extra_damage', 'leth', 'plus_leth', 
                    'defense_leth', 'type', 'durability', 'dp', 'short_name',
                    'notes', 'is_lance')
admin.site.register(Sheet)
admin.site.register(Character)
admin.site.register(WeaponSpecialQuality)
admin.site.register(WeaponTemplate, WeaponTemplateAdmin)
admin.site.register(Weapon)
admin.site.register(WeaponQuality)
