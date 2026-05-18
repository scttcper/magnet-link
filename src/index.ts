import { base32 } from 'rfc4648';
import { hexToUint8Array, uint8ArrayToHex } from 'uint8array-extras';

import * as bep53Range from './bep53.js';

export interface MagnetData {
  /**
   * Is the info-hash hex encoded, for a total of 40 characters. For compatability with existing links in the wild, clients should also support the 32 character base32 encoded info-hash.
   *
   * *or*
   *
   * Is the multihash formatted, hex encoded full infohash for torrents in the new metadata format. 'btmh' and 'btih' exact topics may exist in the same magnet if they describe the same hybrid torrent.
   * @link http://www.bittorrent.org/beps/bep_0009.html
   */
  xt?: string | string[];
  /**
   * Parsed xt= parameter see xt
   */
  infoHash?: string;
  infoHashIntArray?: Uint8Array;
  infoHashV2?: string;
  infoHashV2IntArray?: Uint8Array;
  /**
   * The display name that may be used by the client to display while waiting for metadata
   */
  name?: string | string[];
  /**
   * The display name that may be used by the client to display while waiting for metadata
   */
  dn?: string | string[];
  /**
   * Tracker url, if there is one. If there are multiple trackers, multiple tr entries may be included
   */
  tr?: string | string[];
  /**
   * Tracker url, if there is one. If there are multiple trackers, multiple tr entries may be included
   */
  announce?: string[];
  /**
   * An array of where the actual torrent file can be downloaded
   */
  xs?: string | string[];
  /**
   * An array of where the actual torrent file can be downloaded
   */
  as?: string | string[];
  /**
   * An array of where the actual torrent file can be downloaded
   */
  ws?: string | string[];
  /**
   * "keyword topic": a more general search, specifying search terms rather than a particular file
   */
  kt?: string[];

  so?: string[] | number[];
  'x.pe'?: string | string[];

  /**
   * "keyword topic": a more general search, specifying search terms rather than a particular file
   */
  keywords?: string | string[];
  /**
   * File index
   */
  ix?: number | number[];
  /**
   * Size in bytes
   */
  xl?: string;
  /**
   * Combined as= and ws= parameters if they exist
   */
  urlList?: string[];

  peerAddresses?: string[];

  publicKey?: string;
  publicKeyIntArray?: Uint8Array;
  /**
   * Optional BEP46 mutable torrent salt.
   * @link http://www.bittorrent.org/beps/bep_0046.html
   */
  s?: string | string[];
  /**
   * Optional BEP46 mutable torrent salt. Convenience alias for s.
   */
  salt?: string | string[];
}

const start = 'magnet:?';
const btihHexPattern = /^urn:btih:([a-fA-F0-9]{40})$/;
const btihBase32Pattern = /^urn:btih:([a-z2-7]{32})$/i;
const btmhSha256Pattern = /^urn:btmh:1220([a-fA-F0-9]{64})$/;
const btpkPattern = /^urn:btpk:([a-fA-F0-9]{64})$/;

