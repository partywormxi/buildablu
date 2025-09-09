import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export default function JobTypeToggle({
  jobType,
  handleJobTypeChange,
  jpPoints,
  setJpPoints,
  assimilationPoints,
  setAssimilationPoints,
  bonus1200,
  setBonus1200,
  bonus100,
  setBonus100,
  masterLevel,
  setMasterLevel
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <ToggleButtonGroup
        value={jobType}
        exclusive
        onChange={handleJobTypeChange}
        aria-label="job type"
      >
        <ToggleButton value="main" aria-label="main job">
          Main Job
        </ToggleButton>
        <ToggleButton value="subjob" aria-label="subjob">
          Subjob
        </ToggleButton>
      </ToggleButtonGroup>
      <br /><br />
      {jobType === 'main' && (
        <div style={{
          display: "inline-block",
          marginLeft: 20,
          padding: "16px 32px",
          border: "2px solid #947ADA",
          borderRadius: "16px",
          background: "#f7f6ff",
          boxShadow: "0 2px 8px rgba(148,122,218,0.08)",
          fontWeight: "bold",
          fontSize: "1.1em",
        }}>
          <label style={{ fontWeight: "bold", marginRight: 20 }}>
            JP Blue Magic Points
            <div className="styled-number-input" style={{ marginRight: 20, marginLeft: 8 }}>
              <button type="button" onClick={() => setJpPoints(Math.max(0, jpPoints - 1))}>-</button>
              <input
                type="number"
                value={jpPoints}
                min={0}
                max={20}
                onChange={e => setJpPoints(Number(e.target.value))}
              />
              <button type="button" onClick={() => setJpPoints(Math.min(20, jpPoints + 1))}>+</button>
            </div>
          </label>
          <label style={{ fontWeight: "bold", marginRight: 20 }}>
            Assimilation merit points
            <div className="styled-number-input" style={{ marginLeft: 8 }}>
              <button type="button" onClick={() => setAssimilationPoints(Math.max(0, assimilationPoints - 1))}>-</button>
              <input
                type="number"
                value={assimilationPoints}
                min={0}
                max={5}
                onChange={e => setAssimilationPoints(Number(e.target.value))}
              />
              <button type="button" onClick={() => setAssimilationPoints(Math.min(5, assimilationPoints + 1))}>+</button>
            </div>
          </label>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 16, width: "100%" }}>
            <div className="checkbox-wrapper-3" style={{ fontWeight: "bold", marginRight: 24 }}>
              <label>
                <input
                  type="checkbox"
                  id="cbx-3"
                  checked={bonus1200}
                  onChange={e => setBonus1200(e.target.checked)}
                /><label htmlFor="cbx-3" className="toggle"><span></span></label>
                Job Trait Bonus 1200
              </label>
            </div>
            <div className="checkbox-wrapper-4" style={{ fontWeight: "bold" }}>
              <label>
                <input
                  type="checkbox"
                  id="cbx-4"
                  checked={bonus100}
                  onChange={e => setBonus100(e.target.checked)}
                /><label htmlFor="cbx-4" className="toggle"><span></span></label>
                Job Trait Bonus 100
              </label>
            </div>
          </div>
        </div>
      )}
      {jobType === 'subjob' && (
        <div style={{
          display: "inline-block",
          marginLeft: 20,
          padding: "16px 32px",
          border: "2px solid #947ADA",
          borderRadius: "16px",
          background: "#f7f6ff",
          boxShadow: "0 2px 8px rgba(0,120,212,0.08)",
          fontWeight: "bold",
          fontSize: "1.1em",
        }}>
          <label style={{ fontWeight: "bold" }}>
            Main Job Master Level
            <div className="styled-number-input" style={{ marginLeft: 8 }}>
              <button type="button" onClick={() => setMasterLevel(Math.max(0, masterLevel - 1))}>-</button>
              <input
                type="number"
                value={masterLevel}
                min={0}
                max={50}
                onChange={e => setMasterLevel(Number(e.target.value))}
              />
              <button type="button" onClick={() => setMasterLevel(Math.min(50, masterLevel + 1))}>+</button>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}