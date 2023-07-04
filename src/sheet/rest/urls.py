from django.urls import re_path
import sheet.rest.views as views
from rest_framework import routers

router = routers.SimpleRouter()
router.register(r'sheets', views.SheetViewSet)
router.register(r'characters', views.CharacterViewSet)

router.register(r'edgelevels', views.EdgeLevelViewSet)
router.register(r'edgelevels/campaign/(?P<campaign_pk>[0-9]+)',
                views.EdgeLevelViewSet,
                basename='campaign-edgelevel')

router.register(r'characters/(?P<character_pk>[0-9]+)/characterskills',
                views.CharacterSkillViewSet,
                basename='character-characterskills')

router.register(r'skills', views.SkillViewSet, basename='skill')
router.register(r'skills/campaign/(?P<campaign_pk>[0-9]+)',
                views.SkillViewSet,
                basename='campaign-skill')

router.register(r'characters/(?P<character_pk>[0-9]+)/characteredges',
                views.CharacterEdgeViewSet,
                basename='character-characteredges')

router.register(r'characters/(?P<character_pk>[0-9]+)/wounds',
                views.WoundViewSet, basename='character-wounds')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetweapons',
                views.SheetWeaponViewSet,
                basename='sheet-weapon')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetfirearms',
                views.SheetFirearmViewSet,
                basename='sheet-firearm')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetrangedweapons',
                views.SheetRangedWeaponViewSet,
                basename='sheet-rangedweapon')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetarmor',
                views.SheetArmorViewSet,
                basename='sheet-armor')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheethelm',
                views.SheetHelmViewSet,
                basename='sheet-helm')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheettransienteffects',
                views.SheetTransientEffectViewSet,
                basename='sheet-transienteffect')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetmiscellaneousitems',
                views.SheetMiscellaneousItemViewSet,
                basename='sheet-miscellaneousitem')

router.register(r'firearms', views.FirearmViewSet, basename='firearm')
router.register(r'firearms/campaign/(?P<campaign_pk>[0-9]+)',
                views.FirearmViewSet,
                basename='campaign-firearm')

router.register(r'weapontemplates', views.WeaponTemplateViewSet,
                basename='weapontemplate')
router.register(r'weapontemplates/campaign/(?P<campaign_pk>[0-9]+)',
                views.WeaponTemplateViewSet,
                basename='campaign-weapontemplate')

router.register(r'weaponqualities', views.WeaponQualityViewSet,
                basename='weaponquality')
router.register(r'weaponqualities/campaign/(?P<campaign_pk>[0-9]+)',
                views.WeaponQualityViewSet,
                basename='campaign-weaponquality')

router.register(r'weapons', views.WeaponViewSet,
                basename='weapon')
router.register(r'weapons/campaign/(?P<campaign_pk>[0-9]+)',
                views.WeaponViewSet,
                basename='campaign-weapon')

router.register(r'rangedweapontemplates', views.RangedWeaponTemplateViewSet,
                basename='rangedweapontemplate')
router.register(r'rangedweapontemplates/campaign/(?P<campaign_pk>[0-9]+)',
                views.RangedWeaponTemplateViewSet,
                basename='campaign-rangedweapontemplate')

router.register(r'rangedweapons', views.RangedWeaponViewSet,
                basename='rangedweapon')
router.register(r'rangedweapons/campaign/(?P<campaign_pk>[0-9]+)',
                views.RangedWeaponViewSet,
                basename='campaign-rangedweapon')

router.register(r'armortemplates', views.ArmorTemplateViewSet,
                basename='armortemplate')
router.register(r'armortemplates/campaign/(?P<campaign_pk>[0-9]+)',
                views.ArmorTemplateViewSet,
                basename='campaign-armortemplate')

router.register(r'armorqualities', views.ArmorQualityViewSet,
                basename='armorquality')
router.register(r'armorqualities/campaign/(?P<campaign_pk>[0-9]+)',
                views.ArmorQualityViewSet,
                basename='campaign-armorquality')

router.register(r'armors', views.ArmorViewSet,
                basename='armor')
router.register(r'armors/campaign/(?P<campaign_pk>[0-9]+)',
                views.ArmorViewSet,
                basename='campaign-armor')

router.register(r'transienteffects', views.TransientEffectViewSet,
                basename='transienteffect')
router.register(r'transienteffects/campaign/(?P<campaign_pk>[0-9]+)',
                views.TransientEffectViewSet,
                basename='campaign-transienteffect')

router.register(r'miscellaneousitems', views.MiscellaneousItemViewSet,
                basename='miscellaneousitem')
router.register(r'miscellaneousitems/campaign/(?P<campaign_pk>[0-9]+)',
                views.MiscellaneousItemViewSet,
                basename='campaign-miscellaneousitem')

router.register(r'firearmaddons', views.FirearmAddOnViewSet,
                basename='firearmaddon')
router.register(r'firearmaddons/campaign/(?P<campaign_pk>[0-9]+)',
                views.FirearmAddOnViewSet, basename='campaign-firearmaddon')

router.register(r'scopes', views.ScopeViewSet,
                basename='scope')
router.register(r'scopes/campaign/(?P<campaign_pk>[0-9]+)',
                views.ScopeViewSet, basename='campaign-scope')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/inventory',
                views.InventoryEntryViewSet,
                basename='sheet-inventory-item')

urlpatterns = router.urls + [
    re_path(r'^ammunition/firearm/(?P<firearm>.+)/$',
            views.WeaponAmmunitionList.as_view()),
    ]
