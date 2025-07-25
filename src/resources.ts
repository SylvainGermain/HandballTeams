import U18PlayersData from '../resources/U18Players.json';
import U15PlayersData from '../resources/U15Players.json';
import U13PlayersData from '../resources/U13Players.json';
import SMPlayersData from '../resources/SMPlayers.json';
import { Player } from './model';

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

const cache = new Map<string, Player[]>();

export namespace Resources {
  export async function loadResources(privateKey: string) {
    await getAsyncPlayersData('U18', privateKey);
    await getAsyncPlayersData('U15', privateKey);
    await getAsyncPlayersData('U13', privateKey);
    await getAsyncPlayersData('SM', privateKey);
  }

  export function getPlayersData(teamId: string): Player[] {
    const cached = cache.get(teamId);
    if (cached) {
      return cached;
    }
    throw new Error('Resource not found for team ID');
  }
}