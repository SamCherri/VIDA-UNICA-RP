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
  const infoCards = [
    { label: "Nome", value: character.name },
    { label: "Idade", value: `${character.age} anos` },
    { label: "Profissão", value: character.profession ?? "Desempregado" },
    { label: "Dinheiro", value: `R$ ${character.moneyCash}` },
    { label: "Local atual", value: currentLocationName ?? "Nenhum" },
    { label: "Risco atual", value: currentRiskLevel ?? "LOW", isRisk: true },
    { label: "Status de vida", value: character.lifeStatus === "alive" ? "Vivo" : "Morto", isStatus: true },
    { label: "Vidas encerradas", value: String(deadHistory.length) }
  ];

  return (
    <section className="card">
      <h3>Minha vida</h3>
      <p className="section-subtitle">Seu personagem tem uma única vida. Construa rotina, relações e consequências.</p>

      <div className="life-cards-grid">
        {infoCards.map((item) => (
          <article key={item.label} className="life-info-card">
            <small>{item.label}</small>
            {item.isStatus ? (
              <StatusBadge variant={character.lifeStatus === "alive" ? "success" : "danger"}>{item.value}</StatusBadge>
            ) : item.isRisk ? (
              <StatusBadge riskLevel={currentRiskLevel ?? "LOW"}>{item.value}</StatusBadge>
            ) : (
              <strong>{item.value}</strong>
            )}
          </article>
        ))}
      </div>

      <h4>Vidas encerradas</h4>
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

      <h4>Profissão atual</h4>
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
