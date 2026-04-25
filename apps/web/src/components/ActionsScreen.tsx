import type { AvailableSceneAction } from "@vida-unica/shared";

type ActionsScreenProps = {
  actions: readonly string[];
  professionalActions: AvailableSceneAction[];
  hasLocation: boolean;
  onAction: (action: string) => void;
  onProfessionalAction: (actionId: string) => void;
};

function groupName(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("compr") || lower.includes("vender") || lower.includes("serv") || lower.includes("trabalh")) return "Serviços";
  if (lower.includes("roub") || lower.includes("amea") || lower.includes("atac") || lower.includes("fug")) return "Risco";
  return "Comuns";
}

export function ActionsScreen({
  actions,
  professionalActions,
  hasLocation,
  onAction,
  onProfessionalAction
}: ActionsScreenProps) {
  const basicGroups = actions.reduce<Record<string, string[]>>((acc, action) => {
    const group = groupName(action);
    acc[group] = [...(acc[group] ?? []), action];
    return acc;
  }, {});

  const professionalGroups = professionalActions.reduce<Record<string, AvailableSceneAction[]>>((acc, action) => {
    const group = action.category;
    acc[group] = [...(acc[group] ?? []), action];
    return acc;
  }, {});

  const hasProfessionalActions = professionalActions.some((action) => action.category !== "Comum");

  return (
    <section className="card">
      <h3>Ações contextuais</h3>
      {Object.entries(basicGroups).map(([group, groupedActions]) => (
        <div key={group} className="action-group">
          <h4>{group}</h4>
          <div className="actions-grid">
            {groupedActions.map((action) => (
              <button key={action} onClick={() => onAction(action)}>
                {action}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="action-group">
        <h4>Ações profissionais</h4>
        {!hasLocation ? (
          <p className="section-subtitle">Entre em um local para ver ações disponíveis.</p>
        ) : !hasProfessionalActions ? (
          <p className="section-subtitle">Nenhuma ação profissional disponível para sua profissão neste local.</p>
        ) : (
          Object.entries(professionalGroups)
            .filter(([group]) => group !== "Comum")
            .map(([group, groupedActions]) => (
              <div key={group} className="action-group">
                <h4>{group}</h4>
                <div className="actions-grid">
                  {groupedActions.map((action) => (
                    <button key={action.id} className="ghost" onClick={() => onProfessionalAction(action.id)}>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </section>
  );
}
