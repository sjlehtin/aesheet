from sheet.models import Sheet, Character, WeaponTemplate, Weapon
from sheet.models import WeaponQuality, WeaponSpecialQuality
from sheet.models import WeaponEffect, SpellEffect
from sheet.models import Skill, CharacterSkill
from sheet.models import Edge, EdgeLevel, CharacterEdge

from django.contrib import admin

class WeaponTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'ccv', 'draw_initiative', 'roa', 'num_dice', 
                    'dice', 'extra_damage', 'leth', 'plus_leth', 
                    'defense_leth', 'type', 'durability', 'dp', 'short_name',
                    'notes', 'is_lance', 'skill', 'skill2')
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
