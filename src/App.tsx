import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { AuthPage } from '@/features/auth';
import { ServerSelectPage } from '@/features/serverSelect';
import { CharacterSelectPage } from '@/features/characterSelect';
import { RosterPage } from '@/features/roster';
import { HubPage } from '@/features/hub';
import { PartyPage } from '@/features/party';
import { MapPage } from '@/features/map';
import { BattlePage } from '@/pages/BattlePage';
import { TutorialPage } from '@/pages/TutorialPage';
import { ResponsiveShell } from '@/layouts/ResponsiveShell';

function RequireAccount({ children }: { children: ReactNode }) {
  const user = useGameStore((s) => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RequireParty({ children }: { children: ReactNode }) {
  const user = useGameStore((s) => s.user);
  const party = useGameStore((s) => s.party);
  // Runs once per page load, the first time any of Hub/Party/Map mounts —
  // a no-op unless the previous session left a fight unresolved (tab
  // backgrounded/killed mid-battle-animation), see recoverFromOrphanedEncounter.
  useEffect(() => {
    useMapStore.getState().recoverFromOrphanedEncounter();
  }, []);
  if (!user) return <Navigate to="/auth" replace />;
  if (!party) return <Navigate to="/roster" replace />;
  return <>{children}</>;
}

/** Guards the one-time guided tutorial battle — redirects straight past
 *  itself once a character has already completed it, so it can never replay. */
function RequireTutorial({ children }: { children: ReactNode }) {
  const user = useGameStore((s) => s.user);
  const party = useGameStore((s) => s.party);
  if (!user) return <Navigate to="/auth" replace />;
  if (!party) return <Navigate to="/roster" replace />;
  if (party.tutorialCompleted) return <Navigate to="/map" replace />;
  return <>{children}</>;
}

/** Route table for the whole game — every screen from the original is now
 *  a sibling route, each backed by its own feature module (src/features/*). */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<ResponsiveShell><AuthPage /></ResponsiveShell>} />
        <Route path="/server-select" element={<RequireAccount><ResponsiveShell><ServerSelectPage /></ResponsiveShell></RequireAccount>} />
        <Route path="/character-select" element={<RequireAccount><ResponsiveShell><CharacterSelectPage /></ResponsiveShell></RequireAccount>} />
        <Route path="/roster" element={<RequireAccount><ResponsiveShell><RosterPage /></ResponsiveShell></RequireAccount>} />
        <Route path="/tutorial" element={<RequireTutorial><TutorialPage /></RequireTutorial>} />
        <Route path="/hub" element={<RequireParty><ResponsiveShell><HubPage /></ResponsiveShell></RequireParty>} />
        <Route path="/party" element={<RequireParty><ResponsiveShell><PartyPage /></ResponsiveShell></RequireParty>} />
        <Route path="/map" element={<RequireParty><ResponsiveShell><MapPage /></ResponsiveShell></RequireParty>} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
