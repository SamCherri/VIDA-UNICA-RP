import { useEffect, useMemo, useState } from "react";
import { BASIC_SCENE_ACTIONS } from "@vida-unica/shared";
import { apiRequest } from "./api/client";

type User = { id: string; username: string; role: string; email: string };
type Character = {
  id: string;
  name: string;
  age: number;
  lifeStatus: "alive" | "dead";
  profession?: string;
  moneyCash: number;
  currentLocation?: { id: string; name: string; riskLevel: RiskLevel } | null;
  currentLocationId?: string | null;
};
type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
type Location = { id: string; name: string; description: string; riskLevel: RiskLevel };
type Message = { id: string; messageType: string; content: string; character?: { name: string } | null; createdAt: string };

type Tab = "city" | "scene" | "actions" | "character" | "menu";

const adminRoles = new Set(["support", "moderator", "admin", "master_admin"]);

const actionGroups = {
  comuns: ["Conversar", "Observar", "Entrar", "Sair", "Se render", "Fugir"],
  servicos: ["Solicitar atendimento", "Sacar dinheiro", "Depositar", "Chamar polícia", "Solicitar médico"],
  risco: ["Sacar arma", "Assaltar"]
} as const;

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Ocorreu um erro inesperado.";
}

function getRiskLabel(risk: RiskLevel) {
  if (risk === "LOW") return "🟢 Baixo";
  if (risk === "MEDIUM") return "🟡 Médio";
  if (risk === "HIGH") return "🔴 Alto";
  return "☠️ Extremo";
}

