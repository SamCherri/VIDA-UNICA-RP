import { PresencePanel, type PresenceCharacter } from "./PresencePanel";

type Message = { id: string; messageType: string; content: string; character?: { name: string } | null; createdAt: string };

type SceneScreenProps = {
  messages: Message[];
  presence: PresenceCharacter[];
  speech: string;
  lastUpdatedAt: Date | null;
  onSpeechChange: (value: string) => void;
  onSendSpeech: () => void;
};

function messageClass(messageType: string) {
  const type = messageType.toLowerCase();
  if (type.includes("system")) return "msg-system";
  if (type.includes("action")) return "msg-action";
  return "msg-speech";
}

export function SceneScreen({ messages, presence, speech, lastUpdatedAt, onSpeechChange, onSendSpeech }: SceneScreenProps) {
  return (
    <section className="card">
      <h3>Cena local</h3>
      <div className="scene-live-indicator" role="status" aria-live="polite">
        <span className="scene-live-dot" aria-hidden>
          ●
        </span>
        <span>Cena atualizando automaticamente</span>
        <small>
          {lastUpdatedAt
            ? `Atualizado às ${lastUpdatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
            : "Aguardando primeira atualização"}
        </small>
      </div>

      <PresencePanel presence={presence} />

      {messages.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma mensagem ainda.</p>
          <small>Entre em ação para movimentar a cena RP deste local.</small>
        </div>
      ) : (
        <div className="timeline">
          {messages.map((message) => (
            <article key={message.id} className={`timeline-item ${messageClass(message.messageType)}`}>
              <strong>{message.character?.name ?? "Sistema"}</strong>
              <p>{message.content}</p>
              <small>{new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
            </article>
          ))}
        </div>
      )}
      <textarea value={speech} placeholder="Digite a fala do personagem" onChange={(e) => onSpeechChange(e.target.value)} />
      <button onClick={onSendSpeech}>Conversar</button>
    </section>
  );
}
