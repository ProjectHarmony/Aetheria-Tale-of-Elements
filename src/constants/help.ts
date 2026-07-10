export interface HelpSection {
  icon: string;
  title: string;
  text: string;
  counter?: boolean;
  example?: string;
}

/**
 * Ported verbatim from script.js HELP_SECTIONS. Note "Sudden Death" here
 * describes a Round-10 comeback mechanic that was NEVER actually wired
 * into the original engine's resolveRound — it's prototype documentation
 * that outran the implementation. This ports the original's actual text
 * (including that inaccuracy) rather than inventing a real Sudden Death
 * mechanic that never existed — that would be a new feature, not parity.
 */
export const HELP_SECTIONS: HelpSection[] = [
  {
    icon: '🌐',
    title: 'The Big Picture',
    text: "Two Elements is a 3v3 mage battle. Every round, you and your opponent secretly choose scrolls for your mages — then everyone's actions reveal and resolve together. No one sees what the other side chose until it's too late to change your mind.",
  },
  {
    icon: '🔺',
    title: 'Elemental Counter Triangle',
    counter: true,
    text: 'Every mage is one of four elements. Attacking the element you counter deals <b>+20% damage</b>; attacking the element that counters you deals <b>−20% damage</b>. All other matchups are neutral.',
  },
  {
    icon: '📝',
    title: 'Plan-Then-Reveal',
    text: "Assign a scroll and a target to each of your living mages during the planning phase. Once both sides have committed, the round <b>resolves in Speed order</b> — nobody's action jumps the queue, and nobody can react to what you picked before locking in.",
    example: 'Wind (112 SPD) acts before Fire (108), Water (100), then Earth (90) — unless something has buffed or debuffed a mage’s Speed.',
  },
  {
    icon: '⚡',
    title: 'Energy & Soul Charge',
    text: "Your team shares one Energy pool that regenerates a flat amount each round. Casting a scroll costs Energy — <b>and it's spent the instant you confirm a target, with no take-backs.</b> A mage can cast up to 3 scrolls in one round if you have the Energy for it. Energy banked above the cap overflows into <b>Soul Charge</b> (max 2), which can cover costs later so nothing goes to waste.",
  },
  {
    icon: '🛡️',
    title: 'Front Line & Back Line',
    text: 'Each team stands 2 mages Front, 1 mage Back. <b>Front-line mages take incoming single-target attacks first</b> — the back-line mage stays safe unless a scroll specifically pierces formation, or an enemy is Taunting and forces a specific target.',
  },
  {
    icon: '✦',
    title: 'Ultimates',
    text: "Every mage has one signature Ultimate scroll. It doesn't take up a loadout slot — it's always available the moment you have enough Energy to cast it.",
  },
  {
    icon: '⚔️',
    title: 'Sudden Death',
    text: 'If a battle is still going at <b>Round 10</b>, Sudden Death kicks in: healing drops by 75% and damage rises by 25%, so long stalemates get forced to a decisive finish.',
  },
  {
    icon: '🎯',
    title: 'Winning',
    text: 'A battle ends the moment one team has no mages left standing. Last team with a living mage wins.',
  },
];
