export type Element = 'fire' | 'water' | 'earth' | 'wind';

export interface ElementMeta {
  icon: string;
  color: string;
  beats: Element;
}

export type Matchup = 'favored' | 'neutral' | 'resisted';

export type Row = 'front' | 'back';
