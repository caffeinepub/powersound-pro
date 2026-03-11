import { Battery, BatteryCharging, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

interface BatteryDisplayProps {
  percentage: number;
  charging: boolean;
  onToggleCharging: () => void;
}

const SEGMENT_KEYS = [
  "s0",
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
];

export function BatteryDisplay({
  percentage,
  charging,
  onToggleCharging,
}: BatteryDisplayProps) {
  const prevPct = useRef(percentage);

  useEffect(() => {
    prevPct.current = percentage;
  }, [percentage]);

  const fillColor =
    percentage > 60
      ? "oklch(0.74 0.26 148)"
      : percentage > 25
        ? "oklch(0.80 0.22 75)"
        : "oklch(0.60 0.22 25)";

  const glowColor =
    percentage > 60
      ? "oklch(0.74 0.26 148 / 0.7)"
      : percentage > 25
        ? "oklch(0.80 0.22 75 / 0.7)"
        : "oklch(0.60 0.22 25 / 0.7)";

  return (
    <div
      className="flex flex-col gap-3 rounded-lg p-4"
      style={{
        background: "oklch(0.09 0.016 242)",
        border: "1px solid oklch(0.28 0.08 212)",
        boxShadow: "0 0 24px oklch(0.72 0.28 212 / 0.12)",
        minWidth: 340,
      }}
    >
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Battery
            className="w-4 h-4"
            style={{ color: "oklch(0.72 0.28 212)" }}
          />
          <span className="font-mono text-[11px] tracking-[0.3em] text-neon-blue">
            POWER SYSTEM
          </span>
        </div>
        <AnimatePresence mode="wait">
          {charging ? (
            <motion.span
              key="charging-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="font-mono text-[10px] tracking-widest font-bold"
              style={{ color: "oklch(0.85 0.24 75)" }}
            >
              ⚡ CHARGING
            </motion.span>
          ) : (
            <motion.span
              key="offline-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono text-[10px] tracking-widest"
              style={{ color: "oklch(0.38 0.02 242)" }}
            >
              ● OFFLINE
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Battery + Charger side by side */}
      <div className="flex items-stretch gap-4">
        {/* === BATTERY BLOCK === */}
        <div
          className="flex flex-col items-center gap-2 flex-1 rounded p-3"
          style={{
            background: "oklch(0.07 0.012 242)",
            border: `1px solid ${charging ? "oklch(0.74 0.26 148 / 0.6)" : "oklch(0.22 0.04 242)"}`,
            boxShadow: charging
              ? "0 0 16px oklch(0.74 0.26 148 / 0.25)"
              : "none",
          }}
        >
          <span
            className="font-mono text-[9px] tracking-[0.25em]"
            style={{ color: "oklch(0.52 0.02 220)" }}
          >
            BATTERY BANK
          </span>

          {/* Big battery with fill */}
          <div className="relative w-full">
            <div
              className="relative h-10 rounded"
              style={{
                background: "oklch(0.10 0.012 242)",
                border: `2px solid ${fillColor}`,
                boxShadow: charging ? `0 0 12px ${glowColor}` : "none",
                overflow: "hidden",
              }}
            >
              <motion.div
                className="absolute left-0 top-0 bottom-0 rounded-sm"
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{
                  background: `linear-gradient(90deg, ${fillColor}88, ${fillColor})`,
                  boxShadow: charging ? `0 0 8px ${glowColor}` : "none",
                }}
              />
              {charging && (
                <div
                  className="absolute top-0 bottom-0 w-8 rounded"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${fillColor}80, transparent)`,
                    animation: "power-flow 1.2s linear infinite",
                  }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-mono font-black text-lg leading-none"
                  style={{
                    color: percentage > 40 ? "oklch(0.04 0.01 242)" : fillColor,
                  }}
                >
                  {percentage}%
                </span>
              </div>
            </div>
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-2 h-4 rounded-r"
              style={{ background: fillColor }}
            />
          </div>

          <div className="text-center">
            <span
              className="font-display font-black text-xl leading-none tracking-tight"
              style={{
                color: fillColor,
                textShadow: charging ? `0 0 16px ${glowColor}` : "none",
              }}
            >
              2,000,000W
            </span>
            <div
              className="font-mono text-[9px] mt-0.5"
              style={{ color: "oklch(0.45 0.02 220)" }}
            >
              CAPACITY
            </div>
          </div>

          {/* Segment indicators */}
          <div className="flex gap-1 w-full">
            {SEGMENT_KEYS.map((key, i) => (
              <div
                key={key}
                className="flex-1 h-1.5 rounded-sm transition-all duration-300"
                style={{
                  background:
                    i < Math.ceil(percentage / 10)
                      ? fillColor
                      : "oklch(0.18 0.02 242)",
                  boxShadow:
                    i < Math.ceil(percentage / 10) && charging
                      ? `0 0 4px ${glowColor}`
                      : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* === POWER FLOW ARROWS === */}
        <div className="flex flex-col items-center justify-center gap-1 w-8">
          <AnimatePresence>
            {charging ? (
              <>
                {["a0", "a1", "a2"].map((key, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: [0, 1, 0], x: [0, 8, 16] }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.25,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    <span
                      style={{ color: "oklch(0.80 0.22 75)", fontSize: 14 }}
                    >
                      ►
                    </span>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="flex flex-col gap-1">
                {["a0", "a1", "a2"].map((key) => (
                  <span
                    key={key}
                    style={{ color: "oklch(0.28 0.04 242)", fontSize: 12 }}
                  >
                    ►
                  </span>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* === CHARGER BLOCK === */}
        <div
          className="flex flex-col items-center gap-2 flex-1 rounded p-3"
          style={{
            background: "oklch(0.07 0.012 242)",
            border: `1px solid ${charging ? "oklch(0.80 0.22 75 / 0.6)" : "oklch(0.22 0.04 242)"}`,
            boxShadow: charging
              ? "0 0 16px oklch(0.80 0.22 75 / 0.25)"
              : "none",
          }}
        >
          <span
            className="font-mono text-[9px] tracking-[0.25em]"
            style={{ color: "oklch(0.52 0.02 220)" }}
          >
            CHARGER UNIT
          </span>

          <div
            className="w-12 h-10 rounded flex items-center justify-center"
            style={{
              background: charging
                ? "oklch(0.14 0.06 75)"
                : "oklch(0.10 0.012 242)",
              border: `2px solid ${charging ? "oklch(0.80 0.22 75)" : "oklch(0.22 0.04 242)"}`,
              boxShadow: charging
                ? "0 0 20px oklch(0.80 0.22 75 / 0.5)"
                : "none",
            }}
          >
            <BatteryCharging
              className={`w-7 h-7 ${charging ? "animate-charge-pulse" : ""}`}
              style={{
                color: charging
                  ? "oklch(0.90 0.22 75)"
                  : "oklch(0.40 0.04 242)",
              }}
            />
          </div>

          {/* Status label */}
          <div
            className="w-full rounded px-2 py-1 text-center"
            style={{
              background: charging
                ? "oklch(0.12 0.06 75)"
                : "oklch(0.06 0.01 242)",
              border: `1px solid ${charging ? "oklch(0.60 0.20 75 / 0.5)" : "oklch(0.20 0.04 242)"}`,
            }}
          >
            <AnimatePresence mode="wait">
              {charging ? (
                <motion.span
                  key="ch"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                  className="font-mono text-[10px] font-black tracking-[0.25em] block"
                  style={{ color: "oklch(0.88 0.22 75)" }}
                >
                  ⚡ CHARGING
                </motion.span>
              ) : (
                <motion.span
                  key="off"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-[10px] tracking-[0.25em] block"
                  style={{ color: "oklch(0.35 0.02 242)" }}
                >
                  OFFLINE
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center">
            <span
              className="font-display font-black text-xl leading-none"
              style={{
                color: charging
                  ? "oklch(0.85 0.22 75)"
                  : "oklch(0.45 0.04 242)",
                textShadow: charging
                  ? "0 0 16px oklch(0.80 0.22 75 / 0.7)"
                  : "none",
              }}
            >
              200,000W
            </span>
            <div
              className="font-mono text-[9px] mt-0.5"
              style={{ color: "oklch(0.45 0.02 220)" }}
            >
              OUTPUT
            </div>
          </div>

          <button
            type="button"
            data-ocid="battery.charging_toggle"
            onClick={onToggleCharging}
            className="w-full py-2 rounded font-mono text-xs font-black tracking-[0.2em] transition-all"
            style={{
              background: charging
                ? "oklch(0.16 0.08 75)"
                : "oklch(0.12 0.02 242)",
              border: `2px solid ${charging ? "oklch(0.80 0.22 75)" : "oklch(0.28 0.06 212)"}`,
              color: charging ? "oklch(0.90 0.22 75)" : "oklch(0.65 0.20 212)",
              boxShadow: charging
                ? "0 0 16px oklch(0.80 0.22 75 / 0.5), inset 0 0 12px oklch(0.80 0.22 75 / 0.1)"
                : "0 0 6px oklch(0.72 0.28 212 / 0.2)",
            }}
          >
            {charging ? (
              <span className="flex items-center justify-center gap-1">
                <Zap
                  className="w-3 h-3 animate-charge-pulse"
                  fill="currentColor"
                />
                STOP CHARGING
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />
                START CHARGE
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
