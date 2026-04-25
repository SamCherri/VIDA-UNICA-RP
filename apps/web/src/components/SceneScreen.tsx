import type { AvailableSceneAction, RiskLevel } from "@vida-unica/shared";
import { PresencePanel, type PresenceCharacter } from "./PresencePanel";

type Message = { id: string; messageType: string; content: string; character?: { name: string } | null; createdAt: string };

type SceneScreenProps = {
  locationName?: string;
  profession?: string;
  moneyCash: number;
  riskLevel?: RiskLevel;
  messages: Message[];
  presence: PresenceCharacter[];
  speech: string;
  lastUpdatedAt: Date | null;
  currentCharacterId: string;
  professionalActions: AvailableSceneAction[];
  onSpeechChange: (value: string) => void;
  onSendSpeech: () => void;
  onQuickAction: (action: string) => void;
  onProfessionalAction: (actionId: string) => void;
  onLeaveLocation: () => void;
  onGoToCity: () => void;
};

const locationSituation: Record<string, string> = {
  "Praça Central": "A praça é o ponto mais comum da cidade. Pessoas passam, conversam e observam o movimento.",
  "Banco Central": "O banco concentra dinheiro, atendimento e segurança. Cada atitude aqui pode gerar registro.",
  Hospital: "O hospital recebe casos simples e emergências. Atendimento rápido pode mudar o rumo de uma vida.",
  Delegacia: "A delegacia concentra ocorrências, registros e decisões policiais.",
  "Beco Industrial": "O beco é uma área de risco. Pouca gente passa por aqui sem motivo.",
  Prefeitura: "A prefeitura organiza documentos, protocolos e decisões que afetam a cidade."
};

const riskSituation: Record<RiskLevel, string> = {
  LOW: "Ambiente relativamente controlado.",
  MEDIUM: "Há movimento e alguma tensão.",
  HIGH: "O clima exige atenção.",
  EXTREME: "Cada decisão pode deixar rastro ou consequência grave."
};

function messageTypeMeta(messageType: string) {
  const type = messageType.toLowerCase();
  if (type.includes("professional") || type.includes("prof")) {
    return { icon: "👔", title: "Trabalho", cssClass: "msg-professional" };
  }
  if (type.includes("system") || type.includes("enter") || type.includes("leave")) {
    return { icon: "⚙️", title: "Sistema", cssClass: "msg-system" };
  }
  if (type.includes("action")) {
    return { icon: "🎬", title: "Ação", cssClass: "msg-action" };
  }
  return { icon: "💬", title: "Fala", cssClass: "msg-speech" };
}

export function SceneScreen({
  locationName,
  profession,
  moneyCash,
  riskLevel,
  messages,
  presence,
  speech,
  lastUpdatedAt,
  currentCharacterId,
  professionalActions,
  onSpeechChange,
  onSendSpeech,
  onQuickAction,
  onProfessionalAction,
  onLeaveLocation,
  onGoToCity
}: SceneScreenProps) {
  if (!locationName || !riskLevel) {
    return (
      <section className="card now-screen">
        <h3>Agora</h3>
        <div className="empty-state now-empty-state">
          <p>Você ainda não está em nenhum lugar da cidade.</p>
          <small>Escolha um local para começar sua rotina.</small>
          <button onClick={onGoToCity}>Ir para Cidade</button>
        </div>
      </section>
    );
  }

  const situation = locationSituation[locationName] ?? "Este local faz parte da rotina da cidade. Observe o ambiente antes de agir.";
  const quickProfessionalActions = professionalActions.filter((action) => action.category !== "Comum").slice(0, 4);

  return (
    <section className="card now-screen">
      <h3>Agora</h3>

      <article className="now-header-card">
        <h4>📍 {locationName}</h4>
        <p>
          {(profession ?? "Desempregado")} • R$ {moneyCash} • {presence.length} presentes
        </p>
        <div className="now-header-meta">
          <span>Risco: {riskLevel}</span>
          <small>
            Cidade viva • {lastUpdatedAt
              ? `Atualizado às ${lastUpdatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
              : "Aguardando atualização automática"}
          </small>
        </div>
      </article>

      <article className="now-situation-card">
        <h4>Situação do local</h4>
        <p>{situation}</p>
        <small>{riskSituation[riskLevel]}</small>
      </article>

      <section className="action-group now-quick-actions">
        <h4>O que fazer agora</h4>
        <div className="actions-grid">
          <button onClick={() => onQuickAction("Conversar")}>Conversar</button>
          <button onClick={() => onQuickAction("Observar")}>Observar</button>
          <button onClick={() => onQuickAction("Solicitar atendimento")}>Pedir ajuda</button>
          {quickProfessionalActions.map((action) => (
            <button key={action.id} className="ghost" onClick={() => onProfessionalAction(action.id)}>
              {action.label}
            </button>
          ))}
          <button className="ghost" onClick={onLeaveLocation}>
            Sair do local
          </button>
        </div>
      </section>

      <PresencePanel presence={presence} currentCharacterId={currentCharacterId} />

      <section className="now-events">
        <h4>Acontecimentos recentes</h4>
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Nada aconteceu ainda. Comece observando o ambiente ou falando com alguém.</p>
          </div>
        ) : (
          <div className="timeline" aria-label="Acontecimentos recentes">
            {messages.map((message) => {
              const meta = messageTypeMeta(message.messageType);
              return (
                <article key={message.id} className={`timeline-item ${meta.cssClass}`}>
                  <strong>
                    {meta.icon} {meta.title}
                  </strong>
                  <p>{message.character?.name ? `${message.character.name}: ${message.content}` : message.content}</p>
                  <small>{new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <textarea value={speech} placeholder="Fale como seu personagem..." onChange={(e) => onSpeechChange(e.target.value)} />
        <small className="speech-help">Quem está neste local poderá ver sua fala.</small>
        <button onClick={onSendSpeech}>Enviar fala</button>
      </section>
    </section>
  );
}
