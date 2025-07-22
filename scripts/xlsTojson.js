
const xlsx = require('xlsx');
const fs = require('fs');

function convertSheet(sheet, sheetName, outputDir) {
  console.log('Converting ', sheetName);
  const outputFile = `${outputDir}/${sheetName}Players.json`
  // Convert sheet to JSON
  const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
  // Extract field names from the first row of the data, and trim spaces
  const fieldNames = jsonData[0].map(field => {
    const label = String(field).trim().replaceAll(' ','').toLowerCase();
    return {
      label: label,
      toUpper: label.includes('post')
    };
  });

  // Remove the first row from the data
  const dataWithoutHeader = jsonData.slice(1);
// {
  // "players":[
    //   {
    //  "name": "toto",
    //  "physique": 3,
    //  "technique": 0.5,
    //  "defense": 3,
    //  "intelligence": 1,
    //  "attaque": 1,
    //  "vitesse": 1.5,
    //  "poste": "Coach"
    // },
  // ]
// }
  // Create an array of objects with field names and values
  let jsonArray = dataWithoutHeader.map(row => {
      const obj = {};

      // initialise obj with empty strings
      // fieldNames.forEach(field => {
      //     obj[field] = '';
      // });

      // populate obj with values from the current row
      row.forEach((value, index) => {
        const v = String(value).trim();
        if (v.length > 0) {
          obj[fieldNames[index].label] = fieldNames[index].toUpper ? v.toUpperCase() : v; // Convert values to strings
        }
      });

      return Object.entries(obj).length === 0 ? undefined : obj;
  });

  jsonArray = jsonArray.filter( value => value !== null && value !== undefined);

  const outputData = { players: jsonArray };
  // Write the JSON data to a file
  fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));

  console.log('JSON file created:', outputFile, '\n', 'With number of rows:', jsonArray.length);
}


function excelToJson(inputFile, outputDir) {
  // Read Excel file
  const workbook = xlsx.readFile(inputFile);
  console.log('SheetNames.', workbook.SheetNames);
  workbook.SheetNames.forEach( sheetName => {
    const sheet = workbook.Sheets[sheetName];
    convertSheet(sheet, sheetName, outputDir);
  });
  console.log('Conversion complete.');
}

// Extract command line parameters
const [, , inputFile, outputDir] = process.argv;

// Check if required parameters are provided
if (!inputFile, !outputDir) {
    console.error('Usage: node excelToJson.js <inputFile> <outputDir>');
    process.exit(1);
}

// run main function
excelToJson(inputFile, outputDir);
