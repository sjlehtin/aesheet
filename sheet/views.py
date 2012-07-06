# Create your views here.

TODO = """
+ = done
- = not done

+ deployment to semeai.org
++ postgresql backups
++ saner bzr backups (branch all branches to make sure repositories remain
   valid) (now in git)
+ ranged weapons
-- ranged weapon ammo special handling
+ logging in
-- access controls
--- marking sheet as only visible to self
--- marking characters as only visible to self
-- password change
+ rest of the skills
+ specializations with skill level 0 should be recognized (for
  specializations with only one level especially)
- rest of the edges
- initiatives
- wondrous items
- inventory ?
- magic item location (only one item to each location)
- change log for sheet (stat modifications etc)
+ editing sheet description
- nicer fast edit of basic stats
+ stamina
-- recovery
+ mana
-- recovery
+ body
-- recovery
- code simplification
- reordering skills
- stats for skill checks
- character mugshot upload
- senses
- charge damage
+ print.css (basically, the whole printable button special handling is
  unnecessary).
- movement chart
- save bonuses
- encumbrance breakdown
- spell skill checks
- sheet styling

- immunity calculation (currently affected if, e.g., helm gives a
  negative modifer to PSY)

NOTES on creating Jan:

- you should be able to leave current stats empty on character creation,
  in which case the stats would be filled in from the initial stats.

+ Adding weapons from templates.
+ Skill points!
+ Specialty levels (treat zero as one)!

Minor:

- adding missing skills (helps in just allowing inserting primary skills
  and autofilling rest)
- modifying skill level with +/- (at least add to skill level)

"""

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import RequestContext
from sheet.models import *
from sheet.forms import *
from django.core.exceptions import ValidationError
import django.forms.util
from django.conf import settings
from django.core.urlresolvers import reverse
import django.db.models
import sheet.models
import csv
import StringIO
from django.db.models.fields import FieldDoesNotExist
from pprint import pprint
import logging
import pdb
import sys
from collections import namedtuple

logger = logging.getLogger(__name__)

def characters_index(request):
    all_characters = Character.objects.all().order_by('name')
    return render_to_response('sheet/characters_index.html',
                              { 'all_characters' : all_characters },
                              context_instance=RequestContext(request))

def sheets_index(request):
    all_sheets = Sheet.objects.all()
    return render_to_response('sheet/sheets_index.html',
                              { 'all_sheets' : all_sheets },
                              context_instance=RequestContext(request))

class RemoveWrap(object):
    def __init__(self, item, type=None):
        self.item = item
        self.type = type

    @property
    def remove_form(self):
        if self.type:
            type = self.type
        else:
            type = self.item.__class__.__name__
        return RemoveGeneric(item=self.item,
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

class WeaponWrap(object):
    class Stats(object):
        rendered_attack_inits = 4
        rendered_defense_inits = 3
        def __init__(self, item, sheet, use_type):
            self.use_type = use_type
            self.sheet = sheet
            self.item = item

        def roa(self):
            return self.sheet.roa(self.item, use_type=self.use_type)

        def skill_checks(self):
            checks = self.sheet.weapon_skill_checks(self.item,
                                                    use_type=self.use_type)
            if len(checks) < len(self.sheet.actions):
                checks.extend([''] * (len(self.sheet.actions) - len(checks)))
            return checks

        def initiatives(self):
            inits = self.sheet.initiatives(self.item, use_type=self.use_type)
            if len(inits) < self.rendered_attack_inits:
                inits.extend([''] * (self.rendered_attack_inits - len(inits)))
            return inits[0:self.rendered_attack_inits]

        def defense_initiatives(self):
            inits = self.sheet.defense_initiatives(self.item,
                                                   use_type=self.use_type)
            if len(inits) < self.rendered_defense_inits:
                inits.extend([''] * (self.rendered_defense_inits - len(inits)))
            return inits[0:self.rendered_defense_inits]

        def damage(self):
            return self.sheet.damage(self.item, use_type=self.use_type)

        def defense_damage(self):
            return self.sheet.defense_damage(self.item, use_type=self.use_type)

    def __init__(self, item, sheet):
        self.item = item
        self.sheet = sheet
        self.full = self.Stats(self.item, self.sheet, use_type=sheet.FULL)
        self.pri = self.Stats(self.item, self.sheet, use_type=sheet.PRI)
        self.sec = self.Stats(self.item, self.sheet, use_type=sheet.SEC)

    def __unicode__(self):
        return unicode(self.item)

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.item, v)

