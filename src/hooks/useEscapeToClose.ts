import { useEffect } from 'react';

/** Closes an open sheet/modal on Escape — shared by every full-screen
 *  overlay in the app (item/gear/card socket details, room dialogs, etc.)
 *  so the shortcut behaves identically everywhere instead of being
 *  reimplemented ad hoc per component. `active` is typically `!!thing`
 *  (whatever prop makes the sheet actually render). */
export function useEscapeToClose(active: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, onClose]);
}