export function magnetDecode(uri: string): MagnetData {
  // Support 'stream-magnet:' as well
  const startIdx = uri.indexOf(start);
  const queryStart = startIdx === -1 ? uri.length : startIdx + start.length;

  const result: Partial<MagnetData> = {};
  for (let paramStart = queryStart; paramStart < uri.length; ) {
    const ampIdx = uri.indexOf('&', paramStart);
    const paramEnd = ampIdx === -1 ? uri.length : ampIdx;
    const eqIdx = uri.indexOf('=', paramStart);

    // No '=' found, or empty key — skip
    if (eqIdx > paramStart && eqIdx < paramEnd) {
      // Reject params with multiple '=' (preserves original split('=').length !== 2 check)
      const secondEqIdx = uri.indexOf('=', eqIdx + 1);
      if (secondEqIdx === -1 || secondEqIdx >= paramEnd) {
        const key = uri.slice(paramStart, eqIdx) as keyof MagnetData;
        let val: string | number | string[] | number[] | undefined;
        try {
          val = parseQueryParamValue(key, uri.slice(eqIdx + 1, paramEnd));
        } catch {
          val = undefined;
        }

        if (val !== undefined) {
          const r = result[key];

          if (r === undefined) {
            result[key] = val as any;
          } else if (Array.isArray(r)) {
            // If there are repeated parameters, return an array of values
            (r as any[]).push(val);
          } else {
            result[key] = [r, val] as any;
          }
        }
      }
    }

    if (ampIdx === -1) {
      break;
    }
    paramStart = ampIdx + 1;
  }

  if (result.xt) {
    const xts = Array.isArray(result.xt) ? result.xt : undefined;
    const xtCount = xts ? xts.length : 1;
    for (let i = 0; i < xtCount; i++) {
      const xt: string = xts ? xts[i] : (result.xt as string);
      const btihHex = btihHexPattern.exec(xt);
      if (btihHex) {
        result.infoHash = btihHex[1].toLowerCase();
        continue;
      }

      const btihBase32 = btihBase32Pattern.exec(xt);
      if (btihBase32) {
        result.infoHash = uint8ArrayToHex(base32.parse(btihBase32[1].toUpperCase()));
        continue;
      }

      const btmhSha256 = btmhSha256Pattern.exec(xt);
      if (btmhSha256) {
        result.infoHashV2 = btmhSha256[1].toLowerCase();
      }
    }
  }

  if (result.xs) {
    const xss = Array.isArray(result.xs) ? result.xs : undefined;
    const xsCount = xss ? xss.length : 1;
    for (let i = 0; i < xsCount; i++) {
      const xs: string = xss ? xss[i] : (result.xs as string);
      const btpk = btpkPattern.exec(xs);
      if (btpk) {
        result.publicKey = btpk[1].toLowerCase();
      }
    }
  }

  if (result.infoHash) {
    result.infoHashIntArray = hexToUint8Array(result.infoHash);
  }

  if (result.infoHashV2) {
    result.infoHashV2IntArray = hexToUint8Array(result.infoHashV2);
  }

  if (result.publicKey) {
    result.publicKeyIntArray = hexToUint8Array(result.publicKey);
  }

  if (result.dn) {
    result.name = result.dn;
  }

  if (result.kt) {
    result.keywords = result.kt;
  }

  if (typeof result.tr === 'string') {
    result.announce = [result.tr];
  } else if (Array.isArray(result.tr)) {
    result.announce = [...result.tr];
  } else {
    result.announce = [];
  }

  const urlList: string[] = [];
  if (typeof result.as === 'string') {
    urlList.push(result.as);
  } else if (Array.isArray(result.as)) {
    for (const item of result.as) {
      urlList.push(item);
    }
  }

  if (typeof result.ws === 'string') {
    urlList.push(result.ws);
  } else if (Array.isArray(result.ws)) {
    for (const item of result.ws) {
      urlList.push(item);
    }
  }

  const peerAddresses: string[] = [];
  if (typeof result['x.pe'] === 'string') {
    peerAddresses.push(result['x.pe']);
  } else if (Array.isArray(result['x.pe'])) {
    for (const item of result['x.pe']) {
      peerAddresses.push(item);
    }
  }

  if (result.s) {
    result.salt = result.s;
  }

  result.announce = [...new Set(result.announce)];
  result.urlList = [...new Set(urlList)];
  result.peerAddresses = [...new Set(peerAddresses)];

  return result;
}

/**
 * Specific query parameters have expected formats, this attempts to parse them in the correct way
 */
