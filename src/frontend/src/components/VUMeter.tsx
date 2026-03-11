import { useEffect, useRef, useState } from "react";

interface VUMeterProps {
  active: boolean;
  level: number; // 0-100
}

const BAR_KEYS = [
  "b01",
  "b02",
  "b03",
  "b04",
  "b05",
  "b06",
  "b07",
  "b08",
  "b09",
  "b10",
  "b11",
  "b12",
];

export function VUMeter({ active, level }: VUMeterProps) {
  const [displayLevel, setDisplayLevel] = useState(level);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setDisplayLevel(0);
      return;
    }
    let tick = 0;
    const animate = () => {
      tick++;
      if (tick % 3 === 0) {
        const noise = (Math.random() - 0.5) * 30;
        setDisplayLevel(Math.max(0, Math.min(100, level + noise)));
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [active, level]);

  const bars = BAR_KEYS.length;
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 28 }}>
      {BAR_KEYS.map((key, i) => {
        const threshold = ((i + 1) / bars) * 100;
        const isLit = active && displayLevel >= threshold;
        const isHigh = threshold > 80;
        const isMid = threshold > 50;
        const barColor = isLit
          ? isHigh
            ? "oklch(0.60 0.22 25)"
            : isMid
              ? "oklch(0.80 0.22 75)"
              : "oklch(0.74 0.26 148)"
          : "oklch(0.18 0.02 242)";
        return (
          <div
            key={key}
            className="w-[4px] rounded-sm transition-all duration-75"
            style={{
              height: `${(i + 1) * (26 / bars) * 0.9 + 3}px`,
              background: barColor,
              boxShadow: isLit ? `0 0 4px ${barColor}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}
