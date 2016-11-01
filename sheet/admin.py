import sheet.models as sm

from django.contrib import admin

class WeaponTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'tech_level', 'ccv', 'draw_initiative', 'roa',
                    'num_dice',
                    'dice', 'extra_damage', 'leth', 'plus_leth',
                    'defense_leth', 'type', 'durability', 'dp', 'short_name',
                    'notes', 'is_lance', 'base_skill', 'skill', 'skill2')
admin.site.register(sm.Armor)
admin.site.register(sm.ArmorQuality)
admin.site.register(sm.ArmorTemplate)
admin.site.register(sm.ArmorSpecialQuality)
admin.site.register(sm.Character)
admin.site.register(sm.CharacterEdge)
admin.site.register(sm.CharacterSkill)
admin.site.register(sm.Edge)
admin.site.register(sm.EdgeLevel)
admin.site.register(sm.EdgeSkillBonus)
admin.site.register(sm.Sheet)
admin.site.register(sm.TechLevel)

class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'has_firearms', 'has_spells')
admin.site.register(sm.Campaign, CampaignAdmin)

admin.site.register(sm.MiscellaneousItem)

admin.site.register(sm.BaseFirearm)
admin.site.register(sm.FirearmAmmunitionType)
admin.site.register(sm.Firearm)
admin.site.register(sm.Ammunition)

class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'tech_level','description', 'notes',
                    'can_be_defaulted',
                    'is_specialization',
                    'skill_cost_0', 'skill_cost_1', 'skill_cost_2',
                    'skill_cost_3', 'stat', 'type')

admin.site.register(sm.Skill, SkillAdmin)
admin.site.register(sm.TransientEffect)
admin.site.register(sm.WeaponSpecialQuality)
admin.site.register(sm.WeaponTemplate, WeaponTemplateAdmin)
admin.site.register(sm.Weapon)
admin.site.register(sm.WeaponQuality)
admin.site.register(sm.RangedWeaponTemplate)
admin.site.register(sm.RangedWeapon)
admin.site.register(sm.CharacterLogEntry)
