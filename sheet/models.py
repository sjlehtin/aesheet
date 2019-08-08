from django.db import models
import django.contrib.auth as auth
import logging
from collections import namedtuple, OrderedDict
from django.db.models import Q


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


class ExportedModel(models.Model):
    """
    Base class for all exported models.  Allows specifying fields that
    won't be exported, like integer id's that wouldn't really help a
    user trying to input data into the system.
    """
    @classmethod
    def dont_export(cls):
        return []

    @classmethod
    def get_exported_fields(cls):
        names = [field.name for field in cls._meta.fields]
        names.extend(list(set([ff.name for ff in cls._meta.get_fields()]
                              ).difference(set(names))))
        if "edge" in names:
            names.remove("edge")
            names.insert(0, "edge")
        if "name" in names:
            names.remove("name")
            names.insert(0, "name")
        return list(filter(lambda xx: xx not in cls.dont_export(), names))

    class Meta:
        abstract = True


class NameManager(models.Manager):
    def get_by_natural_key(self, name):
        return self.get(name=name)


class PrivateMixin(object):
    def access_allowed(self, user):
        """
        This checks that the resource is accessible by the user.

        :param user: the user accessing the resource
        :return: True if access is granted, false otherwise.
        """
        raise RuntimeError("not implemented")


class TechLevel(ExportedModel):
    """
    Different periods have different kinds of technologies available.
    """
    objects = NameManager()

    name = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return self.name

    @classmethod
    def dont_export(cls):
        return ["weapontemplate", "campaign", "armortemplate", "armorquality",
                "miscellaneousitem", "weaponquality", "skill",
                "rangedweapontemplate", "basefirearm", "transienteffect",
                "ammunition", "firearmaddon", "scope", "id"]


class Campaign(ExportedModel):
    """
    Campaign is the world setting for the characters.
    """
    objects = NameManager()

    name = models.CharField(max_length=10, unique=True)
    tech_levels = models.ManyToManyField(TechLevel)

    has_firearms = models.BooleanField(default=False)
    has_spells = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    @classmethod
    def dont_export(cls):
        return ["character", "id"]


class CampaignItem(object):
    def __init__(self, campaign):
        self.name = campaign.name
        self.objects = []


def get_characters(user):
    return Character.objects.filter(Q(private=False) | Q(owner=user))


def get_sheets(user):
    return Sheet.objects.filter(Q(character__private=False) |
                                Q(character__owner=user))


def get_by_campaign(objects, get_character=lambda obj: obj):
    items = OrderedDict()
    objects = [(get_character(obj), obj) for obj in objects]
    objects.sort(key=lambda xx: xx[0].campaign.name)
    for (char, obj) in objects:
        item = items.setdefault(char.campaign.name,
                                CampaignItem(char.campaign))
        item.objects.append(obj)
    return items.values()


class Character(PrivateMixin, models.Model):
    """
    Model for the character "under" the sheet.  Modifications to the
    basic character will immediately affect all sheets based on the
    character.
    """
    name = models.CharField(max_length=256, unique=True)
    owner = models.ForeignKey(auth.models.User,
                              related_name="characters")
    private = models.BooleanField(
            default=False,
            help_text="If set, access to the character "
            "will be denied for other users. "
            "The character will also be hidden "
            "in lists.  As a rule of thumb, "
            "only the GM should mark characters"
            " as private.")

    occupation = models.CharField(max_length=256)
    campaign = models.ForeignKey(Campaign)

    portrait = models.ImageField(blank=True, upload_to='portraits')

    # XXX race can be used to fill in basic edges and stats later for,
    # e.g., GM usage.
    race = models.CharField(max_length=256)
    description = models.TextField(blank=True)
    age = models.PositiveIntegerField(default=20)
    unnatural_aging = models.IntegerField(default=0)
    height = models.IntegerField(default=175)
    weigth = models.IntegerField(default=75)
    times_wounded = models.PositiveIntegerField(default=0)
    size = models.CharField(max_length=1, choices=SIZE_CHOICES, default='M')

    notes = models.TextField(blank=True,
                             help_text="Freeform notes for the character, "
                                       "intended for quick notes across "
                                       "gaming sessions.")

    hero = models.BooleanField(default=False)

    deity = models.CharField(max_length=256, blank=True)
    adventures = models.PositiveIntegerField(default=0)
    gained_sp = models.PositiveIntegerField(default=0)

    xp_used_ingame = models.PositiveIntegerField(default=0)
    bought_stamina = models.PositiveIntegerField(default=0)
    bought_mana = models.PositiveIntegerField(default=0)
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

    edges = models.ManyToManyField('EdgeLevel', through='CharacterEdge',
                                   blank=True)
    last_update_at = models.DateTimeField(auto_now=True, blank=True)

    stamina_damage = models.IntegerField(default=0)

    class Meta:
        ordering = ['campaign', 'name']

    BASE_STATS = ["fit", "ref", "lrn", "int", "psy", "wil", "cha", "pos"]
    DERIVED_STATS = ["mov", "dex", "imm"]
    ALL_STATS = BASE_STATS + DERIVED_STATS

    def __str__(self):
        return u"%s: %s %s" % (self.name, self.race, self.occupation)

    # TODO: Remove after python 2.7 support no longer needed.
    def __unicode__(self):
        return self.__str__()

    @classmethod
    def get_by_campaign(cls, user):
        return get_by_campaign(get_characters(user))

    def access_allowed(self, user):
        if not self.private:
            return True
        if self.owner.pk == user.pk:
            return True
        else:
            return False

    def add_skill_log_entry(self, skill, level,
                            request=None,
                            amount=0, removed=False):
        entry = CharacterLogEntry()
        entry.character = self
        entry.user = request.user if request else None
        entry.entry_type = entry.SKILL
        entry.skill = skill
        entry.skill_level = level
        entry.amount = amount
        entry.removed = removed
        entry.save()


    def add_log_entry(self, entry_text, request=None):
        entry = CharacterLogEntry()
        entry.character = self
        entry.user = request.user if request else None
        entry.entry_type = entry.NON_FIELD
        entry.entry = entry_text
        entry.save()


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

    def __str__(self):
        return u"%s" % (self.name)

    class Meta:
        ordering = ['name']


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

