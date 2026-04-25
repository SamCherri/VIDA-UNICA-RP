export const USER_ROLES = ["player", "support", "moderator", "admin", "master_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "EXTREME"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const BASIC_SCENE_ACTIONS = [
  "Conversar",
  "Observar",
  "Entrar",
  "Sair",
  "Solicitar atendimento",
  "Sacar dinheiro",
  "Depositar",
  "Chamar polícia",
  "Solicitar médico",
  "Sacar arma",
  "Assaltar",
  "Se render",
  "Fugir"
] as const;
