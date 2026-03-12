# PowerSound Pro — Clean Rebuild

## Current State
The app has accumulated 20+ versions of audio chain code with conflicting gain nodes, volume multipliers, and legacy panels causing distortion. The codebase needs a full clean slate.

## Requested Changes (Diff)

### Add
- Fresh App.tsx built from zero — no legacy code
- Zero-gain audio chain: ONLY BiquadFilter nodes for signal shaping, DynamicsCompressor for gentle stabilizer correction — no GainNode multipliers anywhere
- 4 Sound Engines as pure status panels (lowpass/bandpass/highpass filters, no gain)
- 10-band DJ Equalizer (BiquadFilter peaking nodes, ±12dB per band for frequency shaping only)
- Loud Booster 1700 with Titanium Clamp — pure signal shaper, zero gain multiplication
- 80Hz Bass Programme slider — sweeps filter frequency only, no gain boost
- Stabilizer 1,600,000,000 titanium (two-stage DynamicsCompressor, gentle correction only, never limiting)
- Signal Guardian pre-correction stage (DynamicsCompressor, very gentle ratio 1.05:1)
- Commander master control — turns all indicators green, controls all app functions
- Battery display — power gate only (pauses music at 0%), zero connection to audio signal or loudness
- Battery does NOT affect highs or any frequency band
- Book opening animation (6 seconds, opens toward user, super blu-ray look)
- 20 Smart Chips status panel (each a BiquadFilter peaking node in the chain)
- Auto Frequency Generator (analyzes song every 500ms, adjusts filter frequencies)
- Healing 9.0 / Restoring 9.0 / Freezing 9.0 panels (wired to gentle correction filters)
- Compressor panel (corrects only, never limits, wired to DynamicsCompressor)
- Commander Memory log (logs only on real state changes)
- Award banner: "Award Winning Number 1 — Gerred Phillips"
- Power Core 334 / 5000 units display
- Bass/Highs routing switch
- Distortion Monitor panel
- A+B+C+D class audio processing labels on engines and EQ
- All indicators green (no red anywhere)
- Dark blue color scheme, visually sharp

### Modify
- VUMeter.tsx and BatteryDisplay.tsx — rewritten clean

### Remove
- All legacy gain/volume multipliers (GainNode > 1.0)
- Loudness slider gain (removed entirely)
- 80Hz bass shelf gain (replaced with pure frequency sweep filter)
- Loud Booster 3x gain multiplier
- Any battery-to-audio signal connection
- All old Commander Memory runaway loop logic
- All bass/highs doubling nodes

## Implementation Plan
1. Delete old App.tsx logic, write fresh single-file app
2. Audio chain: source → SignalGuardian → Engine1-4 → EQ10 → Bass80Filter → Stabilizer1 → Stabilizer2 → destination
3. Zero GainNode multipliers — all nodes are filters or gentle compressors only
4. Commander switch controls all panel states and turns everything green
5. Battery gates audio playback only — no signal scaling
6. Book animation: 6-second CSS 3D perspective open-toward-user effect
7. All panels real and wired into the chain
