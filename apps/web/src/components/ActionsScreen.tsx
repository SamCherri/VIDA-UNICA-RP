import type { AvailableSceneAction } from "@vida-unica/shared";

type ActionsScreenProps = {
  actions: readonly string[];
  professionalActions: AvailableSceneAction[];
  hasLocation: boolean;
  onAction: (action: string) => void;
  onProfessionalAction: (actionId: string) => void;
};

function mapBasicCategory(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("médic") || lower.includes("atendimento")) return "hospital";
  if (lower.includes("sacar") || lower.includes("deposit")) return "banco";
  if (lower.includes("arma") || lower.includes("render")) return "segurança";
  if (lower.includes("polí") || lower.includes("assalt") || lower.includes("fug")) return "polícia";
  return "comum";
}

const groupOrder = ["comum", "hospital", "banco", "segurança", "polícia"] as const;

export function ActionsScreen({
  actions,
  professionalActions,
  hasLocation,
  onAction,
  onProfessionalAction
}: ActionsScreenProps) {
  const basicGroups = actions.reduce<Record<string, string[]>>((acc, action) => {
    const group = mapBasicCategory(action);
    acc[group] = [...(acc[group] ?? []), action];
    return acc;
  }, {});

  const professionalGroups = professionalActions.reduce<Record<string, AvailableSceneAction[]>>((acc, action) => {
    if (action.category === "Comum") return acc;
    const group = action.category.toLowerCase();
    acc[group] = [...(acc[group] ?? []), action];
    return acc;
  }, {});

  return (
    <section className="card">
      <h3>Fazer</h3>
      <p className="section-subtitle">
        Use esta aba para ver todas as ações disponíveis. Na tela Agora aparecem apenas as ações mais importantes do momento.
      </p>

      {groupOrder.map((group) => {
        const groupedBasic = basicGroups[group] ?? [];
        const groupedProfessional = professionalGroups[group] ?? [];
        const noLocationText = "Entre em um local para liberar ações deste grupo.";

        return (
          <div key={group} className="action-group">
            <h4>{group[0].toUpperCase() + group.slice(1)}</h4>
            {!hasLocation ? (
              <p className="section-subtitle">{noLocationText}</p>
            ) : (
              <div className="actions-grid">
                {groupedBasic.map((action) => (
                  <button key={action} onClick={() => onAction(action)}>
                    {action}
                  </button>
                ))}

                {groupedProfessional.map((action) => (
                  <button key={action.id} className="ghost" onClick={() => onProfessionalAction(action.id)}>
                    {action.label}
                  </button>
                ))}

                {groupedBasic.length === 0 && groupedProfessional.length === 0 && (
                  <p className="section-subtitle">Nenhuma ação disponível agora neste grupo.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
