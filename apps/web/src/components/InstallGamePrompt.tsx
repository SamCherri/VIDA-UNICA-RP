import { useEffect, useMemo, useState } from "react";

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallGamePrompt() {
  const [promptEvent, setPromptEvent] = useState<DeferredInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as DeferredInstallPromptEvent);
    }

    function onAppInstalled() {
      setPromptEvent(null);
      setHidden(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const message = useMemo(() => {
    if (promptEvent) return "Jogue em tela cheia instalando o jogo no celular.";
    return "No Chrome, toque em ⋮ e depois em Adicionar à tela inicial.";
  }, [promptEvent]);

  async function handleInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  }

  if (hidden) return null;

  return (
    <section className="card install-prompt" aria-label="Instalar jogo">
      <div>
        <p className="install-title">Modo jogo instalado</p>
        <p className="install-text">{message}</p>
      </div>

      <div className="install-actions">
        <button className="install-cta" onClick={handleInstall} disabled={!promptEvent}>
          Instalar jogo no celular
        </button>
        <button className="ghost install-dismiss" onClick={() => setHidden(true)}>
          Agora não
        </button>
      </div>
    </section>
  );
}
