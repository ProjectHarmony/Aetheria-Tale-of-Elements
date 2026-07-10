import { useState } from 'react';
import type { BattleState } from '@/types';
import { FilterChips, type FilterKey } from './FilterChips';
import { HandZone } from './HandZone';

interface HandSectionProps {
  battle: BattleState;
  onPlayCard: (cardId: string) => void;
}

/** Owns the card-type filter selection (a pure UI preference, not game
 *  state) and composes the filter chips with the hand — mirrors the
 *  original's separate-but-adjacent .filters/.hand-zone rows. */
export function HandSection({ battle, onPlayCard }: HandSectionProps) {
  const [filter, setFilter] = useState<FilterKey>('all');

  return (
    <>
      <FilterChips active={filter} onChange={setFilter} />
      <HandZone battle={battle} filter={filter} onPlayCard={onPlayCard} />
    </>
  );
}
