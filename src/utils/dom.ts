/** True if the given element is a text-input-like target — used to skip
 *  global keyboard shortcuts (WASD movement, Enter-opens-chat) while the
 *  user is actually typing into a field, rather than hijacking their keys. */
export function isTypingTarget(el: Element | null): boolean {
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
}
