import test from 'ava';

import { MagnetData, magnetDecode, magnetEncode } from '../src/index.js';

test('should encode', t => {
  t.is(
    magnetEncode({
      xt: [
        'urn:btmh:1220caf1e1c30e81cb361b9ee167c4aa64228a7fa4fa9f6105232b28ad099f3a302e',
        'urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1',
        'urn:tree:tiger:7N5OAMRNGMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY',
        'urn:btih:QHQXPYWMACKDWKP47RRVIV7VOURXFE5Q',
      ],
      xl: '10826029',
      dn: 'mediawiki-1.15.1.tar.gz',
      tr: ['udp://tracker.example4.com:80/announce'],
      as: 'http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz',
      xs: ['http://cache.example.org/XRX2PEFXOOEJFRVUCX6HMZMKS5TWG4K5', 'dchub://example.org'],
    }),

    'magnet:?xt=urn:btmh:1220caf1e1c30e81cb361b9ee167c4aa64228a7fa4fa9f6105232b28ad099f3a302e&xt=urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1&xt=urn:tree:tiger:7N5OAMRNGMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY&xt=urn:btih:QHQXPYWMACKDWKP47RRVIV7VOURXFE5Q&xl=10826029&dn=mediawiki-1.15.1.tar.gz&tr=udp%3A%2F%2Ftracker.example4.com%3A80%2Fannounce&as=http%3A%2F%2Fdownload.wikimedia.org%2Fmediawiki%2F1.15%2Fmediawiki-1.15.1.tar.gz&xs=http%3A%2F%2Fcache.example.org%2FXRX2PEFXOOEJFRVUCX6HMZMKS5TWG4K5&xs=dchub%3A%2F%2Fexample.org',
  );
});

test('should encode simple magnet uri using convenience names', t => {
  const obj: MagnetData = {
    xt: 'urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36',
    dn: 'Leaves of Grass by Walt Whitman.epub',
    name: 'Leaves of Grass by Walt Whitman.epub',
    infoHash: 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36',
    tr: [
      'udp://tracker.example1.com:1337',
      'udp://tracker.example2.com:80',
      'udp://tracker.example3.com:6969',
      'udp://tracker.example4.com:80',
      'udp://tracker.example5.com:80',
    ],
    announce: [
      'udp://tracker.example1.com:1337',
      'udp://tracker.example2.com:80',
      'udp://tracker.example3.com:6969',
      'udp://tracker.example4.com:80',
      'udp://tracker.example5.com:80',
    ],
    urlList: ['http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz'],
    ws: 'http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz',
    kt: ['hey', 'hey2'],
    keywords: ['hey', 'hey2'],
  };

  const result = magnetEncode(obj);

  t.is(
    result,
    'magnet:?xt=urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36&dn=Leaves+of+Grass+by+Walt+Whitman.epub&tr=udp%3A%2F%2Ftracker.example1.com%3A1337&tr=udp%3A%2F%2Ftracker.example2.com%3A80&tr=udp%3A%2F%2Ftracker.example3.com%3A6969&tr=udp%3A%2F%2Ftracker.example4.com%3A80&tr=udp%3A%2F%2Ftracker.example5.com%3A80&ws=http%3A%2F%2Fdownload.wikimedia.org%2Fmediawiki%2F1.15%2Fmediawiki-1.15.1.tar.gz&kt=hey+hey2',
  );

  t.deepEqual(magnetDecode(result), obj);
});
