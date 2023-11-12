# magnet-link [![npm](https://badgen.net/npm/v/@ctrl/magnet-link)](https://www.npmjs.com/package/@ctrl/magnet-link) [![coverage](https://badgen.net/codecov/c/github/scttcper/magnet-link)](https://codecov.io/gh/scttcper/magnet-link)

> Parse a magnet URI into an object

Port of [webtorrent/magnet-uri](https://github.com/webtorrent/magnet-uri) by [feross](https://github.com/feross) that uses fewer dependencies in typescript

__Demo__: https://magnet-link.vercel.app  

### Install
```console
npm install @ctrl/magnet-link
```

### Use

#### Encode
```ts
import { magnetDecode } from '@ctrl/magnet-link';

const uri = 'magnet:?xt=urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36&dn=Leaves+of+Grass+by+Walt+Whitman.epub&tr=udp%3A%2F%2Ftracker.example4.com%3A80&tr=udp%3A%2F%2Ftracker.example5.com%3A80&tr=udp%3A%2F%2Ftracker.example3.com%3A6969&tr=udp%3A%2F%2Ftracker.example2.com%3A80&tr=udp%3A%2F%2Ftracker.example1.com%3A1337';
const parsed = magnetDecode(uri);
console.log(parsed.dn) // "Leaves of Grass by Walt Whitman.epub"
console.log(parsed.infoHash) // "d2474e86c95b19b8bcfdb92bc12c9d44667cfa36"
```
The entire parsed object
```json
{
  "xt": "urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36",
  "dn": "Leaves of Grass by Walt Whitman.epub",
  "tr": [
    "udp://tracker.example1.com:1337",
    "udp://tracker.example2.com:80",
    "udp://tracker.example3.com:6969",
    "udp://tracker.example4.com:80",
    "udp://tracker.example5.com:80"
  ],
  "name": "Leaves of Grass by Walt Whitman.epub",
  "infoHash": "d2474e86c95b19b8bcfdb92bc12c9d44667cfa36",
  "announce": [
    "udp://tracker.example1.com:1337",
    "udp://tracker.example2.com:80",
    "udp://tracker.example3.com:6969",
    "udp://tracker.example4.com:80",
    "udp://tracker.example5.com:80"
  ]
}
```

#### Decode

```ts
import { magnetEncode } from '@ctrl/magnet-link';

// convert object to magnet uri
const uri = magnetEncode({
  xt: [
    'urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1',
    'urn:tree:tiger:7N5OAMRNGMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY',
    'urn:btih:QHQXPYWMACKDWKP47RRVIV7VOURXFE5Q',
  ],
  xl: '10826029',
  dn: 'mediawiki-1.15.1.tar.gz',
  tr: [
    'udp://tracker.openbittorrent.com:80/announce',
  ],
  as: 'http://download.wikimedia.org/mediawiki/1.15/mediawiki-1.15.1.tar.gz',
  xs: [
    'http://cache.example.org/XRX2PEFXOOEJFRVUCX6HMZMKS5TWG4K5',
    'dchub://example.org',
  ],
});


You can also use convenience key names like name (dn), infoHash (xt), infoHashIntArray (xt), announce (tr), and keywords (kt).
```

### See Also
- magnet uri spec http://www.bittorrent.org/beps/bep_0053.html
- more spec http://www.bittorrent.org/beps/bep_0009.html
- magnet-uri https://github.com/webtorrent/magnet-uri
