import { useCallback, useEffect, useRef } from 'react';

interface UseHoldRepeatOptions {
  /** Called once per "tick" — a single tap, or once per repeat interval while held. */
  onTick: () => void;
  /** Re-checked on every tick (not just at press-start) so a hold naturally
   *  stops the moment the limit is hit mid-repeat (e.g. skill/stat points run out). */
  disabled?: boolean;
  initialDelayMs?: number;
  intervalMs?: number;
}

/**
 * Press-and-hold repeat for a +/- style button: a quick tap fires once
 * (works via mouse, touch, or keyboard Enter/Space); holding past
 * `initialDelayMs` starts firing every `intervalMs` until released, so
 * spending e.g. 10 stat points doesn't need 10 separate taps.
 *
 * `onPointerDown` fires the first tick immediately and arms the repeat
 * timers; the native `click` that follows on release would otherwise double
 * up that same first tick, so `onClick` only fires when pointerdown never
 * ran (i.e. keyboard activation, which has no pointer events).
 */
export function useHoldRepeat({ onTick, disabled = false, initialDelayMs = 400, intervalMs = 90 }: UseHoldRepeatOptions) {
  const onTickRef = useRef(onTick);
  const disabledRef = useRef(disabled);
  onTickRef.current = onTick;
  disabledRef.current = disabled;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedByHoldRef = useRef(false);

  const stop = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => stop, [stop]);

  const onPointerDown = useCallback(() => {
    if (disabledRef.current) return;
    stop();
    firedByHoldRef.current = true;
    onTickRef.current();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (disabledRef.current) { stop(); return; }
        onTickRef.current();
      }, intervalMs);
    }, initialDelayMs);
  }, [initialDelayMs, intervalMs, stop]);

  const onClick = useCallback(() => {
    if (firedByHoldRef.current) { firedByHoldRef.current = false; return; }
    if (!disabledRef.current) onTickRef.current();
  }, []);

  return { onPointerDown, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop, onClick };
}
