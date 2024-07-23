
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

export interface BaseFirearm {
  magazine_weight: string;

}

export interface Ammunition {
  weight: string
}

export interface SheetFirearm {
  id: number;
  base: BaseFirearm;
  ammo: Ammunition;
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