function parseQueryParamValue(key: string, val: string): string | number | string[] | number[] {
  // Clean up torrent name
  if (key === 'dn') {
    return decodeURIComponent(val.replaceAll('+', ' '));
  }

  // Address tracker (tr), exact source (xs), and acceptable source (as) are encoded
  // URIs, so decode them
  if (key === 'tr' || key === 'xs' || key === 'as' || key === 'ws') {
    return decodeURIComponent(val);
  }

  // Return keywords as an array
  if (key === 'kt') {
    const keywords = val.split('+');
    for (let i = 0; i < keywords.length; i++) {
      keywords[i] = decodeURIComponent(keywords[i]);
    }

    return keywords;
  }

  // bep53
  if (key === 'so') {
    return bep53Range.parseRange(decodeURIComponent(val).split(','));
  }

  // Cast file index (ix) to a number
  if (key === 'ix') {
    return Number(val);
  }

  return val;
}

export function magnetEncode(data: MagnetData): string {
  const obj: any = { ...data }; // Shallow clone object

  const xts = new Set<string>(obj.xt ? (Array.isArray(obj.xt) ? obj.xt : [obj.xt]) : []);

  if (obj.infoHashIntArray) {
    xts.add(`urn:btih:${uint8ArrayToHex(obj.infoHashIntArray)}`);
  }

  if (obj.infoHash) {
    xts.add(`urn:btih:${obj.infoHash}`);
  }

  if (obj.infoHashV2IntArray) {
    xts.add(`urn:btmh:1220${uint8ArrayToHex(obj.infoHashV2IntArray)}`);
  }

  if (obj.infoHashV2) {
    xts.add(`urn:btmh:1220${obj.infoHashV2}`);
  }

  if (xts.size === 1) {
    obj.xt = xts.values().next().value;
  }

  if (xts.size > 1) {
    obj.xt = [...xts];
  }

  // Support using convenience names, in addition to spec names
  // (example: `infoHash` for `xt`, `name` for `dn`)
  if (obj.publicKeyIntArray) {
    obj.xs = `urn:btpk:${uint8ArrayToHex(obj.publicKeyIntArray)}`;
  }

  if (obj.publicKey) {
    obj.xs = `urn:btpk:${obj.publicKey}`;
  }

  if (obj.name) {
    obj.dn = obj.name;
  }

  if (obj.keywords) {
    obj.kt = obj.keywords;
  }

  if (obj.announce) {
    obj.tr = obj.announce;
  }

  if (obj.urlList) {
    obj.ws = obj.urlList;
    delete obj.as;
  }

  if (obj.peerAddresses) {
    obj['x.pe'] = obj.peerAddresses;
  }

  if (obj.salt) {
    obj.s = obj.salt;
  }

  let acc = start;
  let paramIdx = 0;
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (key.length !== 2 && key !== 's' && key !== 'x.pe') {
      continue;
    }

    const raw = obj[key];

    if (key === 'so') {
      if (paramIdx > 0) {
        acc += '&';
      }

      acc += `${key}=${bep53Range.composeRange(Array.isArray(raw) ? raw : [raw])}`;
      paramIdx++;
      continue;
    }

    if (Array.isArray(raw)) {
      for (let j = 0; j < raw.length; j++) {
        const val = encodeParamValue(key, raw[j]);

        if (key === 'kt' && j > 0) {
          acc += `+${val}`;
        } else {
          if (paramIdx > 0 || j > 0) {
            acc += '&';
          }

          acc += `${key}=${val}`;
        }
      }
    } else {
      const val = encodeParamValue(key, raw);

      if (paramIdx > 0) {
        acc += '&';
      }

      acc += `${key}=${val}`;
    }

    paramIdx++;
  }

  return acc;
}

function encodeParamValue(key: string, val: string) {
  if (key === 'dn') {
    return encodeURIComponent(val).replaceAll('%20', '+');
  }

  if (key === 'tr' || key === 'as' || key === 'ws' || key === 'kt') {
    return encodeURIComponent(val);
  }

  if (key === 'xs' && !val.startsWith('urn:btpk:')) {
    return encodeURIComponent(val);
  }

  return val;
}
