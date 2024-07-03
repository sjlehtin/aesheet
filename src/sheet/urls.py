from django.urls import include, path
import sheet.views
import sheet.views.marshal
from django.views.generic import RedirectView
from django.urls import reverse_lazy
from sheet.rest.urls import urlpatterns as rest_urls
from django.conf.urls.static import static
from django.conf import settings

from django.contrib import admin
admin.autodiscover()


marshal_urls = [
    path('import/', sheet.views.marshal.import_data, name='import'),
    path('export/<str:data_type>/', sheet.views.marshal.export_data,
         name='export'),
    path('browse/<str:data_type>/', sheet.views.marshal.browse, name='browse'),
]

urlpatterns = [
    path('', RedirectView.as_view(url=reverse_lazy('sheets_index'))),
    path('characters/', sheet.views.characters_index, name='characters_index'),

    path('characters/add_char/', sheet.views.AddCharacterView.as_view(),
         name="add_char"),

    path('characters/edit_char/<int:pk>/',
         sheet.views.EditCharacterView.as_view(),
         name='edit_character'),

    path('characters/edit_sheet/<int:pk>/',
         sheet.views.EditSheetView.as_view(),
         name='edit_sheet'),

    path('sheetsets/add_sheetset/', sheet.views.AddSheetSetView.as_view(),
         name="add_sheet_set"),
    path('sheetsets/<int:sheet_set_id>/', sheet.views.sheet_set_detail,
         name='sheet_set_detail', kwargs={'template_name': 'sheet/sheet_set_detail.html'}),

    # Specific sheets for the characters.
    path('sheets/', sheet.views.sheets_index, name='sheets_index'),
    path('sheets/<int:sheet_id>/', sheet.views.sheet_detail, name='sheet_detail'),
    path('sheets/<int:sheet_id>/compact/', sheet.views.sheet_detail,
         name='sheet_compact', kwargs={'template_name': 'sheet/sheet_compact.html'}),

    path('sheets/copy/<int:sheet_id>',
         sheet.views.CopySheetView.as_view(), name='copy_sheet'),
    path('sheets/copy/',
         sheet.views.CopySheetView.as_view(), name='copy_sheet'),

    path('import-export/', include(marshal_urls)),

    path('TODO', sheet.views.TODOView.as_view(), name="todo"),

    path('rest/', include(rest_urls)),
    path('api-auth/', include('rest_framework.urls',
                              namespace='rest_framework')),

    path('accounts/', include('accounts.urls')),

    path('admin/', admin.site.urls),
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
    urlpatterns.append(path("sheets/%s/" % name,
                            class_from_name(name).as_view(),
                            name=name))

# In development, serve the uploaded media files.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)