# Create your views here.

TODO = """
+ deployment to semeai.org
** postgresql backups
** saner bzr backups (branch all branches to make sure repositories remain
   valid)
* ranged weapons
** ranged weapon ammo special handling
+ logging in
** access controls
*** marking sheet as only visible to self
*** marking characters as only visible to self
** password change
* rest of the skills
* rest of the edges
* magic item location (only one to each location)
* change log for sheet
* editing sheet description
* nicer fast edit of basic stats
* stamina
** recovery
* mana
** recovery
* body
** recovery

"""

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from sheet.models import *
from sheet.forms import *
from django.core.exceptions import ValidationError
import django.forms.util
from django.conf import settings

def characters_index(request):
    all_characters = Character.objects.all().order_by('name')
    return render_to_response('sheet/characters_index.html',
                              { 'all_characters' : all_characters },
                              context_instance=RequestContext(request))

def character_detail(request, char_id):
    character = get_object_or_404(Character, pk=char_id)
    return render_to_response('sheet/sheet_detail.html',
                              { 'char' : character },
                              context_instance=RequestContext(request))

def sheets_index(request):
    all_sheets = Sheet.objects.all()
    return render_to_response('sheet/sheets_index.html',
                              { 'all_sheets' : all_sheets },
                              context_instance=RequestContext(request))

def process_sheet_change_request(request, sheet):
    assert request.method == "POST"
    form_id = request.POST.get('form_id')
    if not form_id:
        raise ValidationError("No form id")
    forms = {}

    f = SheetForm(request.POST)

    if not f.is_valid():
        return

    if form_id == "RemoveGeneric":
        item_type = request.POST.get('item_type')
        if not item_type:
            raise ValidationError("No item_type")
        form = RemoveGeneric(request.POST)
        if form.is_valid():
            item = form.cleaned_data['item']
            print "Removing %s" % item_type
            if item_type == "Weapon":
                item = get_object_or_404(Weapon, pk=item)
                sheet.weapons.remove(item)
            elif item_type == "Armor":
                item = get_object_or_404(Armor, pk=item)
                sheet.armor.remove(item)
            elif item_type == "Helm":
                item = get_object_or_404(Armor, pk=item)
                sheet.helm.remove(item)
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
            return (True, forms)
        # removal forms are forgotten and not updated on failures.

    elif form_id == "StatModify":
        form = StatModify(request.POST)
        if form.is_valid():
            stat = form.cleaned_data['stat']
            func = form.cleaned_data['function']
            if func == "add":
                amount = 1
            else:
                amount = -1
            stat = "cur_" + stat
            char = sheet.character
            setattr(char, stat,
                    getattr(char, stat) + amount)
            char.full_clean()
            char.save()
            return (True, forms)

    elif form_id == "AddWeapon":
        form = AddWeapon(request.POST, sheet=sheet, form_id=form_id)
        if form.is_valid():
            weapon = form.cleaned_data['item']
            weapon = get_object_or_404(Weapon, pk=weapon)
            sheet.weapons.add(weapon)
            sheet.full_clean()
            sheet.save()
            return (True, forms)

    elif form_id == "AddArmor":
        form = AddArmor(request.POST, sheet=sheet, form_id=form_id)
        if form.is_valid():
            armor = form.cleaned_data['item']
            armor = get_object_or_404(Armor, pk=armor)
            sheet.armor.add(armor)
            sheet.full_clean()
            sheet.save()
            return (True, forms)

    elif form_id == "AddHelm":
        form = AddHelm(request.POST, sheet=sheet, form_id=form_id)
        if form.is_valid():
            helm = form.cleaned_data['item']
            helm = get_object_or_404(Armor, pk=helm)
            sheet.helm.add(helm)
            sheet.full_clean()
            sheet.save()
            return (True, forms)

    elif form_id == "AddSpellEffect":
        form = AddSpellEffect(request.POST, sheet=sheet, form_id=form_id)
        if form.is_valid():
            spell = form.cleaned_data['item']
            spell = get_object_or_404(SpellEffect, pk=spell)
            sheet.spell_effects.add(spell)
            sheet.full_clean()
            sheet.save()
            return (True, forms)

    elif form_id == "AddSkill":
        form = AddSkill(request.POST, sheet=sheet, form_id=form_id)
        forms['add_skill_form'] = form
        if form.is_valid():
            skill = form.cleaned_data['item']
            skill = get_object_or_404(Skill, pk=skill)
            cs = CharacterSkill()
            cs.character = sheet.character
            cs.skill = skill
            cs.level = form.cleaned_data['level']
            try:
                cs.full_clean()
            except ValidationError as e:
                el = form._errors.setdefault('__all__',
                                             django.forms.util.ErrorList())
                el.append('\n'.join(['\n'.join(x)
                                   for x in e.message_dict.values()]))

                return (False, forms)
            cs.save()
            return (True, forms)

    elif form_id == "AddEdge":
        form = AddEdge(request.POST, sheet=sheet, form_id=form_id)
        if form.is_valid():
            edge = form.cleaned_data['item']
            edge = get_object_or_404(EdgeLevel, pk=edge)
            cs = CharacterEdge()
            cs.character = sheet.character
            cs.edge = edge
            cs.full_clean()
            cs.save()
            return (True, forms)

    return (False, forms)

