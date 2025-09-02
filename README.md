# buildablu

## Description
Build your BLU sets in browser and copy them to your AzureSets `data\settings.xml` file

## Features
- Dynamic generation of XML sets
- Copyable XML output for easy use

## Project Structure
```
buildablu
├── public
│   ├── index.html        # Main HTML document
│   ├── styles.css       # Styles for the application
│   └── script.js        # JavaScript logic for generating XML
│   └── data.json        # Data file of BLU spells
├── package.json         # npm configuration file
└── README.md            # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/buildablu.git
   ```
2. Navigate to the project directory:
   ```
   cd buildablu
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
1. Start the application:
   ```
   npm start
   ```
2. Open your browser and go to `http://localhost:8080` to view the application.
3. Use the dropdown menus to make selections and generate XML sets.
4. Copy the generated XML from the output section.

## License
This project is licensed under the MIT License.