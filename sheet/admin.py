from sheet.models import *

from django.contrib import admin

class WeaponTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'ccv', 'draw_initiative', 'roa', 'num_dice',
                    'dice', 'extra_damage', 'leth', 'plus_leth',
                    'defense_leth', 'type', 'durability', 'dp', 'short_name',
                    'notes', 'is_lance', 'base_skill', 'skill', 'skill2')
admin.site.register(Armor)
admin.site.register(ArmorQuality)
admin.site.register(ArmorTemplate)
admin.site.register(ArmorSpecialQuality)
admin.site.register(Character)
admin.site.register(CharacterEdge)
admin.site.register(CharacterSkill)
admin.site.register(Edge)
admin.site.register(EdgeLevel)
admin.site.register(Sheet)
admin.site.register(Skill)
admin.site.register(SpellEffect)
admin.site.register(WeaponEffect)
admin.site.register(WeaponSpecialQuality)
admin.site.register(WeaponTemplate, WeaponTemplateAdmin)
admin.site.register(Weapon)
admin.site.register(WeaponQuality)
