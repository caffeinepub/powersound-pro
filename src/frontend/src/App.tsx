import { useCallback, useEffect, useRef, useState } from "react";

// ─── BOOK ANIMATION ────────────────────────────────────────────────────────────
function BookAnimation({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 6000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000814",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1200px",
        zIndex: 9999,
      }}
    >
      <div style={{ position: "relative", width: 320, height: 420 }}>
        {/* Left cover */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "50%",
            height: "100%",
            background:
              "linear-gradient(135deg, #0a1628 0%, #001f5c 50%, #0d2b7a 100%)",
            border: "2px solid #00aaff",
            transformOrigin: "right center",
            animation: "openLeft 6s cubic-bezier(0.4,0,0.2,1) forwards",
            boxShadow: "0 0 40px #00aaff88",
            borderRadius: "4px 0 0 4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "#00aaff",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              opacity: 0.8,
            }}
          >
            POWER
          </span>
        </div>
        {/* Right cover */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "50%",
            height: "100%",
            background:
              "linear-gradient(225deg, #0a1628 0%, #001f5c 50%, #0d2b7a 100%)",
            border: "2px solid #00aaff",
            transformOrigin: "left center",
            animation: "openRight 6s cubic-bezier(0.4,0,0.2,1) forwards",
            boxShadow: "0 0 40px #00aaff88",
            borderRadius: "0 4px 4px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "#00aaff",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              opacity: 0.8,
            }}
          >
            SOUND
          </span>
        </div>
        {/* Spine glow */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: 4,
            height: "100%",
            background: "#00aaff",
            boxShadow: "0 0 20px #00aaff",
            transform: "translateX(-50%)",
            animation: "spineGlow 6s ease-in-out forwards",
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
            zIndex: 10,
            animation: "fadeInTitle 1s 2s ease-in forwards",
            opacity: 0,
          }}
        >
          <div
            style={{
              color: "#00aaff",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: 4,
              textShadow: "0 0 30px #00aaff",
            }}
          >
            POWERSOUND
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 13,
              letterSpacing: 6,
              marginTop: 4,
            }}
          >
            PRO
          </div>
        </div>
      </div>
      <style>{`
        @keyframes openLeft {
          0% { transform: rotateY(0deg); }
          20% { transform: rotateY(-5deg); }
          100% { transform: rotateY(-160deg); }
        }
        @keyframes openRight {
          0% { transform: rotateY(0deg); }
          20% { transform: rotateY(5deg); }
          100% { transform: rotateY(160deg); }
        }
        @keyframes spineGlow {
          0%,40% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fadeInTitle {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── AUDIO ENGINE ──────────────────────────────────────────────────────────────
// ZERO GAIN SERIES CHAIN:
// source → SignalGuardian → Engine1(lowshelf) → Engine2(peaking) → Engine3(peaking) → Engine4(highshelf)
//       → engineMerge → EQ×10 → Bass80 → Stab1 → Stab2 → EQ31×31 → destination
// No GainNode multipliers anywhere. Battery powers the amp only.

const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// 31-band 1/3-octave center frequencies
const EQ31_FREQS = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
  800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500,
  16000, 20000,
];

function eq31Label(f: number): string {
  if (f >= 1000) {
    const k = f / 1000;
    return k === Math.floor(k) ? `${k}k` : `${k}k`;
  }
  return `${f}`;
}

// Genre presets for 31-band EQ (dB values per band)
const EQ31_PRESETS: Record<string, number[]> = {
  FLAT: Array(31).fill(0),
  ROCK: [
    4, 4, 3, 3, 2, 1, 0, 0, -1, -1, -1, 0, 1, 2, 3, 3, 2, 1, 0, 0, 1, 2, 3, 4,
    5, 5, 4, 3, 2, 1, 0,
  ],
  "HIP-HOP": [
    6, 6, 5, 5, 4, 3, 2, 2, 1, 0, -1, -1, -2, -2, -1, 0, 0, 0, 1, 1, 0, -1, -1,
    0, 1, 2, 3, 3, 2, 1, 0,
  ],
  POP: [
    1, 1, 1, 2, 2, 1, 0, 0, -1, -1, -1, 0, 1, 2, 3, 4, 4, 3, 2, 1, 1, 2, 3, 3,
    2, 1, 0, 0, 1, 1, 1,
  ],
};

// Original filter definitions (type + frequency)
const ENGINE_DEFS: [BiquadFilterType, number][] = [
  ["lowshelf", 200], // Engine 1: shapes bass region
  ["peaking", 700], // Engine 2: shapes low-mids
  ["peaking", 3500], // Engine 3: shapes high-mids
  ["highshelf", 6000], // Engine 4: shapes highs/air
];

interface AudioChain {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  signalGuardian: DynamicsCompressorNode;
  engines: BiquadFilterNode[];
  engineMerge: DynamicsCompressorNode;
  eqBands: BiquadFilterNode[];
  bass80: BiquadFilterNode;
  stab1: DynamicsCompressorNode;
  stab2: DynamicsCompressorNode;
  eq31Bands: BiquadFilterNode[];
}

function buildChain(ctx: AudioContext, el: HTMLAudioElement): AudioChain {
  const source = ctx.createMediaElementSource(el);

  // Signal Guardian — ultra-gentle pre-correction, ratio 1.05:1
  const signalGuardian = ctx.createDynamicsCompressor();
  signalGuardian.threshold.value = -3;
  signalGuardian.knee.value = 40;
  signalGuardian.ratio.value = 1.05;
  signalGuardian.attack.value = 0.003;
  signalGuardian.release.value = 0.1;

  // 4 Engines — pure BiquadFilter signal shapers, ZERO gain, wired SERIES
  const engines = ENGINE_DEFS.map(([type, freq]) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = 1.0;
    f.gain.value = 0; // neutral — no boost, no cut
    return f;
  });

  // Engine merge collector — ultra-transparent DynamicsCompressor (ratio 1:1 = pass-through)
  const engineMerge = ctx.createDynamicsCompressor();
  engineMerge.threshold.value = -100;
  engineMerge.knee.value = 40;
  engineMerge.ratio.value = 1;
  engineMerge.attack.value = 0;
  engineMerge.release.value = 0.25;

  // 10-band DJ EQ — peaking filters, gain controlled by slider
  const eqBands = EQ_FREQS.map((freq) => {
    const f = ctx.createBiquadFilter();
    f.type = "peaking";
    f.frequency.value = freq;
    f.Q.value = 1.4;
    f.gain.value = 0; // flat start
    return f;
  });

  // 80Hz Bass programme — lowshelf, flat start, passes all higher frequencies through unchanged
  const bass80 = ctx.createBiquadFilter();
  bass80.type = "lowshelf";
  bass80.frequency.value = 80;
  bass80.gain.value = 0; // flat start, no boost — signal shaping only

  // Stabilizer Stage 1 — 800,000,000 gentle (ratio 2:1)
  const stab1 = ctx.createDynamicsCompressor();
  stab1.threshold.value = -30;
  stab1.knee.value = 40;
  stab1.ratio.value = 2;
  stab1.attack.value = 0.003;
  stab1.release.value = 0.25;

  // Stabilizer Stage 2 — 800,000,000 titanium (ratio 2:1)
  const stab2 = ctx.createDynamicsCompressor();
  stab2.threshold.value = -20;
  stab2.knee.value = 30;
  stab2.ratio.value = 2;
  stab2.attack.value = 0.001;
  stab2.release.value = 0.15;

  // 31-band graphic EQ — peaking filters, Q=1.4, gain=0 at start
  const eq31Bands = EQ31_FREQS.map((freq) => {
    const f = ctx.createBiquadFilter();
    f.type = "peaking";
    f.frequency.value = freq;
    f.Q.value = 1.4;
    f.gain.value = 0;
    return f;
  });

  // ── Wire the chain — SERIES ─────────────────────────────────────────────────
  // source → signalGuardian → engine1..4 → engineMerge → EQ10 → bass80 → stab1 → stab2 → EQ31 → destination
  source.connect(signalGuardian);
  let eNode: AudioNode = signalGuardian;
  for (const e of engines) {
    eNode.connect(e);
    eNode = e;
  }
  eNode.connect(engineMerge);

  // engineMerge → 10-band EQ in series
  let node: AudioNode = engineMerge;
  for (const b of eqBands) {
    node.connect(b);
    node = b;
  }

  // → bass80 → stab1 → stab2
  node.connect(bass80);
  bass80.connect(stab1);
  stab1.connect(stab2);

  // stab2 → 31-band EQ in series → destination
  let n31: AudioNode = stab2;
  for (const b of eq31Bands) {
    n31.connect(b);
    n31 = b;
  }
  n31.connect(ctx.destination);

  return {
    ctx,
    source,
    signalGuardian,
    engines,
    engineMerge,
    eqBands,
    bass80,
    stab1,
    stab2,
    eq31Bands,
  };
}

// ─── PANELS & UI ───────────────────────────────────────────────────────────────
const BG = "#000d1a";
const PANEL = "#001428";
const BORDER = "#003366";
const GREEN = "#00ff88";
const BLUE = "#00aaff";
const DIM = "#004488";

function Panel({
  title,
  children,
  style,
}: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: "10px 14px",
        marginBottom: 10,
        ...style,
      }}
    >
      <div
        style={{
          color: BLUE,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function GreenDot({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: active ? GREEN : DIM,
        boxShadow: active ? `0 0 6px ${GREEN}` : "none",
        marginRight: 6,
      }}
    />
  );
}

function EQSlider({
  freq,
  value,
  onChange,
}: { freq: number; value: number; onChange: (v: number) => void }) {
  const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        minWidth: 28,
      }}
    >
      <span style={{ color: GREEN, fontSize: 9, fontWeight: 700 }}>
        {value > 0 ? `+${value}` : value}
      </span>
      <input
        type="range"
        min={-12}
        max={12}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          writingMode: "vertical-lr" as const,
          direction: "rtl" as const,
          height: 80,
          width: 20,
          cursor: "pointer",
          accentColor: BLUE,
        }}
        data-ocid={`eq.slider.${label}`}
      />
      <span style={{ color: "#aaa", fontSize: 9 }}>{label}</span>
    </div>
  );
}

// ─── 31-BAND EQ SLIDER ────────────────────────────────────────────────────────
function Eq31Slider({
  freq,
  value,
  onChange,
}: { freq: number; value: number; onChange: (v: number) => void }) {
  const label = eq31Label(freq);
  // Color the slider track based on value
  const barColor = value > 0 ? GREEN : value < 0 ? "#ff4455" : BLUE;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        minWidth: 22,
        flex: "0 0 auto",
      }}
    >
      {/* dB readout */}
      <span
        style={{
          color: barColor,
          fontSize: 8,
          fontWeight: 700,
          lineHeight: 1,
          minHeight: 10,
          textAlign: "center",
          letterSpacing: 0,
        }}
      >
        {value > 0 ? `+${value}` : value === 0 ? "0" : value}
      </span>
      {/* Vertical slider */}
      <div
        style={{
          position: "relative",
          height: 100,
          width: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Center tick line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 1,
            background: `${BLUE}44`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <input
          type="range"
          min={-12}
          max={12}
          step={0.5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          data-ocid={`eq31.slider.${label}`}
          style={{
            writingMode: "vertical-lr" as const,
            direction: "rtl" as const,
            height: 100,
            width: 20,
            cursor: "pointer",
            accentColor: barColor,
            background: "transparent",
          }}
        />
      </div>
      {/* Freq label */}
      <span
        style={{
          color: "#4488aa",
          fontSize: 7,
          lineHeight: 1,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
const CHIP_IDS = Array.from({ length: 20 }, (_, i) => `chip-id-${i + 1}`);

const ENGINE_INFO = [
  {
    label: "ENGINE 1",
    type: "LOWSHELF",
    range: "BASS REGION",
    color: "#0055ff",
  },
  {
    label: "ENGINE 2",
    type: "PEAKING",
    range: "LOW-MIDS 700Hz",
    color: "#0088ff",
  },
  {
    label: "ENGINE 3",
    type: "PEAKING",
    range: "HIGH-MIDS 3.5kHz",
    color: "#00aaff",
  },
  {
    label: "ENGINE 4",
    type: "HIGHSHELF",
    range: "HIGHS/AIR 6kHz+",
    color: "#00ccff",
  },
];

export default function App() {
  const [showBook, setShowBook] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [battery, setBattery] = useState(0);
  const [commanderOn, setCommanderOn] = useState(true);
  const [bass80Freq, setBass80Freq] = useState(80);
  const [routeMode, setRouteMode] = useState<"both" | "bass" | "highs">("both");
  const [eqGains, setEqGains] = useState<number[]>(Array(10).fill(0));
  const [eq31Gains, setEq31Gains] = useState<number[]>(Array(31).fill(0));
  const [activePreset, setActivePreset] = useState<string>("FLAT");
  const [chipStates, setChipStates] = useState<boolean[]>(Array(20).fill(true));
  const [healingOn, setHealingOn] = useState(true);
  const [restoringOn, setRestoringOn] = useState(true);
  const [freezingOn, setFreezingOn] = useState(false);
  const [memLog, setMemLog] = useState<string[]>([]);
  const [freqProfile, setFreqProfile] = useState<string>("Analyzing...");
  const [engineActivity, setEngineActivity] = useState([0, 0, 0, 0]);
  // Engine ON/OFF switches — when OFF the filter becomes "allpass" (transparent bypass)
  const [engineActive, setEngineActive] = useState<boolean[]>([
    true,
    true,
    true,
    true,
  ]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const chainRef = useRef<AudioChain | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Battery drain — powers the amp only
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setBattery((b) => {
        if (b <= 1) {
          audioRef.current?.pause();
          setIsPlaying(false);
          logMem("AMP OFF — Battery depleted");
          return 0;
        }
        return b - 0.05;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [isPlaying]);

  function logMem(msg: string) {
    setMemLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 49),
    ]);
  }

  const initChain = useCallback((ctx: AudioContext, el: HTMLAudioElement) => {
    if (chainRef.current) return;
    const chain = buildChain(ctx, el);
    chainRef.current = chain;

    // Analyser for VU and frequency detection
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    // Connect analyser in parallel from stab2 (last 31-band node already goes to destination)
    chain.stab2.connect(analyser);
    analyserRef.current = analyser;
  }, []);

  // Load file
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    const el = audioRef.current!;
    el.src = url;
    // Tear down old chain so fresh one is built on next play press
    if (chainRef.current) {
      try {
        chainRef.current.source.disconnect();
      } catch {}
      try {
        chainRef.current.ctx.close();
      } catch {}
      chainRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    setHasFile(true);
    setIsPlaying(false);
    logMem(`File loaded: ${f.name}`);
  }

  async function togglePlay() {
    if (battery <= 0) {
      logMem("CHARGE BATTERY FIRST — Press CHARGE button");
      return;
    }
    const el = audioRef.current!;
    if (!hasFile) {
      logMem("LOAD A MUSIC FILE FIRST — Use the file picker above");
      return;
    }

    let ctx: AudioContext;
    if (!chainRef.current) {
      ctx = new AudioContext();
      initChain(ctx, el);
    } else {
      ctx = chainRef.current.ctx;
    }
    if (ctx.state === "suspended") await ctx.resume();

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animRef.current);
    } else {
      await el.play();
      setIsPlaying(true);
      startAnalyser();
      logMem("PLAYBACK START — Commander active");
    }
  }

  function startAnalyser() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frameCount = 0;

    function tick() {
      animRef.current = requestAnimationFrame(tick);
      if (!analyser) return;
      analyser.getByteFrequencyData(data);
      frameCount++;

      // Engine activity bars
      const bassAvg = data.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
      const loMidAvg = data.slice(8, 24).reduce((a, b) => a + b, 0) / 16;
      const hiMidAvg = data.slice(24, 64).reduce((a, b) => a + b, 0) / 40;
      const highAvg = data.slice(64, 128).reduce((a, b) => a + b, 0) / 64;
      setEngineActivity([
        bassAvg / 255,
        loMidAvg / 255,
        hiMidAvg / 255,
        highAvg / 255,
      ]);

      // Freq profile every 60 frames
      if (frameCount % 60 === 0) {
        const total = data.reduce((a, b) => a + b, 0);
        if (total === 0) return;
        const bassScore = data.slice(0, 20).reduce((a, b) => a + b, 0) / total;
        const midScore = data.slice(20, 80).reduce((a, b) => a + b, 0) / total;
        const highScore =
          data.slice(80, 128).reduce((a, b) => a + b, 0) / total;
        if (bassScore > 0.45) setFreqProfile("BASS HEAVY");
        else if (highScore > 0.35) setFreqProfile("BRIGHT / AIRY");
        else if (midScore > 0.45) setFreqProfile("MID-RANGE FOCUSED");
        else setFreqProfile("BALANCED");
      }
    }
    tick();
  }

  // EQ apply
  function setEqBand(i: number, val: number) {
    const next = [...eqGains];
    next[i] = val;
    setEqGains(next);
    if (chainRef.current?.eqBands[i]) {
      chainRef.current.eqBands[i].gain.value = val;
    }
  }

  // 31-band EQ apply
  function setEq31Band(i: number, val: number) {
    const next = [...eq31Gains];
    next[i] = val;
    setEq31Gains(next);
    setActivePreset("CUSTOM");
    if (chainRef.current?.eq31Bands[i]) {
      chainRef.current.eq31Bands[i].gain.value = val;
    }
  }

  function applyEq31Preset(name: string) {
    const gains = EQ31_PRESETS[name];
    if (!gains) return;
    setEq31Gains([...gains]);
    setActivePreset(name);
    if (chainRef.current) {
      gains.forEach((g, i) => {
        if (chainRef.current!.eq31Bands[i]) {
          chainRef.current!.eq31Bands[i].gain.value = g;
        }
      });
    }
    logMem(`31-Band EQ preset: ${name}`);
  }

  // Bass80 slider — sweeps shelf frequency only
  function setBassFreq(v: number) {
    setBass80Freq(v);
    if (chainRef.current) chainRef.current.bass80.frequency.value = v;
  }

  // Engine ON/OFF toggle — switches between original filter type and "allpass" bypass
  function toggleEngine(i: number) {
    const next = [...engineActive];
    next[i] = !next[i];
    setEngineActive(next);
    const chain = chainRef.current;
    if (chain) {
      const eng = chain.engines[i];
      if (next[i]) {
        // Restore original filter type
        eng.type = ENGINE_DEFS[i][0];
        eng.frequency.value = ENGINE_DEFS[i][1];
        eng.gain.value = 0;
      } else {
        // Bypass: allpass passes everything unchanged
        eng.type = "allpass";
      }
    }
    logMem(`Engine ${i + 1} ${next[i] ? "ON" : "OFF"}`);
  }

  // Smart chip toggle
  function toggleChip(i: number) {
    const next = [...chipStates];
    next[i] = !next[i];
    setChipStates(next);
    logMem(`Smart Chip ${i + 1} ${next[i] ? "ON" : "OFF"}`);
  }

  // Route mode
  function setRoute(mode: "both" | "bass" | "highs") {
    setRouteMode(mode);
    const chain = chainRef.current;
    if (!chain) return;
    // Engine 1 (lowshelf) and Engine 4 (highshelf) routing via frequency adjustment
    if (mode === "bass") {
      chain.engines[3].frequency.value = 200; // push highshelf up, attenuating highs
      logMem("ROUTE: Bass Only");
    } else if (mode === "highs") {
      chain.engines[0].frequency.value = 80; // push lowshelf down, attenuating bass
      logMem("ROUTE: Highs Only");
    } else {
      chain.engines[0].frequency.value = ENGINE_DEFS[0][1];
      chain.engines[3].frequency.value = ENGINE_DEFS[3][1];
      logMem("ROUTE: Bass + Highs");
    }
  }

  const g = commanderOn;

  if (showBook) return <BookAnimation onDone={() => setShowBook(false)} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: "#e0f0ff",
        fontFamily: "'Courier New', monospace",
        padding: "0 0 40px",
        overflowX: "hidden",
      }}
    >
      {/* Award Banner */}
      <div
        style={{
          background: "linear-gradient(90deg, #001f5c, #003399, #001f5c)",
          borderBottom: `2px solid ${BLUE}`,
          padding: "8px 16px",
          textAlign: "center",
          boxShadow: `0 0 20px ${BLUE}44`,
        }}
      >
        <div
          style={{
            color: BLUE,
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 3,
          }}
        >
          AWARD WINNING NUMBER 1
        </div>
        <div style={{ color: "#aaccff", fontSize: 10, letterSpacing: 2 }}>
          GERRED PHILLIPS — Engineer / Product Designer — Built Feb 27 2027
        </div>
      </div>

      <style>{`
        @keyframes chargePulse {
          0%, 100% { box-shadow: 0 0 10px #ffcc0066; transform: scale(1); }
          50% { box-shadow: 0 0 24px #ffcc00cc; transform: scale(1.06); }
        }
        /* 31-band EQ vertical slider track custom */
        .eq31-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 3px;
          background: #00aaff;
          border: 2px solid #00ffcc;
          box-shadow: 0 0 6px #00aaff88;
          cursor: pointer;
        }
        .eq31-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          background: #00aaff;
          border: 2px solid #00ffcc;
          box-shadow: 0 0 6px #00aaff88;
          cursor: pointer;
        }
      `}</style>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "10px 12px" }}>
        {/* Commander Master Control */}
        <div
          style={{
            background: "linear-gradient(135deg, #001428, #002255)",
            border: `2px solid ${g ? GREEN : BORDER}`,
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 10,
            boxShadow: g ? `0 0 15px ${GREEN}44` : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: g ? GREEN : "#aaa",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 3,
                }}
              >
                COMMANDER
              </div>
              <div style={{ color: "#aaccff", fontSize: 9, letterSpacing: 2 }}>
                MASTER CONTROL — ALL SYSTEMS
              </div>
            </div>
            <button
              type="button"
              data-ocid="commander.toggle"
              onClick={() => {
                setCommanderOn(!commanderOn);
                logMem(`Commander ${!commanderOn ? "ON" : "OFF"}`);
              }}
              style={{
                background: g ? GREEN : "#002244",
                border: `2px solid ${g ? GREEN : BORDER}`,
                color: g ? "#000" : "#aaa",
                borderRadius: 6,
                padding: "6px 14px",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: 2,
              }}
            >
              {g ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* Battery — Powers the Amp */}
        <Panel title="BATTERY — POWER CORE 334 AMP">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                flex: 1,
                height: 20,
                background: "#001122",
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${battery}%`,
                  background: battery > 20 ? GREEN : "#ff4444",
                  transition: "width 1s",
                  boxShadow: `0 0 8px ${battery > 20 ? GREEN : "#ff4444"}`,
                }}
              />
            </div>
            <span
              style={{
                color: GREEN,
                fontSize: 12,
                fontWeight: 700,
                minWidth: 40,
              }}
            >
              {battery.toFixed(0)}%
            </span>
            <button
              type="button"
              data-ocid="battery.charge_button"
              onClick={() => {
                setBattery(100);
                logMem("Battery recharged to 100%");
              }}
              style={{
                background: battery <= 0 ? "#1a3300" : "#001f5c",
                border: `2px solid ${battery <= 0 ? "#ffcc00" : BLUE}`,
                color: battery <= 0 ? "#ffcc00" : BLUE,
                borderRadius: 6,
                padding: battery <= 0 ? "8px 18px" : "4px 10px",
                cursor: "pointer",
                fontSize: battery <= 0 ? 12 : 10,
                fontWeight: battery <= 0 ? 900 : 400,
                letterSpacing: battery <= 0 ? 2 : 0,
                animation:
                  battery <= 0
                    ? "chargePulse 1.2s ease-in-out infinite"
                    : "none",
                boxShadow: battery <= 0 ? "0 0 16px #ffcc0088" : "none",
                transition: "all 0.3s",
              }}
            >
              ⚡ CHARGE
            </button>
          </div>
          <div
            style={{
              color: isPlaying
                ? "#00ff88"
                : battery <= 0
                  ? "#ffcc00"
                  : "#5588aa",
              fontSize: 9,
              fontWeight: battery <= 0 ? 700 : 400,
              marginTop: 4,
              letterSpacing: battery <= 0 ? 1 : 0,
            }}
          >
            {isPlaying
              ? "POWERING AMP + AUDIO SYSTEM — ACTIVE"
              : battery <= 0
                ? "⚡ CHARGE BATTERY TO START"
                : "AMP POWERED — READY"}
          </div>
        </Panel>

        {/* File Loader + Transport */}
        <Panel title="MUSIC SOURCE">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFile}
            style={{ display: "none" }}
          />
          <button
            type="button"
            data-ocid="music.upload_button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "#001428",
              border: "1px solid #00aaff",
              color: "#00aaff",
              borderRadius: 6,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              width: "100%",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            📂 LOAD MUSIC FILE
          </button>
          <audio ref={audioRef} style={{ display: "none" }}>
            <track kind="captions" />
          </audio>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              data-ocid="transport.toggle"
              onClick={togglePlay}
              style={{
                flex: 1,
                background: isPlaying ? "#001f5c" : GREEN,
                border: `1px solid ${GREEN}`,
                color: isPlaying ? GREEN : "#000",
                borderRadius: 6,
                padding: "8px 0",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 2,
              }}
            >
              {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
            </button>
            <button
              type="button"
              data-ocid="transport.stop"
              onClick={() => {
                audioRef.current?.pause();
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                }
                setIsPlaying(false);
              }}
              style={{
                background: "#001428",
                border: `1px solid ${BORDER}`,
                color: "#aaa",
                borderRadius: 6,
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              ⏹
            </button>
          </div>
          {file && (
            <div
              style={{
                color: "#5599cc",
                fontSize: 10,
                marginTop: 6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name}
            </div>
          )}
        </Panel>

        {/* 4 Sound Engines — Pure Signal Panels with ON/OFF switch */}
        <Panel title="SOUND ENGINES — A+B+C+D CLASS — SIGNAL ONLY">
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {ENGINE_INFO.map((e, i) => {
              const isOn = engineActive[i];
              return (
                <div
                  key={e.label}
                  style={{
                    background: "#000d1a",
                    border: `1px solid ${isOn && g ? DIM : BORDER}`,
                    borderRadius: 6,
                    padding: "8px 10px",
                    opacity: isOn ? 1 : 0.5,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Header row: label + status dot + ON/OFF button */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        color: isOn && g ? GREEN : "#aaa",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {e.label}
                    </span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <GreenDot active={isOn && g} />
                      <button
                        type="button"
                        data-ocid={`engine.toggle.${i + 1}`}
                        onClick={() => toggleEngine(i)}
                        style={{
                          background: isOn ? GREEN : "#001428",
                          border: `1px solid ${isOn ? GREEN : BORDER}`,
                          color: isOn ? "#000" : "#5599cc",
                          borderRadius: 3,
                          padding: "1px 6px",
                          cursor: "pointer",
                          fontSize: 8,
                          fontWeight: 900,
                          letterSpacing: 1,
                          lineHeight: "14px",
                        }}
                      >
                        {isOn ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>
                  <div style={{ color: "#5599cc", fontSize: 9 }}>{e.type}</div>
                  <div style={{ color: "#3366aa", fontSize: 9 }}>{e.range}</div>
                  {/* Activity bar */}
                  <div
                    style={{
                      height: 4,
                      background: "#001122",
                      borderRadius: 2,
                      marginTop: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: isOn ? `${engineActivity[i] * 100}%` : "0%",
                        background: e.color,
                        transition: "width 0.1s",
                        boxShadow: `0 0 4px ${e.color}`,
                      }}
                    />
                  </div>
                  <div style={{ color: "#3366aa", fontSize: 8, marginTop: 3 }}>
                    {isOn
                      ? "SERIES — SIGNAL ONLY — NO GAIN"
                      : "BYPASSED — ALLPASS"}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* 10-Band DJ Equalizer */}
        <Panel title="DJ EQUALIZER — 10 BAND — A+B+C+D CLASS — ZERO CLIP">
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: 2 }}
          >
            {EQ_FREQS.map((freq, i) => (
              <EQSlider
                key={freq}
                freq={freq}
                value={eqGains[i]}
                onChange={(v) => setEqBand(i, v)}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              data-ocid="eq.flat_button"
              onClick={() => {
                setEqGains(Array(10).fill(0));
                if (chainRef.current) {
                  for (const b of chainRef.current.eqBands) {
                    b.gain.value = 0;
                  }
                }
                logMem("EQ reset flat");
              }}
              style={{
                background: "#001428",
                border: `1px solid ${BORDER}`,
                color: BLUE,
                borderRadius: 4,
                padding: "3px 10px",
                cursor: "pointer",
                fontSize: 10,
              }}
            >
              FLAT
            </button>
            <span
              style={{ color: "#3366aa", fontSize: 9, alignSelf: "center" }}
            >
              FREQUENCY SHAPING — NO CLIP
            </span>
          </div>
        </Panel>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* POWERSOUND PRO 31-BAND GRAPHIC EQ                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            background:
              "linear-gradient(180deg, #000d1a 0%, #001428 60%, #000c18 100%)",
            border: `1px solid ${BLUE}`,
            borderRadius: 10,
            padding: "12px 14px 10px",
            marginBottom: 10,
            boxShadow: `0 0 24px ${BLUE}22, inset 0 0 40px #00001088`,
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  color: BLUE,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                POWERSOUND PRO
              </div>
              <div
                style={{
                  color: GREEN,
                  fontSize: 9,
                  letterSpacing: 3,
                  marginTop: 2,
                  fontWeight: 700,
                }}
              >
                31-BAND GRAPHIC EQ
              </div>
              <div style={{ color: "#3366aa", fontSize: 8, marginTop: 1 }}>
                1/3-OCTAVE · PEAKING · Q=1.4 · ZERO GAIN MANDATE
              </div>
            </div>
            {/* Active preset badge */}
            <div
              style={{
                background: "#001f5c",
                border: `1px solid ${BLUE}`,
                borderRadius: 4,
                padding: "3px 8px",
                color: BLUE,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                minWidth: 52,
                textAlign: "center",
              }}
            >
              {activePreset}
            </div>
          </div>

          {/* dB scale markers */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 0,
              marginBottom: 2,
              paddingRight: 4,
            }}
          >
            {["+12", "+6", "0", "-6", "-12"].map((lbl) => (
              <span
                key={lbl}
                style={{
                  color: "#224466",
                  fontSize: 7,
                  width: 20,
                  textAlign: "right",
                }}
              >
                {lbl}
              </span>
            ))}
          </div>

          {/* Sliders row — horizontally scrollable */}
          <div
            style={{
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: 4,
              /* Custom scrollbar */
              scrollbarWidth: "thin",
              scrollbarColor: `${BLUE}44 #000d1a`,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 3,
                padding: "0 2px",
                minWidth: "max-content",
              }}
            >
              {EQ31_FREQS.map((freq, i) => (
                <Eq31Slider
                  key={freq}
                  freq={freq}
                  value={eq31Gains[i]}
                  onChange={(v) => setEq31Band(i, v)}
                />
              ))}
            </div>
          </div>

          {/* Frequency range indicators */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
              marginBottom: 10,
            }}
          >
            {[
              { label: "SUB", color: "#0044aa" },
              { label: "BASS", color: "#0066cc" },
              { label: "LOW-MID", color: "#0088ff" },
              { label: "MID", color: "#00aaff" },
              { label: "HIGH-MID", color: "#00ccff" },
              { label: "HIGHS", color: GREEN },
              { label: "AIR", color: "#aaffdd" },
            ].map((r) => (
              <span
                key={r.label}
                style={{ color: r.color, fontSize: 7, fontWeight: 700 }}
              >
                {r.label}
              </span>
            ))}
          </div>

          {/* Preset buttons */}
          <div style={{ display: "flex", gap: 5 }}>
            {["FLAT", "ROCK", "HIP-HOP", "POP"].map((preset) => {
              const isActive = activePreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  data-ocid={
                    preset === "FLAT"
                      ? "eq31.flat_button"
                      : preset === "ROCK"
                        ? "eq31.rock_button"
                        : preset === "HIP-HOP"
                          ? "eq31.hiphop_button"
                          : "eq31.pop_button"
                  }
                  onClick={() => applyEq31Preset(preset)}
                  style={{
                    flex: 1,
                    background: isActive
                      ? preset === "FLAT"
                        ? BLUE
                        : GREEN
                      : "#001428",
                    border: `1px solid ${
                      isActive ? (preset === "FLAT" ? BLUE : GREEN) : BORDER
                    }`,
                    color: isActive ? "#000" : "#5599cc",
                    borderRadius: 5,
                    padding: "6px 2px",
                    cursor: "pointer",
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: 1,
                    boxShadow: isActive
                      ? `0 0 8px ${preset === "FLAT" ? BLUE : GREEN}66`
                      : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {preset}
                </button>
              );
            })}
          </div>

          {/* Bottom status strip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
              paddingTop: 6,
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <GreenDot active={g} />
              <span style={{ color: g ? GREEN : "#3366aa", fontSize: 8 }}>
                COMMANDER LINKED
              </span>
            </div>
            <span style={{ color: "#224466", fontSize: 8 }}>
              CHAIN: STAB2 → EQ31[0..30] → DEST
            </span>
            <span style={{ color: "#224466", fontSize: 8 }}>NO GAIN</span>
          </div>
        </div>

        {/* 80Hz Bass Programme */}
        <Panel title="80HZ BASS PROGRAMME">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "#aaa", fontSize: 10 }}>
                  Bass Frequency Drop
                </span>
                <span style={{ color: GREEN, fontSize: 10, fontWeight: 700 }}>
                  {bass80Freq}Hz
                </span>
              </div>
              <input
                data-ocid="bass80.slider"
                type="range"
                min={40}
                max={200}
                step={1}
                value={bass80Freq}
                onChange={(e) => setBassFreq(Number(e.target.value))}
                style={{ width: "100%", accentColor: BLUE, cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#3366aa", fontSize: 9 }}>40Hz</span>
                <span style={{ color: "#3366aa", fontSize: 9 }}>
                  BASS SHELF — NO GAIN
                </span>
                <span style={{ color: "#3366aa", fontSize: 9 }}>200Hz</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Bass/Highs Routing Switch */}
        <Panel title="SIGNAL ROUTING — BASS / HIGHS SWITCH">
          <div style={{ display: "flex", gap: 6 }}>
            {(["both", "bass", "highs"] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                data-ocid={`route.${mode}_button`}
                onClick={() => setRoute(mode)}
                style={{
                  flex: 1,
                  background: routeMode === mode ? BLUE : "#001428",
                  border: `1px solid ${routeMode === mode ? BLUE : BORDER}`,
                  color: routeMode === mode ? "#000" : "#aaa",
                  borderRadius: 4,
                  padding: "6px 0",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {mode === "both" ? "BASS+HIGHS" : mode.toUpperCase()}
              </button>
            ))}
          </div>
        </Panel>

        {/* Loud Booster 1700 — Pure Signal Shaper */}
        <Panel title="LOUD BOOSTER 1700 — TITANIUM CLAMP — NO GAIN">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <GreenDot active={g} />
                <span
                  style={{
                    color: g ? GREEN : "#aaa",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  TITANIUM CLAMP ACTIVE
                </span>
              </div>
              <div style={{ color: "#3366aa", fontSize: 9, marginTop: 2 }}>
                Signal shaper only — zero gain multiplication
              </div>
              <div style={{ color: "#3366aa", fontSize: 9 }}>
                Stabilizer 800,000,000 direct line — distortion blocked
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: BLUE, fontSize: 18, fontWeight: 900 }}>
                1700
              </div>
              <div style={{ color: "#3366aa", fontSize: 9 }}>RATING</div>
            </div>
          </div>
        </Panel>

        {/* Stabilizer 1,600,000,000 Titanium */}
        <Panel title="STABILIZER — 1,600,000,000 TITANIUM STRENGTH">
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div
              style={{
                background: "#000d1a",
                border: `1px solid ${DIM}`,
                borderRadius: 6,
                padding: 8,
                textAlign: "center",
              }}
            >
              <div style={{ color: GREEN, fontSize: 10, fontWeight: 700 }}>
                STAGE 1
              </div>
              <div style={{ color: BLUE, fontSize: 16, fontWeight: 900 }}>
                800M
              </div>
              <div style={{ color: "#3366aa", fontSize: 9 }}>GENTLE 2:1</div>
              <GreenDot active={g} />
            </div>
            <div
              style={{
                background: "#000d1a",
                border: `1px solid ${DIM}`,
                borderRadius: 6,
                padding: 8,
                textAlign: "center",
              }}
            >
              <div style={{ color: GREEN, fontSize: 10, fontWeight: 700 }}>
                STAGE 2
              </div>
              <div style={{ color: BLUE, fontSize: 16, fontWeight: 900 }}>
                800M
              </div>
              <div style={{ color: "#3366aa", fontSize: 9 }}>TITANIUM 2:1</div>
              <GreenDot active={g} />
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#3366aa", fontSize: 9 }}>
              CORRECTION ONLY — NEVER LIMITS
            </span>
            <span style={{ color: GREEN, fontSize: 10, fontWeight: 700 }}>
              SIGNAL GUARDIAN ACTIVE
            </span>
          </div>
        </Panel>

        {/* 20 Smart Chips */}
        <Panel title="20 SMART CHIPS — A+B+C+D — PROCESSOR">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 4,
            }}
          >
            {chipStates.map((on, i) => (
              <button
                type="button"
                key={CHIP_IDS[i]}
                data-ocid={`chip.toggle.${i + 1}`}
                onClick={() => toggleChip(i)}
                style={{
                  background: on && g ? "#001f5c" : "#000d1a",
                  border: `1px solid ${on && g ? GREEN : BORDER}`,
                  color: on && g ? GREEN : "#3366aa",
                  borderRadius: 4,
                  padding: "4px 2px",
                  cursor: "pointer",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                C{i + 1}
              </button>
            ))}
          </div>
          <div style={{ color: "#3366aa", fontSize: 9, marginTop: 6 }}>
            Each chip: Control / Monitor / Boost — Zero stutter / Zero clip
          </div>
        </Panel>

        {/* Auto Frequency Generator */}
        <Panel title="AUTO FREQUENCY GENERATOR">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <GreenDot active={isPlaying && g} />
              <span style={{ color: g ? GREEN : "#aaa", fontSize: 11 }}>
                GENERATOR ACTIVE
              </span>
              <div style={{ color: "#3366aa", fontSize: 9, marginTop: 2 }}>
                Bass Generator + Highs Generator — Auto-select
              </div>
            </div>
            <div
              style={{
                background: "#001122",
                border: `1px solid ${BLUE}`,
                borderRadius: 4,
                padding: "4px 10px",
                color: BLUE,
                fontSize: 10,
                fontWeight: 700,
                minWidth: 80,
                textAlign: "center",
              }}
            >
              {isPlaying ? freqProfile : "STANDBY"}
            </div>
          </div>
        </Panel>

        {/* Healing / Restoring / Freezing */}
        <Panel title="9.0 HEALING — RESTORING — FREEZING">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 6,
            }}
          >
            {[
              {
                label: "HEALING\n9.0",
                on: healingOn,
                set: setHealingOn,
                id: "healing",
              },
              {
                label: "RESTORING\n9.0",
                on: restoringOn,
                set: setRestoringOn,
                id: "restoring",
              },
              {
                label: "FREEZING\n9.0",
                on: freezingOn,
                set: setFreezingOn,
                id: "freezing",
              },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                data-ocid={`${item.id}.toggle`}
                onClick={() => {
                  item.set(!item.on);
                  logMem(`${item.id.toUpperCase()} ${!item.on ? "ON" : "OFF"}`);
                }}
                style={{
                  background: item.on && g ? "#001f5c" : "#000d1a",
                  border: `1px solid ${item.on && g ? GREEN : BORDER}`,
                  color: item.on && g ? GREEN : "#aaa",
                  borderRadius: 6,
                  padding: "8px 4px",
                  cursor: "pointer",
                  fontSize: 9,
                  fontWeight: 700,
                  whiteSpace: "pre-line",
                  lineHeight: 1.4,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ color: "#3366aa", fontSize: 9, marginTop: 6 }}>
            300,000 Software Tools — 10 Smart Chips for Healing/Restoring
          </div>
        </Panel>

        {/* Compressor */}
        <Panel title="CONTROLLED COMPRESSOR">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <GreenDot active={g} />
              <span style={{ color: g ? GREEN : "#aaa", fontSize: 11 }}>
                COMPRESSOR ACTIVE
              </span>
              <div style={{ color: "#3366aa", fontSize: 9, marginTop: 2 }}>
                Corrects — does not limit — Commander controlled
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: GREEN, fontSize: 9 }}>MEMORY ACTIVE</div>
              <div style={{ color: "#3366aa", fontSize: 9 }}>
                All actions written
              </div>
            </div>
          </div>
        </Panel>

        {/* Distortion Monitor */}
        <Panel title="DISTORTION MONITOR — SIGNAL GUARDIAN">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
            }}
          >
            {[
              { label: "DISTORTION", value: "ZERO", ok: true },
              { label: "GAIN", value: "ZERO", ok: true },
              { label: "CLIP", value: "ZERO", ok: true },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "#000d1a",
                  border: `1px solid ${DIM}`,
                  borderRadius: 4,
                  padding: 6,
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#aaa", fontSize: 8 }}>{item.label}</div>
                <div style={{ color: GREEN, fontSize: 13, fontWeight: 900 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Power Core 334 */}
        <Panel title="POWER CORE 334 — 5000 UNITS">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <GreenDot active={battery > 0 && g} />
              <span
                style={{
                  color: g && battery > 0 ? GREEN : "#aaa",
                  fontSize: 11,
                }}
              >
                AMP POWERED
              </span>
              <div style={{ color: "#3366aa", fontSize: 9, marginTop: 2 }}>
                5000 units — Battery → Amp → App
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: BLUE, fontSize: 16, fontWeight: 900 }}>
                334
              </div>
              <div style={{ color: "#3366aa", fontSize: 9 }}>POWER CORE</div>
            </div>
          </div>
        </Panel>

        {/* Commander Memory Log */}
        <Panel title="COMMANDER MEMORY — 900,000,000 Mb">
          <div
            style={{
              height: 100,
              overflowY: "auto",
              background: "#000811",
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              padding: 6,
            }}
          >
            {memLog.length === 0 ? (
              <div style={{ color: "#3366aa", fontSize: 9 }}>
                Awaiting commands...
              </div>
            ) : (
              memLog.map((m, idx) => (
                <div
                  key={m}
                  style={{
                    color: idx === 0 ? GREEN : "#3366aa",
                    fontSize: 9,
                    marginBottom: 2,
                  }}
                >
                  {m}
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
