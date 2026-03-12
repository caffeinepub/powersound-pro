# PowerSound Pro

## Current State
The 4 sound engines are wired in series — each engine's output feeds the next engine's input. This causes near-total signal cancellation because the lowpass at 200Hz strips out everything above 200Hz before the bandpass at 500Hz even sees the signal.

## Requested Changes (Diff)

### Add
- Parallel engine wiring: a merger node (ChannelMergerNode or individual connects to a shared gain-free node) that combines all 4 engine outputs

### Modify
- `buildChain`: wire engines in parallel — source → signalGuardian → each of the 4 engines simultaneously → merge all 4 outputs into a single node → continue chain to EQ → stab

### Remove
- Series engine wiring (the for-loop that daisy-chains engines)

## Implementation Plan
1. After signalGuardian, connect it to all 4 engines simultaneously
2. Create a DynamicsCompressor or simple pass-through node as a merge point (no gain)
3. Connect all 4 engine outputs to the merge node
4. Continue chain from merge node → EQ bands → bass80 → stab1 → stab2 → destination
