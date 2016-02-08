from __future__ import division

TODO = """
+ = done
- = not done

Priority list by JW:

+ 0) restrict ammo by chosen weapon dynamically with JS
+ 1) basic skill checks
+ 2) movement rates
- 3) berettas akimbo
+ 4) overland
- 5) spell skill cheks

+ inventory
- damage taken
-- stamina
-- lethal
-- incurred to character, with approriate wounds
-- healing damage
-- bleeding damage, retain original wound, but incurs AA etc penalties
   as per bleeding.

- notes changes should not be logged.

- suspended weight
- marking weapons as having no weight; useful for alternate weapons, or
  weapons with larger sizes (Martel enlarged).

- finalize initial robot tests.

- armor modifiers to skill checks.  These should work for the physical skills
  where the check is shown even without the character having the skill.
- edge skillbonuses back to sheet, they are missing after moving skills to
  react.

- show character height, weight in sheet.
- "add xp used ingame" with a possibility to enter description (to log)
-- if a log entry is added, entry should not be coalesced.
- "add xp" with an optional log entry, allowing for in-game notes.
- shield damages
- tiring
- bootstrap data pop-up links for armor, effects in edit area
-- show basic info.
- reordering weapons.  possible to do with ajax, so it would be faster.

- character addition form layout for easier "intake"
  + group cur, starting stats
  - show raises
+/- adding weapon inplace ("add row" functionality), instead of the large set of
    controls.  Might already be sufficient with the condensed layout, verify with
    JW.


- senses (SM)
- spell skill checks (SM)

- edge levels from items (toughness, darkvision, etc)
+ automatic used edge point calculation

- you should be able to leave current stats empty on character creation,
  in which case the stats would be filled in from the initial stats.

-- xl and e range dependent on user FIT (SM)
-- password change (SM)
+ wondrous items
- magic item location (only one item to each location)
+ change log for sheet (stat modifications etc)
++ skills
-- edges

- code simplification; sheet detail form handling mainly.

- save bonuses (M)
- encumbrance breakdown (M)
- sheet styling

- short description of spell effect (+50 FIT etc)
- stats, armors etc if the character is larger sized.

- Partial skills.  This is a larger item than it sounds, as the current design
  assumes whole skill levels.  Investigate if could be done as a skill level
  model field.

- Inserting None as skill cost to the sheet should work to allow resetting
  skill costs from CSV import.

- creating new objects should be ajaxiced and redirects should occur in a
  sensible manner.

- hardened skin + toughness -> natural weapons durability.
-- NaturalWeaponDura=Aleth+HdSkin+ROUNDDOWN(Toughness/2)+SizeModifier
+ size field for weapons (huge cretin with Large bite)

- free edges based on campaign (probably should think about race
  in this context, for FRP at least)

- it should be really easy to bootstrap the sheet system.  There should be
  some initial data, like tech-levels and campaigns.

Minor:

- adding missing skills (helps in just allowing inserting primary skills
  and autofilling rest)

Firearms:

- using two Berettas akimbo.  Check rule situation regarding instinctive fire.
-- fireams are assigned to hands (right, left, both).  Penalties/bonuses should
   be applied based on weapon type.  If both hands are occupied, apply penalty
   for two guns.
- firearms in CC.

Edges:

+ run speed multiplier
+ climb speed multiplier
- jump distance multiplier
+ swim speed multiplier
+ overland speed multiplier
- superior balance effect on ref/mov balance checks

Skills:

- jumping/tumbling synergy, see AEN skills and edges.

Spells:
+ fly speed multiplier

"""

BUGS = """
- Adding skills with multiple prereqs doesn't work.
- Better error messages on importing completely invalid CSV (heading line or
  data type broken)
"""

from django.shortcuts import render, get_object_or_404
from django.http import HttpResponseRedirect
from sheet.models import *
from sheet.forms import *
from django.core.exceptions import ValidationError, PermissionDenied
from django.conf import settings
from django.core.urlresolvers import reverse, reverse_lazy
from django.views.generic import UpdateView, CreateView, FormView
import sheet.models
import sheet.forms
import os.path
import subprocess
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


class GenWrapper(object):
    def __init__(self, item, type=None):
        self.item = item

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.item, v)

    def __unicode__(self):
        return unicode(self.item)


class RemoveWrap(object):
    def __init__(self, item, type=None):
        self.item = item
        self.type = type

    def remove_form(self):
        if self.type:
            type = self.type
        else:
            type = self.item.__class__.__name__
        return RemoveGenericForm(item=self.item,
                                 item_type=type,
                                 prefix='remove')

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.item, v)

    def __unicode__(self):
        return unicode(self.item)


class ArmorWrap(RemoveWrap):
    def __init__(self, item, sheet, type):
        super(ArmorWrap, self).__init__(item, type)
        self.sheet = sheet

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()

        if v.startswith("armor_"):
            value = 0
            # TODO: Rethink, this is approaching the ludicrous.
            # The armor values calculation should probably be in the SheetView,
            # which would collate values from Armor, Helm and other sources.
            for misc_item in self.sheet.miscellaneous_items.all():
                logger.debug("getting " + v)
                for quality in misc_item.armor_qualities.all():
                    effect_value = getattr(quality, v, 0)
                    logger.debug("got {0}: {1}".format(v, effect_value))
                    value += effect_value

            original_value = 0
            if self.item:
                original_value = getattr(self.item, v)
                value += original_value
            logger.debug(
                "Value for {value}: {current}, Orig: {original}".format(
                    value=v, current=value, original=original_value))
            return value
        else:
            return getattr(self.item, v)


