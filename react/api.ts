export interface Skill {
  name: string;
}

export interface Edge {
  id: number;
  name: string;
}

export interface EdgeLevel {
  edge: Edge;
  level: number;
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

export interface GenericArmament extends GenericBaseItem {
  draw_initiative: number;
  durability: number;
  dp: number

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

  bypass: number
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
