from __future__ import division
from django.db import models
import django.contrib.auth as auth
import math
import logging
from functools import wraps
import pprint
from collections import namedtuple
from django.db.models import Sum
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)
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

def roundup(dec):
    return int(math.ceil(dec))

def rounddown(dec):
    return int(math.floor(dec))

class ExportedModel(models.Model):
    """
    Base class for all exported models.  Allows specifying fields that
    won't be exported, like integer id's that wouldn't really help a
    user trying to input data into the system.
    """
    @classmethod
    def dont_export(self):
        return []

    @classmethod
    def get_exported_fields(cls):
        names = [field.name for field in cls._meta.fields]
        names.extend(list(set(cls._meta.get_all_field_names()
                              ).difference(set(names))))
        if "edge" in names:
            names.remove("edge")
            names.insert(0, "edge")
        if "name" in names:
            names.remove("name")
            names.insert(0, "name")
        return filter(lambda xx: xx not in cls.dont_export(), names)

    class Meta:
        abstract = True

class Character(models.Model):
    """
    Model for the character "under" the sheet.  Modifications to the
    basic character will immediately affect all sheets based on the
    character.
    """
    name = models.CharField(max_length=256)
    owner = models.ForeignKey(auth.models.User, related_name="characters")
    occupation = models.CharField(max_length=256)
    # XXX race can be used to fill in basic edges and stats later for,
    # e.g., GM usage.
    race = models.CharField(max_length=256)
    description = models.TextField(blank=True)
    age =  models.PositiveIntegerField(default=20)
    unnatural_aging = models.IntegerField(default=0)
    height = models.IntegerField(default=175)
    weigth = models.IntegerField(default=75)
    times_wounded  =  models.PositiveIntegerField(default=0)
    size = models.CharField(max_length=1, choices=SIZE_CHOICES, default='M')

    hero = models.BooleanField(default=False)

    deity = models.CharField(max_length=256, default="Kord")
    adventures = models.PositiveIntegerField(default=0)
    gained_sp = models.PositiveIntegerField(default=0)

    xp_used_ingame = models.PositiveIntegerField(default=0)
    bought_stamina = models.PositiveIntegerField(default=0)
    bought_mana = models.PositiveIntegerField(default=0)
    edges_bought = models.PositiveIntegerField(default=0)
    total_xp = models.PositiveIntegerField(default=0)

    # The abilities the character was rolled with.
    start_fit = models.PositiveIntegerField(default=43)
    start_ref = models.PositiveIntegerField(default=43)
    start_lrn = models.PositiveIntegerField(default=43)
    start_int = models.PositiveIntegerField(default=43)
    start_psy = models.PositiveIntegerField(default=43)
    start_wil = models.PositiveIntegerField(default=43)
    start_cha = models.PositiveIntegerField(default=43)
    start_pos = models.PositiveIntegerField(default=43)

    # Current ability scores, i.e., start ability plus increases with
    # XP.
    cur_fit = models.PositiveIntegerField(default=43)
    cur_ref = models.PositiveIntegerField(default=43)
    cur_lrn = models.PositiveIntegerField(default=43)
    cur_int = models.PositiveIntegerField(default=43)
    cur_psy = models.PositiveIntegerField(default=43)
    cur_wil = models.PositiveIntegerField(default=43)
    cur_cha = models.PositiveIntegerField(default=43)
    cur_pos = models.PositiveIntegerField(default=43)

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

    free_edges = models.IntegerField(default=2)

    def get_ability(self, abilities, ability, accessor):
        """
        Optimized for prefetched many-to-many fields.
        """
        if not ability:
            return None

        if isinstance(ability, basestring):
            for aa in abilities.all():
                if ability == accessor(aa).name:
                    return aa
        else:
            for aa in abilities.all():
                if ability == accessor(aa):
                    return aa

        return None

    def get_edge(self, edge):
        ce = self.get_ability(self.edges, edge,
                              accessor=lambda xx: xx.edge.edge)
        if ce:
            return ce.edge
        else:
            return None

    def get_skill(self, skill):
        cs = self.get_ability(self.skills, skill,
                              accessor=lambda xx: xx.skill)
        if cs:
            return cs
        else:
            return None

    def has_skill(self, skill):
        if skill is None:
            return True
        if self.get_skill(skill):
            return True
        return False

    def skill_level(self, skill):
        """
        Return level of the skill, specified by the skill's name, or None
        if the character doesn't possess the specified skill.
        """
        skill = self.get_skill(skill)
        if skill:
            return skill.level
        return None

    def edge_level(self, edge_name):
        ee = self.get_edge(edge_name)
        if not ee:
            return 0
        return ee.level

    def _mod_stat(self, stat):
        # Exclude effects which don't have an effect on stat.
        mod = 0

        edges = self.edges.all() # prefetched.
        if edges:
            mod += sum([getattr(ee.edge, stat) for ee in edges])

        mod += getattr(self, 'base_mod_' + stat)
        return mod

    def _stat_wrapper(func):
        @wraps(func)
        def _pass_name(*args, **kwds):
            o = args[0]
            base = 0
            extra = func(o)
            if extra:
                base += extra
            return base + o._mod_stat(func.func_name[4:])
        return _pass_name
    @property
    @_stat_wrapper
    def mod_fit(self):
        pass
    @property
    @_stat_wrapper
    def mod_ref(self):
        pass
    @property
    @_stat_wrapper
    def mod_lrn(self):
        pass
    @property
    @_stat_wrapper
    def mod_int(self):
        pass
    @property
    @_stat_wrapper
    def mod_psy(self):
        pass
    @property
    @_stat_wrapper
    def mod_wil(self):
        pass
    @property
    @_stat_wrapper
    def mod_cha(self):
        pass
    @property
    @_stat_wrapper
    def mod_pos(self):
        pass
    @property
    @_stat_wrapper
    def mod_mov(self):
        pass
    @property
    @_stat_wrapper
    def mod_dex(self):
        pass
    @property
    @_stat_wrapper
    def mod_imm(self):
        pass

    # Base stats before circumstance modifiers.
    @property
    def fit(self):
        return self.cur_fit + self.mod_fit

    @property
    def ref(self):
        return self.cur_ref + self.mod_ref

    @property
    def lrn(self):
        return self.cur_lrn + self.mod_lrn

    @property
    def int(self):
        return self.cur_int + self.mod_int

    @property
    def psy(self):
        return self.cur_psy + self.mod_psy

    @property
    def wil(self):
        return self.cur_wil + self.mod_wil

    @property
    def cha(self):
        return self.cur_cha + self.mod_cha

    @property
    def pos(self):
        return self.cur_pos + self.mod_pos

    @property
    def mov(self):
        return roundup((self.ref + self.fit)/2.0) + self.mod_mov

    @property
    def dex(self):
        return roundup((self.ref + self.int)/2.0) + self.mod_dex

    @property
    def imm(self):
        return roundup((self.fit + self.psy)/2.0) + self.mod_imm

    @property
    def xp_used_stats(self):
        xp_used_stats = 0
        for st in ["fit", "ref", "lrn", "int", "psy", "wil", "cha", "pos"]:
            xp_used_stats += (getattr(self, "cur_" + st) -
                              getattr(self, "start_" + st))
        xp_used_stats += self.bought_stamina
        xp_used_stats += self.bought_mana
        xp_used_stats *= 5
        return xp_used_stats

    @property
    def xp_used_edges(self):
        # XXX this should be changed in the future to just count the
        # cost from the actual edges obtained by the character.
        return 25 * self.edges_bought
        # sum([ee.edge.cost for ee in self.edges.all()])

    @property
    def xp_used_hero(self):
        if self.hero:
            return 100
        return 0

    def xp_used(self):
        return self.xp_used_edges + self.xp_used_ingame + \
            self.xp_used_stats + self.xp_used_hero

    def __unicode__(self):
        return "%s: %s %s" % (self.name, self.race, self.occupation)

    @property
    def initial_sp(self):
        return roundup(self.start_lrn/3.0) + roundup(self.start_int/5.0) + \
            roundup(self.start_psy/10.0)

    @property
    def age_sp(self):
        return roundup(self.lrn/15.0 + self.int/25.0 + self.psy/50.0)

    @property
    def missing_skills(self):

        from django.db import connection, transaction
        cursor = connection.cursor()

        # # Get all skill the character has prerequisites for.
        cursor.execute(
            # First get all the skills that are required for the
            # characters skills.
            """SELECT cs.skill_id, rs.to_skill_id FROM
               sheet_skill_required_skills rs, sheet_characterskill cs WHERE
               cs.character_id = %s and cs.skill_id = rs.from_skill_id

               EXCEPT
            """
            # Then take out all skills the character has the skills for.
            """
               SELECT rs.from_skill_id, cs.skill_id FROM
               sheet_skill_required_skills rs, sheet_characterskill cs WHERE
               cs.character_id = %s and cs.skill_id = rs.to_skill_id""",
            [self.id, self.id])
        return dict(cursor.fetchall())

