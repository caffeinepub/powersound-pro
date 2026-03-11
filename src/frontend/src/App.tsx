import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import {
  Activity,
  FolderOpen,
  Link,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Save,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BatteryDisplay } from "./components/BatteryDisplay";
import { VUMeter } from "./components/VUMeter";
import { useCreatePreset, useGetAllPresets } from "./hooks/useQueries";

const EQ_BANDS = [
  "32Hz",
  "64Hz",
  "125Hz",
  "250Hz",
  "500Hz",
  "1kHz",
  "2kHz",
  "4kHz",
  "8kHz",
  "16kHz",
];
const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const DEFAULT_EQ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const DEFAULT_ENGINES = [85, 80, 90, 75];

const SMART_CHIP_IDS = [
  "SC-01",
  "SC-02",
  "SC-03",
  "SC-04",
  "SC-05",
  "SC-06",
  "SC-07",
  "SC-08",
  "SC-09",
  "SC-10",
  "SC-11",
  "SC-12",
  "SC-13",
  "SC-14",
  "SC-15",
  "SC-16",
  "SC-17",
  "SC-18",
  "SC-19",
  "SC-20",
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div
        className="h-px flex-1"
        style={{ background: "oklch(0.28 0.08 212)" }}
      />
      <span className="font-mono text-[10px] tracking-[0.35em] text-neon-blue">
        {children}
      </span>
      <div
        className="h-px flex-1"
        style={{ background: "oklch(0.28 0.08 212)" }}
      />
    </div>
  );
}

function StatusDot({ on, color = "148" }: { on: boolean; color?: string }) {
  return (
    <div
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{
        background: on ? `oklch(0.74 0.26 ${color})` : "oklch(0.22 0.04 242)",
        boxShadow: on ? `0 0 6px oklch(0.74 0.26 ${color})` : "none",
      }}
    />
  );
}

