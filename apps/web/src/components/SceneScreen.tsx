import { useMemo, useRef } from "react";
import type { AvailableSceneAction, RiskLevel } from "@vida-unica/shared";
import type { RoutinePayload } from "../api/client";
import { PresencePanel, type PresenceCharacter } from "./PresencePanel";

type Message = { id: string; messageType: string; content: string; character?: { name: string } | null; createdAt: string };

type SceneScreenProps = {
  locationName?: string;
  profession?: string;
  moneyCash: number;
  riskLevel?: RiskLevel;
  routine: RoutinePayload | null;
  isInLocation: boolean;
  messages: Message[];
  presence: PresenceCharacter[];
  speech: string;
  lastUpdatedAt: Date | null;
  currentCharacterId: string;
  currentCharacterName: string;
  professionalActions: AvailableSceneAction[];
  onSpeechChange: (value: string) => void;
  onSendSpeech: () => void;
  onQuickAction: (action: string) => void;
  onProfessionalAction: (actionId: string) => void;
  onRoutineAction: (action: "eat" | "drink" | "rest" | "work") => void;
  onLeaveLocation: () => void;
  onGoToCity: () => void;
};

const locationSituation: Record<string, string> = {
  Mercado: "Este é um local de rotina civil. Você pode observar o movimento, falar com pessoas ou procurar atendimento.",
  "Praça Central": "A praça é o ponto mais comum da cidade. Pessoas passam, conversam e observam o movimento.",
  "Banco Central": "Este local envolve dinheiro e atendimento. Ações bancárias só fazem sentido para funcionários do banco.",
  Hospital: "Este local recebe atendimento e emergências. Funcionários do hospital têm ações específicas aqui.",
  Delegacia: "Este local concentra registros e atividade policial. Policiais têm ações específicas aqui.",
  "Beco Industrial": "Área de risco. Evite ações sem motivo: tudo pode deixar rastro.",
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
  if (type.includes("work")) {
    return { icon: "💼", title: "Trabalho", cssClass: "msg-work" };
  }
  if (type.includes("routine")) {
    return { icon: "🧭", title: "Rotina", cssClass: "msg-routine" };
  }
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

const blockedActionKeywords = ["sacar", "deposit", "arma", "assalt", "fug", "entrar", "render"];

function isAllowedProfessionalAction(label: string) {
  const text = label.toLowerCase();
  return !blockedActionKeywords.some((keyword) => text.includes(keyword));
}

function groupConsecutiveMessages(messages: Message[]) {
  const grouped: Array<{ message: Message; count: number }> = [];

  for (const message of messages) {
    const previous = grouped[grouped.length - 1];
    if (
      previous &&
      previous.message.content === message.content &&
      previous.message.messageType === message.messageType &&
      previous.message.character?.name === message.character?.name
    ) {
      previous.count += 1;
    } else {
      grouped.push({ message, count: 1 });
    }
  }

  return grouped;
}

function routineStatusClass(value: number) {
  if (value > 60) return "routine-good";
  if (value >= 30) return "routine-warning";
  return "routine-critical";
}

export function SceneScreen({
  locationName,
  profession,
  moneyCash,
  riskLevel,
  routine,
  isInLocation,
  messages,
  presence,
  speech,
  lastUpdatedAt,
  currentCharacterId,
  currentCharacterName,
  professionalActions,
  onSpeechChange,
  onSendSpeech,
  onQuickAction,
  onProfessionalAction,
  onRoutineAction,
  onLeaveLocation,
  onGoToCity
}: SceneScreenProps) {
  const speechRef = useRef<HTMLTextAreaElement | null>(null);
  const recentMessages = useMemo(() => messages.slice(-8), [messages]);
  const groupedMessages = useMemo(() => groupConsecutiveMessages(recentMessages), [recentMessages]);

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

  const situation = locationSituation[locationName] ?? "Observe o ambiente e interaja apenas com ações coerentes ao local.";
  const quickProfessionalActions = professionalActions
    .filter((action) => action.category !== "Comum" && isAllowedProfessionalAction(action.label))
    .slice(0, 4);

  function handleFocusSpeech() {
    speechRef.current?.focus();
    speechRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const showWork = (profession ?? "Desempregado") !== "Desempregado";

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

      <article className="now-routine-card">
        <h4>Minha rotina</h4>
        {!routine ? (
          <small>Entre em um local para atualizar sua rotina.</small>
        ) : (
          <div className="routine-bars">
            {[
              { label: "Fome", value: routine.hunger },
              { label: "Sede", value: routine.thirst },
              { label: "Sono", value: routine.sleep },
              { label: "Energia", value: routine.energy }
            ].map((item) => (
              <div key={item.label} className="routine-row">
                <div className="routine-row-label">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="routine-bar-track">
                  <div className={`routine-bar-fill ${routineStatusClass(item.value)}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="now-situation-card">
        <h4>Situação do local</h4>
        <p>{situation}</p>
        <small>{riskSituation[riskLevel]}</small>
      </article>

      <section className="action-group now-quick-actions">
        <h4>O que fazer agora</h4>
        <div className="actions-grid">
          <button onClick={handleFocusSpeech}>Falar</button>
          <button onClick={() => onQuickAction("Observar")}>Observar</button>
          <button onClick={() => onQuickAction("Solicitar atendimento")}>Pedir ajuda</button>
          <button className="ghost" onClick={onLeaveLocation}>
            Sair do local
          </button>

          {isInLocation && (
            <>
              <button className="ghost" onClick={() => onRoutineAction("eat")}>Comer</button>
              <button className="ghost" onClick={() => onRoutineAction("drink")}>Beber água</button>
              <button className="ghost" onClick={() => onRoutineAction("rest")}>Descansar</button>
              {showWork && (
                <button
                  className="ghost"
                  disabled={routine ? !routine.canWork : false}
                  title={routine && !routine.canWork ? "Você está em condição ruim para trabalhar. Cuide da sua vida antes." : undefined}
                  onClick={() => onRoutineAction("work")}
                >
                  {routine && !routine.canWork ? "Trabalhar (bloqueado)" : "Trabalhar"}
                </button>
              )}
            </>
          )}

          {quickProfessionalActions.map((action) => (
            <button key={action.id} className="ghost" onClick={() => onProfessionalAction(action.id)}>
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section className="now-speech">
        <h4>Falar no local</h4>
        <textarea
          ref={speechRef}
          value={speech}
          placeholder="Fale como seu personagem..."
          onChange={(e) => onSpeechChange(e.target.value)}
        />
        <small className="speech-help">Quem está neste local poderá ver sua fala.</small>
        <button onClick={onSendSpeech}>Enviar fala</button>
      </section>

      <section className="now-events">
        <h4>Acontecimentos recentes</h4>
        {groupedMessages.length === 0 ? (
          <div className="empty-state">
            <p>Nada aconteceu ainda. Observe o ambiente ou fale com alguém para movimentar este local.</p>
          </div>
        ) : (
          <div className="timeline" aria-label="Acontecimentos recentes">
            {groupedMessages.map(({ message, count }) => {
              const meta = messageTypeMeta(message.messageType);
              const isPlayerEvent = message.character?.name === currentCharacterName && meta.cssClass !== "msg-system";
              return (
                <article key={message.id} className={`timeline-item ${meta.cssClass} ${isPlayerEvent ? "timeline-item-player" : ""}`}>
                  <strong>
                    {meta.icon} {meta.title}
                  </strong>
                  <p>
                    {message.character?.name ? `${message.character.name}: ${message.content}` : message.content}
                    {count > 1 ? ` x${count}` : ""}
                  </p>
                  <small>{new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <PresencePanel presence={presence} currentCharacterId={currentCharacterId} />
    </section>
  );
}
