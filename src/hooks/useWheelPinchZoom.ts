import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface UseWheelPinchZoomOptions {
  ref: RefObject<HTMLElement | null>;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  /** Called with the next zoom value and the gesture's anchor point in the
   *  element's local (client-rect-relative) coordinates. Callers decide how
   *  to keep that point visually stable (scroll offset, camera math, etc) —
   *  this hook only detects the gesture, it doesn't own zoom state. */
  onZoom: (nextZoom: number, anchorX: number, anchorY: number) => void;
}

/** Wires ctrl+wheel (desktop mouse/trackpad "pinch") and two-finger touch
 *  pinch on `ref`'s element into zoom changes. */
export function useWheelPinchZoom({ ref, zoom, minZoom, maxZoom, onZoom }: UseWheelPinchZoomOptions) {
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const pinchRef = useRef<{ dist: number; zoom: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clamp = (z: number) => Math.min(maxZoom, Math.max(minZoom, z));
    const localPoint = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    };
    const touchDist = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const { x, y } = localPoint(e.clientX, e.clientY);
      const next = clamp(zoomRef.current * Math.exp(-e.deltaY * 0.01));
      if (next !== zoomRef.current) onZoom(next, x, y);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 2) { pinchRef.current = null; return; }
      const [a, b] = [e.touches[0]!, e.touches[1]!];
      const mid = localPoint((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
      pinchRef.current = { dist: touchDist(a, b), zoom: zoomRef.current, x: mid.x, y: mid.y };
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const dist = touchDist(e.touches[0]!, e.touches[1]!);
      const next = clamp(pinchRef.current.zoom * (dist / pinchRef.current.dist));
      onZoom(next, pinchRef.current.x, pinchRef.current.y);
    }
    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchRef.current = null;
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [ref, minZoom, maxZoom, onZoom]);
}
