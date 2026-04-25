import { LocationCard } from "./LocationCard";

type Location = { id: string; name: string; description: string; riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" };

type CityScreenProps = {
  locations: Location[];
  currentLocationId?: string | null;
  currentLocationName?: string;
  onEnterLocation: (locationId: string) => void;
  onLeaveLocation: () => void;
};

export function CityScreen({ locations, currentLocationId, currentLocationName, onEnterLocation, onLeaveLocation }: CityScreenProps) {
  return (
    <section className="card">
      <h3>Cidade</h3>
      <p className="section-subtitle">Local atual: {currentLocationName ?? "Nenhum"}</p>
      <div className="locations-grid">
        {locations.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
            isCurrent={location.id === currentLocationId}
            onEnter={onEnterLocation}
          />
        ))}
      </div>
      <button className="ghost" onClick={onLeaveLocation}>
        Sair do local atual
      </button>
    </section>
  );
}