Action = namedtuple('Action', ['action', 'check'])

class RangedWeaponWrap(object):
    def __init__(self, item, sheet):
        self.sheet = sheet
        self.item = item

    def rof(self):
        return self.sheet.rof(self.item)

    def skill_checks(self):
        ll = None
        try:
            ll = [Action._make(xx) for xx in map(
                    None,
                    self.sheet.ranged_actions,
                    self.sheet.ranged_skill_checks(self.item))]
            logging.info("Checks: %s" % ll)
        except:
            logging.exception("Got exception")
        return ll

    def ranges(self):
        try:
            ll = self.sheet.ranged_ranges(self.item)
        except e:
            logging.exception("Got exception %s" % e)
        return ll

    def initiatives(self):
        return self.sheet.initiatives(self.item)

    def damage(self):
        return self.sheet.damage(self.item)

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.item, v)

    def __unicode__(self):
        return unicode(self.item)


class SheetView(object):
    def __init__(self, sheet):
        self.sheet = sheet

    def stats(self):
        ll = []
        for st in ["fit", "ref", "lrn", "int", "psy", "wil", "cha", "pos",
                   "mov", "dex", "imm"]:
            stat = {'name' : st,
                    'base' : getattr(self.sheet, st),
                    'eff' : getattr(self.sheet, "eff_" + st),
                    }
            if st not in ["mov", "dex", "imm"]:
                stat.update({
                        'add_form' : StatModify(instance=self.sheet.character,
                                                initial={ 'stat' : "cur_" + st,
                                                          'function' : "add" },
                                                prefix='stat-modify'),
                        'dec_form' : StatModify(instance=self.sheet.character,
                                                initial={ 'stat' : "cur_" + st,
                                                          'function' : "dec" },
                                                prefix='stat-modify'),
                        })
            ll.append(stat)
        return ll


    def weapons(self):
        return [WeaponWrap(RemoveWrap(xx), self.sheet)
                for xx in self.sheet.weapons.all()]

    def ranged_weapons(self):
        try:
            ll = [RangedWeaponWrap(RemoveWrap(xx), self.sheet)
                  for xx in self.sheet.ranged_weapons.all()]
            logging.info("list: %s" % ll)
        except:
            logging.exception("Got exception")
        return ll

    def spell_effects(self):
        if not self.sheet.spell_effects.exists():
            return []

        return [RemoveWrap(xx) for xx in self.sheet.spell_effects.all()]

    def skills(self):
        if not self.sheet.skills.exists():
            return []
        return [RemoveWrap(xx) for xx in self.sheet.skills.all()]

    def edges(self):
        if not self.sheet.edges.exists():
            return []
        return [RemoveWrap(xx) for xx in self.sheet.edges.all()]

    def armor(self):
        if not self.sheet.armor:
            return
        return RemoveWrap(self.sheet.armor, type="Armor")

    def helm(self):
        if not self.sheet.helm:
            return
        return RemoveWrap(self.sheet.helm, type="Helm")

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.sheet, v)