class SheetView(object):
    def __init__(self, char_sheet):
        self.sheet = char_sheet

    def edges(self):
        return [RemoveWrap(xx) for xx in self.sheet.edges.all()]

    def armor(self):
        return ArmorWrap(self.sheet.armor, sheet=self.sheet, type="Armor")

    def helm(self):
        return ArmorWrap(self.sheet.helm, sheet=self.sheet, type="Helm")

    def miscellaneous_items(self):
        return [RemoveWrap(xx) for xx in self.sheet.miscellaneous_items.all()]

    def overland_movement(self):
        overland_mov = self.sheet.eff_mov * self.sheet.run_multiplier()
        fly_mov = self.sheet.eff_mov * self.sheet.enhancement_fly_multiplier()

        terrains = [1, 2, 3, 4, 5, 6, 10, 15]
        miles_per_day = [(overland_mov / (2 * mult)) for mult in terrains]
        miles_per_day.append(fly_mov/2)
        return dict(terrains=["Road", "Clear", "Scrub", "Woods", "Sand",
                              "Forest", "Mtn", "Swamp", "Fly"],
                    miles_per_day=miles_per_day,
                    miles_per_hour=[rate/7.5 for rate in miles_per_day])

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        try:
            return getattr(self.sheet, v)
        except AttributeError:
            raise AttributeError, \
                "'SheetView' object has no attribute '{attr}'".format(attr=v)


def process_sheet_change_request(request, sheet):
    assert request.method == "POST"

    form = RemoveGenericForm(request.POST, prefix='remove')
    if form.is_valid():
        item = form.cleaned_data['item']
        item_type = form.cleaned_data['item_type']
        logger.info("Removing %s" % item_type)
        if item_type == "Armor":
            sheet.armor = None
        elif item_type == "Helm":
            sheet.helm = None
        elif item_type == "MiscellaneousItem":
            item = get_object_or_404(MiscellaneousItem, pk=item)
            sheet.miscellaneous_items.remove(item)
        elif item_type == "CharacterEdge":
            item = get_object_or_404(CharacterEdge, pk=item)
            item.delete()
        else:
            raise ValidationError("Invalid item type")
        sheet.full_clean()
        sheet.save()
        return True
        # removal forms are forgotten and not updated on failures.

    return False


def sheet_detail(request, sheet_id=None):
    sheet = get_object_or_404(Sheet.objects.select_related()
                              .select_related('armor__base',
                                              'armor__quality',
                                              'helm', )
                              .prefetch_related(
        'weapons__base',
        'weapons__quality',
        'ranged_weapons__base',
        'ranged_weapons__quality',
        'miscellaneous_items',
        'character__campaign',
        'character__skills',
        'character__skills__skill',
        'character__skills__skill__required_skills',
        'character__skills__skill__edgeskillbonus_set',
        'character__edges',
        'character__edges__edge',
        'character__characterlogentry_set__skill',
    ),
                              pk=sheet_id)
    if not sheet.character.access_allowed(request.user):
        raise PermissionDenied

    forms = {}

    if request.method == "POST":
        data = request.POST
    else:
        data = None

    def add_form(form_class, prefix, **kwargs):
        key = prefix.replace('-', '_') + "_form"
        if data is not None:
            has_prefix = any([var.startswith(prefix) for var in data.keys()])
            form_data = data if has_prefix else None
        else:
            form_data = None
        forms[key] = form_class(form_data,
                                request=request,
                                prefix=prefix, **kwargs)

    add_form(AddEdgeForm, "add-edge", instance=sheet.character)
    add_form(AddExistingHelmForm, "add-existing-helm", instance=sheet)
    add_form(AddHelmForm, "add-helm", instance=sheet)
    add_form(AddExistingArmorForm, "add-existing-armor", instance=sheet)
    add_form(AddArmorForm, "add-armor", instance=sheet)
    add_form(AddExistingMiscellaneousItemForm,
             "add-existing-miscellaneous-item", instance=sheet)
    add_form(HelmForm, "new-helm")

    if request.method == "POST":
        should_change = False

        for kk, ff in forms.items():
            logger.info("handling %s" % kk)
            if ff.is_bound:
                if ff.is_valid():
                    logger.info("saved %s" % kk)
                    oo = ff.save()
                    should_change = True
                    if kk == 'new_armor_form':
                        sheet.armor = oo
                        sheet.save()
                    elif kk == 'new_helm_form':
                        sheet.helm = oo
                        sheet.save()
                else:
                    messages.error(request, 'Errors in processing request '
                                            '({form_slug}).'.format(
                        form_slug=ff.prefix.replace('-', ' ')))
        if not should_change:
            should_change = process_sheet_change_request(request,
                                                         sheet)
        # More complex forms need to be passed back to
        # render(), below.
        if should_change:
            return HttpResponseRedirect(settings.ROOT_URL + 'sheets/%s/' %
                                        sheet.id)

    c = {'sheet': SheetView(sheet) }
    c.update(forms)
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


def version_history(request):
    def logiter(output):
        acc = ""
        for ll in output:
            if ll.startswith("commit ") and acc:
                yield acc
                acc = ""
            acc += ll
        yield acc

    proc = subprocess.Popen(['git', 'log'], stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT,
                            cwd=os.path.dirname(__file__))
    return render(request, 'sheet/changelog.html',
                  {'log': logiter(proc.stdout)})


class TODOView(TemplateView):
    template_name = 'sheet/todo.html'

    def get_context_data(self, **kwargs):
        context = dict(**kwargs)
        context['TODO'] = TODO
        context['BUGS'] = BUGS
        return context
