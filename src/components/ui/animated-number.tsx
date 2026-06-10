"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  /** Formats the in-flight value; defaults to mn-MN locale grouping. */
  format?: (value: number) => string;
  durationMs?: number;
  className?: string;
}

/**
 * Counts from the previously rendered value to the new one with an
 * ease-out curve. Renders the final value immediately when the user
 * prefers reduced motion.
 */
export function AnimatedNumber({ value, format, durationMs = 900, className }: AnimatedNumberProps) {
  // Start at 0 so the value counts up on first mount as well.
  const [display, setDisplay] = useState(0);
  // Tracks what is actually on screen — survives StrictMode's double
  // effect invocation, where a "previous target" ref would not.
  const displayRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (displayRef.current === value) {
      return;
    }

    const from = displayRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();

    const tick = (now: number) => {
      if (reduceMotion) {
        displayRef.current = value;
        setDisplay(value);
        return;
      }
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (value - from) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, durationMs]);

  const rounded = Math.round(display);
  const text = format ? format(rounded) : rounded.toLocaleString("mn-MN");

  return <span className={className}>{text}</span>;
}