def process_sheet_change_request(request, sheet):
    assert request.method == "POST"

    form = RemoveGeneric(request.POST, prefix='remove')
    if form.is_valid():
        item = form.cleaned_data['item']
        item_type = form.cleaned_data['item_type']
        logger.info("Removing %s" % item_type)
        if item_type == "Weapon":
            item = get_object_or_404(Weapon, pk=item)
            sheet.weapons.remove(item)
        elif item_type == "RangedWeapon":
            item = get_object_or_404(RangedWeapon, pk=item)
            sheet.ranged_weapons.remove(item)
        elif item_type == "Armor":
            sheet.armor = None
        elif item_type == "Helm":
            sheet.helm = None
        elif item_type == "SpellEffect":
            item = get_object_or_404(SpellEffect, pk=item)
            sheet.spell_effects.remove(item)
        elif item_type == "CharacterSkill":
            item = get_object_or_404(CharacterSkill, pk=item)
            item.delete()
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
    sheet = get_object_or_404(Sheet, pk=sheet_id)

    forms = {}

    if request.method == "POST":
        data = request.POST
    else:
        data = None

    forms['_stat_modify'] = StatModify(data,
                                       instance=sheet.character,
                                       prefix="stat-modify")
    forms['add_skill_form'] = AddSkill(data,
                                       instance=sheet.character,
                                       prefix="add-skill")
    forms['add_edge_form'] = AddEdge(data,
                                     instance=sheet.character,
                                     prefix="add-edge")
    forms['add_spell_effect_form'] = AddSpellEffect(
        data,
        instance=sheet,
        prefix="add-spell-effect")
    forms['add_helm_form'] = AddHelm(data, instance=sheet,
                                     prefix="add-helm")
    forms['add_armor_form'] = AddArmor(data, instance=sheet,
                                       prefix="add-armor")
    forms['add_weapon_form'] = AddWeapon(data, instance=sheet,
                                         prefix="add-weapon")
    forms['new_weapon_form'] = WeaponForm(data, prefix="new-weapon")
    forms['new_ranged_weapon_form'] = \
        RangedWeaponForm(data, prefix="new-ranged-weapon")
    forms['new_armor_form'] = ArmorForm(data, prefix="new-armor")
    forms['new_helm_form'] = HelmForm(data, prefix="new-helm")
    forms['add_ranged_weapon_form'] = \
        AddRangedWeapon(data,
                        instance=sheet,
                        prefix="add-ranged-weapon")

    if request.method == "POST":
        should_change = False


        for kk, ff in forms.items():
            logging.info("handling %s" % kk)
            if ff.is_valid():
                logging.info("saved %s" % kk)
                oo = ff.save()
                should_change = True
                if kk == 'new_weapon_form':
                    sheet.weapons.add(oo)
                elif kk == 'new_ranged_weapon_form':
                    sheet.ranged_weapons.add(oo)
                elif kk == 'new_armor_form':
                    sheet.armor = oo
                    sheet.save()
                elif kk == 'new_helm_form':
                    sheet.helm = oo
                    sheet.save()

        if not should_change:
            should_change = process_sheet_change_request(request,
                                                         sheet)
        # XXX more complex forms need to be passed back to
        # render_to_response, below.
        if should_change:
            return HttpResponseRedirect(settings.ROOT_URL + 'sheets/%s/' %
                                        sheet.id)

    c = { 'char' : SheetView(sheet),
          'TODO' : TODO,
          }
    c.update(forms)
    return render_to_response('sheet/sheet_detail.html',
                              RequestContext(request, c))

def edit_character(request, char_id=None):
    character = None
    if char_id:
        character = get_object_or_404(Character, pk=char_id)
    form = CharacterForm(instance=character)

    forms = {}
    if request.method == "POST":
        form = CharacterForm(request.POST, instance=character)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(settings.ROOT_URL + 'characters/')

    c = {}
    c.update({ 'char_form' : form,
               'char' : character })
    c.update(forms)
    return render_to_response('sheet/edit_char.html',
                              RequestContext(request, c))

def edit_spell_effect(request, eff_id=None):
    effect = None
    if eff_id:
        effect = get_object_or_404(SpellEffect, pk=eff_id)
    data = None
    if request.method == "POST":
        data = request.POST
    form = SpellEffectForm(data, instance=effect)

    if request.method == "POST":
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse(sheets_index))

    return render_to_response('sheet/gen_edit.html',
                              RequestContext(request, { 'form' : form }))

def edit_edge(request, edge_id=None):
    if edge_id:
        effect = get_object_or_404(Edge, pk=edge_id)
    else:
        effect = None

    data = None
    if request.method == "POST":
        data = request.POST
    form = EdgeForm(data, instance=effect)

    if request.method == "POST":
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse(sheets_index))

    return render_to_response('sheet/gen_edit.html',
                              RequestContext(request, { 'form' : form }))

