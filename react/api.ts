export interface Skill {
  name: string
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

enum AutoFireClass {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
}

export interface BaseFirearm {
  accuracy: number;
  sight: number;
  barrel_length: number;

  target_initiative: number;

  autofire_rpm?: number;
  autofire_class: AutoFireClass;
  restricted_burst_rounds: number;
  autofire_only: boolean;

  stock: string;
  duration: string;
  weapon_class_modifier: string;

  magazine_weight: string;

  weight: string;

  base_skill: Skill
  required_skills: Skill[]
}

export interface Ammunition {
  weight: string;
  cartridge_weight?: string;

  velocity: number;
}

export interface Scope {
  sight: number;
  target_i_mod: number;
  perks: EdgeLevel[];
}

export interface SheetFirearm {
  id: number;
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