BASE_STATS = Character.BASE_STATS
DERIVED_STATS = Character.DERIVED_STATS
ALL_STATS = Character.ALL_STATS
STAT_TYPES = [st.upper() for st in ALL_STATS]
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

    tech_level = models.ForeignKey(TechLevel)

    # XXX Should be any of these? See Construction.  Add another
    # attribute for another required skill?
    #
    # TODO: Fix construction skill.

    required_skills = models.ManyToManyField('self', symmetrical=False,
                                             blank=True)
    required_edges = models.ManyToManyField(Edge, blank=True)

    skill_cost_0 = models.IntegerField(blank=True, null=True)
    skill_cost_1 = models.IntegerField(blank=True, null=True)
    skill_cost_2 = models.IntegerField(blank=True, null=True)
    skill_cost_3 = models.IntegerField(blank=True, null=True)

    type = models.CharField(max_length=64, choices=SKILL_TYPES)

    stat = models.CharField(max_length=64, choices=STAT_TYPES)

    def clean_fields(self, exclude=None):
        self.stat = self.stat.upper()
        super(Skill, self).clean_fields(exclude=exclude)

    def get_minimum_level(self):
        levels = [0, 1, 2, 3]
        for lvl in levels:
            cost = getattr(self, 'skill_cost_{}'.format(lvl))
            if cost is not None and not (
                            cost == 0 and self.is_specialization):
                return lvl
        raise ValueError("Skill is invalid")

    def get_maximum_level(self):
        if self.skill_cost_3 is not None:
            return 8

        levels = [2, 1, 0]
        for lvl in levels:
            cost = getattr(self, 'skill_cost_{}'.format(lvl))
            if cost is not None:
                return lvl
        raise ValueError("Skill is invalid")

    @classmethod
    def dont_export(cls):
        return ['characterskill',
                'primary_for_rangedweapontemplate',
                'secondary_for_rangedweapontemplate',
                'base_skill_for_rangedweapontemplate',
                'primary_for_weapontemplate',
                'secondary_for_weapontemplate',
                'base_skill_for_weapontemplate',
                'primary_for_basefirearm',
                'secondary_for_basefirearm',
                'base_skill_for_basefirearm',
                'skill', 'edgeskillbonus', 'characterlogentry',
                'edgelevel']

    def __str__(self):
        return u"%s" % self.name


class CharacterSkill(PrivateMixin, models.Model):
    character = models.ForeignKey(Character, related_name='skills')
    skill = models.ForeignKey(Skill)
    level = models.IntegerField(default=0)

    def access_allowed(self, user):
        return self.character.access_allowed(user)

    def __str__(self):
        return u"%s: %s %s" % (self.character, self.skill, self.level)

    class Meta:
        ordering = ('skill__name', )
        unique_together = ('character', 'skill')


