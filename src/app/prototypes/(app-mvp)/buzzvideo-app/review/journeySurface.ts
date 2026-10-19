import { buildPreset, type Journey } from "./journeys";
import { surfaceOf } from "./surface";

/** 每条旅程预置状态对应的屏(只算一次);右栏按它挑这条旅程相关的状态开关 */
const SURFACES = new Map<string, string>();
export function surfaceOfJourney(j: Journey) {
  if (!SURFACES.has(j.id)) {
    const p = buildPreset(j);
    SURFACES.set(j.id, surfaceOf(p.state, p.nav));
  }
  return SURFACES.get(j.id)!;
}