class Edge(ExportedModel):
    """
    A base model for edges.  Here is information that would otherwise
    repeat through all the edge levels.
    """
    name = models.CharField(max_length=256, primary_key=True)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    @classmethod
    def dont_export(self):
        return ['skill', 'edgelevel']

    def __unicode__(self):
        return "%s" % (self.name)

SKILL_TYPES = [
    "Physical",
    "Combat",
    "Specialty",
    "Education",
    "Social",
    "Mystical",
    "Mage",
    "Priest",
    "Language"
    ]
SKILL_TYPES = zip(SKILL_TYPES, SKILL_TYPES)

BASE_STATS = [
    "FIT",
    "REF",
    "LRN",
    "INT",
    "PSY",
    "WIL",
    "CHA",
    "POS",
    ]
STAT_TYPES = BASE_STATS + [
    "DEX",
    "MOV",
    "IMM",
    ]
STAT_TYPES = zip(STAT_TYPES, STAT_TYPES)

class Skill(ExportedModel):
    """
    """
    class Meta:
        ordering = ['name']
    name = models.CharField(max_length=256, primary_key=True)
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    can_be_defaulted = models.BooleanField(default=True)
    is_specialization = models.BooleanField(default=False)

    # XXX Should be any of these? See Construction.  Add another
    # attribute for another required skill?
    #
    # TODO: Fix construction skill.

    required_skills = models.ManyToManyField('self', symmetrical=False,
                                             blank=True, null=True)
    required_edges = models.ManyToManyField(Edge, blank=True, null=True)

    skill_cost_0 = models.IntegerField(blank=True, null=True)
    skill_cost_1 = models.IntegerField(blank=True, null=True)
    skill_cost_2 = models.IntegerField(blank=True, null=True)
    skill_cost_3 = models.IntegerField(blank=True, null=True)

    type = models.CharField(max_length=64, choices=SKILL_TYPES)

    stat = models.CharField(max_length=64, choices=STAT_TYPES)

    def cost(self, level):
        if level == 0:
            if not self.skill_cost_0:
                return 0
            return self.skill_cost_0

        if level == 1:
            cost_at_this_level = self.skill_cost_1
        elif level == 2:
            cost_at_this_level = self.skill_cost_2
        elif level > 5:
            cost_at_this_level = self.skill_cost_3 + 2
        else:
            cost_at_this_level = self.skill_cost_3

        if cost_at_this_level == None:
            raise ValueError("Skill doesn't support level %s" % level)
        return cost_at_this_level + self.cost(level - 1)

    @classmethod
    def dont_export(cls):
        return ['characterskill',
                'primary_for_rangedweapontemplate',
                'secondary_for_rangedweapontemplate',
                'base_skill_for_rangedweapontemplate',
                'primary_for_weapontemplate',
                'secondary_for_weapontemplate',
                'base_skill_for_weapontemplate',
                'skill', 'edgeskillbonus']

    def __unicode__(self):
        return "%s" % (self.name)

