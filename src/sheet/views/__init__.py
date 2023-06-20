from django.shortcuts import render, get_object_or_404
from django.http import HttpResponseRedirect
from sheet.models import *
from sheet.forms import *
from django.core.exceptions import ValidationError, PermissionDenied
from django.urls import reverse, reverse_lazy
from django.views.generic import UpdateView, CreateView, FormView
import sheet.models
import sheet.forms
from django.views.generic import TemplateView
from django.forms.models import modelform_factory
import logging
from django.contrib import messages

logger = logging.getLogger(__name__)


def characters_index(request):
    return render(request, 'sheet/characters_index.html',
                  {'campaigns': Character.get_by_campaign(request.user)})


def sheets_index(request):
    return render(request, 'sheet/sheets_index.html',
                  {'campaigns': Sheet.get_by_campaign(request.user)})


def sheet_detail(request, sheet_id=None):
    sheet = get_object_or_404(Sheet.objects.prefetch_related(
        'character__characterlogentry_set__skill',
    ),
                              pk=sheet_id)
    if not sheet.character.access_allowed(request.user):
        raise PermissionDenied

    c = {'sheet': sheet }
    return render(request, 'sheet/sheet_detail.html', c)


class FormSaveMixin(object):
    success_message = "Object saved successfully."

    def form_valid(self, form):
        response = super(FormSaveMixin, self).form_valid(form)
        messages.success(self.request, self.success_message.format(
            object=self.object))
        return response

    def form_invalid(self, form):
        messages.error(self.request,
                       "Error trying to modify object: field{plural} {error_fields} "
                       "{poss} errors.".format(
                           plural="s" if len(form.errors.keys()) != 1 else "",
                           poss="have"
                           if len(form.errors.keys()) != 1 else "has",
                           error_fields=', '.join(form.errors.keys())))
        return super(FormSaveMixin, self).form_invalid(form)


class RequestMixin(object):
    def get_form_kwargs(self, **kwargs):
        new_kwargs = dict(request=self.request)
        new_kwargs.update(super(RequestMixin, self).get_form_kwargs(**kwargs))
        return new_kwargs


class BaseCreateView(FormSaveMixin, RequestMixin, CreateView):
    def get_form_class(self):
        if self.form_class:
            return self.form_class
        return modelform_factory(self.model, form=sheet.forms.RequestForm,
                                 fields="__all__")


class BaseUpdateView(FormSaveMixin, RequestMixin, UpdateView):
    def get_form_class(self):
        if self.form_class:
            return self.form_class
        return modelform_factory(self.model, form=sheet.forms.RequestForm,
                                 fields="__all__")


class AddWeaponView(BaseCreateView):
    model = Weapon
    template_name = 'sheet/add_weapon.html'
    success_url = reverse_lazy(sheets_index)


class AddWeaponTemplateView(AddWeaponView):
    model = WeaponTemplate


class AddWeaponQualityView(AddWeaponView):
    model = WeaponQuality


class AddWeaponSpecialQualityView(AddWeaponView):
    model = WeaponSpecialQuality


class AddMiscellaneousItemView(AddWeaponView):
    model = MiscellaneousItem
    template_name = 'sheet/add_miscellaneous_item.html'


class EditCharacterView(BaseUpdateView):
    form_class = EditCharacterForm
    model = Character
    template_name = 'sheet/create_character.html'
    success_url = reverse_lazy(characters_index)
    success_message = "Character edit successful."

    def get_object(self, queryset=None):
        object = super(EditCharacterView, self).get_object(queryset)
        if not object.access_allowed(self.request.user):
            raise PermissionDenied
        return object

    def get_form_kwargs(self):
        dd = super(EditCharacterView, self).get_form_kwargs()
        dd['request'] = self.request
        return dd

    def get_success_url(self):
        return reverse('edit_character', args=(self.object.pk, ))


class AddCharacterView(BaseCreateView):
    model = sheet.models.Character
    form_class = sheet.forms.AddCharacterForm
    template_name = 'sheet/create_character.html'

    def form_valid(self, form):
        self.object = form.save()
        self.sheet = sheet.models.Sheet.objects.create(
            character=self.object,
            owner=self.object.owner)
        messages.success(self.request, "Character added successfully.  "
                                       "Sheet has been created automatically.")
        return HttpResponseRedirect(self.get_success_url())

    def get_success_url(self):
        return reverse('sheet_detail', args=(self.sheet.pk, ))


class AddTransientEffectView(BaseCreateView):
    model = sheet.models.TransientEffect
    template_name = 'sheet/gen_edit.html'
    success_url = reverse_lazy(sheets_index)


class AddEdgeView(AddTransientEffectView):
    model = Edge


class EditSheetView(BaseUpdateView):
    form_class = EditSheetForm
    model = Sheet
    template_name = 'sheet/gen_edit.html'

    def get_object(self, queryset=None):
        object = super(EditSheetView, self).get_object(queryset)
        if not object.character.access_allowed(self.request.user):
            raise PermissionDenied
        return object

    def get_success_url(self):
        return reverse('sheet_detail', args=(self.object.pk, ))


class AddSheetView(BaseCreateView):
    model = Sheet
    form_class = AddSheetForm
    template_name = 'sheet/gen_edit.html'
    success_message = "Sheet added successfully."

    def get_success_url(self):
        return reverse('sheet_detail', args=(self.object.pk, ))


class AddEdgeLevelView(AddTransientEffectView):
    form_class = EditEdgeLevelForm
    model = EdgeLevel


class AddEdgeSkillBonusView(AddTransientEffectView):
    model = EdgeSkillBonus


class AddRangedWeaponView(AddWeaponView):
    model = RangedWeapon


class AddFirearmView(AddWeaponView):
    model = sheet.models.BaseFirearm
    form_class = sheet.forms.CreateBaseFirearmForm


class AddAmmunitionView(AddWeaponView):
    model = Ammunition


class AddRangedWeaponTemplateView(AddRangedWeaponView):
    model = RangedWeaponTemplate


class AddArmorView(AddTransientEffectView):
    model = Armor
    template_name = 'sheet/add_armor.html'


class AddArmorTemplateView(AddTransientEffectView):
    model = ArmorTemplate


class AddArmorQualityView(AddTransientEffectView):
    model = ArmorQuality


class AddArmorSpecialQualityView(AddTransientEffectView):
    model = ArmorSpecialQuality
    template_name = 'sheet/add_armor_special_quality.html'


class CopySheetView(RequestMixin, FormView):
    form_class = sheet.forms.CopySheetForm
    template_name = "sheet/gen_edit.html"

    def __init__(self, **kwargs):
        super(CopySheetView, self).__init__(**kwargs)
        self.sheet_id = None

    def get_form_kwargs(self, **kwargs):
        form_kwargs = super(CopySheetView, self).get_form_kwargs()
        if self.sheet_id:
            initial = form_kwargs.setdefault('initial', dict())
            initial['sheet'] = self.sheet_id
        return form_kwargs

    def get(self, request, *args, **kwargs):
        self.sheet_id = kwargs.pop('sheet_id', None)
        return super(CopySheetView, self).get(request, *args, **kwargs)

    def form_valid(self, form):
        new_sheet = form.save()
        self.success_url = reverse('edit_sheet', args=(new_sheet.id, ))
        messages.success(self.request, "Successfully copied sheet to "
                                       "{new_char}.".format(
            new_char=new_sheet.character.name
        ))
        return super(CopySheetView, self).form_valid(form)


class TODOView(TemplateView):
    template_name = 'sheet/todo.html'
