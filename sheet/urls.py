from django.conf.urls import include, url
import sheet.views
import sheet.views.marshal
from django.views.generic import RedirectView
from django.core.urlresolvers import reverse_lazy
from sheet.rest.urls import urlpatterns as rest_urls

marshal_urls = [
    url(r'^import/$', sheet.views.marshal.import_data, name='import'),
    url(r'^export/(?P<data_type>\w+)/$', sheet.views.marshal.export_data,
        name='export'),
    url(r'^browse/(?P<data_type>\w+)/$', sheet.views.marshal.browse, name='browse'),
]

urlpatterns = [
    url(r'^$', RedirectView.as_view(url=reverse_lazy('sheets_index'))),
    url(r'^characters/$', sheet.views.characters_index, name='characters_index'),

    url(r'^characters/add_char/$', sheet.views.AddCharacterView.as_view(),
        name="add_char"),

    url(r'^characters/edit_char/(?P<pk>\d+)/$',
        sheet.views.EditCharacterView.as_view(),
        name='edit_character'),

    url(r'^characters/edit_sheet/(?P<pk>\d+)/$',
        sheet.views.EditSheetView.as_view(),
        name='edit_sheet'),

    # Specific sheets for the characters.
    url(r'^sheets/$', sheet.views.sheets_index, name='sheets_index'),
    url(r'^sheets/(?P<sheet_id>\d+)/$', sheet.views.sheet_detail, name='sheet_detail'),

    url(r'^sheets/copy/(?P<sheet_id>\d+)?$',
        sheet.views.CopySheetView.as_view(), name='copy_sheet'),

    url(r'^import-export/', include(marshal_urls)),

    url(r'^ChangeLog$', sheet.views.version_history, name='version_history'),
    url(r'^TODO$', sheet.views.TODOView.as_view(), name="todo"),

   url(r'^rest/', include(rest_urls)),
   url(r'^api-auth/', include('rest_framework.urls',
                              namespace='rest_framework'))
]

def class_from_name(name):
    components = name.split('_')
    components = [cc.capitalize() for cc in components]
    return getattr(sheet.views, ''.join(components) + "View")


CREATE_NAMES = ["add_sheet", "add_edge", "add_edge_level",
                "add_edge_skill_bonus", "add_armor",
                "add_armor_template",
                "add_armor_quality", "add_armor_special_quality", "add_weapon",
                "add_weapon_template", "add_weapon_quality",
                "add_weapon_special_quality", "add_ranged_weapon",
                "add_ranged_weapon_template", "add_miscellaneous_item",
                "add_firearm", "add_ammunition", "add_transient_effect"]

CREATE_URLS = ["sheets/{0}/".format(name) for name in CREATE_NAMES]

for name in CREATE_NAMES:
    urlpatterns.append(url("^sheets/%s/" % name,
                           class_from_name(name).as_view(),
                           name=name))
