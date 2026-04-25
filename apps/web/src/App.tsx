import { useEffect, useMemo, useState } from "react";
import { BASIC_SCENE_ACTIONS, PROFESSIONS, type AvailableSceneAction, type Profession } from "@vida-unica/shared";
import { apiRequest } from "./api/client";
import { ErrorBanner } from "./components/ErrorBanner";
import { AuthScreen } from "./components/AuthScreen";
import { CityScreen } from "./components/CityScreen";
import { SceneScreen } from "./components/SceneScreen";
import { ActionsScreen } from "./components/ActionsScreen";
import { CharacterScreen } from "./components/CharacterScreen";
import { BottomNav } from "./components/BottomNav";
import type { PresenceCharacter } from "./components/PresencePanel";

type User = { id: string; username: string; role: string; email: string };
type Character = {
  id: string;
  name: string;
  age: number;
  lifeStatus: "alive" | "dead";
  profession?: Profession;
  moneyCash: number;
  currentLocation?: { id: string; name: string; riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" } | null;
  currentLocationId?: string | null;
};
type Location = { id: string; name: string; description: string; riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" };
type Message = { id: string; messageType: string; content: string; character?: { name: string } | null; createdAt: string };

const adminRoles = new Set(["support", "moderator", "admin", "master_admin"]);
const POLLING_INTERVAL_MS = 5000;
const DEFAULT_PROFESSION: Profession = "Desempregado";

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Ocorreu um erro inesperado.";
}

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("vu_token"));
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [deadHistory, setDeadHistory] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [presence, setPresence] = useState<PresenceCharacter[]>([]);
  const [availableActions, setAvailableActions] = useState<AvailableSceneAction[]>([]);
  const [sceneUpdatedAt, setSceneUpdatedAt] = useState<Date | null>(null);
  const [tab, setTab] = useState<"city" | "scene" | "actions" | "character" | "menu">("city");
  const [error, setError] = useState<string>("");

  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" });
  const [showRegister, setShowRegister] = useState(false);
  const [charForm, setCharForm] = useState({ name: "", age: 18, story: "", appearance: "", profession: "" });
  const [speech, setSpeech] = useState("");
  const [selectedProfession, setSelectedProfession] = useState<Profession>(DEFAULT_PROFESSION);
  const [isSavingProfession, setIsSavingProfession] = useState(false);

  const currentLocation = useMemo(
    () => locations.find((location) => location.id === (character?.currentLocationId ?? character?.currentLocation?.id)),
    [locations, character]
  );

  async function refreshSceneData(authToken: string, locationId: string, silent = true) {
    const [messagesResult, presenceResult] = await Promise.allSettled([
      apiRequest<Message[]>(`/locations/${locationId}/messages`, "GET", undefined, authToken),
      apiRequest<PresenceCharacter[]>(`/locations/${locationId}/presence`, "GET", undefined, authToken)
    ]);

    let hasSuccessfulUpdate = false;

    if (messagesResult.status === "fulfilled") {
      setMessages(messagesResult.value);
      hasSuccessfulUpdate = true;
    } else if (!silent) {
      setError(getErrorMessage(messagesResult.reason));
    }

    if (presenceResult.status === "fulfilled") {
      setPresence(presenceResult.value);
      hasSuccessfulUpdate = true;
    }

    if (hasSuccessfulUpdate) {
      setSceneUpdatedAt(new Date());
    }
  }

  async function refreshAvailableActions(authToken: string, locationId: string) {
    try {
      const actions = await apiRequest<AvailableSceneAction[]>(`/locations/${locationId}/available-actions`, "GET", undefined, authToken);
      setAvailableActions(actions);
    } catch {
      setAvailableActions([]);
    }
  }

  async function bootstrap(authToken: string) {
    const me = await apiRequest<User>("/auth/me", "GET", undefined, authToken);
    const [activeCharacter, history, locationList] = await Promise.all([
      apiRequest<Character | null>("/characters/me", "GET", undefined, authToken),
      apiRequest<Character[]>("/characters/history", "GET", undefined, authToken),
      apiRequest<Location[]>("/locations", "GET", undefined, authToken)
    ]);
    setUser(me);
    setCharacter(activeCharacter);
    setSelectedProfession((activeCharacter?.profession as Profession | undefined) ?? DEFAULT_PROFESSION);
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
    if (!character) return;
    setSelectedProfession((character.profession as Profession | undefined) ?? DEFAULT_PROFESSION);
  }, [character]);

  useEffect(() => {
    if (!token || !currentLocation?.id) {
      setMessages([]);
      setPresence([]);
      setAvailableActions([]);
      setSceneUpdatedAt(null);
      return;
    }

    void refreshSceneData(token, currentLocation.id, true);
    void refreshAvailableActions(token, currentLocation.id);

    const intervalId = window.setInterval(() => {
      void refreshSceneData(token, currentLocation.id, true);
    }, POLLING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [token, currentLocation?.id]);

  function handleLogout() {
    localStorage.removeItem("vu_token");
    setToken(null);
    setUser(null);
    setCharacter(null);
    setMessages([]);
    setPresence([]);
    setAvailableActions([]);
    setSceneUpdatedAt(null);
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
      setSelectedProfession((created.profession as Profession | undefined) ?? DEFAULT_PROFESSION);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function enterLocation(locationId = selectedLocation) {
    if (!token || !locationId) return;

    if (locationId === currentLocation?.id) {
      setError("Você já está neste local. Escolha outro ponto da cidade para movimentar a cena.");
      return;
    }

    setError("");
    try {
      await apiRequest(`/locations/${locationId}/enter`, "POST", {}, token);
      setSelectedLocation(locationId);
      const refreshed = await apiRequest<Character | null>("/characters/me", "GET", undefined, token);
      setCharacter(refreshed);
      await refreshSceneData(token, locationId, true);
      setTab("scene");
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
      setPresence([]);
      setAvailableActions([]);
      setSceneUpdatedAt(null);
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
      await refreshSceneData(token, currentLocation.id, false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function doAction(action: string) {
    if (!token || !currentLocation) return;
    setError("");
    try {
      await apiRequest(`/locations/${currentLocation.id}/action`, "POST", { action }, token);
      await refreshSceneData(token, currentLocation.id, false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function doProfessionalAction(actionId: string) {
    if (!token || !currentLocation) return;
    setError("");
    try {
      await apiRequest(`/locations/${currentLocation.id}/professional-action`, "POST", { actionId }, token);
      await refreshSceneData(token, currentLocation.id, false);
      await refreshAvailableActions(token, currentLocation.id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function saveProfession() {
    if (!token) return;
    setError("");
    setIsSavingProfession(true);
    try {
      const updated = await apiRequest<Character>("/characters/me/profession", "POST", { profession: selectedProfession }, token);
      setCharacter(updated);
      setSelectedProfession((updated.profession as Profession | undefined) ?? DEFAULT_PROFESSION);
      if (updated.currentLocationId) {
        await refreshAvailableActions(token, updated.currentLocationId);
      } else {
        setAvailableActions([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSavingProfession(false);
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
      <>
        <AuthScreen
          showRegister={showRegister}
          loginForm={loginForm}
          registerForm={registerForm}
          onLoginFormChange={setLoginForm}
          onRegisterFormChange={setRegisterForm}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onToggleMode={setShowRegister}
        />
        {error && (
          <main className="mobile-container">
            <ErrorBanner message={error} />
          </main>
        )}
      </>
    );
  }

  return (
    <main className="mobile-container">
      <header className="card app-header">
        <div>
          <h2>VIDA ÚNICA RP</h2>
          <p>Operador: {user?.username}</p>
        </div>
        <span className="role-pill">{user?.role}</span>
      </header>

      {!character ? (
        <section className="card">
          <h3>Criar personagem</h3>
          <p className="section-subtitle">Defina sua identidade antes de entrar nas ruas.</p>
          <input value={charForm.name} placeholder="Nome" onChange={(e) => setCharForm({ ...charForm, name: e.target.value })} />
          <input
            value={charForm.age}
            type="number"
            placeholder="Idade"
            onChange={(e) => setCharForm({ ...charForm, age: Number(e.target.value) })}
          />
          <input
            value={charForm.profession}
            placeholder="Profissão"
            onChange={(e) => setCharForm({ ...charForm, profession: e.target.value })}
          />
          <textarea value={charForm.story} placeholder="História" onChange={(e) => setCharForm({ ...charForm, story: e.target.value })} />
          <button onClick={createCharacter}>Criar personagem</button>

          <h4>Histórico de mortos</h4>
          <ul className="dead-list">
            {deadHistory.map((dead) => (
              <li key={dead.id}>
                <strong>{dead.name}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {tab === "city" && (
            <CityScreen
              locations={locations}
              currentLocationId={currentLocation?.id}
              currentLocationName={currentLocation?.name}
              onEnterLocation={enterLocation}
              onLeaveLocation={leaveLocation}
            />
          )}
          {tab === "scene" && (
            <SceneScreen
              messages={messages}
              presence={presence}
              speech={speech}
              lastUpdatedAt={sceneUpdatedAt}
              onSpeechChange={setSpeech}
              onSendSpeech={sendSpeech}
            />
          )}
          {tab === "actions" && (
            <ActionsScreen
              actions={BASIC_SCENE_ACTIONS}
              professionalActions={availableActions}
              hasLocation={Boolean(currentLocation)}
              onAction={doAction}
              onProfessionalAction={doProfessionalAction}
            />
          )}
          {tab === "character" && (
            <CharacterScreen
              character={character}
              professions={PROFESSIONS}
              selectedProfession={selectedProfession}
              onProfessionChange={setSelectedProfession}
              onSaveProfession={saveProfession}
              isSavingProfession={isSavingProfession}
              currentLocationName={currentLocation?.name}
              currentRiskLevel={currentLocation?.riskLevel}
              deadHistory={deadHistory}
              canMarkDead={import.meta.env.DEV}
              onMarkDead={markDead}
            />
          )}

          {tab === "menu" && (
            <section className="card">
              <h3>Menu</h3>
              <button className="ghost" onClick={handleLogout}>
                Sair da conta
              </button>
              {adminRoles.has(user?.role ?? "") && <AdminPanel token={token} />}
            </section>
          )}
        </>
      )}

      {error && <ErrorBanner message={error} />}

      <BottomNav activeTab={tab} onChange={setTab} />
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
