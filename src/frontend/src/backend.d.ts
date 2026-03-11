import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Preset {
    engineLevel1: bigint;
    engineLevel2: bigint;
    engineLevel3: bigint;
    engineLevel4: bigint;
    name: string;
    virtualSimulation: boolean;
    volumeBooster: bigint;
    equalizerBands: Array<bigint>;
    loudMode: boolean;
    bassBooster: bigint;
}
export interface backendInterface {
    createPreset(id: string, name: string, engineLevel1: bigint, engineLevel2: bigint, engineLevel3: bigint, engineLevel4: bigint, equalizerBands: Array<bigint>, volumeBooster: bigint, bassBooster: bigint, virtualSimulation: boolean, loudMode: boolean): Promise<void>;
    deletePreset(id: string): Promise<void>;
    getActivePreset(): Promise<Preset | null>;
    getAllPresets(): Promise<Array<Preset>>;
    readPreset(id: string): Promise<Preset>;
    setActivePreset(id: string): Promise<void>;
    updatePreset(id: string, name: string, engineLevel1: bigint, engineLevel2: bigint, engineLevel3: bigint, engineLevel4: bigint, equalizerBands: Array<bigint>, volumeBooster: bigint, bassBooster: bigint, virtualSimulation: boolean, loudMode: boolean): Promise<void>;
}
