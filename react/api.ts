export interface Skill {
  name: string;
}

export interface Edge {
  id: number;
  name: string;
  description: string;
}

export interface EdgeLevel {
  edge: Edge;
  level: number;
  cost: number;
}

export interface CharacterEdge {
  id: number;
  edge: EdgeLevel;
  ignore_cost: boolean;
}

export interface GenericBaseItem {
  id: number;
  weight: string;
}

export interface GenericQuality {
  weight_multiplier: string;
  mod_weight_multiplier: string;
}

export interface GenericItem {
  id: number;
  size: number;
  base: GenericBaseItem;
  quality: GenericQuality;
}

export enum ArmorLocation {
  Head = "h",
  Torso = "t",
  LeftLeg = "ll",
  RightLeg = "rl",
  LeftArm = "la",
  RightArm = "ra"
}

export enum ArmorStatType {
  Piercing = "p",
  Slashing = "s",
  Bludgeoning = "b",
  Burn = "r",
  DamageReduction = "dr",
  DamagePoints = "dp",
  ProtectionLevel = "pl"
}

export interface ArmorModifier {
  name: string;

  armor_h_p: string;
  armor_h_s: string;
  armor_h_b: string;
  armor_h_r: string;
  armor_h_dr: string;
  armor_h_dp: string;
  armor_h_pl: string;

  // Torso armor values
  armor_t_p: string;
  armor_t_s: string;
  armor_t_b: string;
  armor_t_r: string;
  armor_t_dr: string;
  armor_t_dp: string;
  armor_t_pl: string;

  // Left leg armor values
  armor_ll_p: string;
  armor_ll_s: string;
  armor_ll_b: string;
  armor_ll_r: string;
  armor_ll_dr: string;
  armor_ll_dp: string;
  armor_ll_pl: string;

  // Left arm armor values
  armor_la_p: string;
  armor_la_s: string;
  armor_la_b: string;
  armor_la_r: string;
  armor_la_dr: string;
  armor_la_dp: string;
  armor_la_pl: string;

  // Right leg armor values
  armor_rl_p: string;
  armor_rl_s: string;
  armor_rl_b: string;
  armor_rl_r: string;
  armor_rl_dr: string;
  armor_rl_dp: string;
  armor_rl_pl: string;

  // Right arm armor values
  armor_ra_p: string;
  armor_ra_s: string;
  armor_ra_b: string;
  armor_ra_r: string;
  armor_ra_dr: string;
  armor_ra_dp: string;
  armor_ra_pl: string;
}

export interface ArmorTemplate extends GenericBaseItem, ArmorModifier {

  is_helm: boolean;
  is_powered: boolean;
}

export interface ArmorSpecialQuality extends ArmorModifier {
}

export interface MiscellaneousItem extends GenericBaseItem {
  name: string;
  armor_qualities: ArmorSpecialQuality[];
}

export interface SheetMiscellaneousItem {
  item: MiscellaneousItem;
}

export interface ArmorQuality extends GenericQuality{
  name: string;

  dp_multiplier: string;

  armor_p: string;  // Piercing
  armor_s: string;  // Slashing
  armor_b: string;  // Bludgeoning
  armor_r: string;  // Burn
  armor_dr: string; // Damage Reduction

  mod_encumbrance_class: number;
}

export interface Armor {
  id: number;
  name: string;
  base: ArmorTemplate;
  quality: ArmorQuality;
}

export interface GenericArmament extends GenericBaseItem {
  draw_initiative: number;
  durability: number;
  dp: number;

  base_skill: Skill;
  required_skills: Skill[];
}

export interface PhysicalWeaponTemplate extends GenericArmament {
  roa: string;
  num_dice: number;
  dice: number;
  extra_damage: number;
  leth: number;
  plus_leth: number;

  bypass: number;
}

/* This represents a generic weapon attached to the sheet, not specifically CC.*/
export interface SheetWeapon {
  id: number;
  base: GenericArmament;
}

export interface SheetPhysicalWeapon extends SheetWeapon {
  base: PhysicalWeaponTemplate;
  quality: WeaponQuality;
  size: number;
}

export interface WeaponTemplate extends PhysicalWeaponTemplate {
  ccv: number;
  ccv_unskilled_modifier: number;

  defense_leth: number;
  is_shield: boolean;

  is_natural_weapon: boolean;
}

export interface WeaponQuality extends GenericQuality {
  roa: string;
  ccv: number;

  damage: string;
  leth: string;
  plus_leth: number;
  defense_leth: number;

  bypass: number;

  durability: number;
  dp_multiplier: string;

  max_fit: number;
}

// TODO: rename to SheetCCWeapon
export interface Weapon extends SheetPhysicalWeapon {
  base: WeaponTemplate;
  quality: WeaponQuality;
}

export interface RangedWeaponTemplate extends PhysicalWeaponTemplate {
  target_initiative: number;
}

export interface SheetRangedWeapon extends SheetPhysicalWeapon {
  base: RangedWeaponTemplate;
  quality: WeaponQuality;
  size: number;
}

enum AutoFireClass {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
}

export interface BaseFirearm extends GenericArmament {
  accuracy: number;
  sight: number;
  barrel_length: number;

  target_initiative: number;

  autofire_rpm?: number;
  autofire_class: AutoFireClass;
  restricted_burst_rounds: number;
  autofire_only: boolean;
  sweep_fire_disabled: boolean;

  // Both ROF and ROA (for firearms in CC) are derived attributes from other firearm characteristics.
  stock: string;
  duration: string;
  weapon_class_modifier: string;

  magazine_weight: string;

  weight: string;
}

export interface Ammunition {
  num_dice: number;
  dice: number;
  extra_damage: number;
  leth: number;
  plus_leth: number;

  weight: string;
  cartridge_weight?: string;

  velocity: number;

  weapon_class_modifier_multiplier: string;
}

export interface Scope {
  sight: number;
  target_i_mod: number;
  perks: EdgeLevel[];
}

export interface SheetFirearm extends SheetWeapon {
  base: BaseFirearm;
  ammo: Ammunition;
  scope?: Scope;
}

export interface SheetFirearmMagazine {
  id: number;
  current: string;
}

export interface Wound {
  id: number;
  effect: string;
  damage: number;
  healed: number;
  location: string;
  damage_type: string;
}

export interface WoundChange {
  id: number;
  effect?: string;
  damage?: number;
  healed?: number;
  location?: string;
  damage_type?: string;
}

export interface Sheet {
  id: number;
  description: string;
  owner: string;
  campaign: number;
  character_name: string;
  character_total_xp: number;
}
