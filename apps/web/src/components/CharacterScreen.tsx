import type { Profession } from "@vida-unica/shared";
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
  professions: readonly Profession[];
  selectedProfession: Profession;
  onProfessionChange: (profession: Profession) => void;
  onSaveProfession: () => void;
  isSavingProfession: boolean;
  currentLocationName?: string;
  currentRiskLevel?: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  deadHistory: Character[];
  canMarkDead: boolean;
  onMarkDead: () => void;
};

export function CharacterScreen({
  character,
  professions,
  selectedProfession,
  onProfessionChange,
  onSaveProfession,
  isSavingProfession,
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
          <strong>Profissão:</strong> {character.profession ?? "Desempregado"}
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

      <h4>Trocar profissão</h4>
      <p className="section-subtitle">Nesta fase, a troca de profissão é livre para testes.</p>
      <select value={selectedProfession} onChange={(e) => onProfessionChange(e.target.value as Profession)}>
        {professions.map((profession) => (
          <option key={profession} value={profession}>
            {profession}
          </option>
        ))}
      </select>
      <button onClick={onSaveProfession} disabled={isSavingProfession}>
        {isSavingProfession ? "Salvando..." : "Salvar profissão"}
      </button>

      {canMarkDead && (
        <button className="danger" onClick={onMarkDead}>
          Marcar morte permanente (teste)
        </button>
      )}
    </section>
  );
}
