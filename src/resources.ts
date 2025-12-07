import U18PlayersData from '../resources/U18Players.json';
import U15PlayersData from '../resources/U15Players.json';
import U13PlayersData from '../resources/U13Players.json';
import SMPlayersData from '../resources/SMPlayers.json';
import AdversaireData from '../resources/adversaire.json';
import asmbhLogo from '../resources/ASMBH_Logo.png';

import { Adversaire, Player } from './model';
import * as XLSX from 'xlsx';

async function getCryptoKey(password: string) {
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

function hexToArrayBuffer(hex: string) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
}

async function deriveKey(password: string, salt: ArrayBuffer) {
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

async function decryptText(encryptedData: {
    cipherText:string, iv:string, salt:string
}, password: string) {
    const { cipherText, iv, salt } = encryptedData;
    const key = await deriveKey(password, hexToArrayBuffer(salt));

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: hexToArrayBuffer(iv) },
        key,
        hexToArrayBuffer(cipherText)
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

async function getAsyncPlayersData(teamId: string, privateKey: string) {
    const cached = cache.get(teamId);
    if (cached) {
      return cached;
    }
    const cipherData =
      teamId === 'U18' ? U18PlayersData.encrypted :
      teamId === 'U15' ? U15PlayersData.encrypted :
      teamId === 'U13' ? U13PlayersData.encrypted :
      teamId === 'SM' ? SMPlayersData.encrypted : undefined;

    if (cipherData === undefined) {
      throw new Error('Unknown team ID');
    }

    const data = await decryptText(cipherData, privateKey);
    const players =  JSON.parse(data) as Player[]
    cache.set(teamId, players);
    return players;
}

async function getAsyncAdversaireData(privateKey: string) {
    const cached = cache.get('adversaire');
    if (cached) {
      return cached;
    }
    const cipherData = AdversaireData.encrypted;

    if (cipherData === undefined) {
      throw new Error('Unknown team ID');
    }

    const data = await decryptText(cipherData, privateKey);
    const decryptedData =  JSON.parse(data) as any[]
    cache.set('adversaire', decryptedData);
    return decryptedData;
}

function convertSheet(sheet: XLSX.WorkSheet, sheetName: string) {
  if (sheetName.toLowerCase() === 'adversaire') {
    console.log(`Unsupported converting sheet for: ${sheetName}`);
    return;
  }

  // Convert sheet to JSON
  const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  // Extract field names from the first row of the data, and trim spaces
  const fieldNames = jsonData[0].map((field: string) => {
    const label = field.trim().replace(/ /g, '').toLowerCase();
    return {
      label: label,
      toUpper: label.includes('post')
    };
  });

  // Remove the first row from the data
  const dataWithoutHeader = jsonData.slice(1);

  // Create an array of objects with field names and values
  const jsonArray: Player[] = dataWithoutHeader.map(row => {
      const obj: { [key: string]: string } = {};
      // populate obj with values from the current row
      row.forEach((value: string, index: number) => {
        const v = value.trim();
        if (v.length > 0) {
          obj[fieldNames[index].label] = fieldNames[index].toUpper ? v.toUpperCase() : v; // Convert values to strings
        }
      });

      return Object.entries(obj).length === 0 ? undefined : (obj as unknown as Player);
  }).filter( value => value !== null && value !== undefined);
  cache.set(sheetName, jsonArray);
}

async function excelToJson(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                workbook.SheetNames.forEach( sheetName => {
                  convertSheet(workbook.Sheets[sheetName], sheetName);
                });
                resolve();
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
}

const cache = new Map<string, Player[]|Adversaire[]>();

export namespace Resources {
  export async function loadResources(privateKey: string) {
    await getAsyncPlayersData('U18', privateKey);
    await getAsyncPlayersData('U15', privateKey);
    await getAsyncPlayersData('U13', privateKey);
    await getAsyncPlayersData('SM', privateKey);
    await getAsyncAdversaireData(privateKey);
  }

  export async function updateResources(file: File) {
    console.log('updateResources from file:', file.name);
    await excelToJson(file);
  }

  export function getAdversaire(): Adversaire[] {
    const cached = cache.get('adversaire');
    if (cached) {
      return cached as Adversaire[];
    }
    throw new Error('Resource not found for team ID');
  }

  export function getPlayersData(teamId: string): Player[] {
    const cached = cache.get(teamId);
    if (cached) {
      return cached as Player[];
    }
    throw new Error('Resource not found for team ID');
  }

  export function getTeamLogo(teamName: string): string {
    if (teamName.toLowerCase().includes('montigny')) {
      return asmbhLogo;
    }

    const adversaires = getAdversaire();
    const adversaire = adversaires.find(adv =>
      adv.nom.toLowerCase().includes(teamName.toLowerCase()) ||
      adv.shortname?.toLowerCase().includes(teamName.toLowerCase())
    );

    if (adversaire?.logo) {
      // If the logo is a local file (not starting with http), serve it from the logos folder
      if (!adversaire.logo.startsWith('http')) {
        // In development, files are served from /logos/ via devServer static config
        // In production, files are copied to build/logos/
        const isDevMode = process.env.NODE_ENV === 'development';
        return isDevMode ? `./${adversaire.logo}` : `./build/${adversaire.logo}`;
      }
      return adversaire.logo;
    }

    return '';
  }
}