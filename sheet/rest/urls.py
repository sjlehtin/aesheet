from django.conf.urls import url
import views
from rest_framework import routers

router = routers.SimpleRouter()
router.register(r'sheets', views.SheetViewSet)
router.register(r'characters', views.CharacterViewSet)
router.register(r'edgelevels', views.EdgeLevelViewSet)

router.register(r'characters/(?P<character_pk>[0-9]+)/characterskills',
                views.CharacterSkillViewSet,
                base_name='character-characterskills')

router.register(r'skills', views.SkillViewSet, base_name='skill')
router.register(r'skills/campaign/(?P<campaign_pk>[0-9]+)',
                views.SkillViewSet,
                base_name='campaign-skill')

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetweapons',
                views.SheetWeaponViewSet,
                base_name='sheet-weapon')


router.register(r'sheets/(?P<sheet_pk>[0-9]+)/sheetfirearms',
                views.SheetFirearmViewSet,
                base_name='sheet-firearm')

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

router.register(r'sheets/(?P<sheet_pk>[0-9]+)/inventory',
                views.InventoryEntryViewSet,
                base_name='sheet-inventory-item')

urlpatterns = router.urls + [
    url(r'^ammunition/firearm/(?P<firearm>.+)/$',
        views.WeaponAmmunitionList.as_view()),

    ]
