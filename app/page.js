'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

function createXMLSet(selectedValues) {
  let xmlString = '<sets>\n';
  selectedValues.forEach((value, idx) => {
    const slotNum = String(idx + 1).padStart(2, '0');
    xmlString += `  <slot${slotNum}>${value}</slot${slotNum}>\n`;
  });
  xmlString += '</sets>';
  return xmlString;
}

export default function Page() {
  const [data, setData] = useState([]);
  const [selectedSpells, setSelectedSpells] = useState([]);
  const [jpPoints, setJpPoints] = useState(20);
  const [assimilationPoints, setAssimilationPoints] = useState(5);
  const [search, setSearch] = useState('');
  const [bonus1200, setBonus1200] = useState(false);
  const [bonus100, setBonus100] = useState(false);

  // New state for job toggle and master level
  const [jobType, setJobType] = useState('main'); // 'main' or 'subjob'
  const [masterLevel, setMasterLevel] = useState(0);

  // New state for BLU level
  const [blulevel, setBluLevel] = useState(jobType === 'main' ? 99 : 49);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/partywormxi/buildablu/refs/heads/main/public/data.json')
      .then(res => res.json())
      .then(setData);
  }, []);

  // Memoized spell cost lookup
  const spellCostMap = useMemo(() => {
    const map = {};
    data.forEach(item => {
      map[item.Spell] = parseInt(item["Point Cost"], 10) || 0;
    });
    return map;
  }, [data]);

  // Derived values
  const blupoints = useMemo(() => {
    if (jobType === 'subjob') {
      return 10 + Math.floor(masterLevel / 5);
    } else {
      return 55 + jpPoints + assimilationPoints;
    }
  }, [jobType, masterLevel, jpPoints, assimilationPoints]);

  const blupointsSet = useMemo(
    () => selectedSpells.reduce((sum, spellName) => sum + (spellCostMap[spellName] || 0), 0),
    [selectedSpells, spellCostMap]
  );
  const limitReached = selectedSpells.length >= 20;

  // Table filtering: only display spells where "Available Level" <= blulevel and matches search
  const filteredData = useMemo(() =>
    data.filter(item =>
      (parseInt(item["Available Level"], 10) <= blulevel) &&
      Object.values(item).some(
        val => val && val.toString().toLowerCase().includes(search.toLowerCase())
      )
    ),
    [data, search, blulevel]
  );

  // Job trait output
  const traitTotals = useMemo(() => {
    const totals = {};
    selectedSpells.forEach(spellName => {
      const spellObj = data.find(item => item.Spell === spellName);
      if (spellObj && spellObj["Creates Job Trait"]) {
        const trait = spellObj["Creates Job Trait"];
        const points = parseInt(spellObj["Trait Points"], 10) || 0;
        totals[trait] = (totals[trait] || 0) + points;
      }
    });
    return totals;
  }, [selectedSpells, data]);

  const qualifyingTraits = useMemo(() =>
    Object.entries(traitTotals)
      .filter(([trait, total]) => total >= 8)
      .map(([trait, total]) => {
        let tier = Math.floor(total / 8);
        if (jobType === 'main' && bonus100) tier++;
        if (jobType === 'main' && bonus1200) tier++;
        return `${trait} (Tier ${tier}, ${total} points)`;
      }),
    [traitTotals, bonus100, bonus1200]
  );

  // Stat bonus output
  const statBonuses = useMemo(() => [
    ...new Set(
      selectedSpells
        .map(spellName => {
          const spellObj = data.find(item => item.Spell === spellName);
          return spellObj ? spellObj["Stat Bonus"] : null;
        })
        .filter(bonus => bonus && bonus.trim() !== "")
    ),
  ], [selectedSpells, data]);

  // XML output
  const xmlOutput = useMemo(() => createXMLSet(selectedSpells), [selectedSpells]);

  // Checkbox handler
  function handleCheckbox(spellName, spellCost, checked) {
    let newSelected;
    if (checked) {
      newSelected = [...selectedSpells, spellName];
    } else {
      newSelected = selectedSpells.filter(s => s !== spellName);
    }
    const newBlupointsSet = newSelected.reduce((sum, name) => sum + (spellCostMap[name] || 0), 0);
    if (checked) {
      if (newSelected.length <= 20 && newBlupointsSet <= blupoints) {
        setSelectedSpells(newSelected);
      }
    } else {
      setSelectedSpells(newSelected);
    }
  }

  // Toggle handler
  function handleToggleJobType() {
    setJobType(prev => (prev === 'main' ? 'subjob' : 'main'));
  }

  // Toggle handler for ToggleButtonGroup
  const handleJobTypeChange = (event, newJobType) => {
    if (newJobType !== null) {
      setJobType(newJobType);
    }
  };

  // Update BLU level when jobType or masterLevel changes
  useEffect(() => {
    if (jobType === 'main') {
      setBluLevel(99);
    } else {
      setBluLevel(49 + Math.floor(masterLevel / 5));
    }
  }, [jobType, masterLevel]);

  return (
    <div className="container" style={{ maxWidth: "80%", padding: 20 }}>
      <h1>Build a BLU</h1>
      <div className="jp-section" style={{ marginBottom: 20 }}>
        <span id="blupoints-display" style={{ marginLeft: 20, fontWeight: "bold" }}>
          Total Available BLU Points: {blupoints}
        </span>
        <span id="blupoints-set-display" style={{ marginLeft: 20, fontWeight: "bold" }}>
          Current BLU Points Set: {blupointsSet}
        </span>
        <span id="blulevel-display" style={{ marginLeft: 20, fontWeight: "bold" }}>
          Current BLU Level: {blulevel}
        </span>
      </div>
      {/* Main/Subjob Toggle */}
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
        <br></br><br></br>
        {jobType === 'main' && (
          <div style={{ display: "inline-block", marginLeft: 20 }}>
            <label style={{ fontWeight: "bold", marginRight: 20 }}>
              JP Blue Magic Points
              <input
                type="number"
                value={jpPoints}
                min={0}
                max={20}
                onChange={e => setJpPoints(Number(e.target.value))}
                style={{ marginLeft: 8, fontWeight: "normal" }}
              />
            </label>
            <label style={{ fontWeight: "bold", marginRight: 20 }}>
              Assimilation merit points
              <input
                type="number"
                value={assimilationPoints}
                min={0}
                max={5}
                onChange={e => setAssimilationPoints(Number(e.target.value))}
                style={{ marginLeft: 8, fontWeight: "normal" }}
              />
            </label>
            <label style={{ marginLeft: 20 }}>
              <input
                type="checkbox"
                checked={bonus1200}
                onChange={e => setBonus1200(e.target.checked)}
              />
              Job Trait Bonus 1200
            </label>
            <label style={{ marginLeft: 20 }}>
              <input
                type="checkbox"
                checked={bonus100}
                onChange={e => setBonus100(e.target.checked)}
              />
              Job Trait Bonus 100
            </label>
          </div>
        )}
        {jobType === 'subjob' && (
          <label style={{ marginLeft: 20, fontWeight: "bold" }}>
            Main Job Master Level
            <input
              type="number"
              min={0}
              max={50}
              value={masterLevel}
              onChange={e => setMasterLevel(Number(e.target.value))}
              style={{ marginLeft: 8, width: 60, fontWeight: "normal" }}
            />
          </label>
        )}
      </div>
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
      <div className="search-section" style={{ marginTop: 20, textAlign: "left" }}>
        <input
          type="text"
          id="search-input"
          placeholder="Search spells..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, width: "100%", maxWidth: 455, textAlign: "left" , borderRadius: 4, border: "1px solid #000000ff"}}
        />
      </div>
      <div id="table-container" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Select</th>
              {data[0] &&
                Object.keys(data[0]).map(key => (
                  <th key={key}>{key}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => {
              const spellCost = parseInt(item["Point Cost"], 10) || 0;
              const checked = selectedSpells.includes(item.Spell);
              const disable =
                (!checked &&
                  (limitReached ||
                    blupointsSet + spellCost > blupoints));
              return (
                <tr key={item.Spell}>
                  <td>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disable}
                      onChange={e =>
                        handleCheckbox(item.Spell, spellCost, e.target.checked)
                      }
                    />
                  </td>
                  {Object.keys(item).map(key => (
                    <td key={key}>
                      {key === "Wiki Link" && item[key] ? (
                        <a href={item[key]} target="_blank" rel="noopener noreferrer">
                          {item[key]}
                        </a>
                      ) : (
                        item[key]
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

