from django.conf.urls import patterns, url
import views

urlpatterns = patterns(
    '',
    url(r'^ammunition/firearm/(?P<firearm>.+)/$', views.WeaponAmmunitionList.as_view()),
    )