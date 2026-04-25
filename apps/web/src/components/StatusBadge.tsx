import type { ReactNode } from "react";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

type StatusBadgeProps = {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  riskLevel?: RiskLevel;
};

function riskVariant(riskLevel?: RiskLevel): StatusBadgeProps["variant"] {
  if (!riskLevel) return "default";
  if (riskLevel === "LOW") return "success";
  if (riskLevel === "MEDIUM") return "warning";
  return "danger";
}

export function StatusBadge({ children, variant = "default", riskLevel }: StatusBadgeProps) {
  const finalVariant = riskLevel ? riskVariant(riskLevel) : variant;
  return <span className={`status-badge status-${finalVariant}`}>{children}</span>;
}
