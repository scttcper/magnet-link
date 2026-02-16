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
}

const start = 'magnet:?';

export function magnetDecode(uri: string): MagnetData {
  // Support 'stream-magnet:' as well
  const data = uri.slice(uri.indexOf(start) + start.length);

  const params = data ? data.split('&') : [];

  const result: Partial<MagnetData> = {};
  // eslint-disable-next-line typescript-eslint/prefer-for-of -- indexed for-loop is faster
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const eqIdx = param.indexOf('=');

    // No '=' found, or empty key — skip
    if (eqIdx <= 0) {
      continue;
    }

    // Reject params with multiple '=' (preserves original split('=').length !== 2 check)
    const valPart = param.slice(eqIdx + 1);
    if (valPart.includes('=')) {
      continue;
    }

    const key = param.slice(0, eqIdx) as keyof MagnetData;
    const val = parseQueryParamValue(key, valPart);

    if (val === undefined) {
      continue;
    }

    const r = result[key];

    if (!r) {
      result[key] = val as any;
      continue;
    }

    // If there are repeated parameters, return an array of values
    if (Array.isArray(r)) {
      (r as any[]).push(val);
      continue;
    }

    result[key] = [r, val] as any;
  }

  if (result.xt) {
    const xts = Array.isArray(result.xt) ? result.xt : undefined;
    const xtCount = xts ? xts.length : 1;
    for (let i = 0; i < xtCount; i++) {
      const xt: string = xts ? xts[i] : (result.xt as string);
      if (xt.startsWith('urn:btih:') && xt.length >= 49) {
        result.infoHash = xt.slice(9, 49).toLowerCase();
      } else if (xt.startsWith('urn:btih:') && xt.length >= 41) {
        const decodedStr = base32.parse(xt.slice(9, 41));
        result.infoHash = uint8ArrayToHex(decodedStr);
      } else if (xt.startsWith('urn:btmh:1220') && xt.length >= 77) {
        result.infoHashV2 = xt.slice(13, 77).toLowerCase();
      }
    }
  }

  if (result.xs) {
    const xss = Array.isArray(result.xs) ? result.xs : undefined;
    const xsCount = xss ? xss.length : 1;
    for (let i = 0; i < xsCount; i++) {
      const xs: string = xss ? xss[i] : (result.xs as string);
      if (xs.startsWith('urn:btpk:') && xs.length >= 73) {
        result.publicKey = xs.slice(9, 73).toLowerCase();
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
    result.announce = result.tr;
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

  result.announce = [...new Set(result.announce)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  result.urlList = [...new Set(urlList)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  result.peerAddresses = [...new Set(peerAddresses)];

  return result;
}

/**
 * Specific query parameters have expected formats, this attempts to parse them in the correct way
 */
function parseQueryParamValue(key: string, val: string): string | number | string[] | number[] {
  // Clean up torrent name
  if (key === 'dn') {
    return decodeURIComponent(val).replaceAll('+', ' ');
  }

  // Address tracker (tr), exact source (xs), and acceptable source (as) are encoded
  // URIs, so decode them
  if (key === 'tr' || key === 'xs' || key === 'as' || key === 'ws') {
    return decodeURIComponent(val);
  }

  // Return keywords as an array
  if (key === 'kt') {
    return decodeURIComponent(val).split('+');
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

  // Deduplicate xt by using a set
  const xts = obj.xt ? new Set(Array.isArray(obj.xt) ? obj.xt : [obj.xt]) : new Set();

  if (obj.infoHashIntArray) {
    xts.add(`urn:btih:${uint8ArrayToHex(obj.infoHashIntArray)}`);
  }

  if (obj.infoHash) {
    xts.add(`urn:btih:${obj.infoHash}`);
  }

  if (obj.infoHashV2IntArray) {
    xts.add((obj.xt = `urn:btmh:1220${uint8ArrayToHex(obj.infoHashV2IntArray)}`));
  }

  if (obj.infoHashV2) {
    xts.add(`urn:btmh:1220${obj.infoHashV2}`);
  }

  const xtsDeduped = [...xts];
  if (xtsDeduped.length === 1) {
    obj.xt = xtsDeduped[0];
  }

  if (xtsDeduped.length > 1) {
    obj.xt = xtsDeduped;
  }

  // Support using convenience names, in addition to spec names
  // (example: `infoHash` for `xt`, `name` for `dn`)
  if (obj.infoHash) {
    obj.xt = `urn:btih:${obj.infoHash as string}`;
  }

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

  let acc = start;
  let paramIdx = 0;
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (key.length !== 2 && key !== 'x.pe') {
      continue;
    }

    const raw = obj[key];
    const values = Array.isArray(raw) ? raw : [raw];

    if (key === 'so') {
      if (paramIdx > 0) {
        acc += '&';
      }

      acc += `${key}=${bep53Range.composeRange(values)}`;
      paramIdx++;
      continue;
    }

    for (let j = 0; j < values.length; j++) {
      let val: string = values[j];

      if (key === 'dn') {
        val = encodeURIComponent(val).replaceAll('%20', '+');
      } else if (key === 'tr' || key === 'as' || key === 'ws') {
        val = encodeURIComponent(val);
      } else if (key === 'xs' && !val.startsWith('urn:btpk:')) {
        val = encodeURIComponent(val);
      } else if (key === 'kt') {
        val = encodeURIComponent(val);
      }

      if (key === 'kt' && j > 0) {
        acc += `+${val}`;
      } else {
        if (paramIdx > 0 || j > 0) {
          acc += '&';
        }

        acc += `${key}=${val}`;
      }
    }

    paramIdx++;
  }

  return acc;
}
