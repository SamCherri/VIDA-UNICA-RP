type ActionsScreenProps = {
  actions: readonly string[];
  onAction: (action: string) => void;
};

function groupName(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("compr") || lower.includes("vender") || lower.includes("serv") || lower.includes("trabalh")) return "Serviços";
  if (lower.includes("roub") || lower.includes("amea") || lower.includes("atac") || lower.includes("fug")) return "Risco";
  return "Comuns";
}

export function ActionsScreen({ actions, onAction }: ActionsScreenProps) {
  const groups = actions.reduce<Record<string, string[]>>((acc, action) => {
    const group = groupName(action);
    acc[group] = [...(acc[group] ?? []), action];
    return acc;
  }, {});

  return (
    <section className="card">
      <h3>Ações contextuais</h3>
      {Object.entries(groups).map(([group, groupedActions]) => (
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
    </section>
  );
}
