export type PresenceCharacter = {
  id: string;
  name: string;
  profession?: string | null;
  lifeStatus: "alive" | "dead";
};

type PresencePanelProps = {
  presence: PresenceCharacter[];
};

export function PresencePanel({ presence }: PresencePanelProps) {
  return (
    <section className="presence-panel">
      <h4>Presentes no local</h4>
      {presence.length === 0 ? (
        <p className="presence-empty">Nenhum personagem detectado no local.</p>
      ) : (
        <ul className="presence-list">
          {presence.map((character) => (
            <li key={character.id} className="presence-item">
              <span className="presence-avatar" aria-hidden>
                👤
              </span>
              <div>
                <strong>{character.name}</strong>
                <small>{character.profession?.trim() ? character.profession : "Sem profissão"}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
