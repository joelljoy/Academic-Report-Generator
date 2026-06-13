const tabs = [
  "Certification Program",
  "FDP / STTP",
  "Workshop / Seminar",
  "Sports / Cultural",
  "In-house Activity",
  "Outreach Program",
];

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="tabs">
      {tabs.map((tab, index) => (
        <button
          key={index}
          className={`tab ${activeTab === index ? "active" : ""}`}
          onClick={() => setActiveTab(index)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
