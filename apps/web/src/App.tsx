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
  currentLocation?: { id: string; name: string; riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" } | null;
  currentLocationId?: string | null;
};
type Location = { id: string; name: string; description: string; riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" };
type Message = { id: string; messageType: string; content: string; character?: { name: string } | null; createdAt: string };

const adminRoles = new Set(["support", "moderator", "admin", "master_admin"]);

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("vu_token"));
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [deadHistory, setDeadHistory] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<"city" | "scene" | "actions" | "character" | "menu">("city");
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
      setError(err.message);
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
      .catch((err) => setError(err.message));
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
    await apiRequest("/auth/register", "POST", registerForm);
    setShowRegister(false);
  }

  async function handleLogin() {
    setError("");
    const payload = await apiRequest<{ token: string }>("/auth/login", "POST", loginForm);
    localStorage.setItem("vu_token", payload.token);
    setToken(payload.token);
  }

  async function createCharacter() {
    if (!token) return;
    const created = await apiRequest<Character>("/characters", "POST", charForm, token);
    setCharacter(created);
  }

  async function enterLocation() {
    if (!token || !selectedLocation) return;
    await apiRequest(`/locations/${selectedLocation}/enter`, "POST", {}, token);
    const refreshed = await apiRequest<Character | null>("/characters/me", "GET", undefined, token);
    setCharacter(refreshed);
  }

  async function leaveLocation() {
    if (!token || !currentLocation) return;
    await apiRequest(`/locations/${currentLocation.id}/leave`, "POST", {}, token);
    const refreshed = await apiRequest<Character | null>("/characters/me", "GET", undefined, token);
    setCharacter(refreshed);
  }

  async function sendSpeech() {
    if (!token || !currentLocation || !speech.trim()) return;
    await apiRequest(`/locations/${currentLocation.id}/say`, "POST", { content: speech }, token);
    setSpeech("");
    const updated = await apiRequest<Message[]>(`/locations/${currentLocation.id}/messages`, "GET", undefined, token);
    setMessages(updated);
  }

  async function doAction(action: string) {
    if (!token || !currentLocation) return;
    await apiRequest(`/locations/${currentLocation.id}/action`, "POST", { action }, token);
    const updated = await apiRequest<Message[]>(`/locations/${currentLocation.id}/messages`, "GET", undefined, token);
    setMessages(updated);
  }

  async function markDead() {
    if (!token || !character) return;
    await apiRequest(`/characters/${character.id}/mark-dead`, "POST", { reason: "Evento crítico de RP" }, token);
    const [activeCharacter, history] = await Promise.all([
      apiRequest<Character | null>("/characters/me", "GET", undefined, token),
      apiRequest<Character[]>("/characters/history", "GET", undefined, token)
    ]);
    setCharacter(activeCharacter);
    setDeadHistory(history);
  }

  if (!token) {
    return (
      <main className="mobile-container">
        <section className="card auth-card">
          <h1>VIDA ÚNICA RP</h1>
          <p>RP mobile-first por cenas visuais e ações contextuais.</p>
          {showRegister ? (
            <>
              <input placeholder="Usuário" onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} />
              <input placeholder="E-mail" onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
              <input placeholder="Senha" type="password" onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
              <button onClick={handleRegister}>Criar conta</button>
              <button className="ghost" onClick={() => setShowRegister(false)}>Voltar</button>
            </>
          ) : (
            <>
              <input placeholder="Usuário ou e-mail" onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })} />
              <input placeholder="Senha" type="password" onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
              <button onClick={handleLogin}>Entrar</button>
              <button className="ghost" onClick={() => setShowRegister(true)}>Criar conta</button>
            </>
          )}
          {error && <small className="error">{error}</small>}
        </section>
      </main>
    );
  }

  return (
    <main className="mobile-container">
      <header className="card">
        <h2>Olá, {user?.username}</h2>
        <p>Role: {user?.role}</p>
      </header>

      {!character ? (
        <section className="card">
          <h3>Criar personagem</h3>
          <input placeholder="Nome" onChange={(e) => setCharForm({ ...charForm, name: e.target.value })} />
          <input type="number" placeholder="Idade" onChange={(e) => setCharForm({ ...charForm, age: Number(e.target.value) })} />
          <input placeholder="Profissão" onChange={(e) => setCharForm({ ...charForm, profession: e.target.value })} />
          <textarea placeholder="História" onChange={(e) => setCharForm({ ...charForm, story: e.target.value })} />
          <button onClick={createCharacter}>Criar personagem</button>

          <h4>Histórico de mortos</h4>
          <ul>
            {deadHistory.map((dead) => (
              <li key={dead.id}>{dead.name}</li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {tab === "city" && (
            <section className="card">
              <h3>Cidade</h3>
              <p>Local atual: {currentLocation?.name ?? "Nenhum"}</p>
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                <option value="">Selecione um local</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
              <button onClick={enterLocation}>Entrar no local</button>
              <button className="ghost" onClick={leaveLocation}>Sair do local</button>
            </section>
          )}

          {tab === "scene" && (
            <section className="card">
              <h3>Cena local</h3>
              <div className="timeline">
                {messages.map((message) => (
                  <article key={message.id}>
                    <strong>{message.character?.name ?? "Sistema"}</strong>
                    <p>{message.content}</p>
                  </article>
                ))}
              </div>
              <textarea value={speech} placeholder="Digite a fala do personagem" onChange={(e) => setSpeech(e.target.value)} />
              <button onClick={sendSpeech}>Conversar</button>
            </section>
          )}

          {tab === "actions" && (
            <section className="card">
              <h3>Ações contextuais</h3>
              <div className="actions-grid">
                {BASIC_SCENE_ACTIONS.map((action) => (
                  <button key={action} onClick={() => doAction(action)}>{action}</button>
                ))}
              </div>
            </section>
          )}

          {tab === "character" && (
            <section className="card">
              <h3>Personagem</h3>
              <p>{character.name} ({character.age} anos)</p>
              <p>Status: {character.lifeStatus === "alive" ? "Vivo" : "Morto"}</p>
              <p>Dinheiro em mãos: R$ {character.moneyCash}</p>
              <p>Risco atual: {currentLocation?.riskLevel ?? "LOW"}</p>
              <button className="danger" onClick={markDead}>Marcar morte permanente (teste)</button>
            </section>
          )}

          {tab === "menu" && (
            <section className="card">
              <h3>Menu</h3>
              <button className="ghost" onClick={handleLogout}>Sair da conta</button>
              {adminRoles.has(user?.role ?? "") && <AdminPanel token={token} />}
            </section>
          )}
        </>
      )}

      {error && <section className="card error">{error}</section>}

      <nav className="bottom-nav">
        <button onClick={() => setTab("city")}>Cidade</button>
        <button onClick={() => setTab("scene")}>Cena</button>
        <button onClick={() => setTab("actions")}>Ações</button>
        <button onClick={() => setTab("character")}>Personagem</button>
        <button onClick={() => setTab("menu")}>Menu</button>
      </nav>
    </main>
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
