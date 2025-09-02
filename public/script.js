function createXMLSet(selectedValues) {
    let xmlString = '<sets>\n';
    selectedValues.forEach((value, idx) => {
        const slotNum = String(idx + 1).padStart(2, '0');
        xmlString += `  <slot${slotNum}>${value}</slot${slotNum}>\n`;
    });
    xmlString += '</sets>';
    return xmlString;
}

function updateJobTraitOutput(selectedSpells, allData) {
    // Map: trait name => total trait points
    const traitTotals = {};

    // Find selected spell objects
    const selectedSpellObjects = allData.filter(item => selectedSpells.includes(item.Spell));

    const bonus100Checked = document.getElementById('job-trait-bonus-100')?.checked;
    const bonus1200Checked = document.getElementById('job-trait-bonus-1200')?.checked;

    selectedSpellObjects.forEach(item => {
        const trait = item["Creates Job Trait"];
        const points = parseInt(item["Trait Points"], 10) || 0;
        if (trait) {
            traitTotals[trait] = (traitTotals[trait] || 0) + points;
        }
    });

    // List traits with total points >= 8, and calculate tiers
    const qualifyingTraits = Object.entries(traitTotals)
        .filter(([trait, total]) => total >= 8)
        .map(([trait, total]) => {
            var tier = Math.floor(total / 8);
            if (bonus100Checked) tier ++;
            if (bonus1200Checked) tier ++;
            return `${trait} (Tier ${tier}, ${total} points)`;
        });

    const output = qualifyingTraits.length
        ? qualifyingTraits.join('\n')
        : "";

    document.getElementById('job-trait-output').textContent = output;
}

// Update updateDisplayedXML to also update job trait output
function updateDisplayedXML(selectedSpells, allData) {
    const xmlOutput = createXMLSet(selectedSpells);
    document.getElementById('xml-output').textContent = xmlOutput;
    updateJobTraitOutput(selectedSpells, allData);
    updateStatBonusDisplay(selectedSpells, allData); // <-- Add this line
}

function getBluPoints() {
    const jpPoints = parseInt(document.getElementById('jp-points').value, 10) || 0;
    const assimilationPoints = parseInt(document.getElementById('assimilation-points').value, 10) || 0;
    return 55 + jpPoints + assimilationPoints;
}

function getBluPointsSet(selectedSpells, allData) {
    return selectedSpells.reduce((sum, spellName) => {
        const spellObj = allData.find(item => item.Spell === spellName);
        return sum + (spellObj ? (parseInt(spellObj["Point Cost"], 10) || 0) : 0);
    }, 0);
}

function updateBluPointsDisplay(selectedSpells, allData) {
    const blupoints = getBluPoints();
    const blupointsSet = getBluPointsSet(selectedSpells, allData);
    document.getElementById('blupoints-display').textContent = `Current BLU Points: ${blupoints}`;
    document.getElementById('blupoints-set-display').textContent = `Current BLU Points Set: ${blupointsSet}`;
}

function updateCheckboxStates(table, selectedSpells) {
    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
    const limitReached = selectedSpells.length >= 20;
    const blupoints = getBluPoints();
    const currentSet = getBluPointsSet(selectedSpells, window.allData || []);
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            // Find spell cost
            const spellName = checkbox.value;
            const spellObj = (window.allData || []).find(item => item.Spell === spellName);
            const spellCost = spellObj ? (parseInt(spellObj["Point Cost"], 10) || 0) : 0;
            // Disable if 20 spells or would exceed BLU Points
            checkbox.disabled = limitReached || (currentSet + spellCost > blupoints);
        } else {
            checkbox.disabled = false;
        }
    });
}

