import type { Element, Row } from '@/types';

/**
 * Single shared algorithm for every placement move: bench->slot, slot->slot
 * (swap), and slot->bench (unplace). `targetOccupantEl` must be the exact
 * mage sitting in the specific slot that was tapped (or undefined for an
 * empty slot) — a row can hold more than one mage (2-Front formations), so
 * "is this row occupied" isn't enough; only the tapped slot's own occupant
 * should ever get bumped.
 */
export function computePlacementAfterMove(
  placements: Partial<Record<Element, Row>>,
  movingEl: Element,
  target: Row | null,
  targetOccupantEl?: Element,
): Partial<Record<Element, Row>> {
  if (targetOccupantEl === movingEl) return placements;
  const fromRow = placements[movingEl] ?? null;
  const next = { ...placements };
  if (targetOccupantEl) {
    if (fromRow) next[targetOccupantEl] = fromRow;
    else delete next[targetOccupantEl];
  }
  if (target === null) delete next[movingEl];
  else next[movingEl] = target;
  return next;
}
