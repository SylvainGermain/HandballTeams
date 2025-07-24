
const xlsx = require('xlsx');
const fs = require('fs');

const encryptedHeaders = ['prenom', 'nom', 'surnom'];

async function getCryptoKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(password);
    return crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
}

async function deriveKey(password, salt) {
    const keyMaterial = await getCryptoKey(password);
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

function arrayBufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

function generateSaltandIV() {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return { salt, iv };
}

async function encryptText(text, salt, iv, password) {
    const encoder = new TextEncoder();
    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(text)
    );

    return {
        cipherText: arrayBufferToHex(encrypted),
        iv: arrayBufferToHex(iv),
        salt: arrayBufferToHex(salt)
    };
}

function convertSheet(sheet, sheetName, outputDir, password) {
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
    //  "posteb": "Coach"
    //  "postec": "Coach"
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

  const { salt, iv } = generateSaltandIV();
  const stringArray = JSON.stringify(jsonArray);
  encryptText(stringArray, salt, iv, password).then( (encrypted) => {
    const outputData = { encrypted: encrypted };

    // Write the JSON data to a file
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));

    console.log('JSON file created:', outputFile, '\n', 'With number of rows:', jsonArray.length);
  });
}


function excelToJson(inputFile, outputDir, password) {
  // Read Excel file
  const workbook = xlsx.readFile(inputFile);
  console.log('SheetNames.', workbook.SheetNames);
  workbook.SheetNames.forEach( sheetName => {
    const sheet = workbook.Sheets[sheetName];
    convertSheet(sheet, sheetName, outputDir, password);
  });
  console.log('Conversion complete.');
}

// Extract command line parameters
const [, , inputFile, outputDir, password] = process.argv;

// Check if required parameters are provided
if (!inputFile || !outputDir || !password) {
    console.error('Usage: node xlsTojson.js <inputFile> <outputDir> <password>');
    console.error('  inputFile:  Path to the Excel file to convert');
    console.error('  outputDir:  Directory where JSON files will be saved');
    console.error('  password:   Password used for encrypting the data');
    process.exit(1);
}

// run main function
excelToJson(inputFile, outputDir, password);
