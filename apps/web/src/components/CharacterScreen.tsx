import { StatusBadge } from "./StatusBadge";

type Character = {
  id: string;
  name: string;
  age: number;
  lifeStatus: "alive" | "dead";
  profession?: string;
  moneyCash: number;
};

type CharacterScreenProps = {
  character: Character;
  currentLocationName?: string;
  currentRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  deadHistory: Character[];
  canMarkDead: boolean;
  onMarkDead: () => void;
};

export function CharacterScreen({
  character,
  currentLocationName,
  currentRiskLevel,
  deadHistory,
  canMarkDead,
  onMarkDead
}: CharacterScreenProps) {
  return (
    <section className="card">
      <h3>Ficha do personagem</h3>
      <article className="character-sheet">
        <p>
          <strong>Nome:</strong> {character.name}
        </p>
        <p>
          <strong>Idade:</strong> {character.age} anos
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <StatusBadge variant={character.lifeStatus === "alive" ? "success" : "danger"}>
            {character.lifeStatus === "alive" ? "Vivo" : "Morto"}
          </StatusBadge>
        </p>
        <p>
          <strong>Dinheiro:</strong> R$ {character.moneyCash}
        </p>
        <p>
          <strong>Local atual:</strong> {currentLocationName ?? "Nenhum"}
        </p>
        <p>
          <strong>Risco atual:</strong> <StatusBadge riskLevel={currentRiskLevel ?? "LOW"}>{currentRiskLevel ?? "LOW"}</StatusBadge>
        </p>
      </article>

      <h4>Histórico de personagens mortos</h4>
      {deadHistory.length === 0 ? (
        <p className="section-subtitle">Nenhum personagem morto registrado.</p>
      ) : (
        <ul className="dead-list">
          {deadHistory.map((dead) => (
            <li key={dead.id}>
              <strong>{dead.name}</strong>
              <span>{dead.age} anos</span>
            </li>
          ))}
        </ul>
      )}

      {canMarkDead && (
        <button className="danger" onClick={onMarkDead}>
          Marcar morte permanente (teste)
        </button>
      )}
    </section>
  );
}