class CharacterSkill(models.Model):
    character = models.ForeignKey(Character, related_name='skills')
    skill = models.ForeignKey(Skill)
    level = models.IntegerField(default=0)

    def clean(self):
        # A skill with a key (character, skill) should be unique.
        if CharacterSkill.objects.filter(skill=self.skill,
                                         character=self.character):
            raise ValidationError("Skill `%s' already obtained." %
                                  (self.skill))
        # Verify that skill level is supported by the skill.
        try:
            cost = self.skill.cost(self.level)
        except ValueError as e:
            raise ValidationError("Invalid level for skill %s: %s (%s)" %
                                  (self.skill, self.level, e))

    def cost(self):
        return self.skill.cost(self.level)

    def comments(self):
        comments = []

        #if self.skill.required_skills.exists():
        #    missing = self.skill.required_skills.exclude(
        #        name__in=[xx.skill.name for xx in self.character.skills.all()])
        #
        #    if missing.exists():
        #        comments.append("Required skill %s missing." %
        #                        ','.join((xx.name for xx in missing)))
        #        print comments
        return "\n".join(comments)


    def check(self, sheet):
        mod = 0
        # edge modifiers.  Avoids database hit.  Will not scale with a
        # very large number of edges giving bonuses to skills, so watch
        # out for that.
        for sk in self.skill.edgeskillbonus_set.all():
            for ee in self.character.edges.all():
                if ee.edge == sk.edge_level:
                    mod += sk.bonus
                    break
        # XXX armor modifiers
        return mod + self.level * 5 + \
            getattr(sheet, "eff_" + self.skill.stat.lower())

    def __unicode__(self):
        return "%s: %s %s" % (self.character, self.skill, self.level)

    class Meta:
        ordering = ('skill__name', ) # XXX before explicit ordering.

class StatModifier(models.Model):
    # `notes' will be added to the effects list, which describes all the
    # noteworthy resistances and immunities of the character not
    # immediately visible from stats, saves and such.
    notes = models.TextField(blank=True)

    cc_skill_levels = models.IntegerField(default=0)

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

class EdgeLevel(ExportedModel, StatModifier):
    """
    This stores the actual modifiers for a specific edge at a certain
    level, like Eye-Hand Coordination 2.
    """
    edge = models.ForeignKey(Edge)
    level = models.IntegerField(default=1)
    cost = models.DecimalField(max_digits=4, decimal_places=1)
    requires_hero = models.BooleanField(default=False)
    # XXX race requirement?
    skill_bonuses = models.ManyToManyField(Skill, through='EdgeSkillBonus')

    @classmethod
    def dont_export(cls):
        return ['characteredge', 'edgeskillbonus', 'skill_bonuses']

    def __unicode__(self):
        return "%s %s (%s)" % (self.edge, self.level, self.cost)

class EdgeSkillBonus(ExportedModel):
    """
    Skill bonuses from edges, e.g., +15 to Surgery from Acute Touch, is
    achieved with adding these.  Get the `id' (an integer value) of an
    existing EdgeLevel (like Acute Touch 1) and the skill and assign a
    bonus (or penalty, if negative).
    """
    edge_level = models.ForeignKey(EdgeLevel)
    skill = models.ForeignKey(Skill)
    bonus = models.IntegerField(default=15)

    def __unicode__(self):
        return "%s -> %s: %+d" % (self.edge_level, self.skill, self.bonus)

class CharacterEdge(models.Model):
    character = models.ForeignKey(Character, related_name='edges')
    edge = models.ForeignKey(EdgeLevel)

    def __unicode__(self):
        return "%s: %s" % (self.character, self.edge)

class BaseWeaponQuality(ExportedModel):
    name = models.CharField(max_length=256, primary_key=True)
    short_name = models.CharField(max_length=5, blank=True)
    roa = models.DecimalField(max_digits=6, decimal_places=4, default=0)
    ccv = models.IntegerField(default=0)

    damage = models.IntegerField(default=0)
    leth = models.IntegerField(default=0)
    plus_leth = models.IntegerField(default=0)

    durability = models.IntegerField(default=0)
    dp_multiplier = models.DecimalField(max_digits=6, decimal_places=4,
                                        default=1)
    weight_multiplier = models.DecimalField(max_digits=6, decimal_places=4,
                                            default=1)
    notes = models.CharField(max_length=256, blank=True)

    class Meta:
        abstract = True
        ordering = ["roa", "ccv"]