// ── Book Cover ──────────────────────────────────────────────────────────────
function BookCover({ onOpen }: { onOpen: () => void }) {
  const [phase, setPhase] = useState<"closed" | "opening" | "done">("closed");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("opening"), 400);
    const t2 = setTimeout(() => {
      setPhase("done");
      onOpen();
    }, 6200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onOpen]);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "oklch(0.05 0.014 242)",
        perspective: "1800px",
        perspectiveOrigin: "50% 50%",
      }}
    >
      {/* LEFT COVER */}
      <motion.div
        initial={{ rotateY: 0 }}
        animate={phase === "opening" ? { rotateY: 170 } : { rotateY: 0 }}
        transition={{ duration: 5.0, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        style={{
          transformOrigin: "right center",
          transformStyle: "preserve-3d",
          width: "46vw",
          maxWidth: 480,
          height: "80vh",
          maxHeight: 700,
          position: "absolute",
          right: "50%",
          borderRadius: "4px 0 0 4px",
          background:
            "linear-gradient(135deg, oklch(0.12 0.06 230) 0%, oklch(0.08 0.04 220) 60%, oklch(0.06 0.02 210) 100%)",
          border: "1px solid oklch(0.35 0.14 212)",
          boxShadow:
            "inset -4px 0 24px oklch(0.72 0.28 212 / 0.15), 0 0 60px oklch(0.50 0.20 212 / 0.3)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <p
            className="font-mono text-[9px] tracking-[0.4em] text-center"
            style={{ color: "oklch(0.45 0.10 212)" }}
          >
            AUDIO CONTROL
            <br />
            SYSTEM
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {["BASS", "MID", "HIGH", "AIR"].map((e) => (
              <div
                key={e}
                className="w-12 h-12 rounded flex items-center justify-center"
                style={{
                  background: "oklch(0.09 0.04 212)",
                  border: "1px solid oklch(0.30 0.12 212)",
                }}
              >
                <span
                  className="font-mono text-[8px]"
                  style={{ color: "oklch(0.60 0.18 212)" }}
                >
                  {e}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute bottom-8 left-6 right-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-px mb-1.5"
                style={{
                  background: `oklch(0.35 0.12 212 / ${0.4 - i * 0.1})`,
                  width: `${100 - i * 15}%`,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* RIGHT COVER */}
      <motion.div
        initial={{ rotateY: 0 }}
        animate={phase === "opening" ? { rotateY: -170 } : { rotateY: 0 }}
        transition={{ duration: 5.0, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        style={{
          transformOrigin: "left center",
          transformStyle: "preserve-3d",
          width: "46vw",
          maxWidth: 480,
          height: "80vh",
          maxHeight: 700,
          position: "absolute",
          left: "50%",
          borderRadius: "0 4px 4px 0",
          background:
            "linear-gradient(225deg, oklch(0.14 0.08 212) 0%, oklch(0.09 0.05 220) 60%, oklch(0.06 0.02 210) 100%)",
          border: "1px solid oklch(0.35 0.14 212)",
          boxShadow:
            "inset 4px 0 24px oklch(0.72 0.28 212 / 0.15), 0 0 60px oklch(0.50 0.20 212 / 0.3)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
            style={{
              background: "oklch(0.10 0.06 212)",
              border: "2px solid oklch(0.68 0.28 212)",
              boxShadow: "0 0 40px oklch(0.72 0.28 212 / 0.6)",
            }}
          >
            <Volume2
              className="w-8 h-8"
              style={{ color: "oklch(0.82 0.28 212)" }}
            />
          </div>
          <h1
            className="font-display font-black text-3xl text-center leading-tight"
            style={{
              color: "oklch(0.88 0.28 196)",
              textShadow: "0 0 30px oklch(0.78 0.28 196 / 0.8)",
              letterSpacing: "0.1em",
            }}
          >
            POWER
            <br />
            SOUND
          </h1>
          <p
            className="font-mono text-[10px] tracking-[0.5em] mt-3"
            style={{ color: "oklch(0.50 0.12 212)" }}
          >
            PRO · v9.0
          </p>
        </div>
      </motion.div>

      {/* Spine */}
      <div
        style={{
          position: "absolute",
          left: "calc(50% - 6px)",
          width: 12,
          height: "80vh",
          maxHeight: 700,
          background:
            "linear-gradient(90deg, oklch(0.18 0.08 212) 0%, oklch(0.30 0.14 212) 50%, oklch(0.18 0.08 212) 100%)",
          boxShadow: "0 0 30px oklch(0.72 0.28 212 / 0.5)",
          zIndex: 10,
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "opening" ? [0, 1, 1, 0] : 0 }}
        transition={{ duration: 5.0, times: [0, 0.1, 0.9, 1] }}
        className="absolute bottom-12 font-mono text-[11px] tracking-[0.5em]"
        style={{ color: "oklch(0.55 0.16 212)" }}
      >
        INITIALIZING POWERSOUND PRO...
      </motion.div>
    </div>
  );
}

// ── Smart Chip Card ─────────────────────────────────────────────────────────
function makeSoftSatCurve(amount = 50): Float32Array<ArrayBuffer> {
  const n = 256;
  const curve = new Float32Array(n) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function makeGuardianCurve(): Float32Array<ArrayBuffer> {
  // Look-ahead harmonic restoration curve — pre-corrects peaks before they reach stabilizer
  const n = 512;
  const curve = new Float32Array(n) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    // Soft harmonic restoration: gentle for small signals, firm for peaks
    const k = 3.0;
    curve[i] = (x * (Math.abs(x) + k)) / (x * x + (k - 1) * Math.abs(x) + 1);
  }
  return curve;
}

function makeClassACurve(): Float32Array<ArrayBuffer> {
  // Class A: warm soft saturation
  const n = 256;
  const curve = new Float32Array(n) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(x * 1.2) / Math.tanh(1.2);
  }
  return curve;
}

function makeClassBCurve(): Float32Array<ArrayBuffer> {
  // Class B: mild push-pull character
  const n = 256;
  const curve = new Float32Array(n) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = x > 0 ? x ** 0.95 : -((-x) ** 0.95);
  }
  return curve;
}

function makeClassCCurve(): Float32Array<ArrayBuffer> {
  // Class C: gentle harmonic enhancer
  const n = 256;
  const curve = new Float32Array(n) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = x + 0.015 * Math.sin(Math.PI * x * 2);
  }
  return curve;
}

function makeClassDCurve(): Float32Array<ArrayBuffer> {
  // Class D: clarity/transient enhancer — light hard knee only at extremes
  const n = 256;
  const curve = new Float32Array(n) as Float32Array<ArrayBuffer>;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    const absX = Math.abs(x);
    if (absX < 0.9) {
      curve[i] = x;
    } else {
      const sign = x > 0 ? 1 : -1;
      curve[i] = sign * (0.9 + (absX - 0.9) * 0.5);
    }
  }
  return curve;
}

function SmartChipCard({
  label,
  healChip = false,
  active = true,
  onToggle,
}: {
  label: string;
  healChip?: boolean;
  active?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex flex-col items-center justify-center rounded p-1 cursor-pointer transition-all"
      style={{
        background: active ? "oklch(0.10 0.04 212)" : "oklch(0.07 0.01 242)",
        border: `1px solid ${active ? "oklch(0.30 0.12 212)" : "oklch(0.18 0.03 242)"}`,
        boxShadow: active ? "0 0 6px oklch(0.60 0.22 212 / 0.2)" : "none",
        minHeight: 44,
        opacity: active ? 1 : 0.45,
      }}
    >
      <div className="flex gap-0.5 mb-0.5">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "oklch(0.74 0.26 148)",
            boxShadow: "0 0 4px oklch(0.74 0.26 148)",
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "oklch(0.72 0.28 212)",
            boxShadow: "0 0 4px oklch(0.72 0.28 212)",
          }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: healChip
              ? "oklch(0.74 0.26 148)"
              : "oklch(0.72 0.22 75)",
            boxShadow: healChip
              ? "0 0 4px oklch(0.74 0.26 148)"
              : "0 0 4px oklch(0.72 0.22 75)",
          }}
        />
      </div>
      <span
        className="font-mono text-[7px]"
        style={{ color: "oklch(0.65 0.18 212)" }}
      >
        {label}
      </span>
      <span
        className="font-mono text-[6px]"
        style={{ color: "oklch(0.38 0.06 242)" }}
      >
        {healChip ? "HEAL" : "CTRL"}
      </span>
    </button>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [bookOpen, setBookOpen] = useState(false);
  const [engineLevels, setEngineLevels] = useState(DEFAULT_ENGINES);
  const [engineActive, setEngineActive] = useState([true, true, true, true]);
  const [eqBands, setEqBands] = useState(DEFAULT_EQ);
  const [bass80Hz, setBass80Hz] = useState(65);
  const [bassHighsMode, setBassHighsMode] = useState<"highs" | "both" | "bass">(
    "both",
  );
  const [volumeBooster, setVolumeBooster] = useState(850);
  const [loudMode, setLoudMode] = useState(false);
  const [chainLinked, setChainLinked] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [distortionLevel, setDistortionLevel] = useState(0);
  const [jazzMode, setJazzMode] = useState(false);
  const [compressorOn, setCompressorOn] = useState(true);
  const [batteryPct, setBatteryPct] = useState(() => {
    const s = localStorage.getItem("powersound_battery");
    return s ? Number.parseFloat(s) : 72;
  });
  const [charging, setCharging] = useState(
    () => localStorage.getItem("powersound_charging") === "true",
  );
  const [presetName, setPresetName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"left" | "right">("left");
  const [rightTab, setRightTab] = useState<"eq" | "processor" | "system">("eq");
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("NO FILE LOADED");
  const [ampOn, setAmpOn] = useState(false);
  const [bassMode, setBassMode] = useState<"regular" | "loud" | "low">(
    "regular",
  );
  const [healingActive, setHealingActive] = useState(true);
  const [scanActive, setScanActive] = useState(true);
  const [generatorBassActive, setGeneratorBassActive] = useState(true);
  const [generatorHighsActive, setGeneratorHighsActive] = useState(true);
  const [smartChipsActive, setSmartChipsActive] = useState<boolean[]>(() =>
    Array(20).fill(true),
  );
  const [processorOn, setProcessorOn] = useState(true);
  const [freezingActive, setFreezingActive] = useState(true);
  const [commanderMemory, setCommanderMemory] = useState<number>(() =>
    Number(localStorage.getItem("powersound_commander_memory") || "0"),
  );
  const [commanderLog, setCommanderLog] = useState<string[]>([]);
  const [commanderOn, setCommanderOn] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const loudGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const engineFiltersRef = useRef<BiquadFilterNode[]>([]);
  const defenseActiveRef = useRef(false);
  const bassRouteGainRef = useRef<GainNode | null>(null);
  const highsRouteGainRef = useRef<GainNode | null>(null);
  const bass80hzGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const sourceCreatedRef = useRef(false);
  const processorGainRef = useRef<GainNode | null>(null);
  const fpgaWaveShaperRef = useRef<WaveShaperNode | null>(null);
  const generatorBassFilterRef = useRef<BiquadFilterNode | null>(null);
  const generatorHighsFilterRef = useRef<BiquadFilterNode | null>(null);
  const healingCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const healingChipFiltersRef = useRef<BiquadFilterNode[]>([]);
  const freezeDelayRef = useRef<DelayNode | null>(null);
  const stabilizerBypassGainRef = useRef<GainNode | null>(null);
  const guardianWaveShaperRef = useRef<WaveShaperNode | null>(null);
  const titaniumCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const lookaheadDelayRef = useRef<DelayNode | null>(null);
  const smartChipGainsRef = useRef<GainNode[]>([]);
  const classARef = useRef<WaveShaperNode | null>(null);
  const classBRef = useRef<WaveShaperNode | null>(null);
  const classCRef = useRef<WaveShaperNode | null>(null);
  const classDRef = useRef<WaveShaperNode | null>(null);
  const autoFreqAnalyserRef = useRef<AnalyserNode | null>(null);
  const autoFreqProfileRef = useRef<string>("BALANCED");
  const [autoFreqProfile, setAutoFreqProfile] = useState("BALANCED");
  const [autoFreqBars, setAutoFreqBars] = useState<number[]>(Array(8).fill(0));

  const logCommanderAction = useCallback((action: string) => {
    const count =
      Number(localStorage.getItem("powersound_commander_memory") || "0") + 1;
    localStorage.setItem("powersound_commander_memory", String(count));
    setCommanderMemory(count);
    setCommanderLog((prev) => [action, ...prev].slice(0, 5));
  }, []);

  const { data: presets = [] } = useGetAllPresets();
  const createPreset = useCreatePreset();

  useEffect(() => {
    setAmpOn(batteryPct > 0);
  }, [batteryPct]);

  // ── Init Web Audio Chain ─────────────────────────────────────────────────
  const initAudioChain = useCallback(() => {
    if (sourceCreatedRef.current || !audioRef.current) return;
    sourceCreatedRef.current = true;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaElementSource(audioRef.current);

    // 10-band EQ filters
    const filters = EQ_FREQUENCIES.map((freq) => {
      const f = ctx.createBiquadFilter();
      f.type = "peaking";
      f.frequency.value = freq;
      f.Q.value = 1.5;
      f.gain.value = 0;
      return f;
    });
    eqNodesRef.current = filters;

    // Engine 1: Low-pass signal filter (no gain) — pure signal routing
    const eng1Filter = ctx.createBiquadFilter();
    eng1Filter.type = "lowpass";
    eng1Filter.frequency.value = 200;
    eng1Filter.Q.value = Math.SQRT1_2;

    // Engine 2: Band-pass signal filter (no gain) — pure signal routing
    const eng2Filter = ctx.createBiquadFilter();
    eng2Filter.type = "bandpass";
    eng2Filter.frequency.value = 500;
    eng2Filter.Q.value = 1.0;

    // Engine 3: Band-pass signal filter (no gain) — pure signal routing
    const eng3Filter = ctx.createBiquadFilter();
    eng3Filter.type = "bandpass";
    eng3Filter.frequency.value = 3000;
    eng3Filter.Q.value = 1.0;

    // Engine 4: High-pass signal filter (no gain) — pure signal routing
    const eng4Filter = ctx.createBiquadFilter();
    eng4Filter.type = "highpass";
    eng4Filter.frequency.value = 6000;
    eng4Filter.Q.value = Math.SQRT1_2;

    // 20 Smart Chip GainNodes (5 per engine)
    const chipGains: GainNode[] = Array.from({ length: 20 }, () => {
      const g = ctx.createGain();
      g.gain.value = 1.0; // useEffect will apply smartChipsActive state after init
      return g;
    });
    smartChipGainsRef.current = chipGains;

    const engineSum = ctx.createGain();
    engineSum.gain.value = 0.2; // 4 engines summed → normalize

    // Processor gain + FPGA wave shaper
    const processorGain = ctx.createGain();
    processorGain.gain.value = 1.0;
    processorGainRef.current = processorGain;

    const fpgaWaveShaper = ctx.createWaveShaper();
    fpgaWaveShaper.curve = processorOn ? makeSoftSatCurve(50) : null;
    fpgaWaveShaper.oversample = "4x";
    fpgaWaveShaperRef.current = fpgaWaveShaper;

    // A+B+C+D class waveshapers — subtle character, never distort
    const classA = ctx.createWaveShaper();
    classA.curve = makeClassACurve();
    classA.oversample = "2x";
    classARef.current = classA;

    const classB = ctx.createWaveShaper();
    classB.curve = makeClassBCurve();
    classB.oversample = "2x";
    classBRef.current = classB;

    const classC = ctx.createWaveShaper();
    classC.curve = makeClassCCurve();
    classC.oversample = "2x";
    classCRef.current = classC;

    const classD = ctx.createWaveShaper();
    classD.curve = makeClassDCurve();
    classD.oversample = "2x";
    classDRef.current = classD;

    // Auto frequency analyser (separate from distortion analyser)
    const autoFreqAnalyser = ctx.createAnalyser();
    autoFreqAnalyser.fftSize = 2048;
    autoFreqAnalyserRef.current = autoFreqAnalyser;

    // Bass path — 80Hz lowpass
    const bassLowpass = ctx.createBiquadFilter();
    bassLowpass.type = "lowpass";
    bassLowpass.frequency.value = 200;
    bassLowpass.Q.value = 0.8;

    const bass80hzGain = ctx.createGain();
    bass80hzGain.gain.value = bass80Hz / 100;
    bass80hzGainRef.current = bass80hzGain;

    const generatorBassFilter = ctx.createBiquadFilter();
    generatorBassFilter.type = "peaking";
    generatorBassFilter.frequency.value = 80;
    generatorBassFilter.Q.value = 1.2;
    generatorBassFilter.gain.value = generatorBassActive ? 2 : 0;
    generatorBassFilterRef.current = generatorBassFilter;

    const bassRouteGain = ctx.createGain();
    bassRouteGain.gain.value = 1.0;
    bassRouteGainRef.current = bassRouteGain;

    // Highs path
    const highsHighpass = ctx.createBiquadFilter();
    highsHighpass.type = "highpass";
    highsHighpass.frequency.value = 200;
    highsHighpass.Q.value = 0.8;

    const generatorHighsFilter = ctx.createBiquadFilter();
    generatorHighsFilter.type = "highshelf";
    generatorHighsFilter.frequency.value = 8000;
    generatorHighsFilter.gain.value = generatorHighsActive ? 2 : 0;
    generatorHighsFilterRef.current = generatorHighsFilter;

    const highsRouteGain = ctx.createGain();
    highsRouteGain.gain.value = 1.0;
    highsRouteGainRef.current = highsRouteGain;

    const masterMix = ctx.createGain();
    masterMix.gain.value = 1.0;

    // Healing chip filters — 10 peaking filters across spectrum
    const healFreqs = [60, 120, 250, 500, 1000, 2000, 4000, 6000, 10000, 16000];
    const healChipFilters: BiquadFilterNode[] = healFreqs.map((freq) => {
      const f = ctx.createBiquadFilter();
      f.type = "peaking";
      f.frequency.value = freq;
      f.Q.value = 1.0;
      f.gain.value = healingActive ? 0.5 : 0;
      return f;
    });
    healingChipFiltersRef.current = healChipFilters;

    // Healing compressor (gentle correction pass)
    const healingCompressor = ctx.createDynamicsCompressor();
    healingCompressor.threshold.value = -18;
    healingCompressor.knee.value = 60;
    healingCompressor.ratio.value = 1.5;
    healingCompressor.attack.value = 0.1;
    healingCompressor.release.value = 0.5;
    healingCompressorRef.current = healingCompressor;

    // Freeze delay
    const freezeDelay = ctx.createDelay(1.0);
    freezeDelay.delayTime.value = freezingActive ? 0.02 : 0.001;
    freezeDelayRef.current = freezeDelay;

    const gainNode = ctx.createGain();
    gainNode.gain.value = Math.max(0.001, Math.min(17, volumeBooster / 100));
    gainNodeRef.current = gainNode;

    const loudGain = ctx.createGain();
    loudGain.gain.value = 1.0;
    loudGainRef.current = loudGain;

    // Signal Guardian — look-ahead harmonic restoration (pre-corrects peaks before stabilizer)
    const guardianWaveShaper = ctx.createWaveShaper();
    guardianWaveShaper.curve = makeGuardianCurve();
    guardianWaveShaper.oversample = "4x";
    guardianWaveShaperRef.current = guardianWaveShaper;

    // Look-ahead delay (gives stabilizer time to react)
    const lookaheadDelay = ctx.createDelay(0.05);
    lookaheadDelay.delayTime.value = 0.015;
    lookaheadDelayRef.current = lookaheadDelay;

    // Stabilizer Stage 1 — 800,000,000 — gentle correction (does NOT limit)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 40;
    compressor.ratio.value = 2;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressorRef.current = compressor;

    // Stabilizer Stage 2 — TITANIUM 800,000,000 — second layer of protection
    const titaniumCompressor = ctx.createDynamicsCompressor();
    titaniumCompressor.threshold.value = -3;
    titaniumCompressor.knee.value = 30;
    titaniumCompressor.ratio.value = 2.5;
    titaniumCompressor.attack.value = 0.001;
    titaniumCompressor.release.value = 0.15;
    titaniumCompressorRef.current = titaniumCompressor;

    // Bypass gain (kept for reconnect logic compatibility)
    const stabilizerBypassGain = ctx.createGain();
    stabilizerBypassGain.gain.value = 1.0;
    stabilizerBypassGainRef.current = stabilizerBypassGain;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    // ── Signal chain wiring ──────────────────────────────────────────────
    // Source → EQ filters
    source.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++)
      filters[i].connect(filters[i + 1]);
    const lastEq = filters[filters.length - 1];

    // EQ → Engine filters → engineSum (no gain nodes on engine path)
    const engFilters = [eng1Filter, eng2Filter, eng3Filter, eng4Filter];
    engineFiltersRef.current = engFilters;
    for (const ef of engFilters) {
      lastEq.connect(ef);
      ef.connect(engineSum);
    }
    // Smart chips connect in parallel to engineSum for spectral control
    lastEq.connect(chipGains[0]);
    for (let c = 0; c < 19; c++) chipGains[c].connect(chipGains[c + 1]);
    chipGains[19].connect(engineSum);

    // engineSum → processorGain → fpgaWaveShaper → A/B/C/D classes → bass/highs paths
    engineSum.connect(processorGain);
    processorGain.connect(fpgaWaveShaper);
    fpgaWaveShaper.connect(classA);
    classA.connect(classB);
    classB.connect(classC);
    classC.connect(classD);
    // Also wire autoFreqAnalyser on the pre-output signal
    classD.connect(autoFreqAnalyser);

    classD.connect(bassLowpass);
    bassLowpass.connect(bass80hzGain);
    bass80hzGain.connect(generatorBassFilter);
    generatorBassFilter.connect(bassRouteGain);
    bassRouteGain.connect(masterMix);

    classD.connect(highsHighpass);
    highsHighpass.connect(generatorHighsFilter);
    generatorHighsFilter.connect(highsRouteGain);
    highsRouteGain.connect(masterMix);

    // masterMix → healing chip filters (in series) → healingCompressor → freezeDelay → gainNode → loudGain
    masterMix.connect(healChipFilters[0]);
    for (let i = 0; i < healChipFilters.length - 1; i++)
      healChipFilters[i].connect(healChipFilters[i + 1]);
    healChipFilters[healChipFilters.length - 1].connect(healingCompressor);
    healingCompressor.connect(freezeDelay);
    freezeDelay.connect(gainNode);
    gainNode.connect(loudGain);

    // loudGain → Signal Guardian → lookahead delay → Stabilizer S1 → Titanium S2 → analyser → destination
    // Commander + Monitor feed back into this chain automatically via distortion detection
    loudGain.connect(guardianWaveShaper);
    guardianWaveShaper.connect(lookaheadDelay);
    lookaheadDelay.connect(compressor);
    compressor.connect(titaniumCompressor);
    titaniumCompressor.connect(analyser);
    analyser.connect(ctx.destination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    volumeBooster,
    bass80Hz,
    generatorBassActive,
    generatorHighsActive,
    freezingActive,
    healingActive,
    processorOn,
  ]);

  // ── Distortion measurement ───────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !analyserRef.current) return;
    const analyser = analyserRef.current;
    const buf = new Float32Array(analyser.fftSize);
    const measure = () => {
      analyser.getFloatTimeDomainData(buf);
      let maxAbs = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = Math.abs(buf[i]);
        if (v > maxAbs) maxAbs = v;
      }
      const distPct = Math.min(100, Math.max(0, (maxAbs - 0.5) * 200));
      setDistortionLevel(Math.round(distPct));
      animFrameRef.current = requestAnimationFrame(measure);
    };
    animFrameRef.current = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [playing]);

  // ── Audio sync effects ───────────────────────────────────────────────────
  useEffect(() => {
    eqBands.forEach((val, i) => {
      if (eqNodesRef.current[i]) eqNodesRef.current[i].gain.value = val;
    });
  }, [eqBands]);

  useEffect(() => {
    if (gainNodeRef.current)
      gainNodeRef.current.gain.value = Math.max(
        0.001,
        Math.min(17, volumeBooster / 100),
      );
  }, [volumeBooster]);

  useEffect(() => {
    if (loudGainRef.current) loudGainRef.current.gain.value = 1.0; // No gain on loud booster - signal shaping only
    // biome-ignore lint/correctness/useExhaustiveDependencies: gain is constant
  }, []);

  useEffect(() => {
    engineActive.forEach((_active, i) => {
      if (engineFiltersRef.current[i]) {
        // Slider adjusts filter frequency only — no gain changes ever
        const baseFreqs = [200, 500, 3000, 6000];
        const range = [150, 400, 2500, 5000];
        const newFreq = baseFreqs[i] + ((engineLevels[i] - 50) / 50) * range[i];
        engineFiltersRef.current[i].frequency.value = Math.max(20, newFreq);
      }
    });
  }, [engineActive, engineLevels]);

  useEffect(() => {
    if (bass80hzGainRef.current)
      bass80hzGainRef.current.gain.value = bass80Hz / 100;
  }, [bass80Hz]);

  useEffect(() => {
    if (!bassRouteGainRef.current || !highsRouteGainRef.current) return;
    if (bassHighsMode === "bass") {
      bassRouteGainRef.current.gain.value = 1.0;
      highsRouteGainRef.current.gain.value = 0.0;
    } else if (bassHighsMode === "highs") {
      bassRouteGainRef.current.gain.value = 0.0;
      highsRouteGainRef.current.gain.value = 1.0;
    } else {
      bassRouteGainRef.current.gain.value = 0.5;
      highsRouteGainRef.current.gain.value = 0.5;
    }
  }, [bassHighsMode]);

  useEffect(() => {
    if (jazzMode && eqNodesRef.current.length > 0) {
      const jazzCurve = [2, 3, 4, 5, 3, 1, -1, -2, -3, -4];
      jazzCurve.forEach((val, i) => {
        if (eqNodesRef.current[i]) eqNodesRef.current[i].gain.value = val;
      });
    }
  }, [jazzMode]);

  // Smart chip gains
  useEffect(() => {
    for (let i = 0; i < smartChipsActive.length; i++) {
      if (smartChipGainsRef.current[i])
        smartChipGainsRef.current[i].gain.value = smartChipsActive[i]
          ? 1.0
          : 0.3;
    }
    if (smartChipGainsRef.current.length > 0) logCommanderAction("CHIP TOGGLE");
  }, [smartChipsActive, logCommanderAction]);

  // Processor gain + FPGA wave shaper
  useEffect(() => {
    if (processorGainRef.current) processorGainRef.current.gain.value = 1.0;
    if (fpgaWaveShaperRef.current)
      fpgaWaveShaperRef.current.curve = processorOn
        ? makeSoftSatCurve(50)
        : null;
    logCommanderAction(processorOn ? "PROCESSOR ON" : "PROCESSOR OFF");
  }, [processorOn, logCommanderAction]);

  // Generator bass filter
  useEffect(() => {
    if (generatorBassFilterRef.current)
      generatorBassFilterRef.current.gain.value = generatorBassActive ? 2 : 0;
    logCommanderAction(generatorBassActive ? "BASS GEN ON" : "BASS GEN OFF");
  }, [generatorBassActive, logCommanderAction]);

  // Generator highs filter
  useEffect(() => {
    if (generatorHighsFilterRef.current)
      generatorHighsFilterRef.current.gain.value = generatorHighsActive ? 2 : 0;
    logCommanderAction(generatorHighsActive ? "HIGHS GEN ON" : "HIGHS GEN OFF");
  }, [generatorHighsActive, logCommanderAction]);

  // Healing chip filters
  useEffect(() => {
    for (const f of healingChipFiltersRef.current) {
      if (f) f.gain.value = healingActive ? 0.5 : 0;
    }
    logCommanderAction(healingActive ? "HEALING ON" : "HEALING OFF");
  }, [healingActive, logCommanderAction]);

  // Freeze delay
  useEffect(() => {
    if (freezeDelayRef.current)
      freezeDelayRef.current.delayTime.value = freezingActive ? 0.02 : 0.001;
    logCommanderAction(freezingActive ? "FREEZE ON" : "FREEZE OFF");
  }, [freezingActive, logCommanderAction]);

  // Commander auto-response: only log when defense state CHANGES (not every frame)
  useEffect(() => {
    const titanium = titaniumCompressorRef.current;
    if (!titanium) return;
    const isActive = distortionLevel > 30;
    if (isActive) {
      titanium.threshold.value = -2;
      titanium.ratio.value = 3.0;
    } else {
      titanium.threshold.value = -3;
      titanium.ratio.value = 2.5;
    }
    if (isActive !== defenseActiveRef.current) {
      defenseActiveRef.current = isActive;
      if (isActive) logCommanderAction(`DEFENSE ACTIVE ${distortionLevel}%`);
      else logCommanderAction("DEFENSE CLEAR");
    }
  }, [distortionLevel, logCommanderAction]);

  // Compressor toggle now controls whether Guardian is in full harmonic restore mode
  useEffect(() => {
    const guardian = guardianWaveShaperRef.current;
    if (!guardian) return;
    guardian.curve = compressorOn ? makeGuardianCurve() : null;
    logCommanderAction(compressorOn ? "GUARDIAN ON" : "GUARDIAN OFF");
  }, [compressorOn, logCommanderAction]);

  // Jazz mode also shifts generator filter frequencies
  useEffect(() => {
    if (generatorBassFilterRef.current)
      generatorBassFilterRef.current.frequency.value = jazzMode ? 200 : 80;
    if (generatorHighsFilterRef.current)
      generatorHighsFilterRef.current.frequency.value = jazzMode ? 12000 : 8000;
  }, [jazzMode]);

  // ── Auto Frequency Generator — analyzes song, auto-adjusts filters ──────
  useEffect(() => {
    if (!playing) return;
    const analyser = autoFreqAnalyserRef.current;
    if (!analyser) return;
    const bufLen = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufLen);
    const sampleRate = autoFreqAnalyserRef.current ? 44100 : 44100;

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray);
      // Frequency bins map: each bin = sampleRate / fftSize Hz
      // fftSize=2048, so binHz ≈ 21.5Hz at 44100
      const binHz = sampleRate / 2048;
      const lowEnd = Math.floor(200 / binHz); // 0-200Hz
      const midStart = Math.floor(200 / binHz);
      const midEnd = Math.floor(2000 / binHz);
      const highStart = Math.floor(2000 / binHz);
      const highEnd = Math.min(bufLen - 1, Math.floor(16000 / binHz));

      let lowSum = 0;
      let midSum = 0;
      let highSum = 0;
      for (let i = 0; i < lowEnd; i++) lowSum += dataArray[i];
      for (let i = midStart; i < midEnd; i++) midSum += dataArray[i];
      for (let i = highStart; i < highEnd; i++) highSum += dataArray[i];

      const lowAvg = lowEnd > 0 ? lowSum / lowEnd : 0;
      const midAvg = midEnd - midStart > 0 ? midSum / (midEnd - midStart) : 0;
      const highAvg =
        highEnd - highStart > 0 ? highSum / (highEnd - highStart) : 0;
      const total = lowAvg + midAvg + highAvg || 1;

      // 8-bar spectrum visualization
      const barBins = Math.floor(bufLen / 8);
      const bars = Array.from({ length: 8 }, (_, b) => {
        let s = 0;
        for (let i = b * barBins; i < (b + 1) * barBins && i < bufLen; i++)
          s += dataArray[i];
        return Math.round((s / barBins / 255) * 100);
      });
      setAutoFreqBars(bars);

      const lowPct = lowAvg / total;
      const midPct = midAvg / total;
      const highPct = highAvg / total;

      let profile = "BALANCED";
      if (lowPct > 0.45) profile = "BASS HEAVY";
      else if (highPct > 0.45) profile = "BRIGHT/AIRY";
      else if (midPct > 0.45) profile = "MIDRANGE FOCUSED";

      if (profile !== autoFreqProfileRef.current) {
        autoFreqProfileRef.current = profile;
        setAutoFreqProfile(profile);
        // Auto-adjust engine filters smoothly
        const engFilters = engineFiltersRef.current;
        const eqNodes = eqNodesRef.current;
        const now =
          (autoFreqAnalyserRef.current as any)?._ctx?.currentTime ?? 0;
        if (engFilters.length >= 4 && profile === "BASS HEAVY") {
          engFilters[0].frequency.setTargetAtTime(80, now, 0.1);
          if (eqNodes[0]) eqNodes[0].gain.setTargetAtTime(2, now, 0.1);
          if (eqNodes[1]) eqNodes[1].gain.setTargetAtTime(1.5, now, 0.1);
        } else if (engFilters.length >= 4 && profile === "MIDRANGE FOCUSED") {
          engFilters[1].frequency.setTargetAtTime(400, now, 0.1);
          engFilters[2].frequency.setTargetAtTime(1500, now, 0.1);
        } else if (engFilters.length >= 4 && profile === "BRIGHT/AIRY") {
          engFilters[3].frequency.setTargetAtTime(8000, now, 0.1);
          if (eqNodes[7]) eqNodes[7].gain.setTargetAtTime(1.5, now, 0.1);
          if (eqNodes[8]) eqNodes[8].gain.setTargetAtTime(1.5, now, 0.1);
          if (eqNodes[9]) eqNodes[9].gain.setTargetAtTime(1.0, now, 0.1);
        } else if (engFilters.length >= 4) {
          // Restore defaults
          const defaultFreqs = [200, 500, 3000, 6000];
          engFilters.forEach((f, i) =>
            f.frequency.setTargetAtTime(defaultFreqs[i], now, 0.1),
          );
        }
      }
    };

    const interval = setInterval(analyze, 500);
    return () => clearInterval(interval);
  }, [playing]);

  // ── Battery drain/charge ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryPct((prev) => {
        if (charging) return Math.min(100, prev + 1.5);
        if (playing) return Math.max(0, prev - 0.3);
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [charging, playing]);

  useEffect(() => {
    if (batteryPct <= 0 && playing) {
      audioRef.current?.pause();
      setPlaying(false);
      toast.error("Battery depleted — charge to continue");
    }
  }, [batteryPct, playing]);

  useEffect(() => {
    localStorage.setItem("powersound_battery", String(batteryPct));
    localStorage.setItem("powersound_charging", String(charging));
  }, [batteryPct, charging]);

  // ── Event handlers ───────────────────────────────────────────────────────
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (audioFile) URL.revokeObjectURL(audioFile);
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      setAudioFileName(file.name);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        initAudioChain();
        if (audioCtxRef.current?.state === "suspended")
          audioCtxRef.current.resume();
        audioRef.current
          .play()
          .then(() => setPlaying(true))
          .catch(() => {});
      }
      toast.success(`Loaded: ${file.name}`);
    },
    [audioFile, initAudioChain],
  );

  useEffect(() => {
    return () => {
      if (audioFile) URL.revokeObjectURL(audioFile);
    };
  }, [audioFile]);

  const handleSavePreset = useCallback(async () => {
    if (!presetName.trim()) {
      toast.error("Enter a preset name");
      return;
    }
    try {
      await createPreset.mutateAsync({
        id: Date.now().toString(),
        name: presetName.trim(),
        engineLevel1: BigInt(engineLevels[0]),
        engineLevel2: BigInt(engineLevels[1]),
        engineLevel3: BigInt(engineLevels[2]),
        engineLevel4: BigInt(engineLevels[3]),
        equalizerBands: eqBands.map((b) => BigInt(b)),
        volumeBooster: BigInt(volumeBooster),
        bassBooster: BigInt(bass80Hz),
        virtualSimulation: false,
        loudMode,
      });
      toast.success(`Preset "${presetName}" saved`);
      setPresetName("");
    } catch {
      toast.error("Failed to save preset");
    }
  }, [
    presetName,
    engineLevels,
    eqBands,
    volumeBooster,
    bass80Hz,
    loudMode,
    createPreset,
  ]);

  const handleLoadPreset = useCallback(
    (id: string) => {
      setSelectedPreset(id);
      const preset = presets.find((p: any) => p.name === id);
      if (!preset) return;
      setEngineLevels([
        Number(preset.engineLevel1),
        Number(preset.engineLevel2),
        Number(preset.engineLevel3),
        Number(preset.engineLevel4),
      ]);
      setEqBands(preset.equalizerBands.map((b: bigint) => Number(b)));
      setVolumeBooster(Number(preset.volumeBooster));
      setBass80Hz(Number(preset.bassBooster));
      setLoudMode(preset.loudMode);
      toast.success(`Loaded "${preset.name}"`);
    },
    [presets],
  );

  const cycleRepeat = () =>
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));

  const handlePlayPause = () => {
    if (!audioFile) {
      toast.error("Load a music file first");
      return;
    }
    if (batteryPct <= 0) {
      toast.error("Battery dead — charge first");
      return;
    }
    if (!audioRef.current) return;
    initAudioChain();
    if (audioCtxRef.current?.state === "suspended")
      audioCtxRef.current.resume();
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const engineNames = [
    "DEEP BASS · 80Hz",
    "MID BASS · 250Hz",
    "MIDRANGE · 2kHz",
    "AIR/HIGHS · 8kHz",
  ];
  const engineColors = [
    "oklch(0.72 0.28 196)",
    "oklch(0.72 0.28 212)",
    "oklch(0.74 0.26 148)",
    "oklch(0.80 0.22 75)",
  ];

  return (
    <>
      <audio ref={audioRef} onEnded={() => setPlaying(false)}>
        <track kind="captions" />
      </audio>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <AnimatePresence>
        {!bookOpen && <BookCover onOpen={() => setBookOpen(true)} />}
      </AnimatePresence>

      <div
        className="flex flex-col min-h-screen"
        style={{
          background: "oklch(0.07 0.014 242)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {/* Commander master control overlay */}
        {!commanderOn && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "oklch(0.04 0.01 242 / 0.7)",
              zIndex: 40,
              pointerEvents: "none",
              backdropFilter: "brightness(0.4) saturate(0.3)",
            }}
          />
        )}
        {/* AWARD BANNER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={bookOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="px-4 py-2 text-center flex-shrink-0"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.12 0.06 75) 0%, oklch(0.16 0.09 75) 50%, oklch(0.12 0.06 75) 100%)",
            borderBottom: "1px solid oklch(0.50 0.20 75)",
            boxShadow: "0 0 24px oklch(0.72 0.28 75 / 0.25)",
          }}
        >
          <p
            className="font-mono text-[10px] tracking-[0.2em]"
            style={{ color: "oklch(0.88 0.26 75)" }}
          >
            🏆 AWARD WINNING NUMBER 1 · GERRED PHILLIPS — ENGINEER / PRODUCT
            DESIGNER · BUILT: FEBRUARY 27, 2027
          </p>
        </motion.div>

        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={bookOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between px-4 py-2 flex-shrink-0"
          style={{
            borderBottom: "1px solid oklch(0.22 0.06 212)",
            background: "oklch(0.08 0.016 242)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "oklch(0.10 0.06 212)",
                border: "1px solid oklch(0.55 0.22 212)",
                boxShadow: "0 0 16px oklch(0.72 0.28 212 / 0.5)",
              }}
            >
              <Volume2
                className="w-4 h-4"
                style={{ color: "oklch(0.82 0.28 212)" }}
              />
            </div>
            <div>
              <h1
                className="font-display font-black text-base leading-none"
                style={{
                  color: "oklch(0.88 0.28 196)",
                  letterSpacing: "0.12em",
                  textShadow: "0 0 20px oklch(0.72 0.28 196 / 0.7)",
                }}
              >
                POWERSOUND PRO
              </h1>
              <p
                className="font-mono text-[8px] tracking-[0.4em]"
                style={{ color: "oklch(0.40 0.08 212)" }}
              >
                v9.0 · POWER CORE 334 · SUPER BLU RAY
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Commander Memory */}
            <div className="hidden sm:flex flex-col items-end">
              <span
                className="font-mono text-[7px] tracking-wider"
                style={{ color: "oklch(0.72 0.22 75)" }}
              >
                COMMANDER MEM
              </span>
              <span
                className="font-mono text-[8px] font-bold"
                style={{ color: "oklch(0.82 0.26 75)" }}
              >
                {commanderMemory.toLocaleString()} CMDS
              </span>
            </div>
            <div
              className="hidden sm:block w-px h-6"
              style={{ background: "oklch(0.22 0.06 212)" }}
            />
            <div className="flex items-center gap-1.5">
              <StatusDot on={ampOn} color="148" />
              <span
                className="font-mono text-[9px]"
                style={{
                  color: ampOn
                    ? "oklch(0.74 0.26 148)"
                    : "oklch(0.35 0.04 242)",
                }}
              >
                {ampOn ? "AMP ON" : "AMP OFF"}
              </span>
            </div>
            <div
              className="w-px h-6"
              style={{ background: "oklch(0.22 0.06 212)" }}
            />
            {/* Preset save/load */}
            <div className="flex items-center gap-1">
              <input
                data-ocid="preset.input"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="PRESET NAME"
                className="font-mono text-[9px] px-2 py-1 rounded w-24 md:w-32"
                style={{
                  background: "oklch(0.10 0.03 242)",
                  border: "1px solid oklch(0.25 0.06 212)",
                  color: "oklch(0.72 0.20 212)",
                }}
              />
              <Button
                data-ocid="preset.save_button"
                size="sm"
                onClick={handleSavePreset}
                className="h-7 px-2 font-mono text-[9px] tracking-wider"
                style={{
                  background: "oklch(0.12 0.05 212)",
                  border: "1px solid oklch(0.40 0.16 212)",
                  color: "oklch(0.72 0.28 212)",
                }}
              >
                <Save className="w-3 h-3 mr-1" />
                {createPreset.isPending ? "..." : "SAVE"}
              </Button>
              {presets.length > 0 && (
                <Select value={selectedPreset} onValueChange={handleLoadPreset}>
                  <SelectTrigger
                    data-ocid="preset.select"
                    className="h-7 w-28 font-mono text-[9px]"
                    style={{
                      background: "oklch(0.10 0.03 242)",
                      border: "1px solid oklch(0.25 0.06 212)",
                      color: "oklch(0.55 0.14 212)",
                    }}
                  >
                    <SelectValue placeholder="LOAD" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((p: any) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </motion.header>

        {/* Mobile panel tabs */}
        <div
          className="md:hidden flex"
          style={{ borderBottom: "1px solid oklch(0.28 0.08 212)" }}
        >
          <button
            type="button"
            data-ocid="nav.tab.1"
            onClick={() => setMobilePanel("left")}
            className="flex-1 py-2 font-mono text-[11px] tracking-wider transition-all"
            style={{
              color:
                mobilePanel === "left"
                  ? "oklch(0.78 0.28 196)"
                  : "oklch(0.45 0.02 220)",
              background:
                mobilePanel === "left" ? "oklch(0.12 0.04 212)" : "transparent",
            }}
          >
            ◄ ENGINES
          </button>
          <button
            type="button"
            data-ocid="nav.tab.2"
            onClick={() => setMobilePanel("right")}
            className="flex-1 py-2 font-mono text-[11px] tracking-wider transition-all"
            style={{
              color:
                mobilePanel === "right"
                  ? "oklch(0.78 0.28 196)"
                  : "oklch(0.45 0.02 220)",
              background:
                mobilePanel === "right"
                  ? "oklch(0.12 0.04 212)"
                  : "transparent",
            }}
          >
            EQ / SYSTEM ►
          </button>
        </div>

        {/* MAIN PANELS */}
        <main className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* ═══ LEFT PANEL ═════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, rotateY: -20, x: -30 }}
            animate={
              bookOpen
                ? { opacity: 1, rotateY: 0, x: 0 }
                : { opacity: 0, rotateY: -20, x: -30 }
            }
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
            style={{ transformOrigin: "right center", perspective: 1400 }}
            className={`${mobilePanel === "left" ? "flex" : "hidden"} md:flex flex-col w-full md:w-1/2 overflow-y-auto`}
            data-ocid="engines.panel"
          >
            <div className="p-4 flex flex-col gap-3">
              {/* PLAYBACK */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={
                  bookOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }
                }
                transition={{ delay: 0.2 }}
                className="rounded p-3 flex flex-col gap-2"
                style={{
                  background: "oklch(0.10 0.014 242)",
                  border: "1px solid oklch(0.35 0.14 212)",
                  boxShadow: "0 0 18px oklch(0.72 0.28 212 / 0.08)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-neon-blue">
                    PLAYBACK
                  </span>
                  <div className="flex items-center gap-1">
                    <StatusDot on={playing} color="148" />
                    <span
                      className="font-mono text-[9px]"
                      style={{
                        color: playing
                          ? "oklch(0.74 0.26 148)"
                          : "oklch(0.35 0.04 242)",
                      }}
                    >
                      {playing ? "PLAYING" : "STOPPED"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShuffle((v) => !v)}
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{
                      color: shuffle
                        ? "oklch(0.72 0.28 212)"
                        : "oklch(0.35 0.04 242)",
                      background: shuffle
                        ? "oklch(0.13 0.06 212)"
                        : "transparent",
                    }}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ color: "oklch(0.60 0.14 212)" }}
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    data-ocid="playback.toggle"
                    onClick={handlePlayPause}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: playing
                        ? "oklch(0.11 0.06 212)"
                        : "oklch(0.13 0.06 212)",
                      border: `2px solid ${playing ? "oklch(0.74 0.26 148)" : "oklch(0.50 0.18 212)"}`,
                      boxShadow: playing
                        ? "0 0 20px oklch(0.74 0.26 148 / 0.6)"
                        : "0 0 14px oklch(0.72 0.28 212 / 0.4)",
                    }}
                  >
                    {playing ? (
                      <Pause
                        className="w-5 h-5"
                        style={{ color: "oklch(0.74 0.26 148)" }}
                      />
                    ) : (
                      <Play
                        className="w-5 h-5"
                        style={{ color: "oklch(0.78 0.28 212)" }}
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ color: "oklch(0.60 0.14 212)" }}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cycleRepeat}
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{
                      color:
                        repeatMode !== "off"
                          ? "oklch(0.72 0.28 212)"
                          : "oklch(0.35 0.04 242)",
                      background:
                        repeatMode !== "off"
                          ? "oklch(0.13 0.06 212)"
                          : "transparent",
                    }}
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="w-4 h-4" />
                    ) : (
                      <Repeat className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div
                  className="font-mono text-[10px] text-center truncate"
                  style={{ color: "oklch(0.55 0.12 212)" }}
                >
                  {audioFileName}
                </div>
                <VUMeter active={playing} level={playing ? 70 : 0} />
              </motion.div>

              {/* BATTERY + POWER CORE 334 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={
                  bookOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                }
                transition={{ delay: 0.25 }}
                className="rounded p-3"
                style={{
                  background: "oklch(0.10 0.014 242)",
                  border: "1px solid oklch(0.35 0.14 212)",
                }}
              >
                <SectionLabel>◈ POWER CORE 334 · BATTERY</SectionLabel>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <BatteryDisplay
                    percentage={batteryPct}
                    charging={charging}
                    onToggleCharging={() => setCharging((v) => !v)}
                  />
                  <div className="flex flex-col gap-1.5">
                    <div
                      className="rounded p-2"
                      style={{
                        background: "oklch(0.09 0.01 242)",
                        border: "1px solid oklch(0.22 0.06 212)",
                      }}
                    >
                      <div
                        className="font-mono text-[7px] mb-1"
                        style={{ color: "oklch(0.38 0.04 242)" }}
                      >
                        POWER CORE 334
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <div
                            className="font-mono text-[7px]"
                            style={{ color: "oklch(0.38 0.04 242)" }}
                          >
                            AMP
                          </div>
                          <div
                            className="font-mono text-[10px] font-bold"
                            style={{ color: "oklch(0.72 0.26 148)" }}
                          >
                            5000
                          </div>
                        </div>
                        <div>
                          <div
                            className="font-mono text-[7px]"
                            style={{ color: "oklch(0.38 0.04 242)" }}
                          >
                            APP
                          </div>
                          <div
                            className="font-mono text-[10px] font-bold"
                            style={{ color: "oklch(0.72 0.28 212)" }}
                          >
                            5000
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-ocid="battery.toggle"
                      onClick={() => setCharging((v) => !v)}
                      className="py-1.5 rounded font-mono text-[9px] tracking-wider transition-all"
                      style={{
                        background: charging
                          ? "oklch(0.11 0.06 148)"
                          : "oklch(0.09 0.01 242)",
                        border: `1px solid ${charging ? "oklch(0.55 0.22 148)" : "oklch(0.22 0.04 242)"}`,
                        color: charging
                          ? "oklch(0.80 0.24 148)"
                          : "oklch(0.45 0.06 242)",
                        boxShadow: charging
                          ? "0 0 12px oklch(0.74 0.26 148 / 0.4)"
                          : "none",
                      }}
                    >
                      {charging ? "⚡ CHARGING" : "CHARGE"}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* STABILIZER 800,000,000 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={
                  bookOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                }
                transition={{ delay: 0.27 }}
                className="rounded p-3"
                style={{
                  background: "oklch(0.10 0.014 242)",
                  border: "1px solid oklch(0.40 0.16 196)",
                  boxShadow: "0 0 14px oklch(0.72 0.28 196 / 0.1)",
                }}
              >
                <SectionLabel>◈ STABILIZER 1,600,000,000 TITANIUM</SectionLabel>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div
                    className="rounded p-2"
                    style={{
                      background: "oklch(0.09 0.01 242)",
                      border: "1px solid oklch(0.22 0.06 196)",
                    }}
                  >
                    <div
                      className="font-mono text-[7px] mb-1"
                      style={{ color: "oklch(0.38 0.04 242)" }}
                    >
                      STAGE 1
                    </div>
                    <div
                      className="font-mono text-[11px] font-bold"
                      style={{ color: "oklch(0.78 0.28 196)" }}
                    >
                      800,000,000
                    </div>
                    <div
                      className="font-mono text-[7px]"
                      style={{ color: "oklch(0.38 0.06 196)" }}
                    >
                      GENTLE CORRECTION
                    </div>
                  </div>
                  <div
                    className="rounded p-2"
                    style={{
                      background: "oklch(0.09 0.01 242)",
                      border: "1px solid oklch(0.30 0.12 40)",
                      boxShadow: "0 0 8px oklch(0.72 0.28 40 / 0.2)",
                    }}
                  >
                    <div
                      className="font-mono text-[7px] mb-1"
                      style={{ color: "oklch(0.38 0.04 242)" }}
                    >
                      STAGE 2 TITANIUM
                    </div>
                    <div
                      className="font-mono text-[11px] font-bold"
                      style={{ color: "oklch(0.82 0.24 40)" }}
                    >
                      800,000,000
                    </div>
                    <div
                      className="font-mono text-[7px]"
                      style={{ color: "oklch(0.55 0.14 40)" }}
                    >
                      TITANIUM STRENGTH
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {[
                    { label: "SMART CHIP", on: true, color: "148" },
                    { label: "COMMANDER", on: true, color: "212" },
                    { label: "NO LIMIT", on: true, color: "75" },
                    { label: "TITANIUM LOCK", on: true, color: "40" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded p-1.5 flex items-center gap-1"
                      style={{
                        background: "oklch(0.09 0.01 242)",
                        border: `1px solid oklch(0.25 0.08 ${item.color})`,
                      }}
                    >
                      <StatusDot on={item.on} color={item.color} />
                      <span
                        className="font-mono text-[7px]"
                        style={{ color: `oklch(0.62 0.18 ${item.color})` }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-2 font-mono text-[8px] text-center"
                  style={{ color: "oklch(0.42 0.10 196)" }}
                >
                  CORRECTS DISTORTION · TITANIUM STRENGTH · NEVER LIMITS
                </div>
              </motion.div>

              {/* ANTI-DISTORTION DEFENSE TEAM */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={
                  bookOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                }
                transition={{ delay: 0.285 }}
                className="rounded p-3"
                style={{
                  background: commanderOn
                    ? distortionLevel > 20
                      ? "oklch(0.10 0.04 148)"
                      : "oklch(0.10 0.02 148)"
                    : "oklch(0.10 0.014 242)",
                  border: commanderOn
                    ? `1px solid ${distortionLevel > 20 ? "oklch(0.65 0.26 148)" : "oklch(0.45 0.18 148)"}`
                    : "1px solid oklch(0.35 0.14 148)",
                  boxShadow: commanderOn
                    ? distortionLevel > 20
                      ? "0 0 22px oklch(0.72 0.28 148 / 0.5)"
                      : "0 0 14px oklch(0.55 0.20 148 / 0.25)"
                    : "0 0 10px oklch(0.55 0.20 148 / 0.1)",
                  transition: "all 0.3s ease",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>⚔ ANTI-DISTORTION DEFENSE TEAM</SectionLabel>
                  <div className="flex items-center gap-2">
                    {distortionLevel > 20 && (
                      <span
                        className="font-mono text-[8px] font-bold px-2 py-0.5 rounded"
                        style={{
                          background: "oklch(0.55 0.22 148)",
                          color: "oklch(0.98 0.01 0)",
                          animation: "pulse 1s infinite",
                        }}
                      >
                        DEFENSE ACTIVE
                      </span>
                    )}
                    {commanderOn && (
                      <span
                        className="font-mono text-[7px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: "oklch(0.12 0.06 148)",
                          color: "oklch(0.75 0.24 148)",
                          border: "1px solid oklch(0.45 0.18 148)",
                        }}
                      >
                        ⚡ CMD
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    {
                      name: "SIGNAL GUARDIAN",
                      role: "PRE-CORRECTION",
                      color: "148",
                      hue: "148",
                    },
                    {
                      name: "COMMANDER",
                      role: "READS & WRITES MEMORY",
                      color: "212",
                      hue: "212",
                    },
                    {
                      name: "STABILIZER 1,600,000,000",
                      role: "FULL TITANIUM POWER",
                      color: "196",
                      hue: "196",
                    },
                    {
                      name: "MONITOR",
                      role: "WATCHES & REPORTS BACK",
                      color: "75",
                      hue: "75",
                    },
                  ].map((unit) => (
                    <div
                      key={unit.name}
                      className="rounded p-1.5 flex items-center gap-2"
                      style={{
                        background: "oklch(0.08 0.01 242)",
                        border: `1px solid oklch(0.22 0.06 ${unit.hue})`,
                      }}
                    >
                      <StatusDot on={true} color={unit.color} />
                      <div className="flex-1">
                        <div
                          className="font-mono text-[9px] font-bold"
                          style={{ color: `oklch(0.75 0.22 ${unit.hue})` }}
                        >
                          {unit.name}
                        </div>
                        <div
                          className="font-mono text-[7px]"
                          style={{ color: `oklch(0.42 0.08 ${unit.hue})` }}
                        >
                          {unit.role}
                        </div>
                      </div>
                      <div
                        className="font-mono text-[7px] px-1.5 py-0.5 rounded"
                        style={{
                          background: `oklch(0.14 0.06 ${unit.hue})`,
                          color: `oklch(0.65 0.18 ${unit.hue})`,
                          border: `1px solid oklch(0.25 0.08 ${unit.hue})`,
                        }}
                      >
                        ON
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-2 font-mono text-[8px] text-center font-bold"
                  style={{
                    color:
                      distortionLevel > 20
                        ? "oklch(0.78 0.26 148)"
                        : "oklch(0.55 0.16 148)",
                  }}
                >
                  ALL 4 UNITS WORKING TOGETHER AGAINST DISTORTION
                </div>
              </motion.div>

              {/* DISTORTION MONITOR */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={
                  bookOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                }
                transition={{ delay: 0.29 }}
                className="rounded p-3"
                style={{
                  background: "oklch(0.10 0.014 242)",
                  border: `1px solid ${distortionLevel > 20 ? "oklch(0.60 0.22 148)" : "oklch(0.30 0.08 212)"}`,
                  boxShadow:
                    distortionLevel > 20
                      ? "0 0 14px oklch(0.65 0.25 148 / 0.3)"
                      : "none",
                }}
              >
                <SectionLabel>◈ DISTORTION MONITOR</SectionLabel>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Activity
                      className="w-4 h-4"
                      style={{
                        color:
                          distortionLevel > 20
                            ? "oklch(0.72 0.28 148)"
                            : "oklch(0.55 0.16 212)",
                      }}
                    />
                    <span
                      className="font-mono text-[11px] font-bold"
                      style={{
                        color:
                          distortionLevel > 20
                            ? "oklch(0.78 0.26 148)"
                            : "oklch(0.74 0.26 148)",
                      }}
                    >
                      {distortionLevel === 0
                        ? "ZERO — TEAM HOLDING ✓"
                        : `${distortionLevel}%`}
                    </span>
                  </div>
                  <div
                    className="font-mono text-[9px]"
                    style={{
                      color:
                        distortionLevel > 20
                          ? "oklch(0.72 0.24 148)"
                          : "oklch(0.55 0.14 212)",
                    }}
                  >
                    {distortionLevel === 0
                      ? "ZERO — TEAM HOLDING ✓"
                      : "DEFENSE TEAM CORRECTING"}
                  </div>
                </div>
                <div
                  className="mt-2 h-2 rounded-full overflow-hidden"
                  style={{ background: "oklch(0.12 0.02 242)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, distortionLevel)}%`,
                      background:
                        distortionLevel > 50
                          ? "oklch(0.65 0.25 148)"
                          : distortionLevel > 20
                            ? "oklch(0.72 0.26 75)"
                            : "oklch(0.74 0.26 148)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span
                    className="font-mono text-[7px]"
                    style={{ color: "oklch(0.32 0.04 242)" }}
                  >
                    MONITOR SIGNAL: 800,000,000
                  </span>
                  <span
                    className="font-mono text-[7px]"
                    style={{ color: "oklch(0.32 0.04 242)" }}
                  >
                    STRAIGHT TO STABILIZER
                  </span>
                </div>
              </motion.div>

              {/* SOUND ENGINES — STATUS PANELS (signal processors, no gain) */}
              <SectionLabel>◈ SOUND ENGINES · A+B+C+D CLASS</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {engineNames.map((name, i) => {
                  const filterTypes = [
                    "LOWPASS",
                    "BANDPASS",
                    "BANDPASS",
                    "HIGHPASS",
                  ];
                  const freqLabels = ["80Hz", "250Hz", "2kHz", "8kHz"];
                  const classLabels = [
                    "CLASS A",
                    "CLASS B",
                    "CLASS C",
                    "CLASS D",
                  ];
                  return (
                    <motion.div
                      key={name}
                      data-ocid={`engine.panel.${i + 1}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={
                        bookOpen
                          ? { opacity: 1, scale: 1 }
                          : { opacity: 0, scale: 0.95 }
                      }
                      transition={{ delay: 0.35 + i * 0.07 }}
                      className="rounded p-2.5"
                      style={{
                        background: engineActive[i]
                          ? "oklch(0.10 0.018 242)"
                          : "oklch(0.07 0.008 242)",
                        border: `1px solid ${engineActive[i] ? engineColors[i] : "oklch(0.18 0.04 242)"}`,
                        boxShadow: engineActive[i]
                          ? `0 0 12px ${engineColors[i]}22`
                          : "none",
                      }}
                    >
                      {/* Status row */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: engineActive[i]
                                ? engineColors[i]
                                : "oklch(0.22 0.04 242)",
                              boxShadow: engineActive[i]
                                ? `0 0 6px ${engineColors[i]}`
                                : "none",
                              animation:
                                engineActive[i] && playing
                                  ? "pulse 1.5s infinite"
                                  : "none",
                            }}
                          />
                          <span
                            className="font-mono text-[8px] tracking-[0.2em]"
                            style={{ color: engineColors[i] }}
                          >
                            ENG {i + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          data-ocid={`engine.toggle.${i + 1}`}
                          onClick={() =>
                            setEngineActive((prev) =>
                              prev.map((v, j) => (j === i ? !v : v)),
                            )
                          }
                          className="font-mono text-[7px] px-1.5 py-0.5 rounded transition-all"
                          style={{
                            background: engineActive[i]
                              ? `oklch(0.12 0.05 ${[196, 212, 148, 75][i]})`
                              : "oklch(0.08 0.01 242)",
                            border: `1px solid ${engineActive[i] ? engineColors[i] : "oklch(0.18 0.04 242)"}`,
                            color: engineActive[i]
                              ? engineColors[i]
                              : "oklch(0.32 0.04 242)",
                          }}
                        >
                          {engineActive[i] ? "ON" : "OFF"}
                        </button>
                      </div>
                      {/* Engine info */}
                      <div className="space-y-0.5 mb-1.5">
                        <div
                          className="font-mono text-[9px] font-bold tracking-wider"
                          style={{ color: engineColors[i] }}
                        >
                          {name}
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className="font-mono text-[7px]"
                            style={{ color: "oklch(0.42 0.08 242)" }}
                          >
                            {filterTypes[i]} · {freqLabels[i]}
                          </span>
                          <span
                            className="font-mono text-[7px]"
                            style={{ color: "oklch(0.55 0.14 212)" }}
                          >
                            {classLabels[i]}
                          </span>
                        </div>
                        <div
                          className="font-mono text-[7px]"
                          style={{ color: "oklch(0.35 0.05 242)" }}
                        >
                          {engineActive[i]
                            ? "SIGNAL ACTIVE · NO GAIN"
                            : "BYPASSED"}
                        </div>
                        <div className="mt-1.5 flex items-center gap-0.5">
                          <div
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background: engineActive[i]
                                ? "oklch(0.35 0.18 148 / 0.40)"
                                : "oklch(0.18 0.02 242)",
                              transition: "background 0.3s",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background: engineActive[i]
                                ? "oklch(0.40 0.18 148 / 0.47)"
                                : "oklch(0.18 0.02 242)",
                              transition: "background 0.3s",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background: engineActive[i]
                                ? "oklch(0.45 0.18 148 / 0.54)"
                                : "oklch(0.18 0.02 242)",
                              transition: "background 0.3s",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background: engineActive[i]
                                ? "oklch(0.50 0.18 148 / 0.61)"
                                : "oklch(0.18 0.02 242)",
                              transition: "background 0.3s",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background: engineActive[i]
                                ? "oklch(0.55 0.18 148 / 0.68)"
                                : "oklch(0.18 0.02 242)",
                              transition: "background 0.3s",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background: engineActive[i]
                                ? "oklch(0.60 0.18 148 / 0.75)"
                                : "oklch(0.18 0.02 242)",
                              transition: "background 0.3s",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background: engineActive[i]
                                ? "oklch(0.65 0.18 148 / 0.82)"
                                : "oklch(0.18 0.02 242)",
                              transition: "background 0.3s",
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "4px",
                              borderRadius: "2px",
                              background: engineActive[i]
                                ? "oklch(0.70 0.18 148 / 0.89)"
                                : "oklch(0.18 0.02 242)",
                              transition: "background 0.3s",
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* LOUDNESS SLIDER */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={
                  bookOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                }
                transition={{ delay: 0.65 }}
                className="rounded p-3"
                style={{
                  background: "oklch(0.10 0.014 242)",
                  border: "1px solid oklch(0.35 0.14 212)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] tracking-[0.3em] text-neon-blue">
                    LOUDNESS · BOOSTER 1700
                  </span>
                  <span
                    className="font-display font-black text-2xl"
                    style={{
                      color: "oklch(0.84 0.26 212)",
                      textShadow: "0 0 14px oklch(0.72 0.28 212 / 0.6)",
                    }}
                  >
                    {volumeBooster}
                  </span>
                </div>
                <input
                  type="range"
                  data-ocid="loudness.slider"
                  min={0}
                  max={1700}
                  value={volumeBooster}
                  onChange={(e) => setVolumeBooster(Number(e.target.value))}
                  className="h-range w-full"
                  style={{ accentColor: "oklch(0.72 0.28 212)" }}
                />
                <div className="flex justify-between mt-1">
                  <span
                    className="font-mono text-[9px]"
                    style={{ color: "oklch(0.35 0.02 242)" }}
                  >
                    LOW
                  </span>
                  <span
                    className="font-mono text-[9px]"
                    style={{ color: "oklch(0.55 0.14 212)" }}
                  >
                    850 = 8.5× GAIN
                  </span>
                  <span
                    className="font-mono text-[9px]"
                    style={{ color: "oklch(0.35 0.02 242)" }}
                  >
                    1700
                  </span>
                </div>
              </motion.div>

              {/* LOUD BOOSTER + CHAIN BLOCK */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={bookOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  type="button"
                  data-ocid="loud.toggle"
                  onClick={() => setLoudMode((v) => !v)}
                  className="w-full py-3 rounded border-2 font-mono text-sm font-black tracking-[0.4em] transition-all"
                  style={{
                    borderColor: loudMode
                      ? "oklch(0.74 0.26 148)"
                      : "oklch(0.22 0.04 242)",
                    background: loudMode
                      ? "oklch(0.11 0.06 148)"
                      : "oklch(0.09 0.01 242)",
                    color: loudMode
                      ? "oklch(0.84 0.24 148)"
                      : "oklch(0.42 0.03 242)",
                    boxShadow: loudMode
                      ? "0 0 24px oklch(0.74 0.26 148 / 0.45), inset 0 0 24px oklch(0.74 0.26 148 / 0.08)"
                      : "none",
                  }}
                >
                  {loudMode
                    ? "◉ LOUD BOOSTER 1700 ACTIVE"
                    : "◎ LOUD BOOSTER 1700 OFF"}
                </button>
                <div
                  className="font-mono text-[8px] text-center mt-1"
                  style={{ color: "oklch(0.38 0.06 212)" }}
                >
                  TITANIUM CLAMP · STRAIGHT FROM STABILIZER 800,000,000
                </div>
                <button
                  type="button"
                  data-ocid="chain.toggle"
                  onClick={() => setChainLinked((v) => !v)}
                  className="w-full mt-1 py-2 rounded border font-mono text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-2"
                  style={{
                    borderColor: chainLinked
                      ? "oklch(0.65 0.22 75)"
                      : "oklch(0.22 0.04 242)",
                    background: chainLinked
                      ? "oklch(0.11 0.05 75)"
                      : "transparent",
                    color: chainLinked
                      ? "oklch(0.80 0.20 75)"
                      : "oklch(0.35 0.03 242)",
                    boxShadow: chainLinked
                      ? "0 0 12px oklch(0.65 0.22 75 / 0.4)"
                      : "none",
                  }}
                >
                  <Link className="w-3.5 h-3.5" />
                  {chainLinked
                    ? "CHAIN BLOCK LINKED · 3× MULTIPLIER"
                    : "CHAIN BLOCK UNLINKED"}
                </button>
              </motion.div>

              {/* 80Hz BASS PROGRAMME */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={
                  bookOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                }
                transition={{ delay: 0.72 }}
                className="rounded p-3"
                style={{
                  background: "oklch(0.10 0.014 242)",
                  border: "1px solid oklch(0.35 0.14 196)",
                }}
              >
                <SectionLabel>◈ 80Hz BASS PROGRAMME</SectionLabel>
                <div className="grid grid-cols-3 gap-1 mt-2 mb-2">
                  {(["regular", "loud", "low"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      data-ocid={`bass.${m}.toggle`}
                      onClick={() => setBassMode(m)}
                      className="py-1 rounded font-mono text-[8px] uppercase tracking-wider transition-all"
                      style={{
                        background:
                          bassMode === m
                            ? "oklch(0.13 0.06 196)"
                            : "oklch(0.08 0.01 242)",
                        border: `1px solid ${bassMode === m ? "oklch(0.50 0.18 196)" : "oklch(0.18 0.04 242)"}`,
                        color:
                          bassMode === m
                            ? "oklch(0.78 0.26 196)"
                            : "oklch(0.38 0.04 242)",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: "oklch(0.65 0.20 196)" }}
                  >
                    BASS DROP AMOUNT
                  </span>
                  <span
                    className="font-display font-black text-xl"
                    style={{
                      color: "oklch(0.78 0.28 196)",
                      textShadow: "0 0 10px oklch(0.78 0.28 196 / 0.5)",
                    }}
                  >
                    {bass80Hz}
                  </span>
                </div>
                <input
                  type="range"
                  data-ocid="bass.slider"
                  min={0}
                  max={100}
                  value={bass80Hz}
                  onChange={(e) => setBass80Hz(Number(e.target.value))}
                  className="h-range w-full"
                  style={{ accentColor: "oklch(0.78 0.28 196)" }}
                />
                <div
                  className="mt-2 font-mono text-[8px] text-center"
                  style={{ color: "oklch(0.38 0.08 212)" }}
                >
                  SEPARATED FROM HIGHS · NO AMP GAIN · 80Hz PROGRAMME
                </div>
              </motion.div>

              {/* BASS / HIGHS ROUTING SWITCH */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={
                  bookOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                }
                transition={{ delay: 0.74 }}
                className="rounded p-3"
                style={{
                  background: "oklch(0.10 0.014 242)",
                  border: "1px solid oklch(0.28 0.08 212)",
                }}
              >
                <SectionLabel>◈ BASS / HIGHS ROUTING SWITCH</SectionLabel>
                <div className="grid grid-cols-3 gap-1 mt-2">
                  {(["highs", "both", "bass"] as const).map((mode) => {
                    const labels = {
                      highs: "HIGHS ONLY",
                      both: "BOTH ON",
                      bass: "BASS ONLY",
                    };
                    const active = bassHighsMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        data-ocid={`bassroute.${mode}.toggle`}
                        onClick={() => setBassHighsMode(mode)}
                        className="py-2 rounded font-mono text-[9px] tracking-wider transition-all"
                        style={{
                          background: active
                            ? "oklch(0.13 0.06 212)"
                            : "oklch(0.08 0.01 242)",
                          border: `1px solid ${active ? "oklch(0.50 0.22 212)" : "oklch(0.20 0.04 242)"}`,
                          color: active
                            ? "oklch(0.78 0.28 212)"
                            : "oklch(0.38 0.04 242)",
                          boxShadow: active
                            ? "0 0 8px oklch(0.72 0.28 212 / 0.4)"
                            : "none",
                        }}
                      >
                        {labels[mode]}
                      </button>
                    );
                  })}
                </div>
                <div
                  className="mt-1 font-mono text-[7px] text-center"
                  style={{ color: "oklch(0.32 0.04 242)" }}
                >
                  SWITCH: BASS | BOTH | HIGHS — COMMANDER MEMORY APPLIED
                </div>
              </motion.div>

              {/* COMMANDER MEMORY */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={
                  bookOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                }
                transition={{ delay: 0.76 }}
                className="rounded p-3"
                style={{
                  background: "oklch(0.10 0.014 242)",
                  border: `1px solid ${commanderOn ? "oklch(0.55 0.22 148)" : "oklch(0.40 0.16 75)"}`,
                  boxShadow: commanderOn
                    ? "0 0 20px oklch(0.65 0.26 148 / 0.3)"
                    : "0 0 14px oklch(0.72 0.22 75 / 0.1)",
                  transition: "all 0.3s ease",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>◈ COMMANDER MEMORY</SectionLabel>
                  <button
                    type="button"
                    data-ocid="commander.toggle"
                    onClick={() => setCommanderOn((v) => !v)}
                    className="font-mono text-[8px] px-2 py-0.5 rounded transition-all"
                    style={{
                      background: commanderOn
                        ? "oklch(0.12 0.06 148)"
                        : "oklch(0.09 0.01 242)",
                      border: `1px solid ${commanderOn ? "oklch(0.55 0.22 148)" : "oklch(0.22 0.04 242)"}`,
                      color: commanderOn
                        ? "oklch(0.80 0.26 148)"
                        : "oklch(0.40 0.04 242)",
                      boxShadow: commanderOn
                        ? "0 0 10px oklch(0.72 0.26 148 / 0.4)"
                        : "none",
                    }}
                  >
                    {commanderOn ? "⚡ COMMANDER ON" : "COMMANDER OFF"}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1.5">
                  <div
                    className="flex items-center justify-between rounded px-2 py-1.5"
                    style={{
                      background: "oklch(0.09 0.01 242)",
                      border: `1px solid ${commanderOn ? "oklch(0.40 0.16 148)" : "oklch(0.28 0.10 75)"}`,
                      boxShadow: commanderOn
                        ? "0 0 12px oklch(0.55 0.22 148 / 0.2)"
                        : "none",
                    }}
                  >
                    <span
                      className="font-mono text-[8px]"
                      style={{ color: "oklch(0.55 0.08 242)" }}
                    >
                      COMMANDER MEMORY
                    </span>
                    <span
                      className="font-mono text-[9px] font-bold"
                      style={{
                        color: commanderOn
                          ? "oklch(0.82 0.26 148)"
                          : "oklch(0.82 0.26 75)",
                      }}
                    >
                      {commanderMemory.toLocaleString()} CMDS
                    </span>
                  </div>
                  {commanderLog.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {commanderLog.slice(0, 3).map((entry) => (
                        <div
                          key={entry}
                          className="font-mono text-[7px]"
                          style={{ color: "oklch(0.45 0.10 75)" }}
                        >
                          ▸ {entry}
                        </div>
                      ))}
                    </div>
                  )}
                  {[
                    "WRITES ALL ACTIONS TO MEMORY",
                    "APPLIES WHAT IS WRITTEN",
                    "ZERO NOISE · ZERO TYPE",
                    "COMMANDER STANDS ON EVERYTHING",
                  ].map((line) => (
                    <div key={line} className="flex items-center gap-2 px-1">
                      <StatusDot
                        on={commanderOn}
                        color={commanderOn ? "148" : "75"}
                      />
                      <span
                        className="font-mono text-[8px]"
                        style={{
                          color: commanderOn
                            ? "oklch(0.55 0.22 148)"
                            : "oklch(0.55 0.12 75)",
                        }}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* FILE PICKER */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={bookOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ delay: 0.78 }}
              >
                <div
                  className="font-mono text-[10px] tracking-[0.3em] mb-1.5 text-center"
                  style={{ color: "oklch(0.72 0.28 212)" }}
                >
                  LOAD MUSIC TO PLAY
                </div>
                <button
                  type="button"
                  data-ocid="file.upload_button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded border-2 font-mono text-sm font-bold tracking-[0.25em] transition-all flex items-center justify-center gap-3"
                  style={{
                    borderColor: audioFile
                      ? "oklch(0.72 0.28 212)"
                      : "oklch(0.28 0.06 212)",
                    background: audioFile
                      ? "oklch(0.11 0.06 212)"
                      : "oklch(0.09 0.014 242)",
                    color: audioFile
                      ? "oklch(0.82 0.22 212)"
                      : "oklch(0.60 0.16 212)",
                    boxShadow: audioFile
                      ? "0 0 16px oklch(0.72 0.28 212 / 0.35)"
                      : "none",
                  }}
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>{audioFile ? "CHANGE FILE" : "FILE PICKER"}</span>
                </button>
                {audioFileName !== "NO FILE LOADED" && (
                  <div
                    className="mt-1 px-2 py-1 rounded font-mono text-[10px] truncate"
                    style={{
                      background: "oklch(0.09 0.01 242)",
                      color: "oklch(0.62 0.16 212)",
                      border: "1px solid oklch(0.20 0.04 242)",
                    }}
                  >
                    ▶ {audioFileName}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Book spine */}
          <div className="hidden md:block book-spine flex-shrink-0" />

          {/* ═══ RIGHT PANEL ════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, rotateY: 20, x: 30 }}
            animate={
              bookOpen
                ? { opacity: 1, rotateY: 0, x: 0 }
                : { opacity: 0, rotateY: 20, x: 30 }
            }
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
            style={{ transformOrigin: "left center", perspective: 1400 }}
            className={`${mobilePanel === "right" ? "flex" : "hidden"} md:flex flex-col w-full md:w-1/2 overflow-y-auto`}
            data-ocid="eq.panel"
          >
            <div className="p-4 flex flex-col gap-3">
              {/* Right panel tabs */}
              <div className="flex gap-1">
                {(["eq", "processor", "system"] as const).map((tab) => {
                  const labels = {
                    eq: "EQ · 10 BAND",
                    processor: "PROCESSOR",
                    system: "SYSTEM",
                  };
                  return (
                    <button
                      key={tab}
                      type="button"
                      data-ocid={`right.${tab}.tab`}
                      onClick={() => setRightTab(tab)}
                      className="flex-1 py-2 rounded font-mono text-[9px] tracking-wider transition-all"
                      style={{
                        background:
                          rightTab === tab
                            ? "oklch(0.13 0.06 212)"
                            : "oklch(0.09 0.01 242)",
                        border: `1px solid ${rightTab === tab ? "oklch(0.45 0.18 212)" : "oklch(0.18 0.04 242)"}`,
                        color:
                          rightTab === tab
                            ? "oklch(0.78 0.28 212)"
                            : "oklch(0.38 0.04 242)",
                      }}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* ── EQ TAB ─────────────────────────────────────────────── */}
              {rightTab === "eq" && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded p-3"
                    style={{
                      background: "oklch(0.10 0.014 242)",
                      border: "1px solid oklch(0.35 0.14 212)",
                    }}
                  >
                    <SectionLabel>◈ 10-BAND EQUALIZER</SectionLabel>
                    <div className="grid grid-cols-10 gap-1 mt-3">
                      {eqBands.map((val, i) => (
                        <div
                          key={EQ_BANDS[i]}
                          className="flex flex-col items-center gap-1"
                        >
                          <span
                            className="font-mono text-[8px]"
                            style={{
                              color:
                                val > 0
                                  ? "oklch(0.74 0.26 148)"
                                  : val < 0
                                    ? "oklch(0.72 0.28 148)"
                                    : "oklch(0.35 0.04 242)",
                            }}
                          >
                            {val > 0 ? `+${val}` : val}
                          </span>
                          <input
                            type="range"
                            data-ocid={`eq.input.${i + 1}`}
                            min={-12}
                            max={12}
                            value={val}
                            onChange={(e) =>
                              setEqBands((prev) =>
                                prev.map((v, j) =>
                                  j === i ? Number(e.target.value) : v,
                                ),
                              )
                            }
                            className="h-range"
                            style={{
                              writingMode: "vertical-lr",
                              direction: "rtl",
                              height: 80,
                              width: 14,
                              accentColor:
                                val >= 0
                                  ? "oklch(0.72 0.28 212)"
                                  : "oklch(0.65 0.22 148)",
                            }}
                          />
                          <span
                            className="font-mono text-[7px] text-center"
                            style={{ color: "oklch(0.38 0.04 242)" }}
                          >
                            {EQ_BANDS[i]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      <button
                        type="button"
                        data-ocid="eq.reset_button"
                        onClick={() => setEqBands(DEFAULT_EQ)}
                        className="font-mono text-[8px] px-2 py-0.5 rounded"
                        style={{
                          background: "oklch(0.09 0.01 242)",
                          border: "1px solid oklch(0.22 0.04 242)",
                          color: "oklch(0.45 0.06 242)",
                        }}
                      >
                        RESET
                      </button>
                      <button
                        type="button"
                        data-ocid="jazz.toggle"
                        onClick={() => setJazzMode((v) => !v)}
                        className="font-mono text-[8px] px-2 py-0.5 rounded transition-all"
                        style={{
                          background: jazzMode
                            ? "oklch(0.12 0.06 75)"
                            : "oklch(0.09 0.01 242)",
                          border: `1px solid ${jazzMode ? "oklch(0.55 0.20 75)" : "oklch(0.22 0.04 242)"}`,
                          color: jazzMode
                            ? "oklch(0.80 0.22 75)"
                            : "oklch(0.45 0.06 242)",
                        }}
                      >
                        1 BILLION JAZZ FREQ
                      </button>
                    </div>
                  </motion.div>

                  {/* AUTO FREQUENCY GENERATOR */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="rounded p-3"
                    style={{
                      background: "oklch(0.10 0.014 242)",
                      border: "1px solid oklch(0.35 0.14 212)",
                    }}
                  >
                    <SectionLabel>◈ AUTO FREQUENCY GENERATOR</SectionLabel>
                    {/* Live Status Row */}
                    <div className="flex items-center justify-between mt-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: playing
                              ? "oklch(0.74 0.26 148)"
                              : "oklch(0.28 0.04 242)",
                            boxShadow: playing
                              ? "0 0 8px oklch(0.74 0.26 148)"
                              : "none",
                            animation: playing ? "pulse 1s infinite" : "none",
                          }}
                        />
                        <span
                          className="font-mono text-[9px] font-bold"
                          style={{
                            color: playing
                              ? "oklch(0.80 0.24 148)"
                              : "oklch(0.38 0.04 242)",
                          }}
                        >
                          {playing ? "GENERATOR ACTIVE" : "GENERATOR STANDBY"}
                        </span>
                      </div>
                      <span
                        className="font-mono text-[8px] px-2 py-0.5 rounded"
                        style={{
                          background: "oklch(0.12 0.06 212)",
                          border: "1px solid oklch(0.40 0.16 212)",
                          color: "oklch(0.82 0.26 212)",
                        }}
                      >
                        {autoFreqProfile}
                      </span>
                    </div>
                    {/* Spectrum Bars */}
                    <div className="flex items-end gap-0.5 h-8 mb-2">
                      {autoFreqBars.map((bar, bi) => {
                        const barColors = [
                          "196",
                          "196",
                          "212",
                          "212",
                          "148",
                          "148",
                          "75",
                          "75",
                        ];
                        const barKeys = [
                          "b0",
                          "b1",
                          "b2",
                          "b3",
                          "b4",
                          "b5",
                          "b6",
                          "b7",
                        ];
                        return (
                          <div
                            key={barKeys[bi]}
                            className="flex-1 rounded-t transition-all"
                            style={{
                              height: `${Math.max(4, bar)}%`,
                              background: `oklch(0.65 0.20 ${barColors[bi]})`,
                              boxShadow:
                                bar > 40
                                  ? `0 0 4px oklch(0.65 0.20 ${barColors[bi]})`
                                  : "none",
                            }}
                          />
                        );
                      })}
                    </div>
                    {/* Profile info */}
                    <div
                      className="rounded p-2 mb-2"
                      style={{
                        background: "oklch(0.08 0.01 242)",
                        border: "1px solid oklch(0.22 0.06 242)",
                      }}
                    >
                      <div
                        className="font-mono text-[7px]"
                        style={{ color: "oklch(0.38 0.04 242)" }}
                      >
                        LAST ADJUSTMENT APPLIED
                      </div>
                      <div
                        className="font-mono text-[8px] mt-0.5"
                        style={{ color: "oklch(0.65 0.16 212)" }}
                      >
                        {autoFreqProfile === "BASS HEAVY" &&
                          "ENG1→80Hz · EQ BND 1-2 +2dB"}
                        {autoFreqProfile === "MIDRANGE FOCUSED" &&
                          "ENG2→400Hz · ENG3→1.5kHz"}
                        {autoFreqProfile === "BRIGHT/AIRY" &&
                          "ENG4→8kHz · EQ BND 8-10 +1.5dB"}
                        {autoFreqProfile === "BALANCED" &&
                          "ALL ENGINES AT DEFAULT FREQ"}
                      </div>
                    </div>
                    {/* Generator toggles */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          label: "BASS GENERATOR",
                          active: generatorBassActive,
                          setActive: setGeneratorBassActive,
                          color: "196",
                        },
                        {
                          label: "HIGHS GENERATOR",
                          active: generatorHighsActive,
                          setActive: setGeneratorHighsActive,
                          color: "75",
                        },
                      ].map((gen) => (
                        <div
                          key={gen.label}
                          className="rounded p-2"
                          style={{
                            background: "oklch(0.09 0.01 242)",
                            border: `1px solid oklch(0.25 0.08 ${gen.color})`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="font-mono text-[7px]"
                              style={{ color: `oklch(0.65 0.18 ${gen.color})` }}
                            >
                              {gen.label}
                            </span>
                            <button
                              type="button"
                              data-ocid={`gen.${gen.label.split(" ")[0].toLowerCase()}.toggle`}
                              onClick={() => gen.setActive((v: boolean) => !v)}
                              className="font-mono text-[7px] px-1.5 py-0.5 rounded transition-all"
                              style={{
                                background: gen.active
                                  ? `oklch(0.12 0.06 ${gen.color})`
                                  : "oklch(0.08 0.01 242)",
                                border: `1px solid oklch(${gen.active ? "0.50" : "0.20"} 0.16 ${gen.color})`,
                                color: `oklch(${gen.active ? "0.78" : "0.38"} 0.20 ${gen.color})`,
                              }}
                            >
                              {gen.active ? "AUTO" : "OFF"}
                            </button>
                          </div>
                          <div
                            className="font-mono text-[7px]"
                            style={{ color: `oklch(0.35 0.04 ${gen.color})` }}
                          >
                            AUTO CONNECTED TO SONG
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="mt-1 font-mono text-[7px] text-center"
                      style={{ color: "oklch(0.32 0.04 242)" }}
                    >
                      INTELLIGENT · 20 SMART CHIPS · BOTH BASS & HIGHS
                    </div>
                  </motion.div>

                  {/* CONTROLLED COMPRESSOR */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="rounded p-3"
                    style={{
                      background: "oklch(0.10 0.014 242)",
                      border: "1px solid oklch(0.30 0.10 280)",
                    }}
                  >
                    <SectionLabel>◈ SIGNAL GUARDIAN — CONTROLLED</SectionLabel>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <div
                          className="font-mono text-[8px]"
                          style={{ color: "oklch(0.55 0.14 280)" }}
                        >
                          DOES NOT LIMIT MUSIC
                        </div>
                        <div
                          className="font-mono text-[7px]"
                          style={{ color: "oklch(0.38 0.06 280)" }}
                        >
                          CORRECTS IT AND MAKES IT ITSELF
                        </div>
                      </div>
                      <button
                        type="button"
                        data-ocid="compressor.toggle"
                        onClick={() => setCompressorOn((v) => !v)}
                        className="px-3 py-1 rounded font-mono text-[9px] tracking-wider transition-all"
                        style={{
                          background: compressorOn
                            ? "oklch(0.12 0.06 148)"
                            : "oklch(0.09 0.01 242)",
                          border: `1px solid ${compressorOn ? "oklch(0.50 0.20 148)" : "oklch(0.20 0.04 242)"}`,
                          color: compressorOn
                            ? "oklch(0.78 0.24 148)"
                            : "oklch(0.38 0.04 242)",
                          boxShadow: compressorOn
                            ? "0 0 10px oklch(0.74 0.26 148 / 0.35)"
                            : "none",
                        }}
                      >
                        {compressorOn ? "ON" : "OFF"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {[
                        { label: "COMMANDER LOGIC", color: "212" },
                        { label: "MEMORY APPLIED", color: "75" },
                        { label: "WITH STABILIZER", color: "148" },
                        { label: "IN COMMANDER", color: "280" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-1 px-1.5 py-1 rounded"
                          style={{
                            background: "oklch(0.08 0.01 242)",
                            border: `1px solid oklch(0.22 0.06 ${item.color})`,
                          }}
                        >
                          <StatusDot on color={item.color} />
                          <span
                            className="font-mono text-[7px]"
                            style={{ color: `oklch(0.55 0.12 ${item.color})` }}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      className="mt-2 font-mono text-[7px] text-center"
                      style={{ color: "oklch(0.32 0.04 242)" }}
                    >
                      WORKS HAND IN HAND WITH STABILIZER · OUT OF SIGHT MONITOR
                      COMMANDER
                    </div>
                  </motion.div>
                </>
              )}

              {/* ── PROCESSOR TAB ──────────────────────────────────────── */}
              {rightTab === "processor" && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded p-3"
                    style={{
                      background: "oklch(0.10 0.014 242)",
                      border: "1px solid oklch(0.35 0.14 212)",
                    }}
                  >
                    <SectionLabel>
                      ◈ PROCESSOR — NUMBER 0 · 20 SMART CHIPS
                    </SectionLabel>
                    <div className="flex items-center justify-between mt-1 mb-2">
                      <div>
                        <div
                          className="font-mono text-[8px]"
                          style={{ color: "oklch(0.65 0.18 212)" }}
                        >
                          DAW/VST · FPGA · CPU BOOSTER · 12V
                        </div>
                        <div
                          className="font-mono text-[8px]"
                          style={{ color: "oklch(0.55 0.14 148)" }}
                        >
                          ZERO STUTTERING · ZERO CLIPPING · 8Hz DROP
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          data-ocid="processor.toggle"
                          onClick={() => setProcessorOn((v) => !v)}
                          className="px-2 py-1 rounded font-mono text-[9px] tracking-wider transition-all"
                          style={{
                            background: processorOn
                              ? "oklch(0.12 0.06 212)"
                              : "oklch(0.09 0.01 242)",
                            border: `1px solid ${processorOn ? "oklch(0.50 0.20 212)" : "oklch(0.20 0.04 242)"}`,
                            color: processorOn
                              ? "oklch(0.78 0.24 212)"
                              : "oklch(0.38 0.04 242)",
                            boxShadow: processorOn
                              ? "0 0 10px oklch(0.72 0.28 212 / 0.35)"
                              : "none",
                          }}
                        >
                          {processorOn ? "ON" : "OFF"}
                        </button>
                        <div
                          className="rounded px-2 py-1"
                          style={{
                            background: "oklch(0.09 0.01 242)",
                            border: "1px solid oklch(0.30 0.12 212)",
                          }}
                        >
                          <div
                            className="font-mono text-[7px]"
                            style={{ color: "oklch(0.38 0.04 242)" }}
                          >
                            PER-CHIP STAB
                          </div>
                          <div
                            className="font-mono text-[8px]"
                            style={{ color: "oklch(0.72 0.22 212)" }}
                          >
                            80K–90K
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {SMART_CHIP_IDS.map((id, i) => (
                        <SmartChipCard
                          key={id}
                          label={id}
                          active={smartChipsActive[i]}
                          onToggle={() => {
                            setSmartChipsActive((prev) => {
                              const next = [...prev];
                              next[i] = !next[i];
                              return next;
                            });
                          }}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-2">
                      {[
                        { label: "CONTROL", color: "148" },
                        { label: "MONITOR", color: "212" },
                        { label: "BOOST", color: "75" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-1 justify-center rounded py-1"
                          style={{
                            background: "oklch(0.08 0.01 242)",
                            border: `1px solid oklch(0.25 0.08 ${item.color})`,
                          }}
                        >
                          <StatusDot on color={item.color} />
                          <span
                            className="font-mono text-[8px]"
                            style={{ color: `oklch(0.65 0.18 ${item.color})` }}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <div
                        className="rounded p-1.5"
                        style={{
                          background: "oklch(0.09 0.01 242)",
                          border: "1px solid oklch(0.22 0.06 212)",
                        }}
                      >
                        <div
                          className="font-mono text-[7px]"
                          style={{ color: "oklch(0.38 0.04 242)" }}
                        >
                          INTELLIGENT AMP
                        </div>
                        <div
                          className="font-mono text-[8px]"
                          style={{ color: "oklch(0.72 0.22 148)" }}
                        >
                          STABILIZER CORRECTED
                        </div>
                      </div>
                      <div
                        className="rounded p-1.5"
                        style={{
                          background: "oklch(0.09 0.01 242)",
                          border: "1px solid oklch(0.22 0.06 212)",
                        }}
                      >
                        <div
                          className="font-mono text-[7px]"
                          style={{ color: "oklch(0.38 0.04 242)" }}
                        >
                          SUPER CLASSES
                        </div>
                        <div
                          className="font-mono text-[8px]"
                          style={{ color: "oklch(0.72 0.22 280)" }}
                        >
                          A/B/C/D ADVANCED
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* 9.0 HEALING / RESTORING / FREEZING */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="rounded p-3"
                    style={{
                      background: "oklch(0.10 0.014 242)",
                      border: "1px solid oklch(0.35 0.14 148)",
                    }}
                  >
                    <SectionLabel>
                      ◈ 9.0 HEALING / RESTORING / FREEZING
                    </SectionLabel>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { label: "HEALING", val: 9.0, color: "148" },
                        { label: "RESTORING", val: 9.0, color: "212" },
                        { label: "FREEZING", val: 9.0, color: "196" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          role={
                            item.label === "FREEZING" ? "button" : undefined
                          }
                          tabIndex={item.label === "FREEZING" ? 0 : undefined}
                          onClick={
                            item.label === "FREEZING"
                              ? () => setFreezingActive((v) => !v)
                              : undefined
                          }
                          onKeyDown={
                            item.label === "FREEZING"
                              ? (e) => {
                                  if (e.key === "Enter" || e.key === " ")
                                    setFreezingActive((v) => !v);
                                }
                              : undefined
                          }
                          data-ocid={
                            item.label === "FREEZING"
                              ? "freeze.toggle"
                              : undefined
                          }
                          className="rounded p-2 flex flex-col items-center transition-all"
                          style={{
                            background:
                              item.label === "FREEZING" && !freezingActive
                                ? "oklch(0.07 0.01 242)"
                                : "oklch(0.09 0.01 242)",
                            border: `1px solid oklch(${item.label === "FREEZING" && !freezingActive ? "0.18 0.04 242" : `0.28 0.10 ${item.color}`})`,
                            cursor:
                              item.label === "FREEZING" ? "pointer" : "default",
                            opacity:
                              item.label === "FREEZING" && !freezingActive
                                ? 0.5
                                : 1,
                          }}
                        >
                          <div
                            className="font-mono text-[7px] mb-1"
                            style={{ color: `oklch(0.45 0.10 ${item.color})` }}
                          >
                            {item.label}
                          </div>
                          <div
                            className="font-display font-black text-2xl"
                            style={{
                              color: `oklch(0.78 0.26 ${item.color})`,
                              textShadow: `0 0 12px oklch(0.72 0.26 ${item.color} / 0.6)`,
                            }}
                          >
                            {item.val}
                          </div>
                          <div
                            className="w-full mt-1.5 h-1 rounded-full"
                            style={{ background: "oklch(0.14 0.04 242)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: "90%",
                                background: `oklch(0.72 0.24 ${item.color})`,
                                boxShadow: `0 0 6px oklch(0.72 0.24 ${item.color} / 0.6)`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <div
                        className="flex items-center gap-1.5 rounded px-2 py-1.5"
                        style={{
                          background: "oklch(0.09 0.01 242)",
                          border: "1px solid oklch(0.20 0.04 242)",
                        }}
                      >
                        <button
                          type="button"
                          data-ocid="healing.toggle"
                          onClick={() => setHealingActive((v) => !v)}
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all"
                          style={{
                            background: healingActive
                              ? "oklch(0.74 0.26 148)"
                              : "oklch(0.22 0.04 242)",
                            boxShadow: healingActive
                              ? "0 0 6px oklch(0.74 0.26 148)"
                              : "none",
                          }}
                        />
                        <span
                          className="font-mono text-[7px]"
                          style={{ color: "oklch(0.50 0.08 242)" }}
                        >
                          MONITORING + SCANNING
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 rounded px-2 py-1.5"
                        style={{
                          background: "oklch(0.09 0.01 242)",
                          border: "1px solid oklch(0.20 0.04 242)",
                        }}
                      >
                        <button
                          type="button"
                          data-ocid="scan.toggle"
                          onClick={() => setScanActive((v) => !v)}
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all"
                          style={{
                            background: scanActive
                              ? "oklch(0.72 0.28 212)"
                              : "oklch(0.22 0.04 242)",
                            boxShadow: scanActive
                              ? "0 0 6px oklch(0.72 0.28 212)"
                              : "none",
                          }}
                        />
                        <span
                          className="font-mono text-[7px]"
                          style={{ color: "oklch(0.50 0.08 242)" }}
                        >
                          AUTO FIX · 300,000 TOOLS
                        </span>
                      </div>
                    </div>
                    <div
                      className="mt-2 rounded p-1.5"
                      style={{
                        background: "oklch(0.08 0.01 242)",
                        border: "1px solid oklch(0.20 0.04 242)",
                      }}
                    >
                      <div
                        className="font-mono text-[7px] mb-1"
                        style={{ color: "oklch(0.38 0.04 242)" }}
                      >
                        HEALING CHIPS
                      </div>
                      <div className="grid grid-cols-10 gap-0.5">
                        {[...Array(10)].map((_, i) => (
                          <button
                            key={`healing-chip-${i + 1}`}
                            type="button"
                            data-ocid={`healing.chip.${i + 1}`}
                            onClick={() => {
                              const f = healingChipFiltersRef.current[i];
                              if (f) {
                                const isOn = f.gain.value > 0;
                                f.gain.value = isOn ? 0 : 0.5;
                                logCommanderAction(
                                  `HEAL CHIP ${i + 1} ${isOn ? "OFF" : "ON"}`,
                                );
                              }
                            }}
                            className="h-3 rounded-sm transition-all cursor-pointer"
                            style={{
                              background: "oklch(0.74 0.26 148)",
                              boxShadow: "0 0 4px oklch(0.74 0.26 148 / 0.6)",
                            }}
                          />
                        ))}
                      </div>
                      <div
                        className="font-mono text-[7px] mt-0.5"
                        style={{ color: "oklch(0.38 0.06 148)" }}
                      >
                        10 SMART CHIPS · HEALING + RESTORING
                      </div>
                    </div>
                    <div
                      className="mt-1 rounded p-1.5"
                      style={{
                        background: "oklch(0.08 0.01 242)",
                        border: "1px solid oklch(0.20 0.04 242)",
                      }}
                    >
                      <div
                        className="font-mono text-[7px]"
                        style={{ color: "oklch(0.38 0.04 242)" }}
                      >
                        SOFTWARE TOOLS
                      </div>
                      <div
                        className="font-mono text-[9px] font-bold"
                        style={{ color: "oklch(0.72 0.22 280)" }}
                      >
                        300,000 ACTIVE
                      </div>
                    </div>
                  </motion.div>

                  {/* SIGNAL CHAIN STATUS */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="rounded p-3"
                    style={{
                      background: "oklch(0.10 0.014 242)",
                      border: "1px solid oklch(0.28 0.08 212)",
                    }}
                  >
                    <SectionLabel>◈ SIGNAL CHAIN STATUS</SectionLabel>
                    <div className="mt-2 space-y-1">
                      {[
                        "SOURCE INPUT",
                        "10-BAND EQ (32Hz–16kHz)",
                        "20 SMART CHIPS (5×4 ENGINES)",
                        "ENGINE 1 · DEEP BASS 80Hz",
                        "ENGINE 2 · MID BASS 250Hz",
                        "ENGINE 3 · MIDRANGE 2kHz",
                        "ENGINE 4 · AIR/HIGHS 8kHz",
                        `PROCESSOR ${processorOn ? "ON ✓" : "OFF"} · FPGA WAVE SHAPE`,
                        "BASS PATH + GENERATOR FILTER",
                        "HIGHS PATH + GENERATOR FILTER",
                        "MASTER MIX",
                        "10 HEALING CHIP FILTERS",
                        "HEALING COMPRESSOR (−18dB)",
                        "FREEZE DELAY NODE",
                        "LOUDNESS BOOSTER 1700",
                        "CHAIN BLOCK (3× MULTIPLIER)",
                        `STABILIZER ${compressorOn ? "ACTIVE ✓" : "BYPASSED"}`,
                        "ANALYSER / MONITOR",
                        "OUTPUT",
                      ].map((stage) => (
                        <div key={stage} className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              background: "oklch(0.74 0.26 148)",
                              boxShadow: "0 0 4px oklch(0.74 0.26 148)",
                            }}
                          />
                          <div
                            className="flex-1 h-px"
                            style={{ background: "oklch(0.18 0.04 242)" }}
                          />
                          <span
                            className="font-mono text-[8px]"
                            style={{ color: "oklch(0.45 0.08 212)" }}
                          >
                            {stage}
                          </span>
                          <div
                            className="flex-1 h-px"
                            style={{ background: "oklch(0.18 0.04 242)" }}
                          />
                          <div
                            className="font-mono text-[7px]"
                            style={{ color: "oklch(0.50 0.14 148)" }}
                          >
                            ACTIVE
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}

              {/* ── SYSTEM TAB ─────────────────────────────────────────── */}
              {rightTab === "system" && (
                <>
                  {/* PRESET SYSTEM */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded p-3"
                    style={{
                      background: "oklch(0.10 0.014 242)",
                      border: "1px solid oklch(0.28 0.08 212)",
                    }}
                  >
                    <SectionLabel>◈ PRESET SYSTEM</SectionLabel>
                    {presets.length === 0 ? (
                      <div
                        data-ocid="preset.empty_state"
                        className="font-mono text-[10px] text-center py-4"
                        style={{ color: "oklch(0.38 0.04 242)" }}
                      >
                        NO PRESETS SAVED
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {presets.map((p: any, idx: number) => (
                          <button
                            key={p.name}
                            type="button"
                            data-ocid={`preset.item.${idx + 1}`}
                            onClick={() => handleLoadPreset(p.name)}
                            className="w-full text-left px-2 py-1.5 rounded font-mono text-[10px] transition-all"
                            style={{
                              background:
                                selectedPreset === p.name
                                  ? "oklch(0.12 0.05 212)"
                                  : "oklch(0.09 0.01 242)",
                              border: `1px solid ${selectedPreset === p.name ? "oklch(0.40 0.16 212)" : "oklch(0.18 0.04 242)"}`,
                              color: "oklch(0.65 0.16 212)",
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* AWARD BADGE */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="rounded p-3"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.12 0.06 75) 0%, oklch(0.10 0.04 75) 100%)",
                      border: "1px solid oklch(0.50 0.20 75)",
                      boxShadow: "0 0 20px oklch(0.72 0.28 75 / 0.2)",
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="font-mono text-[10px] tracking-[0.3em]"
                        style={{ color: "oklch(0.88 0.26 75)" }}
                      >
                        🏆 AWARD WINNING NUMBER 1
                      </div>
                      <div
                        className="font-display font-black text-lg mt-1"
                        style={{
                          color: "oklch(0.92 0.28 75)",
                          textShadow: "0 0 20px oklch(0.82 0.28 75 / 0.6)",
                        }}
                      >
                        GERRED PHILLIPS
                      </div>
                      <div
                        className="font-mono text-[9px] mt-0.5"
                        style={{ color: "oklch(0.70 0.18 75)" }}
                      >
                        ENGINEER / PRODUCT DESIGNER
                      </div>
                      <div
                        className="font-mono text-[8px] mt-0.5"
                        style={{ color: "oklch(0.55 0.14 75)" }}
                      >
                        BUILT: FEBRUARY 27, 2027
                      </div>
                    </div>
                  </motion.div>

                  {/* SYSTEM INFO */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="rounded p-3"
                    style={{
                      background: "oklch(0.10 0.014 242)",
                      border: "1px solid oklch(0.28 0.08 212)",
                    }}
                  >
                    <SectionLabel>◈ SYSTEM INFO</SectionLabel>
                    <div className="mt-2 space-y-1">
                      {[
                        ["APP", "PowerSound Pro v9.0"],
                        ["ENGINE", "Power Core 334"],
                        ["STABILIZER", "800,000,000"],
                        ["COMMANDER MEM", "900,000,000 Mb"],
                        ["SMART CHIPS", "20 × Super Class A/B/C/D"],
                        ["PROCESSOR", "No. 0 · 12V · FPGA"],
                        ["HEALING CHIPS", "10 Active"],
                        ["SOFTWARE TOOLS", "300,000"],
                        ["BASS PROG", "80Hz · No Amp Gain"],
                        ["BOOSTER", "1700 · Titanium Clamp"],
                        ["CHAIN BLOCK", "3× Multiplier"],
                        ["SIGNAL GUARDIAN", "Controlled · Titanium · No Limit"],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between"
                        >
                          <span
                            className="font-mono text-[8px]"
                            style={{ color: "oklch(0.38 0.04 242)" }}
                          >
                            {k}
                          </span>
                          <span
                            className="font-mono text-[8px]"
                            style={{ color: "oklch(0.62 0.14 212)" }}
                          >
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </main>

        {/* FOOTER */}
        <footer
          className="text-center py-2 px-4 font-mono text-[9px] flex-shrink-0"
          style={{
            borderTop: "1px solid oklch(0.18 0.04 242)",
            color: "oklch(0.32 0.04 242)",
            background: "oklch(0.07 0.012 242)",
          }}
        >
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "oklch(0.52 0.14 212)" }}
          >
            caffeine.ai
          </a>
        </footer>
      </div>
      <Toaster />
    </>
  );
}
