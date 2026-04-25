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
      <h3>Agora no local</h3>
      <div className="scene-live-indicator" role="status" aria-live="polite">
        <span className="scene-live-dot" aria-hidden>
          ●
        </span>
        <span>Acontecimentos atualizando automaticamente</span>
        <small>
          {lastUpdatedAt
            ? `Atualizado às ${lastUpdatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
            : "Aguardando primeira atualização"}
        </small>
      </div>

      <PresencePanel presence={presence} />

      {messages.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum acontecimento ainda.</p>
          <small>Faça uma ação para movimentar a vida RP neste local.</small>
        </div>
      ) : (
        <div className="timeline" aria-label="Acontecimentos">
          {messages.map((message) => (
            <article key={message.id} className={`timeline-item ${messageClass(message.messageType)}`}>
              <strong>{message.character?.name ?? "Sistema"}</strong>
              <p>{message.content}</p>
              <small>{new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
            </article>
          ))}
        </div>
      )}
      <textarea value={speech} placeholder="Digite a fala da sua vida na cidade" onChange={(e) => onSpeechChange(e.target.value)} />
      <button onClick={onSendSpeech}>Conversar</button>
    </section>
  );
}