class WeaponQuality(BaseWeaponQuality):
    """
    """
    defense_leth = models.IntegerField(default=0)

    versus_missile_modifier = models.IntegerField(default=0)
    versus_area_save_modifier = models.IntegerField(default=0)

    @classmethod
    def dont_export(cls):
        return ['weapon', 'rangedweapon', 'rangedweaponammo_set']

    def __unicode__(self):
        return self.name

class WeaponDamage(object):
    def __init__(self, num_dice, dice, extra_damage=0, leth=0, plus_leth=0):
        self.num_dice = num_dice
        self.dice = dice
        self.extra_damage = extra_damage
        self.leth = leth
        self.plus_leth = plus_leth

    def add_damage(self, dmg):
        self.extra_damage += dmg

    # XXX remove and add size modification on the fly?
    def multiply_damage(self, mult):
        self.num_dice *= mult
        self.extra_damage *= mult

    def add_leth(self, leth):
        self.leth += leth

    # XXX remove?
    def max_damage(self):
        return self.num_dice * self.dice + self.extra_damage

    def __unicode__(self):
        return "%sd%s%s/%d" % (
            self.num_dice, self.dice,
            "%+d" % self.extra_damage if self.extra_damage else "", self.leth)

class BaseWeaponTemplate(ExportedModel):
    class Meta:
        abstract = True
        ordering = ['name']
    name = models.CharField(max_length=256, primary_key=True)
    short_name = models.CharField(
        max_length=64,
        help_text="This is used when the name must be fit to a small space")
    description = models.TextField(blank=True)
    notes = models.CharField(max_length=64, blank=True)

    draw_initiative = models.IntegerField(default=-3, blank=True, null=True)

    roa = models.DecimalField(max_digits=4, decimal_places=3, default=1.0)

    num_dice = models.IntegerField(default=1)
    dice = models.IntegerField(default=6)
    extra_damage = models.IntegerField(default=0)
    leth = models.IntegerField(default=5)
    plus_leth = models.IntegerField(default=0)

    type = models.CharField(max_length=5, default="S")

    durability = models.IntegerField(default=5)
    dp = models.IntegerField(default=10)

    weight = models.DecimalField(max_digits=4, decimal_places=1,
                                 default=1.0)

    # XXX Melee weapons currently always assume "Weapon Combat"
    base_skill = models.ForeignKey(Skill,
                                   related_name="base_skill_for_%(class)s")
    skill = models.ForeignKey(Skill, blank=True, null=True,
                              related_name="primary_for_%(class)s")
    skill2 = models.ForeignKey(Skill, blank=True, null=True,
                               related_name="secondary_for_%(class)s")

    @classmethod
    def dont_export(self):
        return ['weapon']

    def __unicode__(self):
        return "%s" % (self.name)

class WeaponTemplate(BaseWeaponTemplate):
    """
    """
    ccv = models.IntegerField(default=10)
    ccv_unskilled_modifier = models.IntegerField(default=-10)

    defense_leth = models.IntegerField(default=5)

    is_lance = models.BooleanField(default=False)
    is_shield = models.BooleanField(default=False)

class RangedWeaponTemplate(BaseWeaponTemplate):
    """
    """
    target_initiative = models.IntegerField(default=-2)
    # XXX special max leth due to dura (durability for this purpose is
    # max leth+1, max leth due to high fit is thus max leth + 2)

    ammo_weight = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0.1)
    range_pb = models.IntegerField(blank=True, null=True)
    range_xs = models.IntegerField()
    range_vs = models.IntegerField()
    range_s = models.IntegerField()
    range_m = models.IntegerField()
    range_l = models.IntegerField()
    range_xl = models.IntegerField()
    range_e = models.IntegerField()

    @classmethod
    def dont_export(self):
        return ['rangedweapon']

EFFECT_TYPES = [
    "enhancement",
    "luck",
    "circumstance",
    ]
EFFECT_TYPES = zip(EFFECT_TYPES, EFFECT_TYPES)

class Effect(StatModifier):
    name = models.CharField(primary_key=True, max_length=256)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=256,
                            choices=EFFECT_TYPES,
                            default="enhancement",
                            help_text="Effect type.  With the exception of "
                            "circumstance bonus, only highest effect of "
                            "a single type will take effect.")
    class Meta:
        ordering = ['name']
        abstract = True

    def __unicode__(self):
        return "%s" % (self.name)

class WeaponSpecialQuality(ExportedModel):
    """
    """
    name = models.CharField(max_length=32, primary_key=True)
    description = models.TextField(blank=True)

    @classmethod
    def dont_export(cls):
        return ['weapon', 'rangedweapon']

    # Effects come with the foreign key in WeaponEffect() class to the
    # name "effects".

    def __unicode__(self):
        return "%s" % (self.name)

class ArmorSpecialQuality(ExportedModel):
    """
    """
    name = models.CharField(max_length=32, primary_key=True)
    description = models.TextField(blank=True)

    @classmethod
    def dont_export(cls):
        return ['armor']

    # Effects come with the foreign key in ArmorEffect() class to the
    # name "effects".
    def __unicode__(self):
        return "%s" % (self.name)

