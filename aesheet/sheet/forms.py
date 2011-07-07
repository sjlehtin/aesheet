from django import forms
from django.forms import widgets
from sheet.models import CharacterSkill, Weapon, Sheet

class AddWeapon(forms.Form):
    def __init__(self, *args, **kwargs):
        sheet = kwargs.pop('sheet')
        form_id = kwargs.pop('form_id', "add_weapon")
        wpns = Weapon.objects.all()
        choices = [(wpn.id, unicode(wpn)) for wpn in wpns]
        super(AddWeapon, self).__init__(*args, **kwargs)
        self.fields['weapon'].choices = choices
        self.fields['form_id'].initial = form_id

    form_id = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    # choices overridden in __init__()
    weapon = forms.ChoiceField(choices=())

class RemoveWeapon(forms.Form):
    def __init__(self, *args, **kwargs):
        weapon = kwargs.pop('weapon', None)
        form_id = kwargs.pop('form_id', "remove_weapon")
        super(RemoveWeapon, self).__init__(*args, **kwargs)
        if weapon:
            self.fields['weapon'].initial = weapon.id
        self.fields['form_id'].initial = form_id

    form_id = forms.CharField(max_length=64, widget=widgets.HiddenInput)
    weapon = forms.IntegerField(widget=widgets.HiddenInput)
