# Create your views here.

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from sheet.models import Character, Sheet, SpellEffect, Weapon
from sheet.forms import AddSpellEffect, AddWeapon, RemoveGeneric
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
    form_id = request.POST.get('form_id')
    if not form_id:
        raise ValidationError("No form id")
    if form_id == "remove":
        item_type = request.POST.get('item_type')
        if not item_type:
            raise ValidationError("No item_type")
        form = RemoveGeneric(request.POST)
        if form.is_valid():            
            item = form.cleaned_data['item']
            if item_type == "weapon":
                item = get_object_or_404(Weapon, pk=item)
                sheet.weapons.remove(item)
            elif item_type == "spell_effect":
                item = get_object_or_404(SpellEffect, pk=item)
                sheet.spell_effects.remove(item)
            else:
                raise ValidationError("Invalid item type")
            sheet.full_clean()
            sheet.save()
            return HttpResponseRedirect('/sheets/%s/' % sheet.id)
        # removal forms are forgotten and not updated on failures.

    elif form_id == "add_weapon":
        form = AddWeapon(request.POST, sheet=sheet, form_id=form_id)
        if form.is_valid():
            weapon = add_weapon_form.cleaned_data['item']
            weapon = get_object_or_404(Weapon, pk=weapon)
            sheet.weapons.add(weapon)
            sheet.full_clean()
            sheet.save()
            return HttpResponseRedirect('/sheets/%s/' % sheet.id)

    elif form_id == "add_spell_effect":
        form = AddSpellEffect(request.POST, sheet=sheet, form_id=form_id)
        if form.is_valid():
            spell = form.cleaned_data['item']
            spell = get_object_or_404(SpellEffect, pk=spell)
            sheet.spell_effects.add(spell)
            sheet.full_clean()
            sheet.save()
            return HttpResponseRedirect('/sheets/%s/' % sheet.id)


def sheet_detail(request, sheet_id):
    sheet = get_object_or_404(Sheet, pk=sheet_id)

    add_weapon_form = AddWeapon(sheet=sheet, 
                                form_id="add_weapon")
    add_spell_form = AddSpellEffect(sheet=sheet, 
                                    form_id="add_spell_effect")

    if request.method == "POST":
        process_sheet_change_request(request, sheet)
        # XXX more complex forms need to be passed back to
        # render_to_response, below.
    weapons = []
    if sheet.weapons.exists():
        weapons = [{ 'item' : wpn,
                     'remove_form' : RemoveGeneric(item=wpn, 
                                                   form_id="remove",
                                                   item_type="weapon") } 
                   for wpn in sheet.weapons.all()]
        
    spell_effects = []
    if sheet.spell_effects.exists():
        spell_effects = [{ 'item' : item,
                           'remove_form' : RemoveGeneric(
                    item=item, 
                    form_id="remove",
                    item_type="spell_effect") } 
                   for item in sheet.spell_effects.all()]

    return render_to_response('sheet/sheet_detail.html', 
                              { 'char' : sheet,
                                'weapons' : weapons,
                                'spell_effects' : spell_effects,
                                'add_weapon_form' : add_weapon_form,
                                'add_spell_effect_form' : add_spell_form,
                                },
                              context_instance=RequestContext(request))