class Weapon(ExportedModel):
    """
    """
    # XXX name from template (appended with quality or something to that
    # effect) will be used if this is not set (= is blank).  If this is
    # set, the name given here should be unique.  Add a validator to
    # verify this.
    name = models.CharField(max_length=256, blank=True)
    description = models.TextField(blank=True)
    base = models.ForeignKey(WeaponTemplate)
    quality = models.ForeignKey(WeaponQuality)
    special_qualities = models.ManyToManyField(WeaponSpecialQuality, blank=True)

    class Meta:
        ordering = ['name']

    @classmethod
    def dont_export(cls):
        return ['sheet']

    @property
    def ccv(self):
        return self.base.ccv + self.quality.ccv

    def roa(self):
        # XXX modifiers for size of weapon.
        return float(self.base.roa + self.quality.roa)

    def damage(self):
        # XXX modifiers for size of weapon.
        #
        # XXX respect the maximum damage allowed by the weapon (from
        # damage dice and magical bonuses) to cap bonuses from FIT.
        return WeaponDamage(
            self.base.num_dice, self.base.dice,
            extra_damage=self.base.extra_damage + self.quality.damage,
            leth=self.base.leth + self.quality.leth,
            plus_leth=self.base.plus_leth + self.quality.plus_leth)

    def defense_damage(self):
        # XXX modifiers for size of weapon.
        return WeaponDamage(
            self.base.num_dice, self.base.dice,
            extra_damage=self.base.extra_damage + self.quality.damage,
            leth=self.base.defense_leth + self.quality.leth)

    def __unicode__(self):
        if self.name:
            return self.name
        quality = ""
        if self.quality.name != "Normal":
            quality = self.quality
        return "%s %s" % (quality, self.base)

Range = namedtuple('Range', ('pb', 'xs', 'vs', 's', 'm', 'l', 'xl', 'e'))

class RangedWeapon(ExportedModel):
    """
    """
    # XXX name from template (appended with quality or something to that
    # effect) will be used if this is not set (= is blank).  If this is
    # set, the name given here should be unique.  Add a validator to
    # verify this.
    name = models.CharField(max_length=256, blank=True)
    description = models.TextField(blank=True)
    base = models.ForeignKey(RangedWeaponTemplate)
    quality = models.ForeignKey(WeaponQuality)
    ammo_quality = models.ForeignKey(WeaponQuality, blank=True, null=True,
                                     related_name="rangedweaponammo_set")
    special_qualities = models.ManyToManyField(WeaponSpecialQuality,
                                               blank=True)

    class Meta:
        ordering = ['name']

    @classmethod
    def dont_export(cls):
        return ['sheet']

    def roa(self):
        # XXX modifiers for size of weapon.
        return float(self.base.roa + self.quality.roa)

    @property
    def to_hit(self):
        # XXX
        return self.quality.ccv

    def damage(self):
        # XXX modifiers for size of weapon.
        #
        # XXX respect the maximum damage allowed by the weapon (from
        # damage dice and magical bonuses) to cap bonuses from FIT.
        return WeaponDamage(
            self.base.num_dice, self.base.dice,
            extra_damage=self.base.extra_damage + self.quality.damage,
            leth=self.base.leth + self.quality.leth,
            plus_leth=self.base.plus_leth + self.quality.plus_leth)

    def __unicode__(self):
        if self.name:
            return self.name
        quality = ""
        if self.quality.name != "Normal":
            quality = self.quality
        return "%s %s" % (quality, self.base)

    def ranges(self, sheet):
        return Range._make([self.base.range_pb, self.base.range_xs,
                            self.base.range_vs, self.base.range_s,
                            self.base.range_m, self.base.range_l,
                            self.base.range_xl, self.base.range_e])

class ArmorTemplate(ExportedModel):
    """
    """
    name = models.CharField(max_length=256, primary_key=True)
    description = models.TextField(blank=True)
    armor_h_p = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_h_s = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_h_b = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_h_r = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_h_f = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_h_dr = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_h_dp = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_t_p = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_t_s = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_t_b = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_t_r = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_t_f = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_t_dr = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_t_dp = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ll_p = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ll_s = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ll_b = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ll_r = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ll_f = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ll_dr = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ll_dp = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_la_p = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_la_s = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_la_b = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_la_r = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_la_f = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_la_dr = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_la_dp = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_rl_p = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_rl_s = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_rl_b = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_rl_r = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_rl_f = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_rl_dr = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_rl_dp = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ra_p = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ra_s = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ra_b = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ra_r = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ra_f = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ra_dr = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_ra_dp = models.DecimalField(max_digits=4, decimal_places=1, default=0)

    is_helm = models.BooleanField(default=False)

    mod_fit = models.IntegerField(default=0)
    mod_ref = models.IntegerField(default=0)
    mod_psy = models.IntegerField(default=0)

    mod_vision = models.IntegerField(default=0)
    mod_hear = models.IntegerField(default=0)
    mod_smell = models.IntegerField(default=0)
    mod_surprise = models.IntegerField(default=0)

    mod_stealth = models.IntegerField(default=0)
    mod_conceal = models.IntegerField(default=0)
    mod_climb = models.IntegerField(default=0)
    mod_tumble = models.IntegerField(default=0)

    weight = models.DecimalField(max_digits=4, decimal_places=1,
                                 default=1.0)
    # 0 no armor, 1 light, 2 medium, 3 heavy
    encumbrance_class = models.IntegerField(default=0)

    # XXX
    protection_level = models.IntegerField(default=1)

    @classmethod
    def dont_export(cls):
        return ['armor']

    def __unicode__(self):
        return "%s" % (self.name)

