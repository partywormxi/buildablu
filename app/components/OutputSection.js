export default function OutputSection({ 
  xmlOutput, 
  qualifyingTraits, 
  statBonuses 
}) {
  return (
    <div className="output-section" style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
      <div>
        <h2>GENERATED XML</h2>
        <pre
          id="xml-output"
          style={{
            border: "2px solid #0078d4",
            borderRadius: 6,
            padding: 12,
            background: "#f9f9f9",
            fontFamily: "monospace",
            userSelect: "all",
            minWidth: 300,
            minHeight: 120,
            boxSizing: "border-box",
            textAlign: 'left'
          }}
        >
          {xmlOutput}
        </pre>
      </div>
      <div>
        <h2>JOB TRAITS</h2>
        <pre id="job-trait-output">{qualifyingTraits.join("\n")}</pre>
      </div>
      <div>
        <h2>STAT BONUSES</h2>
        <pre id="stat-bonus-display" style={{ fontWeight: "bold" }}>
          {statBonuses.length ? statBonuses.join(", \n") : "None"}
        </pre>
      </div>
    </div>
  );
}