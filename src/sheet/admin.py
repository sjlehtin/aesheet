import sheet.models as sm
from django.contrib import admin


class WeaponTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'tech_level', 'ccv', 'draw_initiative', 'roa',
                    'num_dice',
                    'dice', 'extra_damage', 'leth', 'plus_leth',
                    'defense_leth', 'type', 'durability', 'dp', 'short_name',
                    'notes', 'is_lance', 'base_skill', 'skill', 'skill2')
    list_filter = ('tech_level',)
    search_fields = ('name', )
    save_as = True


class CampaignAdmin(admin.ModelAdmin):
    @admin.display
    def campaign_tech_levels(self, obj):
        return ",".join([tl.name for tl in obj.tech_levels.all()])

    list_display = ('name', 'has_firearms', 'has_spells',
                    'campaign_tech_levels')


class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'tech_level', 'description', 'notes',
                    'can_be_defaulted',
                    'is_specialization',
                    'skill_cost_0', 'skill_cost_1', 'skill_cost_2',
                    'skill_cost_3', 'stat', 'type')
    list_filter = ('tech_level',)
    search_fields = ('name', )
    save_as = True


class EdgeSkillBonusAdmin(admin.ModelAdmin):
    list_filter = ('edge_level__level',)
    ordering = ('edge_level__edge__name', 'edge_level__level',)


class FirearmAmmunitionTypeInline(admin.TabularInline):
    model = sm.FirearmAmmunitionType
    ordering = ('calibre__name', )


class BaseFirearmAdmin(admin.ModelAdmin):
    list_per_page = 50
    list_select_related = True

    inlines = [FirearmAmmunitionTypeInline]
    list_filter = ('tech_level',)
    search_fields = ('name', )
    save_as = True
    list_display = ['name', 'draw_initiative', 'weight',
                    'autofire_rpm',
                    'autofire_class', 'sweep_fire_disabled',
                    'restricted_burst_rounds', 'magazine_size',
                    'magazine_weight',
                    'stock', 'duration',
                    'weapon_class_modifier', 'accuracy', 'sight',
                    'barrel_length',
                    'base_skill', 'skill', 'skill2',
                    'durability', 'dp']
    list_editable = ['draw_initiative', 'weight',
                     'magazine_size', 'magazine_weight',
                     'autofire_rpm',
                     'autofire_class', 'sweep_fire_disabled',
                     'restricted_burst_rounds', 'stock', 'duration',
                     'weapon_class_modifier', 'accuracy', 'sight',
                     'barrel_length',
                     'durability', 'dp']


class ArmorAdmin(admin.ModelAdmin):
    list_filter = ('base__tech_level',)


class AmmunitionAdmin(admin.ModelAdmin):
    list_select_related = True
    list_per_page = 50

    search_fields = ('calibre__name', 'bullet_type')
    list_filter = ('tech_level', )
    save_as = True
    list_display = ['calibre', 'type', 'bullet_type', 'weight', 'velocity', 'damage', 'num_dice', 'dice', 'extra_damage', 'leth', 'plus_leth']
    list_editable = ['type', 'bullet_type', 'weight', 'velocity', 'num_dice', 'dice', 'extra_damage', 'leth', 'plus_leth']

    @admin.display
    def damage(self, obj):
        return sm.format_damage(obj.num_dice, obj.dice, obj.extra_damage, obj.leth, obj.plus_leth)


class ItemAdmin(admin.ModelAdmin):
    search_fields = ('name', )
    list_filter = ('tech_level', )
    save_as = True


class QualityAdmin(ItemAdmin):
    pass


class EffectAdmin(ItemAdmin):
    pass


class CharacterSkillAdmin(admin.ModelAdmin):
    list_select_related = True
    list_per_page = 50

    list_display = ('character', 'skill', 'level')
    list_filter = ('character__name', 'skill__name')
    search_fields = ('character__name', 'skill__name')
    save_as = True

    ordering = ('character__name', )


class CharacterEdgeAdmin(admin.ModelAdmin):
    list_select_related = True
    list_per_page = 50

    list_display = ('character', 'edge',  'ignore_cost')
    list_filter = ('character__name', 'edge__edge__name')
    search_fields = ('character__name', 'edge__edge__name')
    save_as = True

    ordering = ('character__name', )


admin.site.register(sm.Armor, ArmorAdmin)
admin.site.register(sm.ArmorQuality, QualityAdmin)
admin.site.register(sm.ArmorTemplate, ItemAdmin)
admin.site.register(sm.ArmorSpecialQuality, EffectAdmin)
admin.site.register(sm.Character)
admin.site.register(sm.CharacterEdge, CharacterEdgeAdmin)
admin.site.register(sm.CharacterSkill, CharacterSkillAdmin)
admin.site.register(sm.Edge)
admin.site.register(sm.EdgeLevel)
admin.site.register(sm.EdgeSkillBonus, EdgeSkillBonusAdmin)
admin.site.register(sm.Sheet)
admin.site.register(sm.TechLevel)
admin.site.register(sm.Campaign, CampaignAdmin)
admin.site.register(sm.MiscellaneousItem, ItemAdmin)
admin.site.register(sm.BaseFirearm, BaseFirearmAdmin)
admin.site.register(sm.Calibre)
admin.site.register(sm.FirearmAddOn, ItemAdmin)
admin.site.register(sm.Ammunition, AmmunitionAdmin)
admin.site.register(sm.Skill, SkillAdmin)
admin.site.register(sm.TransientEffect, EffectAdmin)
admin.site.register(sm.WeaponSpecialQuality, EffectAdmin)
admin.site.register(sm.WeaponTemplate, WeaponTemplateAdmin)
admin.site.register(sm.Weapon)
admin.site.register(sm.WeaponQuality, QualityAdmin)
admin.site.register(sm.RangedWeaponTemplate, ItemAdmin)
admin.site.register(sm.RangedWeapon)
admin.site.register(sm.Scope, ItemAdmin)
