'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { BLOCKED_PAGES } from 'next/dist/shared/lib/constants';

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
  const [bonus1200, setBonus1200] = useState(true);
  const [bonus100, setBonus100] = useState(true);

  // New state for job toggle and master level
  const [jobType, setJobType] = useState('main'); // 'main' or 'subjob'
  const [masterLevel, setMasterLevel] = useState(0);

  // New state for BLU level
  const [blulevel, setBluLevel] = useState(jobType === 'main' ? 99 : 49);

  const [blusets, setBlusets] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("blu_blusets");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [blusetName, setBlusetName] = useState('');
  const [selectedBluset, setSelectedBluset] = useState('');
  const [sampleBlusets, setSampleBlusets] = useState([]);

  useEffect(() => {
    fetch('./data.json')
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
      if (masterLevel < 10) {
        return 30;
      } else {
        return 35;
      }
    } else {
      return 55 + jpPoints + assimilationPoints;
    }
  }, [jobType, masterLevel, jpPoints, assimilationPoints]);

  const blupointsSet = useMemo(
    () => selectedSpells.reduce((sum, spellName) => sum + (spellCostMap[spellName] || 0), 0),
    [selectedSpells, spellCostMap]
  );

  const spellLimit = useMemo(() => {
    if (jobType === 'subjob') {
      if (masterLevel < 10) {
        return 14;
      } else {
        return 16;
      }
    } else {
      return 20;
    }
  }, [jobType, masterLevel]);


  const limitReached = selectedSpells.length >= spellLimit;

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

  // XML output with bluset name
  const xmlOutput = useMemo(() => {
    const setName = selectedBluset ? `${selectedBluset}` : 'newsetname';
    let xmlString = `<${setName}>\n`;
    selectedSpells.forEach((value, idx) => {
      const slotNum = String(idx + 1).padStart(2, '0');
      xmlString += `  <slot${slotNum}>${value}</slot${slotNum}>\n`;
    });
    xmlString += `</${setName}>`;
    return xmlString.toLowerCase();
  }, [selectedSpells, selectedBluset]);

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

  // Save blusets to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("blu_blusets", JSON.stringify(blusets));
    }
  }, [blusets]);

  // Save current bluset
  function handleSaveBluset() {
    if (!blusetName.trim()) return;
    const newBluset = {
      name: blusetName.trim(),
      spells: selectedSpells,
    };
    setBlusets(prev =>
      [
        ...prev.filter(bs => bs.name !== newBluset.name),
        newBluset
      ]
    );
    setSelectedBluset(newBluset.name);
    setBlusetName('');
  }

  // Recall bluset
  function handleRecallBluset(name) {
    const bs = blusets.find(b => b.name === name);
    if (bs) {
      setSelectedSpells(bs.spells);
      setSelectedBluset(name);
    }
  }

  // Clear all blusets
  function handleClearBlusets() {
    setBlusets([]);
    setSelectedBluset('');
    if (typeof window !== "undefined") {
      localStorage.removeItem("blu_blusets");
    }
  }

  // Button handler to read sets from samplesets.xml and add to recall blusets
  function handleImportSampleBlusets() {
    fetch('./samplesets.xml')
      .then(res => res.text())
      .then(xmlText => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        //const sets = Array.from(xmlDoc.Descendants().Where(x => x.Name.LocalName.StartsWith("sample")));
        const sets = Array.from(xmlDoc.getElementsByTagName("sample"));
        const samples = sets.map(setEl => {
          const name = setEl.getAttribute("name") || "sample";
          const spells = Array.from(setEl.children)
            .filter(child => child.tagName.startsWith("slot"))
            .map(child => child.textContent);
          return { name, spells };
        });
        // Add samples to blusets if not already present
        setBlusets(prev => {
          const existingNames = new Set(prev.map(bs => bs.name));
          const newSets = samples.filter(s => !existingNames.has(s.name));
          return [...prev, ...newSets];
        });
        setSampleBlusets(samples); // Optionally keep for reference
      });
  }

  return (
    <div className="container" style={{ maxWidth: "80%", padding: 20 }}>
      <h1>Build a BLU</h1>
      {/* BLUset Save/Recall/Clear/Import UI */}
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
            <div className="checkbox-wrapper-3" style={{ fontWeight: "bold" }}>
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
            <label style={{ marginLeft: 20 }}>
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
              // Calculate color for Point Cost column (1-8)
              const minCost = 1, maxCost = 8;
              const percent = Math.max(0, Math.min(1, (spellCost - minCost) / (maxCost - minCost)));
              const pointCostColor = `rgb(${255 - percent * 120}, ${255 - percent * 120}, ${255 - percent * 120})`;

              // Row color based on Subtype
              let rowBg = "";
              const subtype = (item["Subtype"] || "").toLowerCase();
              if (subtype === "light") rowBg = "#fff";
              else if (subtype === "earth") rowBg = "#af7d66ff"; // brown
              else if (subtype === "fire") rowBg = "#dd9898ff";
              else if (subtype === "water") rowBg = "#61b5eeff";
              else if (subtype === "wind") rowBg = "#99eeb3ff";
              else if (subtype === "ice") rowBg = "#87e7eeff";
              else if (subtype === "lightning") rowBg = "#d68cddff";
              else if (subtype === "dark") rowBg = "#726969ff";
              else if (subtype === "slashing" || subtype === "blunt" || subtype === "piercing") rowBg = "#d3d3d3"; // grey

              return (
                <tr key={item.Spell} style={rowBg ? { background: rowBg } : undefined}>
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
                    <td
                      key={key}
                      style={
                        key === "Point Cost"
                          ? {
                              background: pointCostColor,
                              fontWeight: "bold"
                            }
                          : undefined
                      }
                    >
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

