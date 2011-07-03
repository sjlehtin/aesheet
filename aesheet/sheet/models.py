from django.db import models

# Create your models here.
from django.core.exceptions import ValidationError

def validate_nonnegative(value):
    if value < 0:
        raise ValidationError(u'%s is negative' % value)

SIZE_CHOICES = (
    ('F', 'Fine'),
    ('D', 'Diminutive'),
    ('T', 'Tiny'),
    ('S', 'Small'),
    ('M', 'Medium'),
    ('L', 'Large'),
    ('H', 'Huge'),
    ('G', 'Gargantuan'),
    ('C', 'Colossal'),
    )

class Character(models.Model):
    name = models.CharField(max_length=256)
    occupation = models.CharField(max_length=256)
    # XXX race can be used to fill in basic edges and stats later for,
    # e.g., GM usage.
    race = models.CharField(max_length=256)
    description = models.TextField(blank=True)
    age =  models.IntegerField(validators=[validate_nonnegative], default=20)
    unnatural_aging = models.IntegerField(default=0)
    height = models.IntegerField(default=175)
    weigth = models.IntegerField(default=75)
    times_wounded  =  models.IntegerField(validators=[validate_nonnegative], 
                                          default=0)
    size = models.CharField(max_length=1, choices=SIZE_CHOICES, default='M')
    deity = models.CharField(max_length=256, default="Kord")
    adventures = models.IntegerField(validators=[validate_nonnegative], 
                                     default=0)
    gained_sp = models.IntegerField(validators=[validate_nonnegative], 
                                     default=0)

    xp_used_ingame = models.IntegerField(validators=[validate_nonnegative], 
                                         default=0)
    bought_stamina = models.IntegerField(validators=[validate_nonnegative], 
                                         default=0)
    bougth_mana = models.IntegerField(validators=[validate_nonnegative], 
                                      default=0)
    edges_bougth = models.IntegerField(validators=[validate_nonnegative], 
                                       default=0)
    total_xp = models.IntegerField(validators=[validate_nonnegative], 
                                   default=0)

    # The abilities the character was rolled with.
    start_fit = models.IntegerField(validators=[validate_nonnegative], 
                                    default=43)
    start_ref = models.IntegerField(validators=[validate_nonnegative], 
                                    default=43)
    start_lrn = models.IntegerField(validators=[validate_nonnegative], 
                                    default=43)
    start_int = models.IntegerField(validators=[validate_nonnegative], 
                                    default=43)
    start_psy = models.IntegerField(validators=[validate_nonnegative], 
                                    default=43)
    start_wil = models.IntegerField(validators=[validate_nonnegative], 
                                    default=43)
    start_cha = models.IntegerField(validators=[validate_nonnegative], 
                                    default=43)
    start_pos = models.IntegerField(validators=[validate_nonnegative], 
                                    default=43)

    # Current ability scores, i.e., start ability plus increases with
    # XP.
    cur_fit = models.IntegerField(validators=[validate_nonnegative], 
                                  default=43)
    cur_ref = models.IntegerField(validators=[validate_nonnegative], 
                                  default=43)
    cur_lrn = models.IntegerField(validators=[validate_nonnegative], 
                                  default=43)
    cur_int = models.IntegerField(validators=[validate_nonnegative], 
                                  default=43)
    cur_psy = models.IntegerField(validators=[validate_nonnegative], 
                                  default=43)
    cur_wil = models.IntegerField(validators=[validate_nonnegative], 
                                  default=43)
    cur_cha = models.IntegerField(validators=[validate_nonnegative], 
                                  default=43)
    cur_pos = models.IntegerField(validators=[validate_nonnegative], 
                                  default=43)

    # Permanent modifiers to ability scores.
    base_mod_fit = models.IntegerField(default=0)
    base_mod_ref = models.IntegerField(default=0)
    base_mod_lrn = models.IntegerField(default=0)
    base_mod_int = models.IntegerField(default=0)
    base_mod_psy = models.IntegerField(default=0)
    base_mod_wil = models.IntegerField(default=0)
    base_mod_cha = models.IntegerField(default=0)
    base_mod_pos = models.IntegerField(default=0)

    base_mod_mov = models.IntegerField(default=0)
    base_mod_dex = models.IntegerField(default=0)
    base_mod_imm = models.IntegerField(default=0)    

    def cur_mov(self):
        return (self.cur_ref + self.cur_fit)/2

    def cur_dex(self):
        return (self.cur_ref + self.cur_int)/2

    def cur_imm(self):
        return (self.cur_fit + self.cur_psy)/2

    # Base stats before circumstance modifiers.
    def fit(self):
        return self.cur_fit + self.base_mod_fit

    def ref(self):
        return self.cur_ref + self.base_mod_ref

    def lrn(self):
        return self.cur_lrn + self.base_mod_lrn

    def int(self):
        return self.cur_int + self.base_mod_int

    def psy(self):
        return self.cur_psy + self.base_mod_psy

    def wil(self):
        return self.cur_wil + self.base_mod_wil

    def cha(self):
        return self.cur_cha + self.base_mod_cha

    def pos(self):
        return self.cur_pos + self.base_mod_pos

    def mov(self):
        return self.cur_mov() + self.base_mod_mov

    def dex(self):
        return self.cur_dex() + self.base_mod_dex

    def imm(self):
        return self.cur_imm() + self.base_mod_imm

    def eff_fit(self):
        return self.fit + self.mod_fit()

    def eff_ref(self):
        return self.ref + self.mod_ref()

    def eff_lrn(self):
        return self.lrn + self.mod_lrn()

    def eff_int(self):
        return self.int + self.mod_int()

    def eff_psy(self):
        return self.psy + self.mod_psy()

    def eff_wil(self):
        return self.wil + self.mod_wil()

    def eff_cha(self):
        return self.cha + self.mod_cha()

    def eff_pos(self):
        return self.pos + self.mod_pos()

    def eff_mov(self):
        return self.mov + self.mod_mov()

    def eff_dex(self):
        return self.dex + self.mod_dex()

    def eff_imm(self):
        return self.imm + self.mod_imm()

    def mod_fit(self):
        return 0

    def mod_ref(self):
        return 0

    def mod_lrn(self):
        return 0

    def mod_int(self):
        return 0

    def mod_psy(self):
        return 0

    def mod_wil(self):
        return 0

    def mod_cha(self):
        return 0

    def mod_pos(self):
        return 0

    def mod_mov(self):
        return 0

    def mod_dex(self):
        return 0

    def mod_imm(self):
        return 0

    def __unicode__(self):
        return "%s: a %s %s%s" % (self.name, self.race, self.occupation,
                                    ((": %s" % self.description) 
                                     if self.description else ""))

