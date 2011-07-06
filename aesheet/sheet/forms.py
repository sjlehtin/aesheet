from django import forms
from sheet.models import CharacterSkill, Weapon, Sheet

class AddWeapon(forms.Form):
    def __init__(self, *args, **kwargs):
        sheet = kwargs.pop('sheet')
        wpns = Weapon.objects.all()
        choices = [(wpn.id, unicode(wpn)) for wpn in wpns]
        super(AddWeapon, self).__init__(*args, **kwargs)
        self.fields['weapon'].choices = choices

    # choices overridden in __init__()
    weapon = forms.ChoiceField(choices=())
