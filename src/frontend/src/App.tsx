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
  FolderOpen,
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
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BatteryDisplay } from "./components/BatteryDisplay";
import { VUMeter } from "./components/VUMeter";
import { useCreatePreset, useGetAllPresets } from "./hooks/useQueries";

const EQ_BANDS = [
  "60Hz",
  "125Hz",
  "250Hz",
  "500Hz",
  "1K",
  "2K",
  "4K",
  "8K",
  "16K",
  "32K",
];
const DEFAULT_EQ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const DEFAULT_ENGINES = [75, 60, 80, 50];

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

export default function App() {
  const [engineLevels, setEngineLevels] = useState(DEFAULT_ENGINES);
  const [engineActive, setEngineActive] = useState([true, false, true, false]);
  const [eqBands, setEqBands] = useState(DEFAULT_EQ);
  const [bassBooster, setBassBooster] = useState(30);
  const [volumeBooster, setVolumeBooster] = useState(850);
  const [loudMode, setLoudMode] = useState(false);
  const [virtualSim, setVirtualSim] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [batteryPct, setBatteryPct] = useState(72);
  const [charging, setCharging] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"left" | "right">("left");
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("NO FILE LOADED");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: presets = [] } = useGetAllPresets();
  const createPreset = useCreatePreset();

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
        audioRef.current
          .play()
          .then(() => setPlaying(true))
          .catch(() => {});
      }
      toast.success(`Loaded: ${file.name}`);
    },
    [audioFile],
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
    const id = Date.now().toString();
    try {
      await createPreset.mutateAsync({
        id,
        name: presetName.trim(),
        engineLevel1: BigInt(engineLevels[0]),
        engineLevel2: BigInt(engineLevels[1]),
        engineLevel3: BigInt(engineLevels[2]),
        engineLevel4: BigInt(engineLevels[3]),
        equalizerBands: eqBands.map((b) => BigInt(b)),
        volumeBooster: BigInt(volumeBooster),
        bassBooster: BigInt(bassBooster),
        virtualSimulation: virtualSim,
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
    bassBooster,
    virtualSim,
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
      setBassBooster(Number(preset.bassBooster));
      setVirtualSim(preset.virtualSimulation);
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
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(0.06 0.014 242)" }}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: virtual audio engine has no captions */}
      <audio ref={audioRef} style={{ display: "none" }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* HEADER */}
      <header
        className="flex items-center justify-between px-4 py-2 flex-wrap gap-2"
        style={{
          background: "oklch(0.08 0.016 242)",
          borderBottom: "1px solid oklch(0.28 0.08 212)",
          boxShadow: "0 2px 20px oklch(0.72 0.28 212 / 0.12)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
            style={{
              background: "oklch(0.13 0.06 212)",
              border: "1px solid oklch(0.50 0.18 212)",
              boxShadow: "0 0 14px oklch(0.72 0.28 212 / 0.5)",
            }}
          >
            <Volume2 className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h1
              className="font-display font-black text-xl leading-none tracking-tight"
              style={{
                color: "oklch(0.85 0.26 196)",
                textShadow: "0 0 20px oklch(0.78 0.28 196 / 0.6)",
              }}
            >
              POWERSOUND
            </h1>
            <p
              className="font-mono text-[9px] tracking-[0.4em]"
              style={{ color: "oklch(0.45 0.06 212)" }}
            >
              PRO CONTROL SYSTEM v2.0
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedPreset} onValueChange={handleLoadPreset}>
            <SelectTrigger
              data-ocid="preset.select"
              className="w-36 h-7 text-[11px] font-mono bg-panel border-neon"
            >
              <SelectValue placeholder="Load Preset" />
            </SelectTrigger>
            <SelectContent className="bg-panel border-neon font-mono text-xs">
              {presets.length === 0 && (
                <SelectItem value="__none__" disabled>
                  No presets
                </SelectItem>
              )}
              {presets.map((p: any) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            data-ocid="preset.input"
            className="h-7 px-2 text-[11px] font-mono rounded border border-neon bg-panel text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-28"
          />
          <Button
            data-ocid="preset.save_button"
            size="sm"
            onClick={handleSavePreset}
            disabled={createPreset.isPending}
            className="h-7 px-3 text-[11px] font-mono"
            style={{
              background: "oklch(0.14 0.06 212)",
              color: "oklch(0.78 0.24 212)",
              border: "1px solid oklch(0.40 0.16 212)",
              boxShadow: "0 0 8px oklch(0.72 0.28 212 / 0.25)",
            }}
          >
            <Save className="w-3 h-3 mr-1" />
            {createPreset.isPending ? "..." : "SAVE"}
          </Button>
        </div>
      </header>

      {/* Mobile tabs */}
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
              mobilePanel === "right" ? "oklch(0.12 0.04 212)" : "transparent",
          }}
        >
          EQ / BOOST ►
        </button>
      </div>

      {/* BOOK PANELS */}
      <main className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* LEFT PANEL */}
        <motion.div
          initial={{ opacity: 0, rotateY: -18, x: -20 }}
          animate={{ opacity: 1, rotateY: 0, x: 0 }}
          transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: "right center", perspective: 1400 }}
          className={`${mobilePanel === "left" ? "flex" : "hidden"} md:flex flex-col w-full md:w-1/2 overflow-y-auto`}
          data-ocid="engines.panel"
        >
          <div className="p-4 flex flex-col gap-3">
            <SectionLabel>◈ SOUND ENGINES</SectionLabel>

            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={`engine-${i}`}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.09 + 0.2, ease: "easeOut" }}
                className="rounded p-3 flex flex-col gap-2"
                style={{
                  background: "oklch(0.10 0.014 242)",
                  border: `1px solid ${engineActive[i] ? "oklch(0.74 0.26 148 / 0.55)" : "oklch(0.20 0.03 242)"}`,
                  boxShadow: engineActive[i]
                    ? "0 0 12px oklch(0.74 0.26 148 / 0.12)"
                    : "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-ocid={`engine.toggle.${i + 1}`}
                      onClick={() =>
                        setEngineActive((prev) =>
                          prev.map((v, j) => (j === i ? !v : v)),
                        )
                      }
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: engineActive[i]
                          ? "oklch(0.74 0.26 148)"
                          : "oklch(0.28 0.04 242)",
                        background: engineActive[i]
                          ? "oklch(0.13 0.06 148)"
                          : "oklch(0.10 0.01 242)",
                        boxShadow: engineActive[i]
                          ? "0 0 12px oklch(0.74 0.26 148 / 0.7), inset 0 0 8px oklch(0.74 0.26 148 / 0.2)"
                          : "none",
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: engineActive[i]
                            ? "oklch(0.80 0.26 148)"
                            : "oklch(0.30 0.04 242)",
                          boxShadow: engineActive[i]
                            ? "0 0 6px oklch(0.80 0.26 148)"
                            : "none",
                        }}
                      />
                    </button>
                    <div>
                      <div
                        className="font-mono text-[10px] font-black tracking-[0.25em]"
                        style={{
                          color: engineActive[i]
                            ? "oklch(0.78 0.12 212)"
                            : "oklch(0.38 0.02 242)",
                        }}
                      >
                        ENGINE {i + 1}
                      </div>
                      <div
                        className="font-mono text-[9px] tracking-widest"
                        style={{
                          color: engineActive[i]
                            ? "oklch(0.74 0.26 148)"
                            : "oklch(0.30 0.02 242)",
                        }}
                      >
                        {engineActive[i] ? "● ACTIVE" : "○ OFFLINE"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono text-base font-black tabular-nums"
                      style={{
                        color: engineActive[i]
                          ? "oklch(0.78 0.24 212)"
                          : "oklch(0.30 0.02 242)",
                        textShadow: engineActive[i]
                          ? "0 0 12px oklch(0.72 0.28 212 / 0.6)"
                          : "none",
                      }}
                    >
                      {engineLevels[i].toString().padStart(3, "0")}
                    </span>
                    <VUMeter active={engineActive[i]} level={engineLevels[i]} />
                  </div>
                </div>
                <input
                  type="range"
                  data-ocid={`engine.slider.${i + 1}`}
                  min={0}
                  max={100}
                  value={engineLevels[i]}
                  onChange={(e) =>
                    setEngineLevels((prev) =>
                      prev.map((v, j) =>
                        j === i ? Number(e.target.value) : v,
                      ),
                    )
                  }
                  className="h-range w-full"
                  disabled={!engineActive[i]}
                  style={{
                    accentColor: engineActive[i]
                      ? "oklch(0.68 0.24 212)"
                      : "oklch(0.28 0.02 242)",
                    opacity: engineActive[i] ? 1 : 0.35,
                  }}
                />
              </motion.div>
            ))}

            {/* Bass */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="rounded p-3"
              style={{
                background: "oklch(0.10 0.014 242)",
                border: "1px solid oklch(0.28 0.08 196)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] tracking-[0.3em] text-neon-cyan">
                  BASS BOOST
                </span>
                <span
                  className="font-display font-black text-2xl"
                  style={{
                    color: "oklch(0.78 0.28 196)",
                    textShadow: "0 0 14px oklch(0.78 0.28 196 / 0.5)",
                  }}
                >
                  {bassBooster}
                </span>
              </div>
              <input
                type="range"
                data-ocid="bass.booster.input"
                min={0}
                max={100}
                value={bassBooster}
                onChange={(e) => setBassBooster(Number(e.target.value))}
                className="h-range w-full"
                style={{ accentColor: "oklch(0.72 0.28 196)" }}
              />
            </motion.div>

            {/* Loud Mode */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <button
                type="button"
                data-ocid="loud.toggle"
                onClick={() => setLoudMode((v) => !v)}
                className="w-full py-4 rounded border-2 font-mono text-sm font-black tracking-[0.4em] transition-all"
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
                {loudMode ? "◉ LOUD MODE ACTIVE" : "◎ LOUD MODE OFF"}
              </button>
            </motion.div>

            {/* File Picker */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72 }}
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

        {/* RIGHT PANEL */}
        <motion.div
          initial={{ opacity: 0, rotateY: 18, x: 20 }}
          animate={{ opacity: 1, rotateY: 0, x: 0 }}
          transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          style={{ transformOrigin: "left center", perspective: 1400 }}
          className={`${mobilePanel === "right" ? "flex" : "hidden"} md:flex flex-col w-full md:w-1/2 overflow-y-auto`}
          data-ocid="eq.panel"
        >
          <div className="p-4 flex flex-col gap-3">
            <SectionLabel>◈ EQUALIZER · 10 BAND</SectionLabel>

            {/* EQ — 2-column grid with horizontal sliders */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded p-3"
              style={{
                background: "oklch(0.10 0.014 242)",
                border: "1px solid oklch(0.28 0.08 212)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px 12px",
                }}
              >
                {EQ_BANDS.map((band, i) => (
                  <div
                    key={band}
                    className="flex items-center gap-2"
                    style={{ minWidth: 0 }}
                  >
                    <span
                      className="font-mono text-[9px] font-bold flex-shrink-0"
                      style={{
                        color: "oklch(0.55 0.10 212)",
                        width: 32,
                        textAlign: "right",
                      }}
                    >
                      {band}
                    </span>
                    <input
                      type="range"
                      data-ocid={`eq.slider.${i + 1}`}
                      min={-100}
                      max={100}
                      value={eqBands[i]}
                      onChange={(e) =>
                        setEqBands((prev) =>
                          prev.map((v, j) =>
                            j === i ? Number(e.target.value) : v,
                          ),
                        )
                      }
                      className="h-range flex-1"
                      style={{
                        minWidth: 0,
                        accentColor:
                          eqBands[i] > 0
                            ? "oklch(0.72 0.28 212)"
                            : eqBands[i] < 0
                              ? "oklch(0.60 0.22 25)"
                              : "oklch(0.45 0.06 242)",
                      }}
                    />
                    <span
                      className="font-mono text-[9px] font-bold tabular-nums flex-shrink-0"
                      style={{
                        width: 24,
                        textAlign: "right",
                        color:
                          eqBands[i] > 0
                            ? "oklch(0.72 0.28 212)"
                            : eqBands[i] < 0
                              ? "oklch(0.60 0.22 25)"
                              : "oklch(0.40 0.02 242)",
                      }}
                    >
                      {eqBands[i] > 0 ? "+" : ""}
                      {eqBands[i]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Volume Booster */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded p-4"
              style={{
                background: "oklch(0.10 0.014 242)",
                border: "1px solid oklch(0.35 0.12 212)",
                boxShadow: "0 0 24px oklch(0.72 0.28 212 / 0.1)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] tracking-[0.3em] text-neon-blue">
                  VOLUME BOOSTER
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className="font-display font-black leading-none"
                    style={{
                      fontSize: 40,
                      color: "oklch(0.84 0.26 212)",
                      textShadow: "0 0 24px oklch(0.72 0.28 212 / 0.7)",
                    }}
                  >
                    {volumeBooster}
                  </span>
                  <span
                    className="font-display font-black text-xl"
                    style={{ color: "oklch(0.60 0.18 212)" }}
                  >
                    %
                  </span>
                </div>
              </div>
              <input
                type="range"
                data-ocid="volume.booster.input"
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
                  0%
                </span>
                <span
                  className="font-mono text-[9px]"
                  style={{ color: "oklch(0.35 0.02 242)" }}
                >
                  1700%
                </span>
              </div>
            </motion.div>

            {/* Virtual Simulation */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
            >
              <button
                type="button"
                data-ocid="virtual.toggle"
                onClick={() => setVirtualSim((v) => !v)}
                className="w-full py-4 rounded border-2 font-mono text-sm font-bold tracking-[0.3em] transition-all"
                style={{
                  borderColor: virtualSim
                    ? "oklch(0.78 0.28 196)"
                    : "oklch(0.22 0.04 242)",
                  background: virtualSim
                    ? "oklch(0.11 0.06 196)"
                    : "oklch(0.09 0.01 242)",
                  color: virtualSim
                    ? "oklch(0.84 0.24 196)"
                    : "oklch(0.42 0.03 242)",
                  boxShadow: virtualSim
                    ? "0 0 24px oklch(0.78 0.28 196 / 0.45), inset 0 0 24px oklch(0.78 0.28 196 / 0.08)"
                    : "none",
                }}
              >
                {virtualSim ? "◉ VIRTUAL SIM ACTIVE" : "◎ VIRTUAL SIMULATION"}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* BATTERY SECTION */}
      <div
        className="px-4 py-3 flex flex-wrap items-center justify-center gap-3"
        style={{
          background: "oklch(0.07 0.014 242)",
          borderTop: "1px solid oklch(0.28 0.08 212)",
          borderBottom: "1px solid oklch(0.22 0.04 242)",
          boxShadow: "0 -4px 24px oklch(0.72 0.28 212 / 0.08)",
        }}
        data-ocid="battery.section"
      >
        <BatteryDisplay
          percentage={Math.round(batteryPct)}
          charging={charging}
          onToggleCharging={() => setCharging((v) => !v)}
        />
      </div>

      {/* MUSIC CONTROLS */}
      <footer
        className="px-4 py-2 flex flex-wrap items-center justify-between gap-2"
        style={{
          background: "oklch(0.08 0.016 242)",
          borderTop: "1px solid oklch(0.22 0.04 242)",
        }}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-ocid="player.toggle"
            onClick={() => setShuffle((v) => !v)}
            className="p-2 rounded transition-all"
            style={{
              color: shuffle ? "oklch(0.78 0.28 196)" : "oklch(0.45 0.02 220)",
            }}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-ocid="player.pagination_prev"
            className="p-2 rounded transition-all"
            style={{ color: "oklch(0.70 0.06 220)" }}
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            type="button"
            data-ocid="player.primary_button"
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: playing
                ? "oklch(0.74 0.26 148)"
                : "oklch(0.68 0.24 212)",
              boxShadow: `0 0 18px ${playing ? "oklch(0.74 0.26 148 / 0.65)" : "oklch(0.68 0.24 212 / 0.65)"}`,
            }}
          >
            {playing ? (
              <Pause
                className="w-5 h-5"
                style={{ color: "oklch(0.04 0.01 242)" }}
                fill="currentColor"
              />
            ) : (
              <Play
                className="w-5 h-5"
                style={{ color: "oklch(0.04 0.01 242)" }}
                fill="currentColor"
              />
            )}
          </button>
          <button
            type="button"
            data-ocid="player.pagination_next"
            className="p-2 rounded transition-all"
            style={{ color: "oklch(0.70 0.06 220)" }}
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            type="button"
            data-ocid="player.secondary_button"
            onClick={cycleRepeat}
            className="p-2 rounded transition-all"
            style={{
              color:
                repeatMode !== "off"
                  ? "oklch(0.78 0.28 196)"
                  : "oklch(0.45 0.02 220)",
            }}
          >
            {repeatMode === "one" ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            {playing && (
              <Zap
                className="w-3 h-3 animate-charge-pulse"
                style={{ color: "oklch(0.74 0.26 148)" }}
                fill="currentColor"
              />
            )}
            <span
              className="font-mono text-[11px] font-bold tracking-widest"
              style={{
                color: playing
                  ? "oklch(0.74 0.26 148)"
                  : "oklch(0.45 0.02 220)",
              }}
            >
              {playing ? "PLAYING" : "PAUSED"}
            </span>
          </div>
          <span
            className="font-mono text-[9px]"
            style={{ color: "oklch(0.38 0.02 220)" }}
          >
            POWERSOUND VIRTUAL ENGINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Volume2
            className="w-4 h-4"
            style={{ color: "oklch(0.50 0.06 212)" }}
          />
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ width: 80, background: "oklch(0.15 0.02 242)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (volumeBooster / 1700) * 100)}%`,
                background:
                  volumeBooster > 1000
                    ? "oklch(0.60 0.22 25)"
                    : volumeBooster > 500
                      ? "oklch(0.80 0.22 75)"
                      : "oklch(0.72 0.28 212)",
              }}
            />
          </div>
          <span
            className="font-mono text-[10px]"
            style={{ color: "oklch(0.50 0.06 212)" }}
          >
            {volumeBooster}%
          </span>
        </div>
      </footer>

      <div
        className="text-center py-1.5 font-mono text-[10px]"
        style={{
          background: "oklch(0.06 0.012 242)",
          borderTop: "1px solid oklch(0.18 0.04 242)",
          color: "oklch(0.38 0.02 220)",
        }}
      >
        © {new Date().getFullYear()} · Built with ♥ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neon-blue hover:text-neon-cyan transition-colors"
        >
          caffeine.ai
        </a>
      </div>

      <Toaster richColors theme="dark" />
    </div>
  );
}
