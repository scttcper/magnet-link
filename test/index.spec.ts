import { magnetEncode, magnetDecode } from '../src/index';

describe('Decode', () => {
  it('should decode', () => {
    expect(
      magnetDecode(
        'magnet:?xt=urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36&dn=Leaves+of+Grass+by+Walt+Whitman.epub&tr=udp%3A%2F%2Ftracker.example4.com%3A80&tr=udp%3A%2F%2Ftracker.example5.com%3A80&tr=udp%3A%2F%2Ftracker.example3.com%3A6969&tr=udp%3A%2F%2Ftracker.example2.com%3A80&tr=udp%3A%2F%2Ftracker.example1.com%3A1337',
      ),
    ).toEqual({
      announce: [
        'udp://tracker.example1.com:1337',
        'udp://tracker.example2.com:80',
        'udp://tracker.example3.com:6969',
        'udp://tracker.example4.com:80',
        'udp://tracker.example5.com:80',
      ],
      dn: 'Leaves of Grass by Walt Whitman.epub',
      infoHash: 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36',
      name: 'Leaves of Grass by Walt Whitman.epub',
      infoHashBuffer: Buffer.from('d2474e86c95b19b8bcfdb92bc12c9d44667cfa36', 'hex'),
      tr: [
        'udp://tracker.example4.com:80',
        'udp://tracker.example5.com:80',
        'udp://tracker.example3.com:6969',
        'udp://tracker.example2.com:80',
        'udp://tracker.example1.com:1337',
      ],
      urlList: [],
      xt: 'urn:btih:d2474e86c95b19b8bcfdb92bc12c9d44667cfa36',
    });
  });
});
describe('Encode', () => {
  it('should encode', () => {
    expect(
      magnetEncode({
        xt: [
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
    ).toBe(
      'magnet:?xt=urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1&xt=urn:tree:tiger:7N5OAMRNGMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY&xt=urn:btih:QHQXPYWMACKDWKP47RRVIV7VOURXFE5Q&xl=10826029&dn=mediawiki-1.15.1.tar.gz&tr=udp%3A%2F%2Ftracker.example4.com%3A80%2Fannounce&as=http%3A%2F%2Fdownload.wikimedia.org%2Fmediawiki%2F1.15%2Fmediawiki-1.15.1.tar.gz&xs=http%3A%2F%2Fcache.example.org%2FXRX2PEFXOOEJFRVUCX6HMZMKS5TWG4K5&xs=dchub%3A%2F%2Fexample.org',
    );
  });
});
