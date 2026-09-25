import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from 0 (or previous value) to `target`.
 * duration: ms, decimals: decimal places to display.
 */
export function useCountUp(target, duration = 900, decimals = 0) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)
  const rafRef  = useRef(null)

  useEffect(() => {
    const from = prevRef.current
    const to   = target
    if (from === to) return

    const start = performance.now()
    const diff  = to - from

    function ease(t) {
      // ease-out cubic
      return 1 - Math.pow(1 - t, 3)
    }

    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const current  = from + diff * ease(progress)
      setDisplay(parseFloat(current.toFixed(decimals)))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = to
      }
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, decimals])

  return display
}
