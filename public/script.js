function createXMLSet(selectedValues) {
    let xmlString = '<sets>\n';
    selectedValues.forEach(value => {
        xmlString += `  <set>${value}</set>\n`;
    });
    xmlString += '</sets>';
    return xmlString;
}

function updateDisplayedXML() {
    const dropdowns = document.querySelectorAll('select');
    const selectedValues = Array.from(dropdowns).map(dropdown => dropdown.value);
    const xmlOutput = createXMLSet(selectedValues);
    document.getElementById('xml-output').textContent = xmlOutput;
}

document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll('select');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('change', updateDisplayedXML);
    });
});