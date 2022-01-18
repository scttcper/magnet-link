import { base32Decode } from '@ctrl/ts-base32';

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
  infoHashBuffer?: Buffer;
  infoHashV2?: string;
  infoHashV2Buffer?: Buffer;
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
  publicKeyBuffer?: Buffer;
}

const start = 'magnet:?';

export function magnetDecode(uri: string): MagnetData {
  // Support 'stream-magnet:' as well
  const data = uri.substr(uri.indexOf(start) + start.length);

  const params = data && data.length >= 0 ? data.split('&') : [];

  const result: Partial<MagnetData> = {};
  params.forEach(param => {
    const keyval = param.split('=');

    // This keyval is invalid, skip it
    if (keyval.length !== 2) {
      return;
    }

    const key = keyval[0] as keyof MagnetData;
    const val = parseQueryParamValue(key, keyval[1]!);

    if (val === undefined) {
      return;
    }

    const r = result[key];

    if (!r) {
      result[key] = val as any;
      return result;
    }

    // If there are repeated parameters, return an array of values
    if (r && Array.isArray(r)) {
      (r as any[]).push(val);
      return;
    }

    result[key] = [r, val] as any;
    // eslint-disable-next-line no-useless-return
    return;
  });

  if (result.xt) {
    let m;
    const xts = Array.isArray(result.xt) ? result.xt : [result.xt];
    xts.forEach((xt: any) => {
      if ((m = xt.match(/^urn:btih:(.{40})/))) {
        result.infoHash = m[1].toLowerCase();
      } else if ((m = xt.match(/^urn:btih:(.{32})/))) {
        const decodedStr = base32Decode(m[1]);
        result.infoHash = Buffer.from(decodedStr).toString('hex');
      } else if ((m = xt.match(/^urn:btmh:1220(.{64})/))) {
        result.infoHashV2 = m[1].toLowerCase();
      }
    });
  }

  if (result.xs) {
    let m;
    const xss = Array.isArray(result.xs) ? result.xs : [result.xs];
    xss.forEach(xs => {
      if ((m = /^urn:btpk:(.{64})/.exec(xs))) {
        result.publicKey = m[1]?.toLowerCase();
      }
    });
  }

  if (result.infoHash) {
    result.infoHashBuffer = Buffer.from(result.infoHash, 'hex');
  }

  if (result.infoHashV2) {
    result.infoHashV2Buffer = Buffer.from(result.infoHashV2, 'hex');
  }

  if (result.publicKey) {
    result.publicKeyBuffer = Buffer.from(result.publicKey, 'hex');
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

  result.urlList = [];
  if (typeof result.as === 'string' || Array.isArray(result.as)) {
    result.urlList = result.urlList.concat(result.as);
  }

  if (typeof result.ws === 'string' || Array.isArray(result.ws)) {
    result.urlList = result.urlList.concat(result.ws);
  }

  result.peerAddresses = [];
  if (typeof result['x.pe'] === 'string' || Array.isArray(result['x.pe'])) {
    result.peerAddresses = result.peerAddresses.concat(result['x.pe']);
  }

  result.announce = [...new Set(result.announce)].sort((a, b) => a.localeCompare(b));
  result.urlList = [...new Set(result.urlList)].sort((a, b) => a.localeCompare(b));
  result.peerAddresses = [...new Set(result.peerAddresses)];

  return result;
}

/**
 * Specific query parameters have expected formats, this attempts to parse them in the correct way
 */
function parseQueryParamValue(key: string, val: string): string | number | string[] | number[] {
  // Clean up torrent name
  if (key === 'dn') {
    return decodeURIComponent(val).replace(/\+/g, ' ');
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
  let xts = new Set();
  if (obj.xt && typeof obj.xt === 'string') {
    xts.add(obj.xt);
  }

  if (obj.xt && Array.isArray(obj.xt)) {
    xts = new Set(obj.xt);
  }

  if (obj.infoHashBuffer) {
    xts.add(`urn:btih:${obj.infoHashBuffer.toString('hex')}`);
  }

  if (obj.infoHash) {
    xts.add(`urn:btih:${obj.infoHash}`);
  }

  if (obj.infoHashV2Buffer) {
    xts.add((obj.xt = `urn:btmh:1220${obj.infoHashV2Buffer.toString('hex')}`));
  }

  if (obj.infoHashV2) {
    xts.add(`urn:btmh:1220${obj.infoHashV2}`);
  }

  const xtsDeduped = Array.from(xts);
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

  if (obj.publicKeyBuffer) {
    obj.xs = `urn:btpk:${obj.publicKeyBuffer.toString('hex')}`;
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

  return Object.keys(obj)
    .filter(key => key.length === 2 || key === 'x.pe')
    .reduce((prev, key, i) => {
      let acc = prev;

      const values = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
      values.forEach((val: string, j: number) => {
        if ((i > 0 || j > 0) && ((key !== 'kt' && key !== 'so') || j === 0)) {
          acc += '&';
        }

        if (key === 'dn') {
          val = encodeURIComponent(val).replace(/%20/g, '+');
        }

        if (key === 'tr' || key === 'as' || key === 'ws') {
          val = encodeURIComponent(val);
        }

        // Don't URI encode BEP46 keys
        if (key === 'xs' && !val.startsWith('urn:btpk:')) {
          val = encodeURIComponent(val);
        }

        if (key === 'kt') {
          val = encodeURIComponent(val);
        }

        if (key === 'so') {
          return;
        }

        if (key === 'kt' && j > 0) {
          acc += `+${val}`;
        } else {
          acc += `${key}=${val}`;
        }
      });
      if (key === 'so') {
        acc += `${key}=${bep53Range.composeRange(values)}`;
      }

      return acc;
    }, `${start}`);
}
