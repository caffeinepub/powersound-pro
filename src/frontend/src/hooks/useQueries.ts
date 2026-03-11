import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Preset } from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllPresets() {
  const { actor, isFetching } = useActor();
  return useQuery<Preset[]>({
    queryKey: ["presets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPresets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetActivePreset() {
  const { actor, isFetching } = useActor();
  return useQuery<Preset | null>({
    queryKey: ["activePreset"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getActivePreset();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePreset() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      name: string;
      engineLevel1: bigint;
      engineLevel2: bigint;
      engineLevel3: bigint;
      engineLevel4: bigint;
      equalizerBands: bigint[];
      volumeBooster: bigint;
      bassBooster: bigint;
      virtualSimulation: boolean;
      loudMode: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.createPreset(
        args.id,
        args.name,
        args.engineLevel1,
        args.engineLevel2,
        args.engineLevel3,
        args.engineLevel4,
        args.equalizerBands,
        args.volumeBooster,
        args.bassBooster,
        args.virtualSimulation,
        args.loudMode,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["presets"] }),
  });
}

export function useSetActivePreset() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      await actor.setActivePreset(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activePreset"] }),
  });
}
