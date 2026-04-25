import { StatusBadge } from "./StatusBadge";

type Location = { id: string; name: string; description: string; riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" };

type LocationCardProps = {
  location: Location;
  isCurrent: boolean;
  onEnter: (locationId: string) => void;
};

export function LocationCard({ location, isCurrent, onEnter }: LocationCardProps) {
  return (
    <article className={`location-card ${isCurrent ? "location-current" : ""}`}>
      <div className="location-header">
        <h4>{location.name}</h4>
        <StatusBadge riskLevel={location.riskLevel}>{location.riskLevel}</StatusBadge>
      </div>
      <p>{location.description}</p>
      {isCurrent ? (
        <button className="ghost" disabled>
          Você já está aqui
        </button>
      ) : (
        <button onClick={() => onEnter(location.id)}>Entrar no local</button>
      )}
    </article>
  );
}
