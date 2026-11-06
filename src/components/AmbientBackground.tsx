/**
 * The "extravagant shell": a soft indigo/violet/pink glow with film grain.
 * Decorative only (aria-hidden, no pointer events). Sits behind the board
 * area, never behind dialogs or the header. Gradients, not blur filters,
 * so it stays cheap on phones; the drift pauses under reduced motion.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="ambient-glow absolute -inset-[10%] animate-drift" />
      <div className="ambient-grain absolute inset-0" />
    </div>
  )
}
