import test from 'ava';

import { MagnetData, magnetDecode } from '../src/index.js';

const leavesOfGrass =
  'magnet:?xt=urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36&dn=Leaves+of+Grass+by+Walt+Whitman.epub&tr=udp%3A%2F%2Ftracker.example4.com%3A80&tr=udp%3A%2F%2Ftracker.example5.com%3A80&tr=udp%3A%2F%2Ftracker.example3.com%3A6969&tr=udp%3A%2F%2Ftracker.example2.com%3A80&tr=udp%3A%2F%2Ftracker.example1.com%3A1337';

const empty = { announce: [], peerAddresses: [], urlList: [] };

test('should decode', t => {
  const result: MagnetData = {
    announce: [
      'udp://tracker.example1.com:1337',
      'udp://tracker.example2.com:80',
      'udp://tracker.example3.com:6969',
      'udp://tracker.example4.com:80',
      'udp://tracker.example5.com:80',
    ],
    dn: 'Leaves of Grass by Walt Whitman.epub',
    infoHash: 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36',
    infoHashBuffer: Buffer.from('d2474e86c95b19b8bcfdb92bc12c9d44667cfa36', 'hex'),
    name: 'Leaves of Grass by Walt Whitman.epub',
    peerAddresses: [],
    tr: [
      'udp://tracker.example4.com:80',
      'udp://tracker.example5.com:80',
      'udp://tracker.example3.com:6969',
      'udp://tracker.example2.com:80',
      'udp://tracker.example1.com:1337',
    ],
    urlList: [],
    xt: 'urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36',
  };
  t.deepEqual(magnetDecode(leavesOfGrass), result);
});

test('should decode empty magnet URIs return empty object', t => {
  const empty1 = '';
  const empty2 = 'magnet:';
  const empty3 = 'magnet:?';

  t.deepEqual(magnetDecode(empty1), empty);
  t.deepEqual(magnetDecode(empty2), empty);
  t.deepEqual(magnetDecode(empty3), empty);
});

test('empty string as keys is okay', t => {
  const uri = 'magnet:?a=&b=&c=';
  const blank = { a: '', b: '', c: '' };
  t.deepEqual(magnetDecode(uri), { ...blank, ...empty });
});

test('should decode invalid magnet URIs return empty object', t => {
  const invalid1 = 'magnet:?xt=urn:btih:===';
  const invalid2 = 'magnet:?xt';
  const invalid3 = 'magnet:?xt=?dn=';

  t.deepEqual(magnetDecode(invalid1), empty);
  t.deepEqual(magnetDecode(invalid2), empty);
  t.deepEqual(magnetDecode(invalid3), empty);
});

test('should decode invalid magnet URIs return only valid keys (ignoring invalid ones)', t => {
  const invalid1 = 'magnet:?a=a&===';
  const invalid2 = 'magnet:?a==&b=b';
  const invalid3 = 'magnet:?a=b=&c=c&d===';

  t.deepEqual(magnetDecode(invalid1), { a: 'a', ...empty });
  t.deepEqual(magnetDecode(invalid2), { b: 'b', ...empty });
  t.deepEqual(magnetDecode(invalid3), { c: 'c', ...empty });
});

test('should decode extracts 40-char hex BitTorrent info_hash', t => {
  const result = magnetDecode('magnet:?xt=urn:btih:aad050ee1bb22e196939547b134535824dabf0ce');
  t.is(result.infoHash, 'aad050ee1bb22e196939547b134535824dabf0ce');
});

test('should decode extracts 32-char base32 BitTorrent info_hash', t => {
  const result = magnetDecode('magnet:?xt=urn:btih:64DZYZWMUAVLIWJUXGDIK4QGAAIN7SL6');
  t.is(result.infoHash, 'f7079c66cca02ab45934b9868572060010dfc97e');
});

