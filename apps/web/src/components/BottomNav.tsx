type Tab = "city" | "scene" | "character" | "menu";

type BottomNavProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

const tabs: Array<{ id: Tab; label: string; emoji: string }> = [
  { id: "city", label: "Cidade", emoji: "🏙" },
  { id: "scene", label: "Agora", emoji: "💬" },
  { id: "character", label: "Vida", emoji: "👤" },
  { id: "menu", label: "Menu", emoji: "☰" }
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => onChange(tab.id)}>
          <span>{tab.emoji}</span>
          <small>{tab.label}</small>
        </button>
      ))}
    </nav>
  );
}
