import { Signal } from "signal-polyfill";
import { Mod } from "./mod_types";

export const MOD_DATA = new Signal.State<Mod[]>([]);
export const TOTAL_MOD_COUNT = new Signal.State<number | null>(null);
// export const CATEGORY_NAMES = ;