test('should decode extracts keywords', t => {
  const result = magnetDecode(
    'magnet:?xt=urn:btih:64DZYZWMUAVLIWJUXGDIK4QGAAIN7SL6&kt=joe+blow+mp3',
  );
  t.deepEqual(result.keywords, ['joe', 'blow', 'mp3']);
});

test('should decode complicated magnet uri (multiple xt params, and as, xs)', t => {
  const result = magnetDecode(
    'magnet:?xt=urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1&xt=urn:tree:tiger:7N5OAMRNGMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY&xt=urn:btih:QHQXPYWMACKDWKP47RRVIV7VOURXFE5Q&xl=10826029&dn=mediawiki-1.15.1.tar.gz&tr=udp%3A%2F%2Ftracker.example4.com%3A80%2Fannounce&as=http%3A%2F%2Fdownload.wikimedia.org%2Fmediawiki%2F1.15%2Fmediawiki-1.15.1.tar.gz&xs=http%3A%2F%2Fcache.example.org%2FXRX2PEFXOOEJFRVUCX6HMZMKS5TWG4K5&xs=dchub://example.org',
  );
  t.is(result.infoHash, '81e177e2cc00943b29fcfc635457f575237293b0');
  t.deepEqual(result.xt, [
    'urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1',
    'urn:tree:tiger:7N5OAMRNGMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY',
    'urn:btih:QHQXPYWMACKDWKP47RRVIV7VOURXFE5Q',
  ]);
  t.is(result.xl, '10826029');
  t.is(result.dn, 'mediawiki-1.15.1.tar.gz');

  const announce = 'udp://tracker.example4.com:80/announce';
  t.is(result.tr, announce);
  t.deepEqual(result.announce, [announce]);
  t.is(result.as, 'http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz');
  t.deepEqual(result.urlList, [
    'http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz',
  ]);
  t.deepEqual(result.xs, [
    'http://cache.example.org/XRX2PEFXOOEJFRVUCX6HMZMKS5TWG4K5',
    'dchub://example.org',
  ]);
});

test('should decode multiple as, ws params', t => {
  const result = magnetDecode(
    'magnet:?xt=urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1&as=http%3A%2F%2Fdownload.wikimedia.org%2Fmediawiki%2F1.15%2Fmediawiki-1.15.1.tar.gz&as=http%3A%2F%2Fdownload.wikimedia.org%2Fmediawiki%2F1.15%2Fmediawiki-1.15.1.tar.gz1&ws=http%3A%2F%2Fdownload.wikimedia.org%2Fmediawiki%2F1.15%2Fmediawiki-1.15.1.tar.gz2&ws=http%3A%2F%2Fdownload.wikimedia.org%2Fmediawiki%2F1.15%2Fmediawiki-1.15.1.tar.gz3',
  );
  t.deepEqual(result.urlList, [
    'http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz',
    'http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz1',
    'http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz2',
    'http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz3',
  ]);
});

test('should decode dedupe repeated trackers', t => {
  const result = magnetDecode(
    'magnet:?xt=urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1&tr=udp%3A%2F%2Ftracker.example4.com%3A80&tr=udp%3A%2F%2Ftracker.example4.com%3A80&tr=udp%3A%2F%2Ftracker.example5.com%3A80&tr=udp%3A%2F%2Ftracker.example3.com%3A6969&tr=udp%3A%2F%2Ftracker.example2.com%3A80&tr=udp%3A%2F%2Ftracker.example1.com%3A1337',
  );
  const announce = [
    'udp://tracker.example1.com:1337',
    'udp://tracker.example2.com:80',
    'udp://tracker.example3.com:6969',
    'udp://tracker.example4.com:80',
    'udp://tracker.example5.com:80',
  ];
  t.deepEqual(result.announce, announce);
});

test('Cast file index (ix) to a number', t => {
  const result = magnetDecode(`${leavesOfGrass}&ix=1`);
  t.is(typeof result.ix, 'number');
  t.is(result.ix, 1);
});

