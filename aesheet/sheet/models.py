from django.db import models

from functools import wraps

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

    def __unicode__(self):
        return "%s: a %s %s%s" % (self.name, self.race, self.occupation,
                                    ((": %s" % self.description) 
                                     if self.description else ""))

class WeaponQuality(models.Model):
    name = models.CharField(max_length=256, unique=True)
    short_name = models.CharField(max_length=5)
    roa = models.DecimalField(max_digits=6, decimal_places=4, default=0)
    ccv = models.IntegerField(default=0)
    damage = models.IntegerField(default=0)
    leth = models.IntegerField(default=0)
    plus_leth = models.IntegerField(default=0)
    defense_leth = models.IntegerField(default=0)
    durability = models.IntegerField(default=0)
    dp_multiplier = models.DecimalField(max_digits=6, decimal_places=4, 
                                        default=1)
    weight_multiplier = models.DecimalField(max_digits=6, decimal_places=4, 
                                            default=1)
    versus_missile_modifier = models.IntegerField(default=0)
    versus_area_save_modifier = models.IntegerField(default=0)

    class Meta:
        ordering = ["roa", "ccv"]

    def __unicode__(self):
        return self.name

class WeaponTemplate(models.Model):
    name = models.CharField(max_length=256, unique=True)
    ccv = models.IntegerField(default=10)
    ccv_unskilled_modifier = models.IntegerField(default=-10)
    draw_initiative = models.IntegerField(default=-3, blank=True, null=True)
    roa = models.DecimalField(max_digits=4, decimal_places=3, default=1.0)
    num_dice = models.IntegerField(default=1)
    dice = models.IntegerField(default=6)
    extra_damage = models.IntegerField(default=0)
    leth = models.IntegerField(default=5)
    plus_leth = models.IntegerField(default=0)
    defense_leth = models.IntegerField(default=5)
    type = models.CharField(max_length=5, default="S")
    durability = models.IntegerField(default=5)
    dp = models.IntegerField(default=10)
    notes = models.CharField(max_length=64, blank=True)
    short_name = models.CharField(max_length=64)

    is_lance = models.BooleanField(default=False)

    def __unicode__(self):
        return "%s" % (self.name)

class WeaponSpecialQuality(models.Model):
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=256)

    # Effects come with the foreign key in WeaponEffect() class to the
    # name "effects".

    def __unicode__(self):
        return "%s" % (self.short_description)

class Weapon(models.Model):
    # XXX name from template (appended with quality or something to that
    # effect) will be used if this is not set (= is blank).  If this is
    # set, the name given here should be unique.  Add a validator to
    # verify this.
    name = models.CharField(max_length=256, blank=True)
    description = models.TextField(blank=True)
    base = models.ForeignKey(WeaponTemplate)
    quality = models.ForeignKey(WeaponQuality)
    special_qualities = models.ManyToManyField(WeaponSpecialQuality)

    def __unicode__(self):
        return "%s: %s" % (self.name, self.base)

class Effect(models.Model):
    name = models.CharField(max_length=256, unique=True)
    description = models.TextField(blank=True)
    # `notes' will be added to the effects list, which describes all the
    # noteworthy resistances and immunities of the character not
    # immediately visible from stats, saves and such.
    notes = models.TextField(blank=True)
    cc_skill_levels = models.IntegerField(default=0)

    fit = models.IntegerField(default=0)
    fit = models.IntegerField(default=0)
    ref = models.IntegerField(default=0)
    lrn = models.IntegerField(default=0)
    int = models.IntegerField(default=0)
    psy = models.IntegerField(default=0)
    wil = models.IntegerField(default=0)
    cha = models.IntegerField(default=0)
    pos = models.IntegerField(default=0)
    mov = models.IntegerField(default=0)
    dex = models.IntegerField(default=0)
    imm = models.IntegerField(default=0)

    saves_vs_fire = models.IntegerField(default=0)
    saves_vs_cold = models.IntegerField(default=0)
    saves_vs_lightning = models.IntegerField(default=0)
    saves_vs_poison = models.IntegerField(default=0)
    saves_vs_all = models.IntegerField(default=0)

    class Meta:
        abstract = True

    def __unicode__(self):
        return "%s" % (self.name)
    
class WeaponEffect(Effect):
    weapon = models.ForeignKey(WeaponSpecialQuality, related_name="effects")

class SpellEffect(Effect):
    pass

class Edge(models.Model):
    name = models.CharField(max_length=256, unique=True)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    def __unicode__(self):
        return "%s" % (self.name)
    