class StatModifier(models.Model):
    # `notes' will be added to the effects list, which describes all the
    # noteworthy resistances and immunities of the character not
    # immediately visible from stats, saves and such.
    notes = models.TextField(blank=True)

    # TODO: not actually used yet.
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

    # TODO: not actually used yet.
    saves_vs_fire = models.IntegerField(default=0)
    saves_vs_cold = models.IntegerField(default=0)
    saves_vs_lightning = models.IntegerField(default=0)
    saves_vs_poison = models.IntegerField(default=0)
    saves_vs_all = models.IntegerField(default=0)

    run_multiplier = models.DecimalField(default=0,
                                         max_digits=4, decimal_places=2)
    swim_multiplier = models.DecimalField(default=0,
                                          max_digits=4, decimal_places=2)
    climb_multiplier = models.DecimalField(default=0,
                                           max_digits=4, decimal_places=2)
    fly_multiplier = models.DecimalField(default=0,
                                         max_digits=4, decimal_places=2)

    vision = models.IntegerField(
        default=0, help_text="Modifier for the general vision INT check")

    hear = models.IntegerField(
        default=0, help_text="Modifier for the general hearing INT check")
    smell = models.IntegerField(
        default=0, help_text="Modifier for the general smell & taste INT "
                             "check")
    surprise = models.IntegerField(
        default=0, help_text="Modifier for the surprise check")

    # TODO: link through to EdgeLevel to allow boosting edges with effects,
    # items, etc.
    class Meta:
        abstract = True


class Wound(models.Model):
    """
    Lethal wounds received by the character.
    """
    def access_allowed(self, user):
        return self.character.access_allowed(user)

    character = models.ForeignKey(Character, related_name="wounds")

    LOCATION_CHOICES = [("H", "Head"),
                        ("T", "Torso"),
                        ("RA", "Right arm"),
                        ("LA", "Left arm"),
                        ("RL", "Right leg"),
                        ("LL", "Left leg")]
    location = models.CharField(max_length=2,
                                choices=LOCATION_CHOICES,
                                default="T")
    DAMAGE_TYPE_CHOICES = [("S", "Slash"),
                           ("P", "Pierce"),
                           ("B", "Bludgeon"),
                           ("R", "Burn")]
    damage_type = models.CharField(max_length=1,
                                   choices=DAMAGE_TYPE_CHOICES,
                                   default="S")
    damage = models.PositiveIntegerField(
        default=0,
        help_text="Initial damage from the wound.")
    healed = models.PositiveIntegerField(
        default=0,
        help_text="Healed damage.  When this becomes equal to damage, "
                  "the wound is healed.")
    effect = models.CharField(max_length=64, blank=True,
                              help_text="Initial effect from the injury.")


class EdgeLevel(ExportedModel, StatModifier):
    """
    This stores the actual modifiers for a specific edge at a certain
    level, like Eye-Hand Coordination 2.
    """
    edge = models.ForeignKey(Edge)
    level = models.IntegerField(default=1)
    cost = models.DecimalField(max_digits=4, decimal_places=1)
    requires_hero = models.BooleanField(default=False)
    extra_skill_points = models.IntegerField(default=0)

    @classmethod
    def dont_export(cls):
        return ['characteredge', 'edgeskillbonus', 'skill_bonuses',
                'edge_skill_bonuses', 'characterlogentry',
                "character", "firearmaddon", "scope"]

    def __str__(self):
        return u"%s %s (%s)" % (self.edge, self.level, self.cost)

    class Meta:
        ordering = ('edge', 'level')


class EdgeSkillBonus(ExportedModel):
    """
    Skill bonuses from edges, e.g., +15 to Surgery from Acute Touch, is
    achieved with adding these.  Get the `id' (an integer value) of an
    existing EdgeLevel (like Acute Touch 1) and the skill and assign a
    bonus (or penalty, if negative).
    """
    edge_level = models.ForeignKey(EdgeLevel,
                                   related_name='edge_skill_bonuses')
    skill = models.ForeignKey(Skill)
    bonus = models.IntegerField(default=15)

    def __str__(self):
        return u"%s -> %s: %+d" % (self.edge_level, self.skill, self.bonus)


class CharacterEdge(PrivateMixin, models.Model):
    character = models.ForeignKey(Character)
    edge = models.ForeignKey(EdgeLevel)

    def access_allowed(self, user):
        return self.character.access_allowed(user)

    def __str__(self):
        return u"%s: %s" % (self.character, self.edge)