test('should decode bittorrent v2 magnet links', t => {
  const result = magnetDecode(
    'magnet:?xt=urn:btmh:1220caf1e1c30e81cb361b9ee167c4aa64228a7fa4fa9f6105232b28ad099f3a302e&dn=bittorrent-v2-test',
  );
  t.is(result.xt, 'urn:btmh:1220caf1e1c30e81cb361b9ee167c4aa64228a7fa4fa9f6105232b28ad099f3a302e');
});

test('should decode hybrid bittorent v2 magnet links', t => {
  // https://blog.libtorrent.org/2020/09/bittorrent-v2/
  const result = magnetDecode(
    'magnet:?xt=urn:btih:631a31dd0a46257d5078c0dee4e66e26f73e42ac&xt=urn:btmh:1220d8dd32ac93357c368556af3ac1d95c9d76bd0dff6fa9833ecdac3d53134efabb&dn=bittorrent-v1-v2-hybrid-test',
  );
  t.deepEqual(result.xt, [
    'urn:btih:631a31dd0a46257d5078c0dee4e66e26f73e42ac',
    'urn:btmh:1220d8dd32ac93357c368556af3ac1d95c9d76bd0dff6fa9833ecdac3d53134efabb',
  ]);
  t.is(result.dn, 'bittorrent-v1-v2-hybrid-test');
});

test('decode: Extracts public key from xs', t => {
  const key = '9a36edf0988ddc1a0fc02d4e8652cce87a71aaac71fce936e650a597c0fb72e0';
  const result = magnetDecode(`magnet:?xs=urn:btpk:${key}`);
  t.is(result.publicKey, key);
  t.deepEqual(result.publicKeyBuffer, Buffer.from(key, 'hex'));
});

// Select specific file indices for download (BEP53) http://www.bittorrent.org/beps/bep_0053.html
test('decode: select-only', t => {
  const result = magnetDecode('magnet:?xt=urn:btih:64DZYZWMUAVLIWJUXGDIK4QGAAIN7SL6&so=0,2,4,6-8');
  t.deepEqual(result.so, [0, 2, 4, 6, 7, 8]);
});

// Peer address expressed as hostname:port (BEP09) http://bittorrent.org/beps/bep_0009.html
test('decode: peer-address single value', t => {
  const result = magnetDecode(
    'magnet:?xt=urn:btih:64DZYZWMUAVLIWJUXGDIK4QGAAIN7SL6&x.pe=123.213.32.10:47450',
  );
  const peerAddresses = ['123.213.32.10:47450'];
  t.deepEqual(result['x.pe'], peerAddresses[0]);
  t.deepEqual(result.peerAddresses, peerAddresses);
});

test('decode: peer-address multiple values', t => {
  const result = magnetDecode(
    'magnet:?xt=urn:btih:64DZYZWMUAVLIWJUXGDIK4QGAAIN7SL6&x.pe=123.213.32.10:47450&x.pe=[2001:db8::2]:55013',
  );
  const peerAddresses = ['123.213.32.10:47450', '[2001:db8::2]:55013'];
  t.deepEqual(result['x.pe'], peerAddresses);
  t.deepEqual(result.peerAddresses, peerAddresses);
});

test('decode: peer-address remove duplicates', t => {
  const result = magnetDecode(
    'magnet:?xt=urn:btih:64DZYZWMUAVLIWJUXGDIK4QGAAIN7SL6&x.pe=123.213.32.10:47450&x.pe=[2001:db8::2]:55013&x.pe=123.213.32.10:47450',
  );

  // raw value is *not* deduped
  t.deepEqual(result['x.pe'], [
    '123.213.32.10:47450',
    '[2001:db8::2]:55013',
    '123.213.32.10:47450',
  ]);

  // friendly value is deduped
  t.deepEqual(result.peerAddresses, ['123.213.32.10:47450', '[2001:db8::2]:55013']);
});
