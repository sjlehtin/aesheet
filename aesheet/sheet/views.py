# Create your views here.

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from sheet.models import Character, CharacterSkill, Sheet, Skill, SpellEffect
from sheet.models import Weapon, CharacterEdge
from sheet.forms import *
from django.core.exceptions import ValidationError

def characters_index(request):
    all_characters = Character.objects.all().order_by('name')
    return render_to_response('sheet/characters_index.html', 
                              { 'all_characters' : all_characters })

def character_detail(request, char_id):
    character = get_object_or_404(Character, pk=char_id)
    return render_to_response('sheet/sheet_detail.html', 
                              { 'char' : character })

def sheets_index(request):
    all_sheets = Sheet.objects.all()
    return render_to_response('sheet/sheets_index.html', 
                              { 'all_sheets' : all_sheets })

def process_sheet_change_request(request, sheet):
    assert request.method == "POST"
    form_id = request.POST.get('form_id')
    if not form_id:
        raise ValidationError("No form id")
    forms = {}

    f = SheetForm(request.POST)
    print "Form id: %s" % form_id
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

    elif form_id == "AddWeapon":
        form = AddWeapon(request.POST, sheet=sheet, form_id=form_id)
        if form.is_valid():
            weapon = form.cleaned_data['item']
            weapon = get_object_or_404(Weapon, pk=weapon)
            sheet.weapons.add(weapon)
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
        if form.is_valid():
            skill = form.cleaned_data['item']
            skill = get_object_or_404(Skill, pk=skill)
            cs = CharacterSkill()
            cs.character = sheet.character
            cs.skill = skill
            cs.level = form.cleaned_data['level']
            cs.full_clean()
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
    def __init__(self, item):
        self.item = item

    def remove_form(self):
        return RemoveGeneric(item=self.item,
                             item_type=self.item.__class__.__name__)

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.item, v)

class SheetView(object):
    def __init__(self, sheet):
        self.sheet = sheet

    def weapons(self):
        if not self.sheet.weapons.exists():
            return []
        return [RemoveWrap(xx) for xx in self.sheet.weapons.all()]

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

    forms = {}
    if request.method == "POST":
        (should_change, forms) = process_sheet_change_request(request, sheet)
        # XXX more complex forms need to be passed back to
        # render_to_response, below.    
        if should_change:
            return HttpResponseRedirect('/sheets/%s/' % sheet.id)

    c = {}
    c.update(forms)
    c.update({ 'char' : SheetView(sheet),
          'add_weapon_form' : add_weapon_form,
          'add_spell_effect_form' : add_spell_form,
          'add_skill_form' : add_skill_form,
          'add_edge_form' : add_edge_form,
          })
    return render_to_response('sheet/sheet_detail.html', 
                              c,
                              context_instance=RequestContext(request))
