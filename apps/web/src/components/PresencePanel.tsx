export type PresenceCharacter = {
  id: string;
  name: string;
  profession?: string | null;
  lifeStatus: "alive" | "dead";
};

type PresencePanelProps = {
  presence: PresenceCharacter[];
  currentCharacterId?: string;
};

export function PresencePanel({ presence, currentCharacterId }: PresencePanelProps) {
  const isOnlyCurrentPlayer = presence.length === 1 && presence[0]?.id === currentCharacterId;

  return (
    <section className="presence-panel">
      <h4>Pessoas neste local</h4>
      {presence.length === 0 || isOnlyCurrentPlayer ? (
        <p className="presence-empty">Você está sozinho neste local.</p>
      ) : (
        <ul className="presence-list">
          {presence.map((character) => (
            <li key={character.id} className="presence-item">
              <span className="presence-avatar" aria-hidden>
                {character.lifeStatus === "alive" ? "🙂" : "☠️"}
              </span>
              <div>
                <strong>{character.name}</strong>
                <small>{character.profession?.trim() ? character.profession : "Sem profissão"}</small>
              </div>
              <span className={`presence-status ${character.lifeStatus === "alive" ? "presence-status-alive" : "presence-status-dead"}`}>
                {character.lifeStatus === "alive" ? "Vivo" : "Morto"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
