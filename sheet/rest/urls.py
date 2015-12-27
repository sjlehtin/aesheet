from django.conf.urls import url
import views
from rest_framework import routers

router = routers.SimpleRouter()
router.register(r'sheets', views.SheetViewSet)
router.register(r'characters', views.CharacterViewSet)

urlpatterns = router.urls + [
    url(r'^ammunition/firearm/(?P<firearm>.+)/$',
        views.WeaponAmmunitionList.as_view()),
    ]
