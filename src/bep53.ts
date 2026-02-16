export function composeRange(range: number[]) {
  return range
    .reduce<string[][]>((acc, cur, idx, arr) => {
      if (idx === 0 || cur !== arr[idx - 1] + 1) {
        acc.push([]);
      }

      acc[acc.length - 1].push(`${cur}`);
      return acc;
    }, [])
    .map(cur => (cur.length > 1 ? `${cur[0]}-${cur[cur.length - 1]}` : `${cur[0]}`));
}

const generateRange = (start: number, end = start) =>
  Array.from({ length: end - start + 1 }, (_, idx) => idx + start);

export function parseRange(range: string[]) {
  return range.reduce<number[]>((acc, cur) => {
    const r = cur.split('-').map(cur => Number.parseInt(cur, 10));
    return [...acc, ...generateRange(r[0], r[1])];
  }, []);
}