def edit_edge_level(request, el_id=None):
    if el_id:
        el = get_object_or_404(EdgeLevel, pk=el_id)
    else:
        el = None
    data = None
    if request.method == "POST":
        data = request.POST
    form = EdgeLevelForm(data, instance=el)

    if request.method == "POST":
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse(sheets_index))

    return render_to_response('sheet/gen_edit.html',
                              RequestContext(request, { 'form' : form }))

def edit_ranged_weapon_template(request, wpn_id=None):
    if wpn_id:
        wpn = get_object_or_404(RangeWeaponTemplate, pk=wpn_id)
    else:
        wpn = None
    data = None
    if request.method == "POST":
        data = request.POST
    form = RangedWeaponTemplateForm(data, instance=wpn)

    if request.method == "POST":
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse(sheets_index))

    return render_to_response('sheet/gen_edit.html',
                              RequestContext(request, { 'form' : form }))

def edit_armor_template(request, armor_id=None):
    if armor_id:
        armor = get_object_or_404(ArmorTemplate, pk=armor_id)
    else:
        armor = None
    data = None
    if request.method == "POST":
        data = request.POST
    form = ArmorTemplateForm(data, instance=armor)

    if request.method == "POST":
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse(sheets_index))

    return render_to_response('sheet/gen_edit.html',
                              RequestContext(request, { 'form' : form }))

def edit_sheet(request, sheet_id=None):
    sheet = None
    if sheet_id:
        sheet = get_object_or_404(Sheet, pk=sheet_id)
    if request.method == "POST":
        form = SheetForm(request.POST, instance=sheet)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(settings.ROOT_URL + 'sheets/')
    else:
        form = SheetForm(instance=sheet)

    return render_to_response('sheet/edit_sheet.html',
                              RequestContext(request, { 'sheet_form' : form,
                                                        'sheet' : sheet }))

def get_data_rows(results, fields):
    """
    Return queryset data columns in order given with the fields
    parameters, one row at a time.
    """
    for obj in results:
        def get_field_value(field):
            try:
                value = getattr(obj, field)
            except AttributeError:
                return ""
            if isinstance(value, django.db.models.Manager):
                def get_descr(mdl):
                    if hasattr(mdl, 'name'):
                        return mdl.name
                    return str(val.pk)
                value = "|".join([get_descr(val) for val in value.all()])
            return value
        yield [get_field_value(field) for field in fields]

def browse(request, type):
    try:
        cls = getattr(sheet.models, type)
    except AttributeError, e:
        raise Http404, "%s is not a supported type." % type
    results = cls.objects.all()
    fields = cls.get_exported_fields()
    rows = get_data_rows(results, fields)
    fields = [" ".join(ff.split('_')) for ff in fields]
    return render_to_response('sheet/browse.html',
                              RequestContext(request, { 'type' : type,
                                                        'header' : fields,
                                                        'rows' : rows }))