class RemoveWrap(object):
    def __init__(self, item, type=None):
        self.item = item
        self.type = type

    def remove_form(self):
        if self.type:
            type = self.type
        else:
            type = self.item.__class__.__name__
        return RemoveGeneric(item=self.item,
                             item_type=type)

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.item, v)

    def __unicode__(self):
        return unicode(self.item)

class WeaponWrap(object):
    class Stats:
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
                        'add_form' : StatModify(initial={ 'stat' : st,
                                                          'function' : "add" }),
                        'dec_form' : StatModify(initial={ 'stat' : st,
                                                          'function' : "dec" }),
                        })
            ll.append(stat)
        return ll


    def weapons(self):
        if not self.sheet.weapons.exists():
            return []
        return [WeaponWrap(RemoveWrap(xx), self.sheet)
                for xx in self.sheet.weapons.all()]

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
        if not self.sheet.armor.exists():
            return []
        return [RemoveWrap(xx) for xx in self.sheet.armor.all()]

    def helm(self):
        if not self.helm:
            return []
        return [RemoveWrap(xx, type="Helm") for xx in self.sheet.helm.all()]

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.sheet, v)


def sheet_detail(request, sheet_id):
    sheet = get_object_or_404(Sheet, pk=sheet_id)

    add_weapon_form = AddWeapon(sheet=sheet)
    add_spell_form = AddSpellEffect(sheet=sheet)
    add_skill_form = AddSkill(sheet=sheet)
    add_edge_form = AddEdge(sheet=sheet)
    add_helm_form = AddHelm(sheet=sheet)
    add_armor_form = AddArmor(sheet=sheet)

    forms = {}
    if request.method == "POST":
        (should_change, forms) = process_sheet_change_request(request, sheet)
        # XXX more complex forms need to be passed back to
        # render_to_response, below.
        if should_change:
            return HttpResponseRedirect(settings.ROOT_URL + 'sheets/%s/' %
                                        sheet.id)

    c = {}
    c.update({ 'char' : SheetView(sheet),
          'add_weapon_form' : add_weapon_form,
          'add_spell_effect_form' : add_spell_form,
          'add_skill_form' : add_skill_form,
          'add_edge_form' : add_edge_form,
          'add_helm_form' : add_helm_form,
          'add_armor_form' : add_armor_form,
          })
    c.update(forms)
    return render_to_response('sheet/sheet_detail.html',
                              c,
                              context_instance=RequestContext(request))

def edit_character(request, char_id=None):

    character = None
    if char_id:
        character = get_object_or_404(Character, pk=char_id)
    form = EditCharacter(instance=character)

    forms = {}
    if request.method == "POST":
        form = EditCharacter(request.POST, instance=character)
        if form.is_valid():
            form.full_clean()
            form.save()
            return HttpResponseRedirect(settings.ROOT_URL + 'characters/')

    c = {}
    c.update({ 'char_form' : form,
               'char' : character })
    c.update(forms)
    return render_to_response('sheet/edit_char.html',
                              c,
                              context_instance=RequestContext(request))
