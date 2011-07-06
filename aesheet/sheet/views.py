# Create your views here.

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse, HttpResponseRedirect
from django.template import RequestContext
from sheet.models import Character, Sheet, Weapon
from sheet.forms import AddWeapon

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

def sheet_add_weapon(request, sheet_id):
    sheet = get_object_or_404(Sheet, pk=sheet_id)
    if request.method == "POST":
        form = AddWeapon(request.POST, sheet=sheet)
        if form.is_valid():
            weapon = form.cleaned_data['weapon']
            weapon = get_object_or_404(Weapon, pk=weapon)
            sheet.weapons.add(weapon)
            sheet.full_clean()
            sheet.save()
            return HttpResponseRedirect('/sheets/%s/' % sheet.id)
    else:
        form = AddWeapon(sheet=sheet)
    return render_to_response('sheet/add_weapon.html',
                              { 'form' : form,
                                'char' : sheet },
                              context_instance=RequestContext(request))

def sheet_detail(request, sheet_id):
    sheet = get_object_or_404(Sheet, pk=sheet_id)
    if request.method == "POST":
        weapon_form = AddWeapon(request.POST, sheet=sheet)
        if form.is_valid():
            weapon = form.cleaned_data['weapon']
            weapon = get_object_or_404(Weapon, pk=weapon)
            sheet.weapons.add(weapon)
            sheet.full_clean()
            sheet.save()
            return HttpResponseRedirect('/sheets/%s/' % sheet.id)
    else:
        weapon_form = AddWeapon(sheet=sheet)
    return render_to_response('sheet/sheet_detail.html', 
                              { 'char' : sheet,
                                'weapon_form' : weapon_form,},
                              context_instance=RequestContext(request))
