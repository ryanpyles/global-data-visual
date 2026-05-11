import React, { useState, useEffect, useRef } from "react";

const INTRO_KEY = "globe-intro-v2";

interface Props {
  onDismiss: () => void;
}

const IntroOverlay: React.FC<Props> = ({ onDismiss }) => {
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1300);
    const t3 = setTimeout(() => setPhase(3), 2100);
    const t4 = setTimeout(() => setPhase(4), 2900);
    const auto = setTimeout(onDismiss, 8000);

    const target = 8200000000;
    const duration = 3200;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 2.2);
      setCount(Math.round(target * ease));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(auto);
      cancelAnimationFrame(rafRef.current);
    };
  }, [onDismiss]);

  const fmt = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${Math.round(n / 1e6).toLocaleString()}M`;
    return n.toLocaleString();
  };

  return (
    <div className="intro-overlay" onClick={onDismiss}>
      <div className="intro-content" onClick={(e) => e.stopPropagation()}>
        <div className={`intro-eyebrow ${phase >= 1 ? "intro-in" : ""}`}>
          Global Human Geography
        </div>
        <div className={`intro-counter ${phase >= 1 ? "intro-in" : ""}`}>
          <span className="intro-count-num">{fmt(count)}</span>
          <span className="intro-count-unit">people</span>
        </div>
        <div className={`intro-facts ${phase >= 2 ? "intro-in" : ""}`}>
          <span>7,000+ languages</span>
          <span className="intro-dot">·</span>
          <span>300M in diaspora</span>
          <span className="intro-dot">·</span>
          <span>12M stateless</span>
        </div>
        <div className={`intro-tagline ${phase >= 3 ? "intro-in" : ""}`}>
          Migration is civilization's operating system.
        </div>
        <button
          className={`intro-enter ${phase >= 4 ? "intro-in" : ""}`}
          onClick={onDismiss}
        >
          Explore the data →
        </button>
        <p className={`intro-skip ${phase >= 2 ? "intro-in" : ""}`} onClick={onDismiss}>
          click anywhere to skip
        </p>
      </div>
    </div>
  );
};

export function shouldShowIntro(): boolean {
  try {
    return !localStorage.getItem(INTRO_KEY);
  } catch {
    return true;
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_KEY, "1");
  } catch {
    // ignore
  }
}

export default IntroOverlay;