class Sheet(models.Model):
    character = models.ForeignKey(Character)
    description = models.TextField()
    size = models.CharField(max_length=1, choices=SIZE_CHOICES, default='M')
    
    def __unicode__(self):
        return "sheet for %s: %s" % (self.character.name, self.description)

QUALITY_CHOICES = (
    ( "Bone", "Bone" ),
    ( "Stone", "Stone" ),
    ( "Bronze", "Bronze" ),
    ( "Poor", "Poor" ),
    ( "Normal", "Normal" ),
    ( "Damascan", "Damascan" ),
    ( "Mithril", "Mithril" ),
    ( "Adamantite", "Adamantite" ),
    ( "L1", "L1" ),
    ( "L2", "L2" ),
    ( "L3", "L3" ),
    ( "L4", "L4" ),
    ( "L5", "L5" ),
    ( "L6", "L6" ),
    ( "L7", "L7" ),
    ( "L1 of Speed", "L1Speed" ),
    ( "L2 of Speed", "L2Speed" ),
    )

class WeaponTemplate(models.Model):
    name = models.CharField(max_length=256)

    def __unicode__(self):
        return "%s" % (self.name)

class Weapon(models.Model):
    name = models.CharField(max_length=256, blank=True)
    description = models.TextField(blank=True)
    base = models.ForeignKey(WeaponTemplate)
    quality = models.CharField(max_length=64, choices=QUALITY_CHOICES, 
                               default='Normal')
    def __unicode__(self):
        return "%s: %s" % (self.name, self.base)
