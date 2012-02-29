from __future__ import division
from django.db import models
import django.contrib.auth as auth
import math
import logging
from functools import wraps
import pprint

from django.core.exceptions import ValidationError

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

    def has_skill(self, skill):
        if not skill:
            return True
        print skill
        qs = self.skills.filter(skill__skill=skill)
        if not qs.count():
            return False
        assert qs.count() <= 1
        return True

    @property
    def cur_mov(self):
        return int(round((self.cur_ref + self.cur_fit)/2))

    @property
    def cur_dex(self):
        return int(round((self.cur_ref + self.cur_int)/2))

    @property
    def cur_imm(self):
        return int(round((self.cur_fit + self.cur_psy)/2))

    # Base stats before circumstance modifiers.
    @property
    def fit(self):
        return self.cur_fit + self.base_mod_fit

    @property
    def ref(self):
        return self.cur_ref + self.base_mod_ref

    @property
    def lrn(self):
        return self.cur_lrn + self.base_mod_lrn

    @property
    def int(self):
        return self.cur_int + self.base_mod_int

    @property
    def psy(self):
        return self.cur_psy + self.base_mod_psy

    @property
    def wil(self):
        return self.cur_wil + self.base_mod_wil

    @property
    def cha(self):
        return self.cur_cha + self.base_mod_cha

    @property
    def pos(self):
        return self.cur_pos + self.base_mod_pos

    @property
    def mov(self):
        return self.cur_mov + self.base_mod_mov

    @property
    def dex(self):
        return self.cur_dex + self.base_mod_dex

    @property
    def imm(self):
        return self.cur_imm + self.base_mod_imm

    @property
    def body(self):
        """
        Return amount of body as a dict,
        ('base', 'bonus', 'recovery_rate').
        """
        return { 'base': 15, 'mod': 0, 'recovery_rate' : "1/3d" }

    @property
    def stamina(self):
        """
        Return amount of stamina as a dict (see "body").
        """
        return { 'base': 15, 'mod': 0, 'recovery_rate' : 0 }

    @property
    def mana(self):
        """
        Return amount of mana as a dict (see "body").
        """
        return { 'base': 15, 'mod': 0, 'recovery_rate' : 0 }

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
    "Trade",
    "Education",
    "Specialty",
    "Social",
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
        return ['characterskill', 'primary_for_weapons',
                'secondary_for_weapons', 'base_skill_for_weapons',
                'skill']

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
    edge = models.ForeignKey(Edge)
    level = models.IntegerField(default=1)
    cost = models.DecimalField(max_digits=4, decimal_places=1)
    requires_hero = models.BooleanField(default=False)
    # XXX race requirement?
    @classmethod
    def dont_export(cls):
        return ['characteredge']

    def __unicode__(self):
        return "%s %s (%s)" % (self.edge, self.level, self.cost)

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
    defense_leth = models.IntegerField(default=0)

    versus_missile_modifier = models.IntegerField(default=0)
    versus_area_save_modifier = models.IntegerField(default=0)

    @classmethod
    def dont_export(cls):
        return ['weapon']

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
        return "%sd%s%+d/%d" % (self.num_dice, self.dice,
                                self.extra_damage, self.leth)

class WeaponTemplate(ExportedModel):
    class Meta:
        ordering = ['name']
    name = models.CharField(max_length=256, primary_key=True)
    short_name = models.CharField(max_length=64)
    description = models.TextField(blank=True)
    notes = models.CharField(max_length=64, blank=True)

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

    weight = models.DecimalField(max_digits=4, decimal_places=1,
                                 default=1.0)

    base_skill = models.ForeignKey(Skill,
                                   related_name="base_skill_for_weapons")
    skill = models.ForeignKey(Skill, blank=True, null=True,
                              related_name="primary_for_weapons")
    skill2 = models.ForeignKey(Skill, blank=True, null=True,
                               related_name="secondary_for_weapons")
    is_lance = models.BooleanField(default=False)
    is_shield = models.BooleanField(default=False)

    @classmethod
    def dont_export(self):
        return ['weapon']

    def __unicode__(self):
        return "%s" % (self.name)

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
    name = models.CharField(max_length=32, primary_key=True,
                            help_text="This uniquely identifies this "
                            "special quality and may also serve as a short "
                            "description of the quality in the sheet.")
    description = models.TextField(blank=True)

    @classmethod
    def dont_export(cls):
        return ['weapon']

    # Effects come with the foreign key in WeaponEffect() class to the
    # name "effects".

    def __unicode__(self):
        return "%s" % (self.name)

class ArmorSpecialQuality(ExportedModel):
    name = models.CharField(max_length=32, primary_key=True,
                            help_text="This uniquely identifies this "
                            "special quality and may also serve as a short "
                            "description of the quality in the sheet.")
    description = models.TextField(blank=True)

    @classmethod
    def dont_export(cls):
        return ['armor']

    # Effects come with the foreign key in ArmorEffect() class to the
    # name "effects".
    def __unicode__(self):
        return "%s" % (self.name)

class Weapon(ExportedModel):
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

class ArmorTemplate(ExportedModel):
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