class ArmorQuality(ExportedModel):
    """
    """
    name = models.CharField(max_length=256, primary_key=True)
    short_name = models.CharField(max_length=5, blank=True)

    dp_multiplier = models.DecimalField(max_digits=4, decimal_places=1,
                                        default=1.0)

    armor_p = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_s = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_b = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_r = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_dr = models.DecimalField(max_digits=4, decimal_places=1, default=0)

    mod_fit_multiplier = models.DecimalField(max_digits=4, decimal_places=1,
                                             default=1.0)
    mod_fit = models.IntegerField(default=0)
    mod_ref = models.IntegerField(default=0)
    mod_psy = models.IntegerField(default=0)
    mod_sensory = models.IntegerField(default=0)
    mod_stealth = models.IntegerField(default=0)
    mod_conceal = models.IntegerField(default=0)
    mod_climb = models.IntegerField(default=0)

    mod_weight_multiplier = models.DecimalField(max_digits=4, decimal_places=1,
                                                default=1.0)
    mod_encumbrance_class = models.IntegerField(default=0)

    @classmethod
    def dont_export(cls):
        return ['armor']

    def __unicode__(self):
        return self.name

class Armor(ExportedModel):
    """
    """
    # XXX name from template (appended with quality or something to that
    # effect) will be used if this is not set (= is blank).  If this is
    # set, the name given here should be unique.  Add a validator to
    # verify this.
    name = models.CharField(max_length=256, blank=True)
    description = models.TextField(blank=True)
    base = models.ForeignKey(ArmorTemplate)
    quality = models.ForeignKey(ArmorQuality)
    special_qualities = models.ManyToManyField(ArmorSpecialQuality, blank=True)

    @classmethod
    def dont_export(cls):
        return ['sheet', 'helm_for']

    def __unicode__(self):
        if self.name:
            return self.name
        return "%s %s" % (self.base.name, self.quality)

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("armor"):
            typ = v.split('_')[-1]
            if typ == 'dp':
                return int(round(getattr(self.base, v) *
                                 self.quality.dp_multiplier))
            return getattr(self.base, v) + getattr(self.quality, "armor_" + typ)

        raise AttributeError, "no attr %s" % v

    @property
    def weight(self):
        return self.base.weight * self.quality.mod_weight_multiplier

    @property
    def mod_fit(self):
        return min(self.base.mod_fit + self.quality.mod_fit, 0)
    @property
    def mod_ref(self):
        return min(self.base.mod_ref + self.quality.mod_ref, 0)
    @property
    def mod_psy(self):
        return min(self.base.mod_psy + self.quality.mod_psy, 0)

class WeaponEffect(ExportedModel, Effect):
    """
    """
    weapon = models.ForeignKey(WeaponSpecialQuality, related_name="effects")

    @classmethod
    def dont_export(cls):
        return ['weapon']

class ArmorEffect(ExportedModel, Effect):
    """
    """
    armor = models.ForeignKey(ArmorSpecialQuality, related_name="effects")

    @classmethod
    def dont_export(cls):
        return ['armor']

class SpellEffect(ExportedModel, Effect):
    """
    """
    @classmethod
    def dont_export(cls):
        return ['sheet']