class BaseWeaponQuality(ExportedModel):
    name = models.CharField(max_length=256, primary_key=True)
    short_name = models.CharField(max_length=5, blank=True)

    tech_level = models.ForeignKey(TechLevel)
    roa = models.DecimalField(max_digits=6, decimal_places=4, default=0)
    ccv = models.IntegerField(default=0)

    damage = models.IntegerField(default=0)
    leth = models.IntegerField(default=0)
    plus_leth = models.IntegerField(default=0)

    bypass = models.IntegerField(default=0)

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
    Fields for quality are added to the fields in the base, unless the
    modifier is a multiplier.
    """
    defense_leth = models.IntegerField(default=0)

    versus_missile_modifier = models.IntegerField(default=0)
    versus_area_save_modifier = models.IntegerField(default=0)

    max_fit = models.IntegerField(
            default=90,
            help_text="Applies for bows, this is the maximum FIT "
            "the weapon pull adjusts to.  This caps the damage and range "
            "of the weapon in case the character has a higher FIT than this.")

    @classmethod
    def dont_export(cls):
        return ['weapon', 'rangedweapon', 'rangedweaponammo_set']

    def __str__(self):
        return self.name


def format_damage(num_dice, dice, extra_damage=0, leth=0, plus_leth=0):
    return u"%sd%s%s/%d%s" % (
            num_dice, dice,
            "%+d" % extra_damage if extra_damage else "",
            leth,
            "%+d" % plus_leth if plus_leth else "")


class BaseArmament(ExportedModel):
    class Meta:
        abstract = True
        ordering = ['name']
    name = models.CharField(max_length=256, primary_key=True)
    short_name = models.CharField(
        max_length=64,
        help_text="This is used when the name must be fit to a small space",
        blank=True)
    description = models.TextField(blank=True)
    notes = models.CharField(max_length=64, blank=True)

    tech_level = models.ForeignKey(TechLevel)

    draw_initiative = models.IntegerField(default=-3, blank=True, null=True)

    durability = models.IntegerField(default=5)
    dp = models.IntegerField(default=10)

    weight = models.DecimalField(max_digits=7, decimal_places=4,
                                 default=1.0)

    base_skill = models.ForeignKey(Skill,
                                   related_name="base_skill_for_%(class)s")
    skill = models.ForeignKey(Skill, blank=True, null=True,
                              related_name="primary_for_%(class)s")
    skill2 = models.ForeignKey(Skill, blank=True, null=True,
                               related_name="secondary_for_%(class)s")

    def __str__(self):
        return u"%s" % self.name


class BaseDamager(models.Model):
    num_dice = models.IntegerField(default=1)
    dice = models.IntegerField(default=6)
    extra_damage = models.IntegerField(default=0)
    leth = models.IntegerField(default=5)
    plus_leth = models.IntegerField(default=0)

    class Meta:
        abstract = True


class BaseWeaponTemplate(BaseArmament, BaseDamager):

    roa = models.DecimalField(max_digits=4, decimal_places=3, default=1.0)

    bypass = models.IntegerField(default=0)

    class Meta:
        abstract = True
        ordering = ['name']


Range = namedtuple('Range', ('pb', 'xs', 'vs', 's', 'm', 'l', 'xl', 'e'))


class RangedWeaponMixin(models.Model):
    target_initiative = models.IntegerField(default=-2)

    range_pb = models.IntegerField(blank=True, null=True)
    range_xs = models.IntegerField(blank=True, null=True)
    range_vs = models.IntegerField(blank=True, null=True)
    range_s = models.IntegerField()
    range_m = models.IntegerField()
    range_l = models.IntegerField()
    range_xl = models.IntegerField(blank=True, null=True)
    range_e = models.IntegerField(blank=True, null=True)

    class Meta:
        abstract = True
        ordering = ['name']


class BaseFirearmAddOn(ExportedModel):
    """

    """
    name = models.CharField(max_length=32, unique=True)

    target_i_mod = models.IntegerField(default=0)
    to_hit_mod = models.IntegerField(default=0)

    tech_level = models.ForeignKey(TechLevel)

    weight = models.DecimalField(max_digits=5, decimal_places=2,
                                 default=1.0)

    notes = models.CharField(max_length=256, blank=True)

    perks = models.ManyToManyField(EdgeLevel, blank=True)

    @classmethod
    def dont_export(cls):
        return ['firearm', "scope"]

    def __str__(self):
        return self.name

    class Meta:
        abstract = True
        ordering = ['name']


class FirearmAddOn(BaseFirearmAddOn):
    """

    """


class Scope(BaseFirearmAddOn):
    """
    Scopes
    """
    sight = models.IntegerField(default=1000,
                                help_text="Overrides weapon's "
                                          "sight modifier")
    @classmethod
    def dont_export(cls):
        return ['firearm', "firearms_using_scope", "firearmaddon_ptr"]


class BaseFirearm(BaseArmament, RangedWeaponMixin):
    """
    """
    autofire_rpm = models.IntegerField(blank=True, null=True)
    _class_choices = ("A", "B", "C", "D", "E")
    autofire_class = models.CharField(max_length=1, blank=True,
                                      choices=zip(_class_choices,
                                                  _class_choices))
    sweep_fire_disabled = models.BooleanField(default=False)
    restricted_burst_rounds = models.IntegerField(default=0)

    stock = models.DecimalField(max_digits=4, decimal_places=2,
                                default=1,
                                help_text="Weapon stock modifier for recoil "
                                          "calculation. Larger is better.")

    duration = models.DecimalField(max_digits=5, decimal_places=3,
                                   default=0.1,
                                   help_text="Modifier for recoil.  In "
                                             "principle, time in seconds from "
                                             "the muzzle break, whatever that "
                                             "means. Bigger is better.")

    weapon_class_modifier = models.DecimalField(
        max_digits=4, decimal_places=2, default=6,
        help_text="ROF modifier for weapon class. Generally from 6-15, "
                  "smaller is better.")

    accuracy = models.DecimalField(max_digits=4, decimal_places=2,
                                   default=1,
                                   help_text="Weapon's inherent accuracy "
                                             "modifier. Larger is better.")
    sight = models.IntegerField(default=100,
                                help_text="Weapon's sight modifier in "
                                          "millimeters")
    barrel_length = models.IntegerField(default=100,
                                        help_text="Weapon's barrel length in "
                                                  "millimeters")

    def get_ammunition_types(self):
        """
        Return the accepted ammunition types for the firearm.
        """
        return [ammo.short_label for ammo in self.ammunition_types.all()]

    @classmethod
    def dont_export(cls):
        return ['short_name', 'range_pb', 'range_xs', 'range_vs',
                'range_xl', 'range_e', 'firearm', ]


class Ammunition(ExportedModel, BaseDamager):
    """
    """
    label = models.CharField(max_length=20,
                             help_text="Ammunition caliber, which should also "
                                       "distinguish between barrel lengths "
                                       "and such.")
    type = models.CharField(max_length=10, default="P",
                            help_text="Damage type of the ammo.")
    bullet_type = models.CharField(max_length=20,
                                   help_text="Make of the ammo, such as "
                                             "full metal jacket.")

    tech_level = models.ForeignKey(TechLevel)

    bypass = models.IntegerField(default=0)

    weight = models.DecimalField(decimal_places=3, max_digits=7,
                                 help_text="Weight of a single round in "
                                           "grams.  Used to calculate recoil.")

    velocity = models.IntegerField(help_text="Velocity of the bullet at muzzle "
                                             "in meters per second.  Used to "
                                             "calculate recoil.")

    @classmethod
    def dont_export(cls):
        return ['firearm']

    def __str__(self):
        return u"{label} {type})".format(label=self.label,
                                         type=self.bullet_type)


class FirearmAmmunitionType(models.Model):
    firearm = models.ForeignKey(BaseFirearm,
                                related_name="ammunition_types")
    short_label = models.CharField(max_length=20,
                                   help_text="Matches the respective field in "
                                             "ammunition")
    def __str__(self):
        return u"{firearm} {label})".format(firearm=self.firearm,
                                            label=self.short_label)


class Firearm(models.Model):
    # This is the SheetFirearm.  This could be renamed and changed to work in
    # same fashion as similar items, currently causes Django to have an extra
    # table for the relationship.  Change would require adding a link to the
    # sheet from here, data migration, and little work for the REST viewset.

    # modifications, such as scopes could be added here.
    base = models.ForeignKey(BaseFirearm)
    ammo = models.ForeignKey(Ammunition)

    scope = models.ForeignKey(Scope, blank=True, null=True,
                              related_name="firearms_using_scope")
    add_ons = models.ManyToManyField(FirearmAddOn, blank=True)

    def __str__(self):
        return u"{base} w/ {ammo}".format(base=self.base,
                                          ammo=self.ammo)


class WeaponTemplate(BaseWeaponTemplate):
    """
    """
    type = models.CharField(max_length=5, default="S")

    ccv = models.IntegerField(default=10)
    ccv_unskilled_modifier = models.IntegerField(default=-10)

    defense_leth = models.IntegerField(default=5)

    is_lance = models.BooleanField(default=False)
    is_shield = models.BooleanField(default=False)

    @classmethod
    def dont_export(cls):
        return ['weapon']


class RangedWeaponTemplate(BaseWeaponTemplate, RangedWeaponMixin):
    """
    """
    type = models.CharField(max_length=5, default="P")

    ammo_weight = models.DecimalField(max_digits=6, decimal_places=3,
                                      default=0.1)

    # TODO: Get rid of this, use base_skill to indicate the type instead.
    THROWN = "thrown"
    CROSSBOW = "xbow"
    BOW = "bow"
    weapon_type = models.CharField(max_length=10, default=THROWN,
                                   choices=(("thrown", THROWN),
                                            ("xbow", CROSSBOW),
                                            ("bow", BOW)))
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

    def __str__(self):
        return u"%s" % (self.name)


class WeaponSpecialQuality(ExportedModel, Effect):
    """
    """

    @classmethod
    def dont_export(cls):
        return ['weapon', 'rangedweapon', 'miscellaneousitem']

    def __str__(self):
        return u"%s" % self.name


class ArmorSpecialQuality(ExportedModel, Effect):
    """
    """

    # Extra protection provided by the special quality.
    armor_h_p = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_h_s = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_h_b = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_h_r = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_h_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_t_p = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_t_s = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_t_b = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_t_r = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_t_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_p = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_s = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_b = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_r = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_la_p = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_la_s = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_la_b = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_la_r = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_la_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_rl_p = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_rl_s = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_rl_b = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_rl_r = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_rl_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_ra_p = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ra_s = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ra_b = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ra_r = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ra_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)

    @classmethod
    def dont_export(cls):
        return ['armor', 'miscellaneousitem']

    # Effects come with the foreign key in ArmorEffect() class to the
    # name "effects".
    def __str__(self):
        return u"%s" % self.name


class BaseWeapon(ExportedModel):
    # XXX name from template (appended with quality or something to that
    # effect) will be used if this is not set (= is blank).  If this is
    # set, the name given here should be unique.  Add a validator to
    # verify this.
    name = models.CharField(max_length=256, blank=True)
    description = models.TextField(blank=True)
    quality = models.ForeignKey(WeaponQuality)

    size = models.PositiveSmallIntegerField(default=1,
                                            choices=((1, "normal"),
                                                     (2, "double"),
                                                     (3, "triple"),
                                                     (4, "quadruple")))

    def __str__(self):
        if self.name:
            return self.name
        quality = ""
        if self.quality.name.lower() != "normal":
            quality = self.quality.name + " "
        if self.size > 1:
            size = {2: "Large",
                    3: "Huge",
                    4: "Gargantuan"}[self.size]
            size += " "
        else:
            size = ""
        return u"{size}{quality}{weapon}".format(size=size,
                                                 quality=quality,
                                                 weapon=self.base)

    @classmethod
    def dont_export(cls):
        return ['sheet']

    class Meta:
        abstract = True
        ordering = ['name']


class Weapon(BaseWeapon):
    """
    """
    base = models.ForeignKey(WeaponTemplate)
    special_qualities = models.ManyToManyField(WeaponSpecialQuality,
                                               blank=True)

    @property
    def ccv(self):
        size_mod = 0
        if self.size > 1:
            size_mod = 5 * (self.size - 1)

        return self.base.ccv + size_mod + self.quality.ccv

    def defense_damage(self):
        return self.damage(defense=True)


class RangedWeapon(BaseWeapon):
    """
    """
    base = models.ForeignKey(RangedWeaponTemplate)
    ammo_quality = models.ForeignKey(WeaponQuality, blank=True, null=True,
                                     related_name="rangedweaponammo_set")
    special_qualities = models.ManyToManyField(WeaponSpecialQuality,
                                               blank=True)

    @property
    def to_hit(self):
        # XXX
        return self.quality.ccv

    @property
    def max_fit(self):
        return self.quality.max_fit

    def ranges(self, sheet):
        return self.base.ranges(sheet)


class ArmorTemplate(ExportedModel):
    """
    """
    name = models.CharField(max_length=256, primary_key=True)
    description = models.TextField(blank=True)

    tech_level = models.ForeignKey(TechLevel)

    is_helm = models.BooleanField(default=False)

    armor_h_p = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_h_s = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_h_b = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_h_r = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_h_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_h_dp = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_t_p = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_t_s = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_t_b = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_t_r = models.DecimalField(max_digits=4, decimal_places=1,
                                    default=0)
    armor_t_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_t_dp = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_p = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_s = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_b = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_r = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ll_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_ll_dp = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_la_p = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_la_s = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_la_b = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_la_r = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_la_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_la_dp = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_rl_p = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_rl_s = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_rl_b = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_rl_r = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_rl_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_rl_dp = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_ra_p = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ra_s = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ra_b = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ra_r = models.DecimalField(max_digits=4, decimal_places=1,
                                     default=0)
    armor_ra_dr = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)
    armor_ra_dp = models.DecimalField(max_digits=4, decimal_places=1,
                                      default=0)

    armor_h_pl = models.IntegerField(default=0)
    armor_t_pl = models.IntegerField(default=0)
    armor_ll_pl = models.IntegerField(default=0)
    armor_rl_pl = models.IntegerField(default=0)
    armor_la_pl = models.IntegerField(default=0)
    armor_ra_pl = models.IntegerField(default=0)

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

    weight = models.DecimalField(max_digits=5, decimal_places=2,
                                 default=1.0)
    # 0 no armor, 1 light, 2 medium, 3 heavy
    encumbrance_class = models.IntegerField(default=0)

    @classmethod
    def dont_export(cls):
        return ['armor']

    def __str__(self):
        return u"%s" % (self.name)


class ArmorQuality(ExportedModel):
    """
    """
    name = models.CharField(max_length=256, primary_key=True)
    short_name = models.CharField(max_length=5, blank=True)

    tech_level = models.ForeignKey(TechLevel)

    # TODO: this is from size, which should be handled specially in code.
    dp_multiplier = models.DecimalField(max_digits=4, decimal_places=1,
                                        default=1.0)

    armor_p = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_s = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_b = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_r = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    armor_dr = models.DecimalField(max_digits=4, decimal_places=1, default=0)

    # TODO: this is from size, which should be handled specially in code.
    mod_fit_multiplier = models.DecimalField(max_digits=4, decimal_places=1,
                                             default=1.0)
    mod_fit = models.IntegerField(default=0)
    mod_ref = models.IntegerField(default=0)
    mod_psy = models.IntegerField(default=0)
    mod_sensory = models.IntegerField(default=0)
    mod_stealth = models.IntegerField(default=0)
    mod_conceal = models.IntegerField(default=0)
    mod_climb = models.IntegerField(default=0)

    # TODO: this is from size, which should be handled specially in code.
    mod_weight_multiplier = models.DecimalField(max_digits=4, decimal_places=1,
                                                default=1.0)
    mod_encumbrance_class = models.IntegerField(default=0)

    @classmethod
    def dont_export(cls):
        return ['armor']

    def __str__(self):
        return u"%s" % self.name


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
    special_qualities = models.ManyToManyField(ArmorSpecialQuality,
                                               blank=True)

    @classmethod
    def dont_export(cls):
        return ['sheet', 'helm_for']

    def __str__(self):
        if self.name:
            return self.name
        return u"%s %s" % (self.base.name, self.quality)


class TransientEffect(ExportedModel, Effect):
    """
    Temporary effects, like spells or drugs, affecting character
    performance in the short term.
    """
    tech_level = models.ForeignKey(TechLevel)
    @classmethod
    def dont_export(cls):
        return ['sheet', 'sheettransienteffect']


class SheetTransientEffect(models.Model):
    sheet = models.ForeignKey('Sheet')
    effect = models.ForeignKey(TransientEffect)


class MiscellaneousItem(ExportedModel):
    name = models.CharField(max_length=256, unique=True)

    tech_level = models.ForeignKey(TechLevel)

    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    armor_qualities = models.ManyToManyField(ArmorSpecialQuality, blank=True)
    weapon_qualities = models.ManyToManyField(WeaponSpecialQuality,
                                              blank=True)

    weight = models.DecimalField(max_digits=5, decimal_places=2,
                                 default=1.0)

    def __str__(self):
        return self.name

    @classmethod
    def dont_export(cls):
        return ['sheetmiscellaneousitem']


class SheetMiscellaneousItem(models.Model):
    sheet = models.ForeignKey('Sheet')
    item = models.ForeignKey(MiscellaneousItem)


class Sheet(PrivateMixin, models.Model):
    character = models.ForeignKey(Character)
    # TODO: Remove this.  It should be determined from the Character.owner.
    owner = models.ForeignKey(auth.models.User, related_name="sheets")
    description = models.TextField(blank=True)
    size = models.CharField(max_length=1, choices=SIZE_CHOICES, default='M')

    # TODO: These relations would need to go through separate tables, e.g.,
    #  SheetWeapon, to allow adding parameters like "in_inventory",
    # or "order".
    weapons = models.ManyToManyField(Weapon, blank=True)
    ranged_weapons = models.ManyToManyField(RangedWeapon, blank=True)
    firearms = models.ManyToManyField(Firearm, blank=True)

    miscellaneous_items = models.ManyToManyField(
        MiscellaneousItem,
        blank=True,
        through=SheetMiscellaneousItem)

    transient_effects = models.ManyToManyField(TransientEffect, blank=True,
                                               through=SheetTransientEffect)

    armor = models.ForeignKey(Armor, blank=True, null=True,
                              on_delete=models.SET_NULL)
    helm = models.ForeignKey(Armor, blank=True, null=True,
                             related_name='helm_for',
                             on_delete=models.SET_NULL)

    last_update_at = models.DateTimeField(auto_now=True, blank=True)

    (SPECIAL, FULL, PRI, SEC) = (0, 1, 2, 3)

    def access_allowed(self, user):
        return self.character.access_allowed(user)

    @classmethod
    def get_by_campaign(cls, user):
        return get_by_campaign(get_sheets(user),
                               lambda sheet: sheet.character)

    def __str__(self):
        return u"sheet for {name}{descr}".format(
            name=self.character.name,
            descr=(": %s" % self.description) if self.description else "")

    # TODO: Remove after python 2.7 support no longer needed.
    def __unicode__(self):
        return self.__str__()

    class Meta:
        ordering = ('character__name', )


class InventoryEntry(PrivateMixin, models.Model):
    sheet = models.ForeignKey(Sheet, related_name='inventory_entries')

    quantity = models.PositiveIntegerField(default=1)
    description = models.CharField(max_length=100)
    location = models.CharField(max_length=30, blank=True,
                                help_text="Indicate where the item(s) is "
                                          "stored")
    unit_weight = models.DecimalField(max_digits=6, decimal_places=3,
                                      default=1, help_text="Item weight in "
                                                           "kilograms")

    order = models.IntegerField(help_text="explicit ordering for the "
                                          "entries", default=0)

    def access_allowed(self, user):
        return self.sheet.access_allowed(user)

    class Meta:
        ordering = ('order', )


class CharacterLogEntry(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True, blank=True)
    user = models.ForeignKey(auth.models.User)
    character = models.ForeignKey(Character)

    STAT, SKILL, EDGE, NON_FIELD = range(0, 4)
    entry_type = models.PositiveIntegerField(
        choices=((STAT, ("stat")),
                 (SKILL, ("skill")),
                 (EDGE, ("edge")),
                 (NON_FIELD, ("non-field")),
                 ),
                 default=STAT)

    entry = models.TextField(blank=True,
                             help_text="Additional information about this "
                             "entry, input by the user.")

    field = models.CharField(max_length=64, blank=True)
    # For skills, amount is non-zero if the level has been modified.  It is
    # zero when the skill has been added or removed.
    amount = models.IntegerField(default=0)

    skill = models.ForeignKey(Skill, blank=True, null=True)
    skill_level = models.PositiveIntegerField(default=0)

    edge = models.ForeignKey(EdgeLevel, blank=True, null=True)
    edge_level = models.IntegerField(default=0)

    removed = models.BooleanField(default=False,
                                  help_text="Setting this means that the "
                                            "edge or skill was removed "
                                            "instead of added.")

    class Meta:
        ordering = ["-timestamp"]
        get_latest_by = "timestamp"

    def __str__(self):
        if self.entry_type == self.STAT:
            if self.amount:
                return u"Added %d to %s." % (self.amount, self.field)
            else:
                return u"Changed %s." % (self.field)
        elif self.entry_type == self.SKILL:
            if self.amount < 0:
                return u"Skill {skill} decreased to level {level}".format(
                    skill=self.skill,
                    level=self.skill_level)
            elif self.amount > 0:
                return u"Skill {skill} increased to level {level}".format(
                    skill=self.skill,
                    level=self.skill_level)
            elif self.removed:
                return u"Removed skill {skill} {level}.".format(
                    skill=self.skill, level=self.skill_level)
            else:
                return u"Added skill %s %d." % (self.skill, self.skill_level)
        elif self.entry_type == self.NON_FIELD:
            return self.entry

    # TODO: Remove after python 2.7 support no longer needed.
    def __unicode__(self):
        return self.__str__()

    def access_allowed(self, user):
        return self.character.access_allowed(user)


def _collect_exportable_classes(start_model):
    """
    Collect all models inheriting from, e.g., ExportedModel, which have not
    been declared abstract.
    """
    subclasses = start_model.__subclasses__()
    exportable = []
    processed = []
    while subclasses:
        cc = subclasses[0]
        processed.append(cc)
        subclasses = subclasses[1:]
        subclasses.extend(
            set(cc.__subclasses__()) - set(processed))
        if not cc._meta.abstract:
            exportable.append(cc)
    return exportable


EXPORTABLE_MODELS = sorted([cc.__name__
                     for cc in _collect_exportable_classes(ExportedModel)])