SKILL_TYPES = [
    "Physical",
    "Combat",
    "Trade",
    "Education",
    "Specialty",
    "Social",
    "Mage",
    "Priest",
    "Language"
    ]
SKILL_TYPES = zip(SKILL_TYPES, SKILL_TYPES)

class Skill(models.Model):
    name = models.CharField(max_length=256, unique=True)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    can_be_defaulted = models.BooleanField(default=True)
    is_specialization = models.BooleanField(default=False)

    required_skills = models.ManyToManyField('self', symmetrical=False, 
                                             blank=True, null=True)
    required_edges = models.ManyToManyField(Edge, blank=True, null=True)

    skill_cost_0 = models.IntegerField(blank=True, null=True)
    skill_cost_1 = models.IntegerField(blank=True, null=True)
    skill_cost_2 = models.IntegerField(blank=True, null=True)
    skill_cost_3 = models.IntegerField(blank=True, null=True)

    type = models.CharField(max_length=64, choices=SKILL_TYPES)

    def cost(self, level):
        if level == 0:
            return self.skill_cost_0

        if level == 1:
            cost_at_this_level = self.skill_cost_1
        elif level == 2:
            cost_at_this_level = self.skill_cost_2
        elif level > 5:
            cost_at_this_level = self.skill_cost_3 + 2
        else:
            cost_at_this_level = self.skill_cost_3

        return cost_at_this_level + self.cost(level - 1)

    def __unicode__(self):
        return "%s" % (self.name)

class CharacterSkill(models.Model):
    # XXX A skill with a with a key (character, skill) should be unique.
    character = models.ForeignKey(Character, related_name='skills')
    skill = models.ForeignKey(Skill)
    skill_level = models.IntegerField(default=0)

    def cost(self):
        return self.skill.cost(self.skill_level)

    def comments(self):
        comments = []
        diff = set(self.skill.required_skills.all()).difference(
            self.character.skills.all())
        diff = [unicode(xx) for xx in diff]
        if len(diff) > 0:
            comments.append("Required skill %s missing." % ','.join(diff))
        return "\n".join(comments)

    def __unicode__(self):
        return "%s: %s %s" % (self.character, self.skill, self.skill_level)

class Sheet(models.Model):
    character = models.ForeignKey(Character)
    description = models.TextField()
    size = models.CharField(max_length=1, choices=SIZE_CHOICES, default='M')
    
    weapons = models.ManyToManyField(Weapon, blank=True)
    
    spell_effects = models.ManyToManyField(SpellEffect, blank=True)

    def eff_fit(self):
        return self.fit() + self.mod_fit()

    def eff_ref(self):
        return self.ref() + self.mod_ref()

    def eff_lrn(self):
        return self.lrn() + self.mod_lrn()

    def eff_int(self):
        return self.int() + self.mod_int()

    def eff_psy(self):
        return self.psy() + self.mod_psy()

    def eff_wil(self):
        return self.wil() + self.mod_wil()

    def eff_cha(self):
        return self.cha() + self.mod_cha()

    def eff_pos(self):
        return self.pos() + self.mod_pos()

    def eff_mov(self):
        return (self.eff_fit() + self.eff_ref())/2 + self.mod_mov()

    def eff_dex(self):
        return (self.eff_ref() + self.eff_int())/2 + self.mod_mov()

    def eff_imm(self):
        return (self.eff_fit() + self.eff_psy())/2 + self.mod_mov()

    def mod_stat(self, stat):
        # XXX allow different types of effects stack.
        # Exclude effects which don't have an effect on stat.
        kwargs = { stat : 0}
        effects = self.spell_effects.exclude(**kwargs)
        if effects:
            eff = max(effects, key=lambda xx: getattr(xx, stat))
            return getattr(eff, stat)
        return 0

    def pass_func_name(func):
        "Name of decorated function will be passed as keyword arg _func_name"
        @wraps(func)
        def _pass_name(*args, **kwds):
            kwds['_func_name'] = func.func_name
            return func(*args, **kwds)
        return _pass_name

    @pass_func_name
    def mod_fit(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_ref(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_lrn(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_int(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_psy(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_wil(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_cha(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_pos(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_mov(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_dex(self, _func_name=None):
        return self.mod_stat(_func_name[4:])
    @pass_func_name
    def mod_imm(self, _func_name=None):
        return self.mod_stat(_func_name[4:])

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError()
        return getattr(self.character, v)

    def __unicode__(self):
        return "sheet for %s: %s" % (self.character.name, self.description)

