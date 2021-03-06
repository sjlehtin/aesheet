from django.conf.urls import url
import sheet.rest.views as views
from rest_framework import routers

router = routers.SimpleRouter()
router.register(r'sheets', views.SheetViewSet)
router.register(r'characters', views.CharacterViewSet)

router.register(r'edgelevels', views.EdgeLevelViewSet)
router.register(r'edgelevels/campaign/(?P<campaign_pk>[0-9]+)',
                views.EdgeLevelViewSet,
                base_name='campaign-edgelevel')

router.register(r'characters/(?P<character_pk>[0-9]+)/characterskills',
                views.CharacterSkillViewSet,
                base_name='character-characterskills')

router.register(r'skills', views.SkillViewSet, base_name='skill')
router.register(r'skills/campaign/(?P<campaign_pk>[0-9]+)',
                views.SkillViewSet,
                base_name='campaign-skill')

router.register(r'characters/(?P<character_pk>[0-9]+)/characteredges',
                views.CharacterEdgeViewSet,
                base_name='character-characteredges')

router.register(r'characters/(?P<character_pk>[0-9]+)/wounds',
                views.WoundViewSet, base_name='character-wounds')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetweapons',
                views.SheetWeaponViewSet,
                base_name='sheet-weapon')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetfirearms',
                views.SheetFirearmViewSet,
                base_name='sheet-firearm')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetrangedweapons',
                views.SheetRangedWeaponViewSet,
                base_name='sheet-rangedweapon')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetarmor',
                views.SheetArmorViewSet,
                base_name='sheet-armor')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheethelm',
                views.SheetHelmViewSet,
                base_name='sheet-helm')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheettransienteffects',
                views.SheetTransientEffectViewSet,
                base_name='sheet-transienteffect')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetmiscellaneousitems',
                views.SheetMiscellaneousItemViewSet,
                base_name='sheet-miscellaneousitem')

router.register(r'firearms', views.FirearmViewSet, base_name='firearm')
router.register(r'firearms/campaign/(?P<campaign_pk>[0-9]+)',
                views.FirearmViewSet,
                base_name='campaign-firearm')

router.register(r'weapontemplates', views.WeaponTemplateViewSet,
                base_name='weapontemplate')
router.register(r'weapontemplates/campaign/(?P<campaign_pk>[0-9]+)',
                views.WeaponTemplateViewSet,
                base_name='campaign-weapontemplate')

router.register(r'weaponqualities', views.WeaponQualityViewSet,
                base_name='weaponquality')
router.register(r'weaponqualities/campaign/(?P<campaign_pk>[0-9]+)',
                views.WeaponQualityViewSet,
                base_name='campaign-weaponquality')

router.register(r'weapons', views.WeaponViewSet,
                base_name='weapon')
router.register(r'weapons/campaign/(?P<campaign_pk>[0-9]+)',
                views.WeaponViewSet,
                base_name='campaign-weapon')

router.register(r'rangedweapontemplates', views.RangedWeaponTemplateViewSet,
                base_name='rangedweapontemplate')
router.register(r'rangedweapontemplates/campaign/(?P<campaign_pk>[0-9]+)',
                views.RangedWeaponTemplateViewSet,
                base_name='campaign-rangedweapontemplate')

router.register(r'rangedweapons', views.RangedWeaponViewSet,
                base_name='rangedweapon')
router.register(r'rangedweapons/campaign/(?P<campaign_pk>[0-9]+)',
                views.RangedWeaponViewSet,
                base_name='campaign-rangedweapon')

router.register(r'armortemplates', views.ArmorTemplateViewSet,
                base_name='armortemplate')
router.register(r'armortemplates/campaign/(?P<campaign_pk>[0-9]+)',
                views.ArmorTemplateViewSet,
                base_name='campaign-armortemplate')

router.register(r'armorqualities', views.ArmorQualityViewSet,
                base_name='armorquality')
router.register(r'armorqualities/campaign/(?P<campaign_pk>[0-9]+)',
                views.ArmorQualityViewSet,
                base_name='campaign-armorquality')

router.register(r'armors', views.ArmorViewSet,
                base_name='armor')
router.register(r'armors/campaign/(?P<campaign_pk>[0-9]+)',
                views.ArmorViewSet,
                base_name='campaign-armor')

router.register(r'transienteffects', views.TransientEffectViewSet,
                base_name='transienteffect')
router.register(r'transienteffects/campaign/(?P<campaign_pk>[0-9]+)',
                views.TransientEffectViewSet,
                base_name='campaign-transienteffect')

router.register(r'miscellaneousitems', views.MiscellaneousItemViewSet,
                base_name='miscellaneousitem')
router.register(r'miscellaneousitems/campaign/(?P<campaign_pk>[0-9]+)',
                views.MiscellaneousItemViewSet,
                base_name='campaign-miscellaneousitem')

router.register(r'firearmaddons', views.FirearmAddOnViewSet,
                base_name='firearmaddon')
router.register(r'firearmaddons/campaign/(?P<campaign_pk>[0-9]+)',
                views.FirearmAddOnViewSet, base_name='campaign-firearmaddon')

router.register(r'scopes', views.ScopeViewSet,
                base_name='scope')
router.register(r'scopes/campaign/(?P<campaign_pk>[0-9]+)',
                views.ScopeViewSet, base_name='campaign-scope')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/inventory',
                views.InventoryEntryViewSet,
                base_name='sheet-inventory-item')

urlpatterns = router.urls + [
    url(r'^ammunition/firearm/(?P<firearm>.+)/$',
        views.WeaponAmmunitionList.as_view()),

    ]