class WeaponEffect(ExportedModel, Effect):
    weapon = models.ForeignKey(WeaponSpecialQuality, related_name="effects")

    @classmethod
    def dont_export(cls):
        return ['weapon']

class ArmorEffect(ExportedModel, Effect):
    armor = models.ForeignKey(ArmorSpecialQuality, related_name="effects")

    @classmethod
    def dont_export(cls):
        return ['armor']

class SpellEffect(ExportedModel, Effect):
    @classmethod
    def dont_export(cls):
        return ['sheet']

class Sheet(models.Model):
    character = models.ForeignKey(Character)
    owner = models.ForeignKey(auth.models.User, related_name="sheets")
    description = models.TextField()
    size = models.CharField(max_length=1, choices=SIZE_CHOICES, default='M')

    weapons = models.ManyToManyField(Weapon, blank=True)

    spell_effects = models.ManyToManyField(SpellEffect, blank=True)

    armor = models.ForeignKey(Armor, blank=True, null=True)
    helm = models.ForeignKey(Armor, blank=True, null=True,
                             related_name='helm_for')

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
        cs = self.character.skills.filter(skill__name="Weapon combat")
        if use_type == self.PRI:
            roa -= 0.25
        elif use_type == self.SEC:
            roa -= 0.5

        try:
            if use_type in [self.FULL, self.SPECIAL]:
                spec = self.character.skills.get(
                    skill__name="Single-weapon style")
                roa += spec.level * 0.05
            else:
                spec = self.character.skills.get(
                    skill__name="Two-weapon style")
                roa += spec.level * 0.05
        except CharacterSkill.DoesNotExist as e:
            logging.warning("Got error on skill lookup: %s" % `e`)

        if cs:
            roa *= (1 + cs[0].level * 0.10)

        # XXX maximum is 5.0 with ranged.
        roa = min(roa, 2.5)

        return roa

    actions = [xx/2.0 for xx in range(1, 10, 1)]

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
            return False
        elif not self.character.has_skill(weapon.base.skill):
            return False
        elif not self.character.has_skill(weapon.base.skill2):
            return False
        return True

    def weapon_skill_checks(self, weapon, use_type=FULL):
        roa = self.roa(weapon, use_type=use_type)
        roa = float(roa)
        def check_mod_from_action_index(act):
            act = float(act)
            if 1/act >= 1/roa + 1:
                return 5        # XXX 10 with ranged.
            if act > roa:
                return - act/roa * 20 + 10
            if act < 0.5 * roa:
                return roa / act
            return 0

        modifiers = 0

        # skill level/unskilled.

        cs = self.character.skills.filter(skill__name="Weapon combat")
        if cs.count() > 0:
            modifiers += cs[0].level * 5

        # XXX CCV bonus (penalty for unskilled)
        if not self.skilled(weapon):
            modifiers += weapon.base.ccv_unskilled_modifier
        else:
            modifiers += weapon.ccv

        checks = [check_mod_from_action_index(act)
                           # cap number of actions.
                           for act in filter(lambda act: act < roa * 2,
                                             self.actions)]
        # XXX intuition counters cc-penalties, fitness counters ranged
        # weapon penalties.
        mov = self.eff_mov + modifiers
        return [int(round(xx) + mov) for xx in checks]

    def damage(self, weapon, use_type=FULL):
        dmg = weapon.damage()

        # XXX fit under 45.
        dmg.add_damage(self.eff_fit / self.fit_modifiers_for_damage[use_type])
        dmg.add_leth(self.eff_fit /
                     self.fit_modifiers_for_lethality[use_type])

        return dmg

    def defense_damage(self, weapon, use_type=FULL):
        dmg = weapon.defense_damage()
        dmg.add_damage(self.eff_fit / self.fit_modifiers_for_damage[use_type])
        dmg.add_leth(self.eff_fit /
                     self.fit_modifiers_for_lethality[use_type])

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
        return int(round((self.eff_fit + self.eff_ref)/2)) + self.mod_mov

    @property
    def eff_dex(self):
        return int(round((self.eff_ref + self.eff_int)/2)) + self.mod_dex

    @property
    def eff_imm(self):
        "IMM is not increased by an enhancement to FIT."
        return int(round((self.fit + self.eff_psy)/2)) + self.mod_imm

    def _mod_stat(self, stat):
        # XXX Armor effects on stats.
        # XXX allow different types of effects stack.
        # Exclude effects which don't have an effect on stat.
        kwargs = { stat : 0}
        effects = self.spell_effects.exclude(**kwargs)
        if effects.count():
            eff = max(effects, key=lambda xx: getattr(xx, stat))
            return getattr(eff, stat)
        return 0

    def _stat_wrapper(func):
        """
        Wraps a stat function.  The stat function is a dummy after
        wrapped, only the name matters.
        """
        @wraps(func)
        def _pass_name(*args, **kwds):
            o = args[0]
            return o._mod_stat(func.func_name[4:])
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

    def __getattr__(self, v):
        # pass through all attribute references not handled by us to
        # base character.
        if v.startswith("_"):
            raise AttributeError, "no attr %s" % v
        return getattr(self.character, v)

    def __unicode__(self):
        return "sheet for %s: %s" % (self.character.name, self.description)
