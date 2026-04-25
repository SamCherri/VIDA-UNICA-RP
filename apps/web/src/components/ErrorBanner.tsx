type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  const lowerMessage = message.toLowerCase();
  const isWarning = lowerMessage.includes("cooldown") || lowerMessage.includes("aguarde") || lowerMessage.includes("espere");

  return (
    <section className={`notice-banner ${isWarning ? "notice-warning" : "notice-error"}`}>
      <strong>{isWarning ? "Aviso" : "Erro"}</strong>
      <p>{message}</p>
    </section>
  );
}
