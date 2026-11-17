// El cielo de fondo: cambia con la hora real (amanecer, día, atardecer, noche) y tiene cordillera al horizonte.
import { useMemo } from "react";

const rand = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

export function Sky({ phase = "night", soft }) {
  const stars = useMemo(() => {
    const r = rand(2027);
    return Array.from({ length: 90 }, () => `${(r() * 100).toFixed(2)}vw ${(r() * 62).toFixed(2)}vh 0 ${r() > 0.85 ? 1 : 0}px rgba(255,255,255,${(0.35 + r() * 0.6).toFixed(2)})`).join(",");
  }, []);
  return (
    <div className={"sky" + (soft ? " soft" : "")} data-phase={phase} aria-hidden="true">
      <div className="sky-stars" style={{ boxShadow: stars }} />
      <div className="sky-orb" />
      <div className="sky-haze" />
      <svg className="sky-ridge r3" viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0 240 L140 150 L260 210 L400 96 L520 190 L640 130 L780 220 L900 120 L1010 80 L1120 170 L1260 110 L1440 200 V320 H0Z" /></svg>
      <svg className="sky-ridge r2" viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0 270 L180 190 L300 240 L470 150 L600 235 L760 170 L880 240 L1040 160 L1180 230 L1320 180 L1440 250 V320 H0Z" /></svg>
      <svg className="sky-ridge r1" viewBox="0 0 1440 320" preserveAspectRatio="none"><path d="M0 300 L200 240 L360 285 L560 225 L720 280 L900 235 L1080 290 L1260 245 L1440 290 V320 H0Z" /></svg>
    </div>
  );
}
