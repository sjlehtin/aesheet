from django.conf.urls import patterns, url
import views

urlpatterns = [
    url(r'^ammunition/firearm/(?P<firearm>.+)/$',
        views.WeaponAmmunitionList.as_view()),
    ]
