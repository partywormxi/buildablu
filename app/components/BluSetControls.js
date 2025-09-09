export default function BluSetControls({
  blusetName,
  setBlusetName,
  handleSaveBluset,
  blusets,
  selectedBluset,
  handleRecallBluset,
  handleClearBlusets,
  handleImportSampleBlusets
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <input
        type="text"
        placeholder="newsetname"
        value={blusetName}
        onChange={e => setBlusetName(e.target.value)}
        style={{ marginRight: 8, padding: 4, borderRadius: 4, border: "1px solid #aaa" }}
      />
      <button
        onClick={handleSaveBluset}
        style={{ padding: "4px 12px", borderRadius: 4, background: "#0078d4", color: "#fff", border: "none", fontWeight: "bold", marginRight: 12 }}
      >
        Save BLUset
      </button>
      <select
        value={selectedBluset || ""}
        onChange={e => handleRecallBluset(e.target.value)}
        style={{ padding: 4, borderRadius: 4, border: "1px solid #aaa", marginRight: 12 }}
      >
        <option value="">Recall BLUset...</option>
        {blusets.map(bs => (
          <option key={bs.name} value={bs.name}>{bs.name}</option>
        ))}
      </select>
      <button
        onClick={handleClearBlusets}
        style={{ padding: "4px 12px", borderRadius: 4, background: "#d32f2f", color: "#fff", border: "none", fontWeight: "bold", marginRight: 12 }}
      >
        Clear All Saved BLUsets
      </button>
      <button
        onClick={handleImportSampleBlusets}
        style={{ padding: "4px 12px", borderRadius: 4, background: "#388e3c", color: "#fff", border: "none", fontWeight: "bold" }}
      >
        Import Sample BLUsets
      </button>
    </div>
  );
}