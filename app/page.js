'use client';

import React, { useEffect, useState, useMemo } from 'react';
import BluSetControls from './components/BluSetControls';
import JobStatsBox from './components/JobStatsBox';
import JobTypeToggle from './components/JobTypeToggle';
import OutputSection from './components/OutputSection';
import SpellTable from './components/SpellTable';

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

  // Store blusets by jobType
  const [blusetsByJob, setBlusetsByJob] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("blu_blusets_by_job");
      return saved ? JSON.parse(saved) : { main: [], subjob: [] };
    }
    return { main: [], subjob: [] };
  });
  const [blusetName, setBlusetName] = useState('');
  const [selectedBluset, setSelectedBluset] = useState('');
  const [sampleBlusets, setSampleBlusets] = useState([]);

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
    [traitTotals, bonus100, bonus1200, jobType]
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

  // Update blusets when jobType changes
  useEffect(() => {
    setSelectedBluset('');
    setSelectedSpells([]);
  }, [jobType]);

  // Save blusets to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("blu_blusets_by_job", JSON.stringify(blusetsByJob));
    }
  }, [blusetsByJob]);

  // Save current bluset for current jobType
  function handleSaveBluset() {
    if (!blusetName.trim()) return;
    const newBluset = {
      name: blusetName.trim(),
      spells: selectedSpells,
    };
    setBlusetsByJob(prev => {
      const jobSets = prev[jobType].filter(bs => bs.name !== newBluset.name);
      return {
        ...prev,
        [jobType]: [...jobSets, newBluset]
      };
    });
    setSelectedBluset(newBluset.name);
    setBlusetName('');
  }

  // Recall bluset for current jobType
  function handleRecallBluset(name) {
    const bs = blusetsByJob[jobType].find(b => b.name === name);
    if (bs) {
      setSelectedSpells(bs.spells);
      setSelectedBluset(name);
    }
  }

  // Clear all blusets for current jobType
  function handleClearBlusets() {
    setBlusetsByJob(prev => ({
      ...prev,
      [jobType]: []
    }));
    setSelectedBluset('');
    if (typeof window !== "undefined") {
      localStorage.setItem("blu_blusets_by_job", JSON.stringify({
        ...blusetsByJob,
        [jobType]: []
      }));
    }
  }
 // https://raw.githubusercontent.com/partywormxi/buildablu/refs/heads/main/public/samplesets.xml
  // Import sample blusets for current jobType
  function handleImportSampleBlusets() {
    //fetch('samplesets.xml')
    fetch('https://raw.githubusercontent.com/partywormxi/buildablu/refs/heads/main/public/samplesets.xml')
      .then(res => res.text())
      .then(xmlText => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        const tagNames = [];
        if (jobType === 'main') {
          tagNames.push("sample", "sample-bumba");
        } else {
          tagNames.push("pld");
        }
        tagNames.forEach(tag => {
          const sets = Array.from(xmlDoc.getElementsByTagName(tag));
          //console.log("sets for tag", tag, sets);
          const samples = sets.map(setEl => {
          const name = setEl.getAttribute("name") || tag;
          const spells = Array.from(setEl.children)
            .filter(child => child.tagName.startsWith("slot"))
            .map(child => toTitleCase(child.textContent));
          return { name, spells };
        });
        //console.log("Imported sample blusets:", samples);
        // main or subjob
        setBlusetsByJob(prev => {
          const existingNames = new Set(prev[jobType].map(bs => bs.name));
          const newSets = samples.filter(s => !existingNames.has(s.name));
          return {
            ...prev,
            [jobType]: [...prev[jobType], ...newSets]
          };
        });
        //setSampleBlusets(samples);
      });
    });
        
  }

  function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }

  return (
    <div className="container" style={{ maxWidth: "80%", padding: 20 }}>
      <h1>BUILD-A-BLU (beta)</h1>
      {/* BLUset Save/Recall/Clear/Import UI */}
      <BluSetControls
        blusetName={blusetName}
        setBlusetName={setBlusetName}
        handleSaveBluset={handleSaveBluset}
        blusets={blusetsByJob[jobType]}
        selectedBluset={selectedBluset}
        handleRecallBluset={handleRecallBluset}
        handleClearBlusets={handleClearBlusets}
        handleImportSampleBlusets={handleImportSampleBlusets}
      />
      <JobStatsBox 
        blupoints={blupoints} 
        blupointsSet={blupointsSet} 
        blulevel={blulevel} 
      />
      <JobTypeToggle
        jobType={jobType}
        handleJobTypeChange={handleJobTypeChange}
        handleToggleJobType={handleToggleJobType}
        bonus1200={bonus1200}
        setBonus1200={setBonus1200}
        bonus100={bonus100}
        setBonus100={setBonus100}
        jpPoints={jpPoints}
        setJpPoints={setJpPoints}
        assimilationPoints={assimilationPoints}
        setAssimilationPoints={setAssimilationPoints}
        masterLevel={masterLevel}
        setMasterLevel={setMasterLevel}
      />
      <OutputSection 
        xmlOutput={xmlOutput} 
        qualifyingTraits={qualifyingTraits} 
        statBonuses={statBonuses} 
      />
      <div className="search-section" style={{ marginTop: 20 }}>
        <input
          type="text"
          id="search-input"
          placeholder="Search spells..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: 8, width: "100%", maxWidth: 400 }}
        />
      </div>
      <SpellTable
        data={data}
        filteredData={filteredData}
        selectedSpells={selectedSpells}
        limitReached={limitReached}
        blupointsSet={blupointsSet}
        blupoints={blupoints}
        handleCheckbox={handleCheckbox}
      />
    </div>
  );
}