function getMessageVisualType(message: Message) {
  if (message.messageType === "system") return "system";
  if (message.messageType === "action") return "action";
  return "say";
}

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("vu_token"));
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [deadHistory, setDeadHistory] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<Tab>("city");
  const [error, setError] = useState<string>("");

  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" });
  const [showRegister, setShowRegister] = useState(false);
  const [charForm, setCharForm] = useState({ name: "", age: 18, story: "", appearance: "", profession: "" });
  const [speech, setSpeech] = useState("");

  const currentLocation = useMemo(
    () => locations.find((location) => location.id === (character?.currentLocationId ?? character?.currentLocation?.id)),
    [locations, character]
  );

  const errorType = useMemo(() => {
    if (!error) return "none";
    const normalized = error.toLowerCase();
    if (normalized.includes("rápido") || normalized.includes("aguarde")) return "warning";
    return "error";
  }, [error]);

  async function bootstrap(authToken: string) {
    const me = await apiRequest<User>("/auth/me", "GET", undefined, authToken);
    const [activeCharacter, history, locationList] = await Promise.all([
      apiRequest<Character | null>("/characters/me", "GET", undefined, authToken),
      apiRequest<Character[]>("/characters/history", "GET", undefined, authToken),
      apiRequest<Location[]>("/locations", "GET", undefined, authToken)
    ]);
    setUser(me);
    setCharacter(activeCharacter);
    setDeadHistory(history);
    setLocations(locationList);
  }

  useEffect(() => {
    if (!token) return;
    bootstrap(token).catch((err) => {
      setError(getErrorMessage(err));
      handleLogout();
    });
  }, [token]);

  useEffect(() => {
    if (!token || !currentLocation?.id) {
      setMessages([]);
      return;
    }

    apiRequest<Message[]>(`/locations/${currentLocation.id}/messages`, "GET", undefined, token)
      .then(setMessages)
      .catch((err) => setError(getErrorMessage(err)));
  }, [token, currentLocation?.id]);

  function handleLogout() {
    localStorage.removeItem("vu_token");
    setToken(null);
    setUser(null);
    setCharacter(null);
    setMessages([]);
  }

  async function handleRegister() {
    setError("");
    try {
      await apiRequest("/auth/register", "POST", registerForm);
      setShowRegister(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleLogin() {
    setError("");
    try {
      const payload = await apiRequest<{ token: string }>("/auth/login", "POST", loginForm);
      localStorage.setItem("vu_token", payload.token);
      setToken(payload.token);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function createCharacter() {
    if (!token) return;
    setError("");
    try {
      const created = await apiRequest<Character>("/characters", "POST", charForm, token);
      setCharacter(created);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function enterLocation(locationId: string) {
    if (!token) return;
    setError("");

    if (currentLocation?.id === locationId) {
      setError("Você já está neste local. Escolha outro ponto da cidade.");
      return;
    }

    try {
      await apiRequest(`/locations/${locationId}/enter`, "POST", {}, token);
      const refreshed = await apiRequest<Character | null>("/characters/me", "GET", undefined, token);
      setCharacter(refreshed);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function leaveLocation() {
    if (!token || !currentLocation) return;
    setError("");
    try {
      await apiRequest(`/locations/${currentLocation.id}/leave`, "POST", {}, token);
      const refreshed = await apiRequest<Character | null>("/characters/me", "GET", undefined, token);
      setCharacter(refreshed);
      setMessages([]);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function sendSpeech() {
    if (!token || !currentLocation || !speech.trim()) return;
    setError("");
    try {
      await apiRequest(`/locations/${currentLocation.id}/say`, "POST", { content: speech }, token);
      setSpeech("");
      const updated = await apiRequest<Message[]>(`/locations/${currentLocation.id}/messages`, "GET", undefined, token);
      setMessages(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function doAction(action: string) {
    if (!token || !currentLocation) return;
    setError("");
    try {
      await apiRequest(`/locations/${currentLocation.id}/action`, "POST", { action }, token);
      const updated = await apiRequest<Message[]>(`/locations/${currentLocation.id}/messages`, "GET", undefined, token);
      setMessages(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function markDead() {
    if (!token || !character) return;
    setError("");
    try {
      await apiRequest(`/characters/${character.id}/mark-dead`, "POST", { reason: "Evento crítico de RP" }, token);
      const [activeCharacter, history] = await Promise.all([
        apiRequest<Character | null>("/characters/me", "GET", undefined, token),
        apiRequest<Character[]>("/characters/history", "GET", undefined, token)
      ]);
      setCharacter(activeCharacter);
      setDeadHistory(history);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!token) {
    return (
      <main className="mobile-shell auth-shell">
        <section className="hero-panel">
          <p className="hero-kicker">Cidade Viva • RP Hardcore</p>
          <h1>VIDA ÚNICA RP</h1>
          <p className="hero-subtitle">Cada escolha deixa rastro. Cada vida importa.</p>
        </section>

        <section className="panel auth-panel">
          <h2>{showRegister ? "Criar conta" : "Entrar"}</h2>
          <p className="panel-subtitle">Acesso rápido para voltar à cena.</p>

          {showRegister ? (
            <>
              <input placeholder="Usuário" onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} />
              <input placeholder="E-mail" onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
              <input placeholder="Senha" type="password" onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
              <button onClick={handleRegister}>Criar conta</button>
              <button className="ghost" onClick={() => setShowRegister(false)}>Já tenho conta</button>
            </>
          ) : (
            <>
              <input placeholder="Usuário ou e-mail" onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })} />
              <input placeholder="Senha" type="password" onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
              <button onClick={handleLogin}>Entrar na cidade</button>
              <button className="ghost" onClick={() => setShowRegister(true)}>Criar conta</button>
            </>
          )}

          {error && <ErrorBanner message={error} type={errorType} />}
        </section>
      </main>
    );
  }

  return (
    <main className="mobile-shell game-shell">
      <header className="panel top-header">
        <div>
          <p className="hero-kicker">Conexão ativa</p>
          <h2>{user?.username}</h2>
        </div>
        <span className="role-pill">{user?.role}</span>
      </header>

      {error && <ErrorBanner message={error} type={errorType} />}

      {!character ? (
        <section className="panel">
          <h3>Criar personagem</h3>
          <p className="panel-subtitle">Seu personagem terá uma única vida.</p>
          <input placeholder="Nome" onChange={(e) => setCharForm({ ...charForm, name: e.target.value })} />
          <input type="number" placeholder="Idade" onChange={(e) => setCharForm({ ...charForm, age: Number(e.target.value) })} />
          <input placeholder="Profissão" onChange={(e) => setCharForm({ ...charForm, profession: e.target.value })} />
          <textarea placeholder="História" onChange={(e) => setCharForm({ ...charForm, story: e.target.value })} />
          <button onClick={createCharacter}>Criar personagem</button>

          <h4 className="section-title">Histórico de personagens mortos</h4>
          {deadHistory.length === 0 ? (
            <p className="muted">Sem histórico de mortes nesta conta.</p>
          ) : (
            <ul className="history-list">
              {deadHistory.map((dead) => (
                <li key={dead.id}>
                  <strong>{dead.name}</strong>
                  <span>Status final: morto</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          {tab === "city" && (
            <section className="panel">
              <div className="section-head">
                <h3>Cidade</h3>
                <p>Local atual: <strong>{currentLocation?.name ?? "Nenhum"}</strong></p>
              </div>

              <div className="location-grid">
                {locations.map((location) => {
                  const isCurrent = currentLocation?.id === location.id;
                  return (
                    <article key={location.id} className={`location-card ${isCurrent ? "current" : ""}`}>
                      <div className="location-top">
                        <h4>{location.name}</h4>
                        <RiskBadge risk={location.riskLevel} />
                      </div>
                      <p>{location.description}</p>
                      <button onClick={() => enterLocation(location.id)} className={isCurrent ? "ghost" : ""}>
                        {isCurrent ? "Você está aqui" : "Entrar no local"}
                      </button>
                    </article>
                  );
                })}
              </div>

              <button className="ghost" onClick={leaveLocation} disabled={!currentLocation}>
                Sair do local atual
              </button>
            </section>
          )}

          {tab === "scene" && (
            <section className="panel">
              <h3>Cena local</h3>
              <p className="panel-subtitle">{currentLocation ? `Timeline de ${currentLocation.name}` : "Entre em um local para iniciar a cena."}</p>

              <div className="timeline">
                {messages.length === 0 ? (
                  <div className="timeline-empty">
                    <p>Sem movimentação recente nesta cena.</p>
                    <small>Converse ou execute uma ação para iniciar a narrativa.</small>
                  </div>
                ) : (
                  messages.map((message) => {
                    const visualType = getMessageVisualType(message);
                    return (
                      <article key={message.id} className={`timeline-item ${visualType}`}>
                        <div className="timeline-meta">
                          <strong>{message.character?.name ?? "Sistema"}</strong>
                          <span>{new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p>{message.content}</p>
                      </article>
                    );
                  })
                )}
              </div>

              <textarea
                value={speech}
                placeholder="Digite a fala do personagem..."
                onChange={(e) => setSpeech(e.target.value)}
                disabled={!currentLocation}
              />
              <button onClick={sendSpeech} disabled={!currentLocation || !speech.trim()}>Conversar na cena</button>
            </section>
          )}

          {tab === "actions" && (
            <section className="panel">
              <h3>Ações contextuais</h3>
              <p className="panel-subtitle">Comandos de cena por botão. Sem texto de comando manual.</p>

              <ActionGroup title="Ações Comuns" type="common" actions={actionGroups.comuns} onAction={doAction} />
              <ActionGroup title="Serviços e suporte" type="service" actions={actionGroups.servicos} onAction={doAction} />
              <ActionGroup title="Ações de risco" type="risk" actions={actionGroups.risco} onAction={doAction} />

              <details className="actions-extra">
                <summary>Ver todas as ações disponíveis</summary>
                <div className="actions-grid compact">
                  {BASIC_SCENE_ACTIONS.map((action) => (
                    <button key={action} onClick={() => doAction(action)}>{action}</button>
                  ))}
                </div>
              </details>
            </section>
          )}

          {tab === "character" && (
            <section className="panel">
              <h3>Ficha do personagem</h3>
              <div className="character-sheet">
                <div>
                  <span>Nome</span>
                  <strong>{character.name}</strong>
                </div>
                <div>
                  <span>Idade</span>
                  <strong>{character.age} anos</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{character.lifeStatus === "alive" ? "Vivo" : "Morto"}</strong>
                </div>
                <div>
                  <span>Dinheiro</span>
                  <strong>R$ {character.moneyCash}</strong>
                </div>
                <div>
                  <span>Local atual</span>
                  <strong>{currentLocation?.name ?? "Nenhum"}</strong>
                </div>
                <div>
                  <span>Risco atual</span>
                  <RiskBadge risk={currentLocation?.riskLevel ?? "LOW"} />
                </div>
              </div>

              <h4 className="section-title">Histórico de personagens mortos</h4>
              {deadHistory.length === 0 ? (
                <p className="muted">Nenhum personagem morto registrado até agora.</p>
              ) : (
                <ul className="history-list">
                  {deadHistory.map((dead) => (
                    <li key={dead.id}>
                      <strong>{dead.name}</strong>
                      <span>{dead.age} anos • status morto</span>
                    </li>
                  ))}
                </ul>
              )}

              {import.meta.env.DEV && (
                <button className="danger" onClick={markDead}>
                  Marcar morte permanente (debug)
                </button>
              )}
            </section>
          )}

          {tab === "menu" && (
            <section className="panel">
              <h3>Menu</h3>
              <p className="panel-subtitle">Controle de sessão e área administrativa.</p>
              <button className="ghost" onClick={handleLogout}>Sair da conta</button>
              {adminRoles.has(user?.role ?? "") && <AdminPanel token={token} />}
            </section>
          )}
        </>
      )}

      <nav className="bottom-nav">
        <NavButton active={tab === "city"} onClick={() => setTab("city")} label="🏙 Cidade" />
        <NavButton active={tab === "scene"} onClick={() => setTab("scene")} label="💬 Cena" />
        <NavButton active={tab === "actions"} onClick={() => setTab("actions")} label="⚡ Ações" />
        <NavButton active={tab === "character"} onClick={() => setTab("character")} label="👤 Personagem" />
        <NavButton active={tab === "menu"} onClick={() => setTab("menu")} label="☰ Menu" />
      </nav>
    </main>
  );
}

function ErrorBanner({ message, type }: { message: string; type: "none" | "warning" | "error" }) {
  if (!message || type === "none") return null;
  return <section className={`error-banner ${type}`}>{message}</section>;
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span className={`risk-badge ${risk.toLowerCase()}`}>{getRiskLabel(risk)}</span>;
}

function ActionGroup({
  title,
  actions,
  onAction,
  type
}: {
  title: string;
  actions: readonly string[];
  onAction: (action: string) => void;
  type: "common" | "service" | "risk";
}) {
  return (
    <div className="actions-group">
      <h4>{title}</h4>
      <div className={`actions-grid ${type}`}>
        {actions.map((action) => (
          <button key={action} onClick={() => onAction(action)}>
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}

function NavButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      {label}
    </button>
  );
}

function AdminPanel({ token }: { token: string }) {
  const [users, setUsers] = useState<Array<{ id: string; username: string; role: string; isBanned: boolean }>>([]);

  useEffect(() => {
    apiRequest<Array<{ id: string; username: string; role: string; isBanned: boolean }>>("/admin/users", "GET", undefined, token)
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [token]);

  return (
    <div className="admin-panel">
      <h4>Painel Admin</h4>
      {users.length === 0 && <p className="muted">Nenhum usuário carregado.</p>}
      {users.map((user) => (
        <article key={user.id} className="admin-user">
          <span>{user.username}</span>
          <span>{user.role}</span>
          <span>{user.isBanned ? "Banido" : "Ativo"}</span>
        </article>
      ))}
    </div>
  );
}