def import_text(data):
    reader = csv.reader(StringIO.StringIO(data))
    data_type = reader.next()
    if not len(data_type) or not data_type[0]:
        raise TypeError, "CSV is in invalid format, first row is the data type"
    data_type = data_type[0]
    try:
        modelcls = getattr(sheet.models, data_type)
    except AttributeError, e:
        raise TypeError, "Invalid data type %s" % data_type

    header = reader.next()

    header = [yy.lower() for yy in ['_'.join(xx.split(' ')) for xx in header]]

    for row in reader:
        mdl = None
        fields = {}
        for (hh, index) in zip(header, range(len(header))):
            fields[hh] = row[index]
        try:
            if 'id' in fields and fields['id']:
                mdl = modelcls.objects.get(id=fields['id'])
            elif 'name' in fields and fields['name']:
                mdl = modelcls.objects.get(name=fields['name'])
        except modelcls.DoesNotExist:
            pass
        if not mdl:
            mdl = modelcls()
        m2m_values = {}
        for (fieldname, value) in fields.items():
            try:
                (field, _, direct, m2m) = \
                    modelcls._meta.get_field_by_name(fieldname)
            except FieldDoesNotExist, e:
                raise ValueError, str(e)

            # If the field is a reference to another object, try to find
            # the matching instance.
            if isinstance(field, django.db.models.ForeignKey):
                if value:
                    try:
                        value = \
                            field.related.parent_model.objects.get(name=value)
                    except field.related.parent_model.DoesNotExist:
                        raise ValueError, "No matching %s with name %s." % (
                            field.related.parent_model._meta.object_name, value)
                else:
                    value = None
            else:
                if not value:
                    if field.has_default():
                        value = field.default
                    elif not field.empty_strings_allowed:
                        continue # Try to get away without setting the value.
                if isinstance(field,
                              django.db.models.fields.related.ManyToManyField):
                    # Make sure the field will at least be cleared.
                    m2m_values[fieldname] = []
                    if not value:
                        continue
                    ll = []
                    for name in value.split('|'):
                        obj = field.rel.to.objects.get(name=name)
                        ll.append(obj)
                    value = ll
                    m2m_values[fieldname] = value
                    # These need to be added only after the object is saved.
                    continue
                else:
                    # XXX Something a little more intelligent would
                    # probably be nice, for other types of data.
                    if value == "FALSE":
                        value = False
                    elif value == "TRUE":
                        value = True
                    try:
                        value = field.to_python(value)
                    except Exception, e:
                        raise type(e), ("Failed to import field \"%s\", "
                                        "value \"%s\" (%s)" % (fieldname, value,
                                                               str(e)))
            setattr(mdl, fieldname, value)
        mdl.full_clean()
        mdl.save()
        for kk, vv in m2m_values.items():
            logger.info("Setting m2m values for %s(%s) %s to %s" %
                        (mdl, mdl.__class__.__name__, kk, vv))
            rel = getattr(mdl, kk)
            rel.clear()
            rel.add(*vv)
        mdl.full_clean()
        mdl.save()

def import_data(request, success=False):
    """
    XXX Create tests and refactor.
    """
    if request.method == 'POST':
        form = ImportForm(request.POST, request.FILES)
        if form.is_valid():
            import_data = form.cleaned_data['import_data']
            if 'file' in request.FILES:
                file = request.FILES['file']
                import_data = file.read()
            try:
                import_text(import_data)
                return HttpResponseRedirect(
                    reverse('import-success'))
            except (TypeError, ValueError, ValidationError), e:
                logging.exception("failed.")
                el = form._errors.setdefault('__all__',
                                             django.forms.util.ErrorList())
                el.append(str(e))
            except Exception, e:
                logging.exception("failed.")
                raise e
    else:
        form = ImportForm()
    types = []
    for choice in ['ArmorTemplate', 'ArmorEffect',
                   'Armor', 'ArmorQuality', 'ArmorSpecialQuality',
                   'SpellEffect', 'WeaponTemplate', 'Weapon', 'WeaponEffect',
                   'WeaponQuality', 'WeaponSpecialQuality', 'Skill', 'Edge',
                   'EdgeLevel', 'RangedWeaponTemplate', 'RangedWeapon']:
        cls = getattr(sheet.models, choice)
        item = {}
        item['name'] = cls._meta.object_name
        item['fields'] = cls.get_exported_fields()
        types.append(item)

    message = ""
    if success:
        message = "Import successful."
    return render_to_response('sheet/import_data.html',
                              RequestContext(request,
                                             { 'message' : message,
                                               'types' : types,
                                               'import_form' : form }))

def export_data(request, type):
    try:
        cls = getattr(sheet.models, type)
    except AttributeError, e:
        raise Http404, "%s is not a supported type." % type
    results = cls.objects.all()
    f = StringIO.StringIO()
    w = csv.writer(f)
    w.writerow([type])
    fields = cls.get_exported_fields()
    w.writerow(fields)
    for row in get_data_rows(results, fields):
        w.writerow(row)
    response = HttpResponse(f.getvalue(), mimetype="text/csv")
    response['Content-Disposition'] = 'attachment; filename=%s.csv' % type
    return response

import os.path
import subprocess
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
    return render_to_response('sheet/changelog.html',
                              RequestContext(request,
                                             { 'log' : logiter(proc.stdout) }))
