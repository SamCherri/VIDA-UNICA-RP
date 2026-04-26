import type { Character } from "@prisma/client";
import { PROFESSIONS, type Profession } from "@vida-unica/shared";
import { z } from "zod";

const HOUR_MS = 60 * 60 * 1000;
const MIN_DECAY_UPDATE_MS = 5 * 60 * 1000;
const DECAY_PER_HOUR = {
  hunger: 5,
  thirst: 7,
  sleep: 4,
  energy: 4
} as const;

export const WORK_COOLDOWN_MS = 30 * 60 * 1000;

export const WORK_SALARY_BY_PROFESSION: Record<Profession, number> = {
  Desempregado: 0,
  "Atendente do Hospital": 120,
  "Caixa de Banco": 130,
  Segurança: 140,
  Policial: 150
};

export const WORK_LOCATIONS_BY_PROFESSION: Record<Profession, string[]> = {
  Desempregado: [],
  "Atendente do Hospital": ["Hospital"],
  "Caixa de Banco": ["Banco Central"],
  Segurança: ["Banco Central"],
  Policial: ["Delegacia", "Praça Central", "Beco Industrial"]
};

const professionSchema = z.enum(PROFESSIONS);

type RoutineCharacter = Pick<
  Character,
  "id" | "hunger" | "thirst" | "sleep" | "energy" | "routineUpdatedAt" | "lastWorkAt" | "workStreak" | "profession"
>;

function clampNeed(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getRoutineStatusLabels(character: Pick<Character, "hunger" | "thirst" | "sleep" | "energy">) {
  const labels: string[] = [];

  if (character.hunger <= 20) {
    labels.push("Personagem está com fome");
  }

  if (character.thirst <= 20) {
    labels.push("Personagem está com sede");
  }

  if (character.sleep <= 20) {
    labels.push("Personagem está com sono");
  }

  if (character.energy <= 20) {
    labels.push("Personagem está cansado");
  }

  return labels;
}

export function canCharacterWork(character: Pick<Character, "hunger" | "thirst" | "sleep" | "energy">) {
  return character.hunger >= 15 && character.thirst >= 15 && character.sleep >= 15 && character.energy >= 15;
}

export async function applyRoutineDecay<T extends RoutineCharacter>(
  character: T,
  updateCharacter: (id: string, data: Pick<Character, "hunger" | "thirst" | "sleep" | "energy" | "routineUpdatedAt">) => Promise<T>
) {
  const now = new Date();
  const elapsedMs = now.getTime() - character.routineUpdatedAt.getTime();

  if (elapsedMs < MIN_DECAY_UPDATE_MS) {
    return character;
  }

  const elapsedHours = Math.floor(elapsedMs / HOUR_MS);

  if (elapsedHours <= 0) {
    return character;
  }

  const decayedAt = new Date(character.routineUpdatedAt.getTime() + elapsedHours * HOUR_MS);

  return updateCharacter(character.id, {
    hunger: clampNeed(character.hunger - DECAY_PER_HOUR.hunger * elapsedHours),
    thirst: clampNeed(character.thirst - DECAY_PER_HOUR.thirst * elapsedHours),
    sleep: clampNeed(character.sleep - DECAY_PER_HOUR.sleep * elapsedHours),
    energy: clampNeed(character.energy - DECAY_PER_HOUR.energy * elapsedHours),
    routineUpdatedAt: decayedAt
  });
}

export function getWorkSalary(profession?: string | null) {
  const parsed = professionSchema.safeParse(profession);
  const safeProfession = parsed.success ? parsed.data : "Desempregado";

  return WORK_SALARY_BY_PROFESSION[safeProfession];
}

export function getWorkLocationRule(profession?: string | null) {
  const parsed = professionSchema.safeParse(profession);
  const safeProfession = parsed.success ? parsed.data : "Desempregado";
  const allowedLocations = WORK_LOCATIONS_BY_PROFESSION[safeProfession];

  return {
    profession: safeProfession,
    allowedLocations
  };
}

export function canWorkAtLocation(profession?: string | null, locationName?: string | null) {
  const { profession: safeProfession, allowedLocations } = getWorkLocationRule(profession);

  if (allowedLocations.length === 0) {
    return {
      canWork: false,
      allowedLocations,
      message: "Escolha uma profissão para trabalhar."
    };
  }

  if (!locationName) {
    return {
      canWork: false,
      allowedLocations,
      message: "Você precisa estar em um local para trabalhar."
    };
  }

  if (!allowedLocations.includes(locationName)) {
    return {
      canWork: false,
      allowedLocations,
      message: `Você não pode trabalhar como ${safeProfession} neste local. Vá até ${allowedLocations.join(", ")}.`
    };
  }

  return {
    canWork: true,
    allowedLocations,
    message: `Você pode trabalhar aqui como ${safeProfession}.`
  };
}

export function buildRoutinePayload(character: RoutineCharacter, locationName?: string | null) {
  const workLocationRule = canWorkAtLocation(character.profession, locationName);

  return {
    hunger: character.hunger,
    thirst: character.thirst,
    sleep: character.sleep,
    energy: character.energy,
    routineUpdatedAt: character.routineUpdatedAt,
    lastWorkAt: character.lastWorkAt,
    workStreak: character.workStreak,
    statusLabels: getRoutineStatusLabels(character),
    canWork: canCharacterWork(character),
    workAvailableHere: workLocationRule.canWork,
    workLocationMessage: workLocationRule.message,
    allowedWorkLocations: workLocationRule.allowedLocations
  };
}