class Sheet(models.Model):
    character = models.ForeignKey(Character)
    owner = models.ForeignKey(auth.models.User, related_name="sheets")
    description = models.TextField()
    size = models.CharField(max_length=1, choices=SIZE_CHOICES, default='M')

    weapons = models.ManyToManyField(Weapon, blank=True)
    ranged_weapons = models.ManyToManyField(RangedWeapon, blank=True)

    spell_effects = models.ManyToManyField(SpellEffect, blank=True)

    armor = models.ForeignKey(Armor, blank=True, null=True)
    helm = models.ForeignKey(Armor, blank=True, null=True,
                             related_name='helm_for')

    extra_weight_carried = models.IntegerField(
        default=0,
        help_text="Extra encumbrance the character is carrying")
    (SPECIAL, FULL, PRI, SEC) = (0, 1, 2, 3)

    fit_modifiers_for_damage = {
        SPECIAL : 5,
        FULL : 7.5,
        PRI : 10,
        SEC : 15
        }

    fit_modifiers_for_lethality = {
        SPECIAL : 15,
        FULL : 22.5,
        PRI : 30,
        SEC : 45
        }


    def roa(self, weapon, use_type=FULL):
        roa = weapon.roa()
        if use_type == self.PRI:
            roa -= 0.25
        elif use_type == self.SEC:
            roa -= 0.5

        if use_type in [self.FULL, self.SPECIAL]:
            spec_level = self.character.skill_level("Single-weapon style")
        else:
            spec_level = self.character.skill_level("Two-weapon style")

        if spec_level:
            roa += spec_level * 0.05

        level = self.character.skill_level("Weapon combat")
        if level:
            roa *= (1 + level * 0.10)

        roa = min(roa, 2.5)

        return roa

    def rof(self, weapon):
        roa = weapon.roa()
        level = self.character.skill_level(weapon.base.base_skill)
        if level:
            roa *= (1 + level * 0.10)

        roa = min(roa, 5.0)

        return roa

    actions = [xx/2.0 for xx in range(1, 10, 1)]
    ranged_actions = [0.5, 1, 2, 3, 4, 5]

    def max_attacks(self, roa):
        return min(int(math.floor(roa * 2)), 9)

    def max_defenses(self, roa):
        return min(int(math.floor(roa * 4)), 9)

    @property
    def base_initiative(self):
        return self.eff_ref / 10.0 + self.eff_int / 20.0 + \
            self.eff_psy / 20.0

    def initiatives(self, weapon, use_type=FULL):
        bi_multipliers = [1, 4, 7, 2, 5, 8, 3, 6, 9]
        roa = self.roa(weapon, use_type=use_type)
        bi = -5 / roa
        inits = []
        for ii in range(1, self.max_attacks(roa) + 1):
            inits.append(bi_multipliers[ii - 1] * bi)
        return map(lambda xx: int(math.ceil(xx + self.base_initiative)), inits)

    def defense_initiatives(self, weapon, use_type=FULL):
        bi_multipliers = [0, 3, 6, 0, 3, 6, 0, 3, 6]
        roa = self.roa(weapon, use_type=use_type)
        bi = -5 / roa
        inits = []
        for ii in range(1, self.max_defenses(roa) + 1):
            inits.append(bi_multipliers[ii - 1] * bi)
        return map(lambda xx: int(math.ceil(xx + self.base_initiative)), inits)

    def skilled(self, weapon, use_type=FULL):
        if not self.character.has_skill(weapon.base.base_skill):
            logger.debug("not skilled with %s" %
                         unicode(weapon.base.base_skill))
            return False
        elif not self.character.has_skill(weapon.base.skill):
            logger.debug("not skilled with %s" %
                         unicode(weapon.base.skill))
            return False
        elif not self.character.has_skill(weapon.base.skill2):
            logger.debug("not skilled with %s" %
                         unicode(weapon.base.skill2))
            return False
        return True

    def weapon_skill_checks(self, weapon, use_type=FULL):
        roa = self.roa(weapon, use_type=use_type)
        roa = float(roa)
        def check_mod_from_action_index(act):
            act = float(act)
            if 1/act >= 1/roa + 1:
                return 5 # cc.
            if act > roa:
                return - act/roa * 20 + 10
            if act < 0.5 * roa:
                return roa / act
            return 0

        modifiers = 0

        # skill level/unskilled.

        level = self.character.skill_level("Weapon combat")
        if level:
            modifiers += level * 5
        logger.debug("Skill level: %s" % level)

        # CCV bonus (penalty for unskilled)
        if not self.skilled(weapon):
            logger.debug("not skilled with %s" % unicode(weapon))
            modifiers += weapon.base.ccv_unskilled_modifier

        modifiers += weapon.ccv

        if use_type == self.SEC:
            if weapon.base.is_shield:
                logger.debug("Shield, not applying wrong hand penalty.")
            else:
                wrong_hand_mod = min(-25 + self.edge_level("Ambidexterity") * 5,
                                      0)
                logger.debug("Wrong hand modifiers: %d" % wrong_hand_mod)
                modifiers += wrong_hand_mod

        logger.debug("total modifiers: %d" % modifiers)

        checks = [check_mod_from_action_index(act)
                           # cap number of actions.
                           for act in filter(lambda act: act < roa * 2,
                                             self.actions)]
        def counter_penalty(xx):
            # Intuition counters ranged weapon penalties.
            xx = xx + rounddown((self.eff_int - 45)/3.0)
            if xx > 0:
                return 0
            return xx

        checks = map(counter_penalty, checks)
        mov = self.eff_mov + modifiers
        return [int(round(xx) + mov) for xx in checks]


    def ranged_skill_checks(self, weapon):
        rof = self.rof(weapon)
        roa = float(rof)
        def check_mod_from_action_index(act):
            act = float(act)
            if 1/act >= 1/roa + 1:
                return 10 # ranged.
            if act > roa:
                return - act/roa * 20 + 10
            if act < 0.5 * roa:
                return roa / act
            return 0

        modifiers = 0

        # skill level/unskilled.
        cs = self.character.skills.filter(skill=weapon.base.base_skill)
        if cs.count() > 0:
            base_skill = self.eff_dex + cs[0].level * 5
        else:
            base_skill = roundup(self.eff_dex / 2.0)

        logging.info("ROF %s" % roa)
        checks = [check_mod_from_action_index(act)
                  # cap number of actions.
                  for act in filter(lambda act: act < roa * 2,
                                    self.ranged_actions)]
        logging.info("checks: %s" % checks)
        def counter_penalty(xx):
            # Fitness counters ranged weapon penalties.
            xx = xx + rounddown((self.eff_fit - 45)/3.0)
            if xx > 0:
                return 0
            return xx

        checks = map(counter_penalty, checks)
        base_skill = base_skill + weapon.to_hit
        return [int(round(xx) + base_skill) for xx in checks]


    def ranged_ranges(self, weapon):
        return weapon.ranges(self)

    def damage(self, weapon, use_type=FULL):
        dmg = weapon.damage()

        # XXX Martial arts expertise.
        #
        # XXX fit under 45.
        dmg.add_damage(rounddown((self.eff_fit - 45) /
                                 self.fit_modifiers_for_damage[use_type]))
        dmg.add_leth(rounddown((self.eff_fit - 45) /
                               self.fit_modifiers_for_lethality[use_type]))

        return dmg

    def defense_damage(self, weapon, use_type=FULL):
        dmg = weapon.defense_damage()
        dmg.add_damage(rounddown((self.eff_fit - 45) /
                                 self.fit_modifiers_for_damage[use_type]))
        dmg.add_leth(rounddown((self.eff_fit - 45) /
                               self.fit_modifiers_for_lethality[use_type]))

        return dmg

    @property
    def eff_fit(self):
        return self.fit + self.mod_fit

    @property
    def eff_ref(self):
        return self.ref + self.mod_ref

    @property
    def eff_lrn(self):
        return self.lrn + self.mod_lrn

    @property
    def eff_int(self):
        return self.int + self.mod_int

    @property
    def eff_psy(self):
        return self.psy + self.mod_psy

    @property
    def eff_wil(self):
        return self.wil + self.mod_wil

    @property
    def eff_cha(self):
        return self.cha + self.mod_cha

    @property
    def eff_pos(self):
        return self.pos + self.mod_pos

    @property
    def eff_mov(self):
        return roundup((self.eff_fit + self.eff_ref)/2.0) + \
            self.character.mod_mov + self.mod_mov

    @property
    def eff_dex(self):
        return roundup((self.eff_ref + self.eff_int)/2.0) + \
            self.character.mod_dex + self.mod_dex

    @property
    def eff_imm(self):
        "IMM is not increased by an enhancement to FIT."
        return roundup((self.fit + self.eff_psy)/2) + \
            self.character.mod_imm + self.mod_imm

    def _mod_stat(self, stat):
        # XXX Armor effects on stats.
        # XXX allow different types of effects stack.

        mod = 0
        # Prefetch for all spell effects done.
        effs = self.spell_effects.all()
        if effs:
            mod += max([getattr(ee, stat) for ee in effs])

        return mod

    def _stat_wrapper(func):
        @wraps(func)
        def _pass_name(*args, **kwds):
            o = args[0]
            base = 0
            extra = func(o)
            if extra:
                base += extra
            return base + o._mod_stat(func.func_name[4:])
        return _pass_name

    def _penalties_for_weight_carried(self):
        ratio = float(self.weight_carried)/self.cur_fit
        if ratio <= 0.25:
            return 0
        elif ratio <= 0.5:
            return -5
        elif ratio <= 1:
            return -10
        elif ratio <= 1.5:
            return -15
        elif ratio <= 2:
            return -20
        elif ratio <= 3:
            return -30
        return -99 # Unable to carry this load.

    @property
    @_stat_wrapper
    def mod_fit(self):
        base = 0
        if self.armor:
            base += self.armor.mod_fit
        if self.helm:
            base += self.helm.mod_fit
        return base + self._penalties_for_weight_carried()

    @property
    @_stat_wrapper
    def mod_ref(self):
        base = 0
        if self.armor:
            base += self.armor.mod_ref
        if self.helm:
            base += self.helm.mod_ref
        return base + self._penalties_for_weight_carried()

    @property
    @_stat_wrapper
    def mod_lrn(self):
        pass
    @property
    @_stat_wrapper
    def mod_int(self):
        pass
    @property
    @_stat_wrapper
    def mod_psy(self):
        base = 0
        if self.armor:
            base += self.armor.mod_psy
        if self.helm:
            base += self.helm.mod_psy
        return base

    @property
    @_stat_wrapper
    def mod_wil(self):
        pass
    @property
    @_stat_wrapper
    def mod_cha(self):
        pass
    @property
    @_stat_wrapper
    def mod_pos(self):
        pass
    @property
    @_stat_wrapper
    def mod_mov(self):
        pass
    @property
    @_stat_wrapper
    def mod_dex(self):
        pass
    @property
    @_stat_wrapper
    def mod_imm(self):
        pass

    @property
    def body(self):
        """
        Return amount of body as a dict, {'base', 'bonus',
        'recovery_rate'}.  The recovery_rate indicates the amount the
        body recovered when not resting.
        """

        sizes = {"M" : 0,
                 "S" : -1,
                 "L" : 1 }
        from_toughness =  (2 + sizes[self.size]) * \
            self.character.edge_level('Toughness')

        return { 'base': roundup(self.fit / 4.0) ,
                 'mod': from_toughness,
                 'recovery_rate' : "",
                 }

    def _format_recovery(self, level, extra_recovery):
        rate = ""
        if level:
            # XXX Higher levels.
            rate = "%d" % pow(2, (level - 1))
        if extra_recovery:
            if rate:
                rate = "%s%+d" % (rate, extra_recovery)
            else:
                rate = "%d" % extra_recovery
        if rate:
            rate += "/8h"
        return rate

    @property
    def stamina(self):
        """
        Return amount of stamina as a dict (see "body").
        """

        # Stamina recovery modifier = ROUNDDOWN((IMM-45)/15;0)
        lvl = self.character.edge_level('Fast healing')
        extra_recovery = rounddown((self.eff_imm - 45) / 15)
        rate = self._format_recovery(lvl, extra_recovery)
        return { 'base': (roundup((self.ref + self.wil) / 4.0) +
                          self.bought_stamina),
                 'mod': 0,
                 'recovery_rate' : rate }

    @property
    def mana(self):
        """
        Return amount of mana as a dict (see "body").
        """
        # Mana recovery modifier =2* ROUNDDOWN((CHA-45)/15;0) / 8h
        lvl = self.character.edge_level('Fast mana recovery')
        extra_recovery = rounddown(2 * ((self.eff_cha - 45) // 15))
        rate = self._format_recovery(lvl, extra_recovery)
        return { 'base': (roundup((self.psy + self.wil) / 4.0) +
                          self.bought_mana),
                 'mod': 0,
                 'recovery_rate' : rate }

    @property
    def weight_carried(self):
        weight = 0
        if self.armor:
            weight += self.armor.weight
        if self.helm:
            weight += self.helm.weight

        wpns = self.ranged_weapons.all()
        if wpns:
            weight += sum([ww.base.weight for ww in wpns])
        wpns = self.weapons.all()
        if wpns:
            weight += sum([ww.base.weight for ww in wpns])

        return weight + self.extra_weight_carried

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v in ["body", "stamina", "mana"] or v.startswith("_"):
            raise AttributeError, "no attr %s" % v
        return getattr(self.character, v)

    def __unicode__(self):
        return "sheet for %s: %s" % (self.character.name, self.description)
