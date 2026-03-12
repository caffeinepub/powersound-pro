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
// ZERO GAIN CHAIN: source → SignalGuardian → Engine1-4 → EQ×10 → Bass80 → Stab1 → Stab2 → destination
// No GainNode multipliers anywhere. Battery powers the amp only.

const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

interface AudioChain {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  signalGuardian: DynamicsCompressorNode;
  engines: BiquadFilterNode[];
  eqBands: BiquadFilterNode[];
  bass80: BiquadFilterNode;
  stab1: DynamicsCompressorNode;
  stab2: DynamicsCompressorNode;
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

  // 4 Engines — pure BiquadFilter signal shapers, ZERO gain
  const engineDefs: [BiquadFilterType, number][] = [
    ["lowpass", 200],
    ["bandpass", 500],
    ["bandpass", 3000],
    ["highpass", 6000],
  ];
  const engines = engineDefs.map(([type, freq], _idx) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    // Q at 1.0 = standard, no resonance boost
    f.Q.value = 1.0;
    return f;
  });

  // 10-band DJ EQ — peaking filters, gain controlled by slider
  const eqBands = EQ_FREQS.map((freq) => {
    const f = ctx.createBiquadFilter();
    f.type = "peaking";
    f.frequency.value = freq;
    f.Q.value = 1.4;
    f.gain.value = 0; // flat start
    return f;
  });

  // 80Hz Bass programme — lowpass sweep, NO gain boost
  const bass80 = ctx.createBiquadFilter();
  bass80.type = "lowpass";
  bass80.frequency.value = 80;
  bass80.Q.value = Math.SQRT1_2;

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

  // Wire the chain
  let node: AudioNode = source;
  node.connect(signalGuardian);
  node = signalGuardian;
  for (const e of engines) {
    node.connect(e);
    node = e;
  }
  for (const b of eqBands) {
    node.connect(b);
    node = b;
  }
  node.connect(bass80);
  node = bass80;
  node.connect(stab1);
  stab1.connect(stab2);
  stab2.connect(ctx.destination);

  return {
    ctx,
    source,
    signalGuardian,
    engines,
    eqBands,
    bass80,
    stab1,
    stab2,
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

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
const CHIP_IDS = Array.from({ length: 20 }, (_, i) => `chip-id-${i + 1}`);

export default function App() {
  const [showBook, setShowBook] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [battery, setBattery] = useState(100);
  const [commanderOn, setCommanderOn] = useState(true);
  const [bass80Freq, setBass80Freq] = useState(80);
  const [routeMode, setRouteMode] = useState<"both" | "bass" | "highs">("both");
  const [eqGains, setEqGains] = useState<number[]>(Array(10).fill(0));
  const [chipStates, setChipStates] = useState<boolean[]>(Array(20).fill(true));
  const [healingOn, setHealingOn] = useState(true);
  const [restoringOn, setRestoringOn] = useState(true);
  const [freezingOn, setFreezingOn] = useState(false);
  const [memLog, setMemLog] = useState<string[]>([]);
  const [freqProfile, setFreqProfile] = useState<string>("Analyzing...");
  const [engineActivity, setEngineActivity] = useState([0, 0, 0, 0]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const chainRef = useRef<AudioChain | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);

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
    setIsPlaying(false);
    logMem(`File loaded: ${f.name}`);
  }

  async function togglePlay() {
    if (battery <= 0) {
      logMem("AMP OFF — Charge battery");
      return;
    }
    const el = audioRef.current!;
    if (!el.src) return;

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

  // Bass80 slider — sweeps filter frequency only
  function setBassFreq(v: number) {
    setBass80Freq(v);
    if (chainRef.current) chainRef.current.bass80.frequency.value = v;
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
    // Engine 1 (lowpass) and Engine 4 (highpass) routing via Q adjustment
    if (mode === "bass") {
      chain.engines[3].frequency.value = 200; // push highpass up, attenuating highs
      logMem("ROUTE: Bass Only");
    } else if (mode === "highs") {
      chain.engines[0].frequency.value = 80; // push lowpass down, attenuating bass
      logMem("ROUTE: Highs Only");
    } else {
      chain.engines[0].frequency.value = 200;
      chain.engines[3].frequency.value = 6000;
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
                background: "#001f5c",
                border: `1px solid ${BLUE}`,
                color: BLUE,
                borderRadius: 4,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 10,
              }}
            >
              CHARGE
            </button>
          </div>
          <div style={{ color: "#5588aa", fontSize: 9, marginTop: 4 }}>
            Amp power only — not connected to audio signal
          </div>
        </Panel>

        {/* File Loader + Transport */}
        <Panel title="MUSIC SOURCE">
          <input
            data-ocid="music.upload_button"
            type="file"
            accept="audio/*"
            onChange={handleFile}
            style={{
              color: "#aaa",
              fontSize: 11,
              marginBottom: 8,
              width: "100%",
            }}
          />
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

        {/* 4 Sound Engines — Pure Signal Panels */}
        <Panel title="SOUND ENGINES — A+B+C+D CLASS — SIGNAL ONLY">
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {[
              {
                label: "ENGINE 1",
                type: "LOWPASS",
                range: "0–200Hz",
                color: "#0055ff",
              },
              {
                label: "ENGINE 2",
                type: "BANDPASS",
                range: "200–1kHz",
                color: "#0088ff",
              },
              {
                label: "ENGINE 3",
                type: "BANDPASS",
                range: "1k–6kHz",
                color: "#00aaff",
              },
              {
                label: "ENGINE 4",
                type: "HIGHPASS",
                range: "6k–20kHz",
                color: "#00ccff",
              },
            ].map((e, i) => (
              <div
                key={e.label}
                style={{
                  background: "#000d1a",
                  border: `1px solid ${g ? DIM : BORDER}`,
                  borderRadius: 6,
                  padding: "8px 10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      color: g ? GREEN : "#aaa",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {e.label}
                  </span>
                  <GreenDot active={g} />
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
                      width: `${engineActivity[i] * 100}%`,
                      background: e.color,
                      transition: "width 0.1s",
                      boxShadow: `0 0 4px ${e.color}`,
                    }}
                  />
                </div>
                <div style={{ color: "#3366aa", fontSize: 8, marginTop: 3 }}>
                  SIGNAL ONLY — NO GAIN
                </div>
              </div>
            ))}
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
                  FILTER SWEEP — NO GAIN
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
