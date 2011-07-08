from django import forms
from django.forms import widgets
from sheet.models import CharacterSkill, Skill, Sheet, SpellEffect, Weapon

class AddWeapon(forms.Form):
    def __init__(self, *args, **kwargs):
        sheet = kwargs.pop('sheet')
        form_id = kwargs.pop('form_id', "add_weapon")
        wpns = Weapon.objects.all()
        choices = [(wpn.id, unicode(wpn)) for wpn in wpns]
        super(AddWeapon, self).__init__(*args, **kwargs)
        self.fields['item'].choices = choices
        self.fields['form_id'].initial = form_id

    form_id = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    # choices overridden in __init__()
    item = forms.ChoiceField(choices=())

class AddSpellEffect(forms.Form):
    def __init__(self, *args, **kwargs):
        sheet = kwargs.pop('sheet')
        form_id = kwargs.pop('form_id', "add_spell_effect")
        items = SpellEffect.objects.all()
        choices = [(item.id, unicode(item)) for item in items]
        super(AddSpellEffect, self).__init__(*args, **kwargs)
        self.fields['item'].choices = choices
        self.fields['form_id'].initial = form_id

    form_id = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    # choices overridden in __init__()
    item = forms.ChoiceField(choices=())

class AddSkill(forms.Form):
    def __init__(self, *args, **kwargs):
        sheet = kwargs.pop('sheet')
        form_id = kwargs.pop('form_id', "add_skill")
        items = Skill.objects.all()
        choices = [(item.id, unicode(item)) for item in items]
        super(self.__class__, self).__init__(*args, **kwargs)
        self.fields['item'].choices = choices
        self.fields['form_id'].initial = form_id

    form_id = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    # choices overridden in __init__()
    item = forms.ChoiceField(choices=())
    # XXX
    choices = range(0,8)
    choices = zip(choices, choices)
    level = forms.ChoiceField(choices=choices)

class RemoveGeneric(forms.Form):
    def __init__(self, *args, **kwargs):
        item = kwargs.pop('item', None)
        form_id = kwargs.pop('form_id', "")
        item_type = kwargs.pop('item_type', "")
        super(RemoveGeneric, self).__init__(*args, **kwargs)
        if item:
            self.fields['item'].initial = item.id
        if item_type:
            self.fields['item_type'].initial = item_type
        self.fields['form_id'].initial = form_id

    form_id = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    item_type = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    item = forms.IntegerField(widget=widgets.HiddenInput)
