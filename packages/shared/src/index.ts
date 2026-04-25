export const USER_ROLES = ["player", "support", "moderator", "admin", "master_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "EXTREME"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const PROFESSIONS = [
  "Desempregado",
  "Atendente do Hospital",
  "Caixa de Banco",
  "Segurança",
  "Policial"
] as const;
export type Profession = (typeof PROFESSIONS)[number];

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

export type AvailableSceneAction = {
  id: string;
  label: string;
  category: "Comum" | "Hospital" | "Banco" | "Segurança" | "Polícia";
  requiresProfession?: Profession;
  riskLevel: RiskLevel;
};
