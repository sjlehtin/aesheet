# Create your views here.

from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponse
from sheet.models import Character, Sheet

def characters_index(request):
    all_characters = Character.objects.all().order_by('name')
    return render_to_response('sheet/characters_index.html', 
                              { 'all_characters' : all_characters })

def character_detail(request, char_id):
    character = get_object_or_404(Character, pk=char_id)
    return render_to_response('sheet/character_detail.html', 
                              { 'char' : character })

def sheets_index(request):
    all_sheets = Sheet.objects.all().order_by('name')
    return render_to_response('sheet/sheet_index.html', 
                              { 'all_sheets' : all_sheets })

def sheet_detail(request, sheet_id):
    return HttpResponse("You're looking at sheet %s." % sheet_id)
