from sheet.models import *

from django.contrib import admin

class WeaponTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'tech_level', 'ccv', 'draw_initiative', 'roa',
                    'num_dice',
                    'dice', 'extra_damage', 'leth', 'plus_leth',
                    'defense_leth', 'type', 'durability', 'dp', 'short_name',
                    'notes', 'is_lance', 'base_skill', 'skill', 'skill2')
admin.site.register(Armor)
admin.site.register(ArmorEffect)
admin.site.register(ArmorQuality)
admin.site.register(ArmorTemplate)
admin.site.register(ArmorSpecialQuality)
admin.site.register(Character)
admin.site.register(CharacterEdge)
admin.site.register(CharacterSkill)
admin.site.register(Edge)
admin.site.register(EdgeLevel)
admin.site.register(EdgeSkillBonus)
admin.site.register(Sheet)
admin.site.register(TechLevel)
admin.site.register(Campaign)
admin.site.register(MiscellaneousItem)

class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'tech_level','description', 'notes',
                    'can_be_defaulted',
                    'is_specialization',
                    'skill_cost_0', 'skill_cost_1', 'skill_cost_2',
                    'skill_cost_3', 'stat', 'type')

admin.site.register(Skill, SkillAdmin)
admin.site.register(SpellEffect)
admin.site.register(WeaponEffect)
admin.site.register(WeaponSpecialQuality)
admin.site.register(WeaponTemplate, WeaponTemplateAdmin)
admin.site.register(Weapon)
admin.site.register(WeaponQuality)
admin.site.register(RangedWeaponTemplate)
admin.site.register(RangedWeapon)
admin.site.register(CharacterLogEntry)
