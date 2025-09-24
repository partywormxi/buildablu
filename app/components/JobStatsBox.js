import React from 'react';

export default function JobStatsBox({ 
  blupoints, 
  blupointsSet, 
  blulevel 
}) {
  const overLimit = blupointsSet > blupoints;

  return (
    <div
      className="jp-section"
      style={{
        marginBottom: 20,
        display: "inline-block",
        padding: "16px 32px",
        border: "2px solid #0078d4",
        borderRadius: "16px",
        background: "#f5f8ff",
        boxShadow: "0 2px 8px rgba(0,120,212,0.08)",
        fontWeight: "bold",
        fontSize: "1.1em",
      }}
    >
      <span id="blupoints-display" style={{ marginRight: 20 }}>
        Total Available BLU Points: {blupoints}
      </span>
      <span
        id="blupoints-set-display"
        style={{
          marginRight: 20,
          background: overLimit ? "#ffdddd" : undefined,
          color: overLimit ? "#b71c1c" : undefined,
          borderRadius: "8px",
          padding: "4px 8px",
          transition: "background 0.2s, color 0.2s"
        }}
      >
        Current BLU Points Set: {blupointsSet}
      </span>
      <span id="blulevel-display">
        Current BLU Level: {blulevel}
      </span>
    </div>
  );
}