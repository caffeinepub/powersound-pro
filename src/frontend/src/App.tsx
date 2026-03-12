import { useCallback, useEffect, useRef, useState } from "react";

// ===================== TYPES =====================

interface Engine {
  id: number;
  label: string;
  type: BiquadFilterType;
  frequency: number;
  range: string;
  on: boolean;
}

interface AudioStore {
  ctx: AudioContext | null;
  source: AudioBufferSourceNode | null;
  analyser: AnalyserNode | null;
  engines: BiquadFilterNode[];
  compressor: DynamicsCompressorNode | null;
  outputGain: GainNode | null;
  eq10: BiquadFilterNode[];
  eq31: BiquadFilterNode[];
  bassFilter: BiquadFilterNode | null;
  loudBoosterGain: GainNode | null;
}

// ===================== CONSTANTS =====================

const EQ10_BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const EQ31_BANDS = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
  800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500,
  16000, 20000,
];

const ENGINE_CLASSES = ["A⁺", "B⁺", "C⁺", "D⁺"];

const INITIAL_ENGINES: Engine[] = [
  {
    id: 1,
    label: "ENGINE 1",
    type: "lowpass",
    frequency: 400,
    range: "20Hz–400Hz",
    on: true,
  },
  {
    id: 2,
    label: "ENGINE 2",
    type: "bandpass",
    frequency: 800,
    range: "200Hz–2kHz",
    on: true,
  },
  {
    id: 3,
    label: "ENGINE 3",
    type: "bandpass",
    frequency: 4000,
    range: "1kHz–8kHz",
    on: true,
  },
  {
    id: 4,
    label: "ENGINE 4",
    type: "highpass",
    frequency: 2500,
    range: "2.5kHz–20kHz",
    on: true,
  },
];

const ROCK_31 = [
  4, 3, 2, 1, 0, -1, -2, -1, 0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 2, 3, 2, 1, 0, -1,
  -2, -1, 0, 1, 2, 3, 4,
];
const HIPHOP_31 = [
  5, 4, 3, 2, 1, 1, 0, 0, -1, -1, -2, -1, 0, 1, 2, 2, 1, 0, -1, -2, -3, -2, -1,
  0, 1, 2, 3, 4, 4, 3, 2,
];
const POP_31 = [
  2, 2, 1, 0, -1, -2, -3, -2, -1, 0, 1, 2, 2, 1, 0, -1, -1, 0, 1, 2, 3, 3, 2, 1,
  0, -1, 0, 1, 2, 2, 3,
];
const FLAT_31 = new Array(31).fill(0);

const INSTRUMENT_EQ_PRESETS: { [key: string]: number[] } = {
  FLAT: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  BASS: [6, 5, 4, 2, 0, -2, -3, -4, -4, -5],
  DRUMS: [5, 4, 3, 1, 0, 0, 1, 2, 3, 2],
  GUITAR: [-2, -1, 0, 2, 3, 4, 3, 2, 1, 0],
  VOCALS: [-3, -2, 0, 1, 3, 4, 4, 3, 2, 1],
  KEYS: [0, 0, 1, 2, 3, 3, 2, 2, 1, 0],
  SYNTH: [-2, -1, 0, 0, 2, 4, 5, 4, 3, 2],
};

// ===================== STYLES =====================

const ps: React.CSSProperties = {
  background: "#0d1526",
  border: "1px solid #1e3a5f",
  boxShadow: "0 0 15px rgba(0,120,255,0.2)",
  borderRadius: "6px",
  padding: "12px",
  minWidth: 0,
  boxSizing: "border-box" as const,
};

const goldText: React.CSSProperties = {
  color: "#f0c040",
  textShadow: "0 0 10px #f0c040",
};
const greenText: React.CSSProperties = {
  color: "#00ff88",
  textShadow: "0 0 8px #00ff88",
};
const dimText: React.CSSProperties = { color: "#4a6fa5", fontSize: "10px" };
const labelStyle: React.CSSProperties = {
  color: "#7ab3e0",
  fontSize: "10px",
  letterSpacing: "0.1em",
  marginBottom: "4px",
};

// ===================== BOOK ANIMATION =====================

function BookAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"closed" | "opening" | "done">("closed");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("opening"), 300);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  const opening = phase === "opening";
  const done = phase === "done";

  if (done) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "#020610",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1200px",
      }}
    >
      {/* Glow orb */}
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,80,200,0.3) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Book container */}
      <div
        style={{
          position: "relative",
          width: 480,
          height: 320,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Left cover */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "50%",
            height: "100%",
            background:
              "linear-gradient(135deg, #0a1628 0%, #0d2050 50%, #0a1628 100%)",
            border: "2px solid #f0c040",
            borderRight: "none",
            transformOrigin: "right center",
            transform: opening ? "rotateY(-150deg)" : "rotateY(0deg)",
            transition: "transform 5s cubic-bezier(0.25,0.1,0.25,1)",
            transformStyle: "preserve-3d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "-4px 0 20px rgba(240,192,64,0.3)",
            backfaceVisibility: "hidden",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                ...goldText,
                fontSize: "11px",
                letterSpacing: "0.3em",
                marginBottom: 8,
              }}
            >
              POWERSOUND
            </div>
            <div style={{ color: "#1e3a5f", fontSize: "28px" }}>◈</div>
          </div>
        </div>

        {/* Spine */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "calc(50% - 3px)",
            width: 6,
            height: "100%",
            background:
              "linear-gradient(to bottom, #f0c040 0%, #c09000 50%, #f0c040 100%)",
            boxShadow: "0 0 20px #f0c040, 0 0 40px rgba(240,192,64,0.5)",
            zIndex: 10,
          }}
        />

        {/* Right cover */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: "100%",
            background:
              "linear-gradient(225deg, #0a1628 0%, #0d2050 50%, #0a1628 100%)",
            border: "2px solid #f0c040",
            borderLeft: "none",
            transformOrigin: "left center",
            transform: opening ? "rotateY(150deg)" : "rotateY(0deg)",
            transition: "transform 5s cubic-bezier(0.25,0.1,0.25,1)",
            transformStyle: "preserve-3d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "4px 0 20px rgba(240,192,64,0.3)",
            backfaceVisibility: "hidden",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                ...goldText,
                fontSize: "11px",
                letterSpacing: "0.3em",
                marginBottom: 8,
              }}
            >
              PRO
            </div>
            <div style={{ color: "#1e3a5f", fontSize: "28px" }}>◈</div>
          </div>
        </div>

        {/* Inner glow when opening */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(0,120,255,0.6) 0%, transparent 60%)",
            opacity: opening ? 1 : 0,
            transition: "opacity 2s ease 1s",
            zIndex: 5,
          }}
        />

        {/* Center text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6,
            opacity: opening ? 1 : 0,
            transition: "opacity 2s ease 2s",
          }}
        >
          <div
            style={{
              ...goldText,
              fontSize: "22px",
              fontWeight: "bold",
              letterSpacing: "0.15em",
              marginBottom: 6,
            }}
          >
            POWERSOUND PRO
          </div>
          <div
            style={{
              color: "#7ab3e0",
              fontSize: "11px",
              letterSpacing: "0.4em",
            }}
          >
            LOADING SYSTEM...
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: "50%",
          transform: "translateX(-50%)",
          color: "#f0c040",
          fontSize: "11px",
          letterSpacing: "0.3em",
          opacity: opening ? 1 : 0,
          transition: "opacity 1s ease 1.5s",
        }}
      >
        ✦ AWARD WINNING NUMBER 1 AUDIO SYSTEM ✦
      </div>
    </div>
  );
}

// ===================== SIGNAL BAR =====================

function SignalBar({ active, level }: { active: boolean; level: number }) {
  return (
    <div
      style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 20 }}
    >
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
        <div
          key={threshold}
          style={{
            width: 6,
            height: `${(i + 1) * 20}%`,
            background: active && level > threshold ? "#00ff88" : "#1e3a5f",
            boxShadow: active && level > threshold ? "0 0 4px #00ff88" : "none",
            borderRadius: 1,
            transition: "background 0.1s",
          }}
        />
      ))}
    </div>
  );
}

// ===================== MAIN APP =====================

export default function App() {
  // Load saved memory from localStorage
  const savedMemory = (() => {
    try {
      return JSON.parse(localStorage.getItem("psp_memory") || "{}");
    } catch {
      return {};
    }
  })();

  const [animDone, setAnimDone] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState("");
  const [battery, setBattery] = useState(savedMemory.battery ?? 0);
  const [batteryCharging, setBatteryCharging] = useState(false);
  const [engines, setEngines] = useState<Engine[]>(
    savedMemory.engines ?? INITIAL_ENGINES,
  );
  const [eq10vals, setEq10vals] = useState<number[]>(
    savedMemory.eq10vals ?? new Array(10).fill(0),
  );
  const [eq31vals, setEq31vals] = useState<number[]>(
    savedMemory.eq31vals ?? new Array(31).fill(0),
  );
  const [selectedInstrument, setSelectedInstrument] = useState<string>("FLAT");
  const [instrumentMixVals, setInstrumentMixVals] = useState<{
    [key: string]: number;
  }>({
    BASS: 75,
    DRUMS: 70,
    GUITAR: 65,
    VOCALS: 80,
    KEYS: 60,
    SYNTH: 65,
    FLAT: 75,
  });
  const [bassOn, setBassOn] = useState(savedMemory.bassOn ?? true);
  const [commanderOn, setCommanderOn] = useState(
    savedMemory.commanderOn ?? true,
  );
  const [volume1700, setVolume1700] = useState(savedMemory.volume1700 ?? 1700);
  const [loudBoosterVal, setLoudBoosterVal] = useState(
    savedMemory.loudBoosterVal ?? 1700,
  );
  const [specBars, setSpecBars] = useState<number[]>(new Array(8).fill(0));
  const [freqProfile, setFreqProfile] = useState("ANALYZING...");
  const [engineLevels, setEngineLevels] = useState([0, 0, 0, 0]);

  const audioRef = useRef<AudioStore>({
    ctx: null,
    source: null,
    analyser: null,
    engines: [],
    compressor: null,
    outputGain: null,
    eq10: [],
    eq31: [],
    bassFilter: null,
    loudBoosterGain: null,
  });
  const chargeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileRef = useRef<ArrayBuffer | null>(null);
  const batteryRef = useRef(savedMemory.battery ?? 0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Battery charging ----
  const startCharging = useCallback(() => {
    if (chargeTimerRef.current) return;
    setBatteryCharging(true);
    chargeTimerRef.current = setInterval(() => {
      setBattery((prev) => {
        const next = Math.min(100, prev + 1);
        batteryRef.current = next;
        if (next >= 100) {
          setBatteryCharging(false);
          if (chargeTimerRef.current) {
            clearInterval(chargeTimerRef.current);
            chargeTimerRef.current = null;
          }
        }
        return next;
      });
    }, 120);
  }, []);

  // Save all app state to memory
  useEffect(() => {
    try {
      localStorage.setItem(
        "psp_memory",
        JSON.stringify({
          battery,
          engines,
          eq10vals,
          eq31vals,
          bassOn,
          commanderOn,
          volume1700,
          loudBoosterVal,
        }),
      );
    } catch (_) {}
  }, [
    battery,
    engines,
    eq10vals,
    eq31vals,
    bassOn,
    commanderOn,
    volume1700,
    loudBoosterVal,
  ]);

  useEffect(() => {
    startCharging();
    return () => {
      if (chargeTimerRef.current) clearInterval(chargeTimerRef.current);
    };
  }, [startCharging]);

  // ---- Analyser loop ----
  const startAnalyser = useCallback(() => {
    const { analyser } = audioRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(data);
      const binSize = Math.floor(data.length / 8);
      const bars = Array.from({ length: 8 }, (_, i) => {
        const start = i * binSize;
        const slice = data.slice(start, start + binSize);
        const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
        return avg / 255;
      });
      setSpecBars(bars);

      // Engine levels
      const bassAvg = data.slice(0, 20).reduce((a, b) => a + b, 0) / 20 / 255;
      const lo = data.slice(0, 40).reduce((a, b) => a + b, 0) / 40 / 255;
      const midLo = data.slice(40, 100).reduce((a, b) => a + b, 0) / 60 / 255;
      const midHi = data.slice(100, 200).reduce((a, b) => a + b, 0) / 100 / 255;
      const hiAvg =
        data.slice(200).reduce((a, b) => a + b, 0) / (data.length - 200) / 255;
      setEngineLevels([lo, midLo, midHi, hiAvg]);

      // Profile detection every ~500ms - handled by rAF rate
      const total = data.reduce((a, b) => a + b, 0) / data.length;
      if (total > 5) {
        if (bassAvg > hiAvg * 1.5) setFreqProfile("BASS HEAVY");
        else if (hiAvg > bassAvg * 1.5) setFreqProfile("BRIGHT / AIRY");
        else setFreqProfile("MID FOCUSED");
      } else {
        setFreqProfile("ANALYZING...");
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  // ---- Build audio graph ----
  const buildGraph = useCallback(
    (buffer: AudioBuffer) => {
      const store = audioRef.current;
      if (store.source) {
        try {
          store.source.stop();
        } catch (_) {}
      }
      if (store.ctx) {
        store.ctx.close();
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const ctx = new AudioContext();

      // Output gain (1700 slider: 0-1, never above unity)
      const outputGain = ctx.createGain();
      outputGain.gain.value = volume1700 / 1700;

      // Loud Booster gain node (0-1700 mapped to 0-1)
      const loudBoosterGain = ctx.createGain();
      loudBoosterGain.gain.value = loudBoosterVal / 1700;

      // Stabilizer (very gentle dynamics compressor)
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -1;
      compressor.knee.value = 40;
      compressor.ratio.value = 1.1;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      // 80Hz bass filter (lowshelf, no gain by default)
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 80;
      bassFilter.gain.value = bassOn ? 3 : 0; // modest 3dB warm shelf

      // 10-band EQ (series)
      const eq10: BiquadFilterNode[] = EQ10_BANDS.map((freq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? "lowshelf" : i === 9 ? "highshelf" : "peaking";
        f.frequency.value = freq;
        f.Q.value = 1.41;
        f.gain.value = eq10vals[i];
        return f;
      });

      // 31-band EQ (series)
      const eq31: BiquadFilterNode[] = EQ31_BANDS.map((freq, i) => {
        const f = ctx.createBiquadFilter();
        f.type = i === 0 ? "lowshelf" : i === 30 ? "highshelf" : "peaking";
        f.frequency.value = freq;
        f.Q.value = 4.32; // narrow bands
        f.gain.value = eq31vals[i];
        return f;
      });

      // Analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.7;

      // Engine filters
      const engineFilters: BiquadFilterNode[] = INITIAL_ENGINES.map((e) => {
        const f = ctx.createBiquadFilter();
        f.type = e.type;
        f.frequency.value = e.frequency;
        // Wide Q for bandpass = more frequencies pass through = strong signal
        f.Q.value = e.type === "bandpass" ? 0.4 : 0.8;
        return f;
      });

      // Source
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Signal chain:
      // source -> analyser -> bassFilter -> eq10[chain] -> eq31[chain]
      //        -> each active engine filter -> compressor -> outputGain -> destination
      source.connect(analyser);
      analyser.connect(bassFilter);
      bassFilter.connect(eq10[0]);
      for (let i = 0; i < eq10.length - 1; i++) eq10[i].connect(eq10[i + 1]);
      const lastEq10 = eq10[eq10.length - 1];
      lastEq10.connect(eq31[0]);
      for (let i = 0; i < eq31.length - 1; i++) eq31[i].connect(eq31[i + 1]);
      const lastEq31 = eq31[eq31.length - 1];

      // Each engine connects in parallel from end of EQ chain -> compressor
      engineFilters.forEach((ef, i) => {
        if (engines[i]?.on !== false) {
          lastEq31.connect(ef);
          ef.connect(compressor);
        }
      });
      // If all engines off, connect directly
      const anyOn = engines.some((e) => e.on);
      if (!anyOn) lastEq31.connect(compressor);

      compressor.connect(loudBoosterGain);
      loudBoosterGain.connect(outputGain);
      outputGain.connect(ctx.destination);

      source.start();
      source.onended = () => setIsPlaying(false);

      Object.assign(store, {
        ctx,
        source,
        analyser,
        engines: engineFilters,
        compressor,
        outputGain,
        eq10,
        eq31,
        bassFilter,
        loudBoosterGain,
      });
      startAnalyser();
    },
    [
      bassOn,
      eq10vals,
      eq31vals,
      engines,
      volume1700,
      loudBoosterVal,
      startAnalyser,
    ],
  );

  // ---- Update output gain when slider changes ----
  useEffect(() => {
    const { outputGain } = audioRef.current;
    if (outputGain) outputGain.gain.value = volume1700 / 1700;
  }, [volume1700]);

  // ---- Update loud booster gain in real time ----
  useEffect(() => {
    const { loudBoosterGain } = audioRef.current;
    if (loudBoosterGain) loudBoosterGain.gain.value = loudBoosterVal / 1700;
  }, [loudBoosterVal]);

  // ---- Update EQ nodes in real time ----
  useEffect(() => {
    audioRef.current.eq10.forEach((node, i) => {
      node.gain.value = eq10vals[i];
    });
  }, [eq10vals]);

  useEffect(() => {
    audioRef.current.eq31.forEach((node, i) => {
      node.gain.value = eq31vals[i];
    });
  }, [eq31vals]);

  // ---- File picker ----
  const handleFile = useCallback(async (file: File) => {
    const ab = await file.arrayBuffer();
    fileRef.current = ab;
    setTrackName(file.name.replace(/\.[^/.]+$/, ""));
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const store = audioRef.current;
    if (store.source) {
      try {
        store.source.stop();
      } catch (_) {}
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (!fileRef.current) return;
    if (batteryRef.current <= 0) return;
    const store = audioRef.current;
    if (store.ctx?.state === "running" && store.source) {
      // already playing, stop
      try {
        store.source.stop();
      } catch (_) {}
      setIsPlaying(false);
      return;
    }
    const tempCtx = new AudioContext();
    const buffer = await tempCtx.decodeAudioData(fileRef.current.slice(0));
    await tempCtx.close();
    buildGraph(buffer);
    setIsPlaying(true);
  }, [buildGraph]);

  const handleStop = useCallback(() => {
    const store = audioRef.current;
    if (store.source) {
      try {
        store.source.stop();
      } catch (_) {}
    }
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setSpecBars(new Array(8).fill(0));
    setEngineLevels([0, 0, 0, 0]);
  }, []);

  const handlePause = useCallback(() => {
    const { ctx } = audioRef.current;
    if (!ctx) return;
    if (ctx.state === "running") {
      ctx.suspend();
      setIsPlaying(false);
    } else if (ctx.state === "suspended") {
      ctx.resume();
      setIsPlaying(true);
    }
  }, []);

  // ---- Toggle engine ----
  const toggleEngine = (id: number) => {
    setEngines((prev) =>
      prev.map((e) => (e.id === id ? { ...e, on: !e.on } : e)),
    );
  };

  // ---- 31-band presets ----
  const applyPreset31 = (preset: number[]) => setEq31vals([...preset]);

  // ---- Battery drain while playing ----
  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => {
      setBattery((prev) => {
        const next = Math.max(0, prev - 0.5);
        batteryRef.current = next;
        if (next <= 0) handleStop();
        return next;
      });
    }, 3000);
    return () => clearInterval(t);
  }, [isPlaying, handleStop]);

  const commanderColor = commanderOn ? "#00ff88" : "#1e3a5f";
  const batteryColor =
    battery > 50 ? "#00ff88" : battery > 20 ? "#f0c040" : "#ff4444";

  if (!animDone) {
    return <BookAnimation onComplete={() => setAnimDone(true)} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f1e",
        color: "#c8e0ff",
        fontFamily: "'JetBrains Mono', monospace",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "16px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* ===== HEADER ===== */}
        <div
          style={{
            ...ps,
            textAlign: "center",
            padding: "20px 16px",
          }}
        >
          <div
            style={{
              ...goldText,
              fontSize: 28,
              fontWeight: "bold",
              letterSpacing: "0.2em",
              marginBottom: 6,
            }}
          >
            ⚡ POWERSOUND PRO ⚡
          </div>
          <div
            style={{
              ...goldText,
              fontSize: 11,
              letterSpacing: "0.5em",
              marginBottom: 12,
              opacity: 0.85,
            }}
          >
            ✦ AWARD WINNING NUMBER 1 AUDIO SYSTEM ✦
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            {["A⁺", "B⁺", "C⁺", "D⁺"].map((cls) => (
              <span
                key={cls}
                style={{
                  color: "#f0c040",
                  textShadow: "0 0 12px #f0c040, 0 0 24px rgba(240,192,64,0.5)",
                  fontSize: 16,
                  fontWeight: "bold",
                  background: "rgba(240,192,64,0.08)",
                  border: "1px solid rgba(240,192,64,0.3)",
                  borderRadius: 4,
                  padding: "2px 10px",
                }}
              >
                {cls}
              </span>
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              color: "#4a6fa5",
              fontSize: 10,
              letterSpacing: "0.2em",
            }}
          >
            HIGH-CLASS AUDIO · SRS 22 CHIP · TITANIUM STABILIZER · CHAIN BLOCK
          </div>
        </div>

        {/* ===== ROW: PLAYER + BATTERY ===== */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Player */}
          <div style={{ ...ps, flex: "1 1 300px" }}>
            <div style={{ ...labelStyle }}>MUSIC PLAYER</div>
            <div style={{ marginBottom: 10 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                data-ocid="player.upload_button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "#0d2050",
                  border: "1px solid #1e5fa5",
                  color: "#7ab3e0",
                  padding: "8px 16px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  width: "100%",
                  marginBottom: 8,
                }}
              >
                📂 LOAD MUSIC FILE
              </button>
            </div>
            <div
              style={{
                background: "#060c18",
                border: "1px solid #1e3a5f",
                borderRadius: 4,
                padding: "8px 10px",
                marginBottom: 10,
                fontSize: 11,
                color: trackName ? "#7ab3e0" : "#2a4a6f",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {trackName || "NO TRACK LOADED"}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                data-ocid="player.primary_button"
                onClick={handlePlay}
                style={{
                  flex: 1,
                  background: isPlaying ? "#002a10" : "#001a40",
                  border: `1px solid ${isPlaying ? "#00ff88" : "#1e5fa5"}`,
                  color: isPlaying ? "#00ff88" : "#7ab3e0",
                  padding: "8px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11,
                  boxShadow: isPlaying
                    ? "0 0 10px rgba(0,255,136,0.3)"
                    : "none",
                }}
              >
                {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
              </button>
              <button
                type="button"
                data-ocid="player.secondary_button"
                onClick={handlePause}
                style={{
                  flex: 1,
                  background: "#001a40",
                  border: "1px solid #1e5fa5",
                  color: "#7ab3e0",
                  padding: "8px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                ⏯ PAUSE/RESUME
              </button>
              <button
                type="button"
                data-ocid="player.delete_button"
                onClick={handleStop}
                style={{
                  flex: 1,
                  background: "#200010",
                  border: "1px solid #3f1020",
                  color: "#ff6680",
                  padding: "8px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                ⏹ STOP
              </button>
            </div>
          </div>

          {/* Battery */}
          <div style={{ ...ps, width: 200, flexShrink: 0 }}>
            <div style={{ ...labelStyle }}>POWER CORE 334</div>
            {/* Battery visual */}
            <div
              style={{
                position: "relative",
                height: 120,
                background: "#060c18",
                border: `2px solid ${batteryColor}`,
                borderRadius: 4,
                marginBottom: 8,
                overflow: "hidden",
                boxShadow: `0 0 10px ${batteryColor}44`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${battery}%`,
                  background: `linear-gradient(to top, ${batteryColor}cc, ${batteryColor}44)`,
                  transition: "height 0.3s",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: "bold",
                  color: batteryColor,
                  textShadow: `0 0 8px ${batteryColor}`,
                  zIndex: 1,
                }}
              >
                {Math.round(battery)}%
              </div>
            </div>
            <div
              style={{
                fontSize: 10,
                textAlign: "center",
                color: batteryCharging ? "#f0c040" : "#4a6fa5",
                marginBottom: 6,
              }}
            >
              {batteryCharging
                ? "⚡ CHARGING..."
                : battery >= 100
                  ? "✓ FULL CHARGE"
                  : "● STANDBY"}
            </div>
            <button
              type="button"
              data-ocid="battery.primary_button"
              onClick={startCharging}
              style={{
                width: "100%",
                background: "#0a1a30",
                border: "1px solid #1e3a5f",
                color: "#f0c040",
                padding: "6px",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 10,
                letterSpacing: "0.1em",
              }}
            >
              ⚡ CHARGE
            </button>
            <div
              style={{
                marginTop: 6,
                fontSize: 9,
                color: "#2a4a6f",
                textAlign: "center",
              }}
            >
              {isPlaying
                ? "AMP POWERED · ACTIVE"
                : trackName
                  ? "FILE LOADED · READY"
                  : "AMP POWER · STANDBY"}{" "}
              · MEMORY ✓
            </div>
          </div>
        </div>

        {/* ===== ROW: 4 ENGINES ===== */}
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>
            SOUND ENGINES — A⁺B⁺C⁺D⁺ SMART CLASS · MEMORY ACTIVE · ZERO GAIN
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 10,
            }}
          >
            {engines.map((eng, i) => (
              <div
                key={eng.id}
                data-ocid={`engine.panel.${i + 1}`}
                style={{
                  ...ps,
                  border: `1px solid ${eng.on ? "#1e5f3a" : "#1e3a5f"}`,
                  boxShadow: eng.on ? "0 0 15px rgba(0,255,136,0.15)" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{ ...goldText, fontSize: 11, fontWeight: "bold" }}
                  >
                    {eng.label}
                  </div>
                  <button
                    type="button"
                    data-ocid={`engine.toggle.${i + 1}`}
                    onClick={() => toggleEngine(eng.id)}
                    style={{
                      background: eng.on ? "#002a10" : "#0d1526",
                      border: `1px solid ${eng.on ? "#00ff88" : "#1e3a5f"}`,
                      color: eng.on ? "#00ff88" : "#4a6fa5",
                      padding: "2px 8px",
                      borderRadius: 3,
                      cursor: "pointer",
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      boxShadow: eng.on
                        ? "0 0 6px rgba(0,255,136,0.4)"
                        : "none",
                    }}
                  >
                    {eng.on ? "ON" : "OFF"}
                  </button>
                </div>
                {/* A+B+C+D class badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      color: "#f0c040",
                      textShadow:
                        "0 0 10px #f0c040, 0 0 20px rgba(240,192,64,0.5)",
                      fontSize: 14,
                      fontWeight: "bold",
                      background: "rgba(240,192,64,0.1)",
                      border: "1px solid rgba(240,192,64,0.4)",
                      borderRadius: 4,
                      padding: "1px 8px",
                    }}
                  >
                    {ENGINE_CLASSES[i]}
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      color: "#00ff88",
                      letterSpacing: "0.1em",
                    }}
                  >
                    SMART ENGINE
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#4a8fa5",
                    marginBottom: 6,
                    letterSpacing: "0.05em",
                  }}
                >
                  {eng.type.toUpperCase()} · {eng.range}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ ...dimText, marginBottom: 4 }}>
                    SIGNAL ACTIVITY
                  </div>
                  <SignalBar
                    active={eng.on && isPlaying}
                    level={engineLevels[i]}
                  />
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: eng.on ? commanderColor : "#1e3a5f",
                    textShadow: eng.on ? `0 0 6px ${commanderColor}` : "none",
                  }}
                >
                  ● {eng.on ? `${eng.frequency}Hz ACTIVE` : "BYPASSED"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== ROW: 10-BAND EQ + COMMANDER + STABILIZER ===== */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* 10-band EQ — Rack Hardware Style */}
          <div
            style={{ flex: "2 1 380px", minWidth: 0 }}
            className="rack-eq-panel"
          >
            <div className="rack-eq-faceplate">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: "bold",
                    color: "#7ab3e0",
                    letterSpacing: "0.12em",
                  }}
                >
                  PSP·DJ·EQ·10
                </span>
                <span
                  style={{
                    fontSize: 7,
                    color: "#2a4a6f",
                    letterSpacing: "0.08em",
                  }}
                >
                  GRAPHIC EQUALIZER
                </span>
              </div>
              <span
                style={{ ...goldText, fontSize: 8, letterSpacing: "0.1em" }}
              >
                A⁺B⁺C⁺D⁺
              </span>
            </div>
            <div className="rack-eq-sliders" style={{ height: 132 }}>
              <div className="rack-eq-zeroline" />
              {EQ10_BANDS.map((freq, i) => {
                const pct = i / (EQ10_BANDS.length - 1);
                const r = Math.round(30 + pct * 90);
                const g = Math.round(95 + pct * 97);
                const b = Math.round(225 - pct * 165);
                const thumbColor = `linear-gradient(180deg, rgb(${r + 40},${g + 20},${b}) 0%, rgb(${r},${g},${b - 30}) 100%)`;
                return (
                  <div key={freq} className="rack-eq-band">
                    <div
                      className={`rack-eq-db${eq10vals[i] > 0 ? " active-pos" : eq10vals[i] < 0 ? " active-neg" : ""}`}
                    >
                      {eq10vals[i] !== 0
                        ? (eq10vals[i] > 0 ? "+" : "") + eq10vals[i]
                        : "·"}
                    </div>
                    <div className="rack-v-range-wrapper">
                      <input
                        data-ocid={`eq10.input.${i + 1}`}
                        type="range"
                        className="rack-v-range"
                        style={
                          {
                            "--rack-thumb-color": thumbColor,
                          } as React.CSSProperties
                        }
                        min={-12}
                        max={12}
                        step={0.5}
                        value={eq10vals[i]}
                        onChange={(e) => {
                          const v = Number.parseFloat(e.target.value);
                          setEq10vals((prev) =>
                            prev.map((x, j) => (j === i ? v : x)),
                          );
                        }}
                      />
                    </div>
                    <div className="rack-eq-freq">
                      {freq >= 1000 ? `${freq / 1000}k` : freq}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commander */}
          <div style={{ ...ps, flex: "1 1 220px", minWidth: 0 }}>
            <div style={{ ...labelStyle, marginBottom: 8 }}>
              COMMANDER — MASTER CONTROL
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: commanderColor,
                  textShadow: `0 0 8px ${commanderColor}`,
                }}
              >
                {commanderOn ? "● COMMANDER ON" : "○ COMMANDER OFF"}
              </span>
              <button
                type="button"
                data-ocid="commander.toggle"
                onClick={() => setCommanderOn((p) => !p)}
                style={{
                  background: commanderOn ? "#002a10" : "#0d1526",
                  border: `2px solid ${commanderColor}`,
                  color: commanderColor,
                  padding: "4px 12px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: "bold",
                  boxShadow: commanderOn
                    ? `0 0 12px ${commanderColor}66`
                    : "none",
                }}
              >
                {commanderOn ? "ON" : "OFF"}
              </button>
            </div>

            <div
              style={{
                background: "#060c18",
                border: `1px solid ${commanderColor}44`,
                borderRadius: 4,
                padding: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  ...goldText,
                  fontSize: 10,
                  marginBottom: 6,
                  letterSpacing: "0.1em",
                }}
              >
                ✦ SRS 22 CHIP
              </div>
              {["MONITOR", "COMMANDER", "STABILIZER"].map((label) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: commanderColor,
                      boxShadow: `0 0 4px ${commanderColor}`,
                    }}
                  />
                  <span style={{ fontSize: 9, color: commanderColor }}>
                    {label} ACTIVE
                  </span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 9, color: "#2a4a6f", lineHeight: 1.6 }}>
              <div>● ZERO CLIPPING</div>
              <div>● ZERO BACKGROUND NOISE</div>
              <div>● ANTI-DISTORTION</div>
              <div>● 20 SMART CHIPS ACTIVE</div>
            </div>
          </div>

          {/* Stabilizer */}
          <div style={{ ...ps, flex: "1 1 220px", minWidth: 0 }}>
            <div style={{ ...labelStyle, marginBottom: 8 }}>STABILIZER</div>
            <div
              style={{
                ...greenText,
                fontSize: 10,
                marginBottom: 6,
                fontWeight: "bold",
              }}
            >
              800,000,000 + 800,000,000
            </div>
            <div style={{ ...goldText, fontSize: 9, marginBottom: 10 }}>
              ✦ TITANIUM GRADE
            </div>

            {[
              "SIGNAL CORRECTION",
              "DISTORTION REMOVAL",
              "SMART CHIP ACTIVE",
              "17MB MEMORY",
              "COMMANDER LINKED",
              "CHAIN BLOCK WIRED",
            ].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 5,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: commanderColor,
                    boxShadow: `0 0 5px ${commanderColor}`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 9, color: commanderColor }}>
                  {label}
                </span>
              </div>
            ))}

            <div style={{ marginTop: 8, fontSize: 9, color: "#2a4a6f" }}>
              DOES NOT LIMIT SIGNAL · FULL POWER PRESERVED
            </div>
          </div>
        </div>

        {/* ===== ROW: BASS + LOUD BOOSTER + 1700 SLIDER + CHAIN BLOCK ===== */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* 80Hz Bass */}
          <div style={{ ...ps, flex: "1 1 160px", minWidth: 0 }}>
            <div style={{ ...labelStyle }}>80Hz BASS PROGRAMME</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{ fontSize: 10, color: bassOn ? "#00ff88" : "#4a6fa5" }}
              >
                {bassOn ? "● ACTIVE" : "○ OFF"}
              </span>
              <button
                type="button"
                data-ocid="bass.toggle"
                onClick={() => {
                  setBassOn((p) => !p);
                  const { bassFilter } = audioRef.current;
                  if (bassFilter) bassFilter.gain.value = !bassOn ? 3 : 0;
                }}
                style={{
                  background: bassOn ? "#002a10" : "#0d1526",
                  border: `1px solid ${bassOn ? "#00ff88" : "#1e3a5f"}`,
                  color: bassOn ? "#00ff88" : "#4a6fa5",
                  padding: "3px 10px",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontSize: 10,
                }}
              >
                {bassOn ? "ON" : "OFF"}
              </button>
            </div>
            <div style={{ fontSize: 9, color: "#2a4a6f", lineHeight: 1.6 }}>
              <div>LOWSHELF · 80Hz</div>
              <div>NATURAL DROP</div>
              <div>ROCK CONCERT BASS</div>
            </div>
          </div>

          {/* Loud Booster */}
          <div style={{ ...ps, flex: "1 1 180px", minWidth: 0 }}>
            <div style={{ ...labelStyle }}>LOUD BOOSTER 1700</div>
            <div style={{ ...goldText, fontSize: 11, marginBottom: 6 }}>
              ✦ TITANIUM CLAMP
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ ...goldText, fontSize: 10 }}>0</span>
              <span
                style={{ color: commanderColor, fontSize: 11, fontWeight: 700 }}
              >
                {loudBoosterVal}
              </span>
              <span style={{ ...goldText, fontSize: 10 }}>1700</span>
            </div>
            <input
              data-ocid="loud_booster.input"
              type="range"
              className="h-range"
              min={0}
              max={1700}
              step={1}
              value={loudBoosterVal}
              onChange={(e) =>
                setLoudBoosterVal(Number.parseInt(e.target.value))
              }
              style={{ width: "100%" }}
            />
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginTop: 8,
              }}
            >
              {["CHAIN LINKED", "TITANIUM CLAMP", "ZERO DISTORTION"].map(
                (l) => (
                  <div
                    key={l}
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: commanderColor,
                        boxShadow: `0 0 4px ${commanderColor}`,
                      }}
                    />
                    <span style={{ fontSize: 8, color: commanderColor }}>
                      {l}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* 1700 Volume Slider */}
          <div style={{ ...ps, flex: "2 1 200px", minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ ...labelStyle, marginBottom: 0 }}>
                1700 VOLUME CONTROL
              </div>
              <span style={{ ...goldText, fontSize: 11 }}>{volume1700}</span>
            </div>
            <input
              data-ocid="volume1700.input"
              type="range"
              className="h-range"
              min={0}
              max={1700}
              step={1}
              value={volume1700}
              onChange={(e) => setVolume1700(Number.parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontSize: 9,
                color: "#2a4a6f",
              }}
            >
              <span>SILENT</span>
              <span>MAX OUTPUT</span>
            </div>
          </div>

          {/* Chain Block */}
          <div style={{ ...ps, flex: "1 1 160px", minWidth: 0 }}>
            <div style={{ ...labelStyle }}>CHAIN BLOCK</div>
            <div
              style={{
                ...greenText,
                fontSize: 10,
                marginBottom: 8,
                fontWeight: "bold",
              }}
            >
              ALL SYSTEMS CONNECTED
            </div>
            {[
              "ENGINES",
              "EQ 10-BAND",
              "EQ 31-BAND",
              "BASS 80Hz",
              "STABILIZER",
              "COMMANDER",
              "SRS 22",
            ].map((sys) => (
              <div
                key={sys}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 3,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: commanderColor,
                    boxShadow: `0 0 3px ${commanderColor}`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 8, color: commanderColor }}>
                  {sys}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== ROW: AUTO FREQUENCY GENERATOR ===== */}
        <div style={{ ...ps }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ ...labelStyle, marginBottom: 0 }}>
              AUTO FREQUENCY GENERATOR
            </div>
            <div
              style={{
                background: "#060c18",
                border: "1px solid #1e3a5f",
                borderRadius: 3,
                padding: "3px 10px",
                fontSize: 9,
                color: "#7ab3e0",
                letterSpacing: "0.1em",
              }}
            >
              PROFILE: <span style={greenText}>{freqProfile}</span>
            </div>
            <div style={{ fontSize: 9, color: "#4a6fa5" }}>
              ANALYZES EVERY 500ms · AUTO-ADJUSTS ENGINES
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              alignItems: "flex-end",
              height: 60,
            }}
          >
            {specBars.map((level, i) => (
              <div
                key={["b0", "b1", "b2", "b3", "b4", "b5", "b6", "b7"][i]}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: `${Math.max(4, level * 100)}%`,
                  background: "linear-gradient(to top, #00ff88, #00aaff)",
                  borderRadius: "2px 2px 0 0",
                  boxShadow:
                    level > 0.1 ? "0 0 8px rgba(0,255,136,0.4)" : "none",
                  transition: "height 0.08s",
                  opacity: level > 0.01 ? 1 : 0.15,
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
              fontSize: 8,
              color: "#2a4a6f",
            }}
          >
            <span>20Hz</span>
            <span>250Hz</span>
            <span>1kHz</span>
            <span>4kHz</span>
            <span>20kHz</span>
          </div>
        </div>

        {/* ===== ROW: 31-BAND EQ — RACK HARDWARE STYLE ===== */}
        <div
          className="rack-eq-panel"
          style={{ width: "100%", boxSizing: "border-box" }}
        >
          <div className="rack-eq-faceplate">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "#7ab3e0",
                  letterSpacing: "0.12em",
                }}
              >
                PSP·GEQ·31
              </span>
              <span
                style={{
                  fontSize: 7,
                  color: "#2a4a6f",
                  letterSpacing: "0.07em",
                }}
              >
                POWERSOUND PRO — 31-BAND GRAPHIC EQ
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {["ROCK", "HIP-HOP", "POP", "FLAT"].map((preset, pi) => (
                  <button
                    type="button"
                    key={preset}
                    data-ocid={`eq31.button.${pi + 1}`}
                    onClick={() =>
                      applyPreset31([ROCK_31, HIPHOP_31, POP_31, FLAT_31][pi])
                    }
                    style={{
                      background: "#0d2050",
                      border: "1px solid #1e5fa5",
                      color: "#7ab3e0",
                      padding: "2px 6px",
                      borderRadius: 2,
                      cursor: "pointer",
                      fontSize: 8,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <span
                style={{ ...goldText, fontSize: 8, letterSpacing: "0.1em" }}
              >
                A⁺B⁺C⁺D⁺
              </span>
            </div>
          </div>
          {/* Sliders row — all 31 bands in one horizontal rack */}
          <div
            className="rack-eq-sliders"
            style={{ height: 132, width: "100%" }}
          >
            <div className="rack-eq-zeroline" />
            {EQ31_BANDS.map((freq, i) => {
              const pct = i / (EQ31_BANDS.length - 1);
              const r = Math.round(20 + pct * 200);
              const g = Math.round(80 + pct * 112);
              const b = Math.round(230 - pct * 170);
              const thumbColor = `linear-gradient(180deg, rgb(${r + 30},${g + 20},${b}) 0%, rgb(${r},${g},${b - 20}) 100%)`;
              return (
                <div key={freq} className="rack-eq-band">
                  <div
                    className={`rack-eq-db${eq31vals[i] > 0 ? " active-pos" : eq31vals[i] < 0 ? " active-neg" : ""}`}
                  >
                    {eq31vals[i] !== 0
                      ? (eq31vals[i] > 0 ? "+" : "") + eq31vals[i]
                      : "·"}
                  </div>
                  <div className="rack-v-range-wrapper">
                    <input
                      data-ocid={`eq31.input.${i + 1}`}
                      type="range"
                      className="rack-v-range-31"
                      style={
                        {
                          "--rack-thumb-color": thumbColor,
                        } as React.CSSProperties
                      }
                      min={-12}
                      max={12}
                      step={0.5}
                      value={eq31vals[i]}
                      onChange={(e) => {
                        const v = Number.parseFloat(e.target.value);
                        setEq31vals((prev) =>
                          prev.map((x, j) => (j === i ? v : x)),
                        );
                      }}
                    />
                  </div>
                  <div className="rack-eq-freq">
                    {freq >= 1000 ? `${freq / 1000}k` : freq}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== INSTRUMENT MIXER ===== */}
        <div data-ocid="mixer.section" style={{ ...ps }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div style={{ ...labelStyle, marginBottom: 0 }}>
              INSTRUMENT MIXER — SET &amp; EQ
            </div>
            <span style={{ ...goldText, fontSize: 9 }}>
              A⁺B⁺C⁺D⁺ CHANNEL PROCESSING
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {["FLAT", "BASS", "DRUMS", "GUITAR", "VOCALS", "KEYS", "SYNTH"].map(
              (inst) => (
                <div
                  key={inst}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 56,
                    cursor: "pointer",
                  }}
                >
                  <button
                    type="button"
                    data-ocid={`mixer.${inst.toLowerCase()}.button`}
                    onClick={() => {
                      setSelectedInstrument(inst);
                      setEq10vals(INSTRUMENT_EQ_PRESETS[inst]);
                    }}
                    style={{
                      fontSize: 8,
                      letterSpacing: "0.1em",
                      padding: "3px 6px",
                      borderRadius: 3,
                      border:
                        selectedInstrument === inst
                          ? "1px solid #f0c040"
                          : "1px solid #1e3a5f",
                      color:
                        selectedInstrument === inst ? "#f0c040" : "#4a6fa5",
                      background:
                        selectedInstrument === inst ? "#0d2050" : "transparent",
                      boxShadow:
                        selectedInstrument === inst
                          ? "0 0 8px rgba(240,192,64,0.4)"
                          : "none",
                      textShadow:
                        selectedInstrument === inst
                          ? "0 0 6px #f0c040"
                          : "none",
                      userSelect: "none" as const,
                    }}
                  >
                    {inst}
                  </button>
                  <div className="v-range-wrapper" style={{ height: 110 }}>
                    <input
                      type="range"
                      data-ocid={`mixer.${inst.toLowerCase()}.input`}
                      className="v-range"
                      min={0}
                      max={100}
                      step={1}
                      value={instrumentMixVals[inst] ?? 75}
                      style={{ height: 100 }}
                      onChange={(e) => {
                        const v = Number.parseFloat(e.target.value);
                        setInstrumentMixVals((prev) => ({
                          ...prev,
                          [inst]: v,
                        }));
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color: "#4a6fa5",
                      textAlign: "center",
                    }}
                  >
                    {instrumentMixVals[inst] ?? 75}
                  </div>
                  <div
                    style={{
                      fontSize: 7,
                      color: "#2a4a6f",
                      textAlign: "center",
                    }}
                  >
                    MIX
                  </div>
                </div>
              ),
            )}
          </div>
          <div style={{ fontSize: 8, color: "#2a4a6f", marginTop: 4 }}>
            TAP AN INSTRUMENT TO LOAD ITS EQ CURVE INTO THE 10-BAND EQUALIZER
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div
          style={{
            textAlign: "center",
            padding: "16px",
            borderTop: "1px solid #1e3a5f",
            fontSize: 10,
            color: "#2a4a6f",
          }}
        >
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            style={{ color: "#4a6fa5", textDecoration: "none" }}
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </div>
  );
}
