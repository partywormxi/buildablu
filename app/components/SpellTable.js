import React from 'react';

export default function SpellTable({
  data,
  filteredData,
  selectedSpells,
  limitReached,
  blupointsSet,
  blupoints,
  handleCheckbox
}) {
  return (
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
            const pointCostColor = `rgb(${227 - percent * 161}, ${234 - percent * 82}, ${252 - percent * 164})`;

            // Row color based on Subtype
            let rowBg = "";
            const subtype = (item["Subtype"] || "").toLowerCase();
            if (subtype === "light") rowBg = "#fff";
            else if (subtype === "earth") rowBg = "#a0522d";
            else if (subtype === "slashing" || subtype === "blunt") rowBg = "#d3d3d3";

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
  );
}