function buildTable(data, selectedSpells, allData) {
    if (!data || data.length === 0) return "No data available.";
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');

    // Add checkbox header
    const checkboxTh = document.createElement('th');
    checkboxTh.textContent = 'Select';
    headerRow.appendChild(checkboxTh);

    // Generate table headers
    const keys = Object.keys(data[0]);
    keys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Generate table rows
    data.forEach(item => {
        const row = document.createElement('tr');

        // Checkbox cell
        const checkboxTd = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = item.Spell;
        checkbox.checked = selectedSpells.includes(item.Spell);

        checkbox.addEventListener('change', function() {
            const blupoints = getBluPoints();
            const spellCost = parseInt(item["Point Cost"], 10) || 0;
            let currentSet = getBluPointsSet(selectedSpells, allData);

            if (this.checked) {
                if (selectedSpells.length < 20 && (currentSet + spellCost) <= blupoints) {
                    selectedSpells.push(item.Spell);
                } else {
                    this.checked = false;
                }
            } else {
                const idx = selectedSpells.indexOf(item.Spell);
                if (idx > -1) selectedSpells.splice(idx, 1);
            }
            updateDisplayedXML(selectedSpells, allData);
            updateCheckboxStates(table, selectedSpells);
            updateBluPointsDisplay(selectedSpells, allData);
        });

        checkboxTd.appendChild(checkbox);
        row.appendChild(checkboxTd);

        // Data cells
        keys.forEach(key => {
            const td = document.createElement('td');
            if (key === "Wiki Link" && item[key]) {
                const a = document.createElement('a');
                a.href = item[key];
                a.textContent = item[key];
                a.target = "_blank";
                td.appendChild(a);
            } else {
                td.textContent = item[key] || "";
            }
            row.appendChild(td);
        });
        table.appendChild(row);
    });

    // Initial enable/disable state
    setTimeout(() => updateCheckboxStates(table, selectedSpells), 0);

    return table;
}

// Update updateCheckboxStates to disable checkboxes if selecting would exceed BLU Points
function updateCheckboxStates(table, selectedSpells) {
    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
    const limitReached = selectedSpells.length >= 20;
    const blupoints = getBluPoints();
    document.getElementById('blupoints-display').textContent = `Current BLU Points: ${blupoints}`;
}

function getBluPointsSet(selectedSpells, allData) {
    return selectedSpells.reduce((sum, spellName) => {
        const spellObj = allData.find(item => item.Spell === spellName);
        return sum + (spellObj ? (parseInt(spellObj["Point Cost"], 10) || 0) : 0);
    }, 0);
}

function updateStatBonusDisplay(selectedSpells, allData) {
    // Collect all stat bonuses from selected spells
    const statBonuses = selectedSpells
        .map(spellName => {
            const spellObj = allData.find(item => item.Spell === spellName);
            return spellObj ? spellObj["Stat Bonus"] : null;
        })
        .filter(bonus => bonus && bonus.trim() !== "");

    // Get unique bonuses
    const uniqueBonuses = [...new Set(statBonuses)];

    // Display
    document.getElementById('stat-bonus-display').textContent =
        uniqueBonuses.length
            ? `${uniqueBonuses.join(', \n')}`
            : "Stat Bonus: None";
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            window.allData = data; // For access in updateCheckboxStates
            let selectedSpells = [];

            // Initial table render
            const container = document.getElementById('table-container');
            container.innerHTML = '';
            const table = buildTable(data, selectedSpells, data);
            if (table) container.appendChild(table);

            // Display initial BLU points and set
            updateBluPointsDisplay(selectedSpells, data);

            // Update BLU points on input change
            document.getElementById('jp-points').addEventListener('input', () => {
                updateBluPointsDisplay(selectedSpells, data);
                updateCheckboxStates(table, selectedSpells);
            });
            document.getElementById('assimilation-points').addEventListener('input', () => {
                updateBluPointsDisplay(selectedSpells, data);
                updateCheckboxStates(table, selectedSpells);
            });

            // Search functionality
            const searchInput = document.getElementById('search-input');
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                const filtered = data.filter(item =>
                    Object.values(item).some(
                        val => val && val.toString().toLowerCase().includes(query)
                    )
                );
                container.innerHTML = '';
                const filteredTable = buildTable(filtered, selectedSpells, data);
                if (filteredTable) container.appendChild(filteredTable);
            });

            // Add copy functionality for XML output
            const copyBtn = document.getElementById('copy-xml-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    const xmlOutput = document.getElementById('xml-output');
                    if (xmlOutput) {
                        const text = xmlOutput.textContent;
                        navigator.clipboard.writeText(text).then(() => {
                            copyBtn.textContent = "Copied!";
                            setTimeout(() => copyBtn.textContent = "Copy XML", 1200);
                        });
                    }
                });
            }

            document.getElementById('job-trait-bonus-1200').addEventListener('change', () => {
                updateJobTraitOutput(selectedSpells, window.allData);
            });
            document.getElementById('job-trait-bonus-100').addEventListener('change', () => {
                updateJobTraitOutput(selectedSpells, window.allData);
            });
        });
});

