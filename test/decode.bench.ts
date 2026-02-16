import { bench, describe } from 'vitest';

import { magnetDecode, magnetEncode } from '../src/index.js';

const leavesOfGrass =
  'magnet:?xt=urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36&dn=Leaves+of+Grass+by+Walt+Whitman.epub&tr=udp%3A%2F%2Ftracker.example4.com%3A80&tr=udp%3A%2F%2Ftracker.example5.com%3A80&tr=udp%3A%2F%2Ftracker.example3.com%3A6969&tr=udp%3A%2F%2Ftracker.example2.com%3A80&tr=udp%3A%2F%2Ftracker.example1.com%3A1337';

const complicated =
  'magnet:?xt=urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1&xt=urn:tree:tiger:7N5OAMRNGMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY&xt=urn:btih:QHQXPYWMACKDWKP47RRVIV7VOURXFE5Q&xl=10826029&dn=mediawiki-1.15.1.tar.gz&tr=udp%3A%2F%2Ftracker.example4.com%3A80%2Fannounce&as=http%3A%2F%2Fdownload.wikimedia.org%2Fmediawiki%2F1.15%2Fmediawiki-1.15.1.tar.gz&xs=http%3A%2F%2Fcache.example.org%2FXRX2PEFXOOEJFRVUCX6HMZMKS5TWG4K5&xs=dchub://example.org';

const hybrid =
  'magnet:?xt=urn:btih:631a31dd0a46257d5078c0dee4e66e26f73e42ac&xt=urn:btmh:1220d8dd32ac93357c368556af3ac1d95c9d76bd0dff6fa9833ecdac3d53134efabb&dn=bittorrent-v1-v2-hybrid-test';

describe('magnetDecode', () => {
  bench('simple magnet link', () => {
    magnetDecode(leavesOfGrass);
  });

  bench('complicated magnet link', () => {
    magnetDecode(complicated);
  });

  bench('hybrid v2 magnet link', () => {
    magnetDecode(hybrid);
  });

  bench('empty magnet link', () => {
    magnetDecode('magnet:?');
  });
});

describe('magnetEncode', () => {
  const decoded = magnetDecode(leavesOfGrass);
  const decodedComplicated = magnetDecode(complicated);

  bench('simple magnet link', () => {
    magnetEncode(decoded);
  });

  bench('complicated magnet link', () => {
    magnetEncode(decodedComplicated);
  });
});
