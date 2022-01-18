/* eslint-disable @typescript-eslint/restrict-plus-operands */

export function composeRange(range: number[]) {
  return range
    .reduce<string[][]>((acc, cur, idx, arr) => {
      // @ts-expect-error
      if (idx === 0 || cur !== arr[idx - 1] + 1) {
        acc.push([]);
      }

      // @ts-expect-error
      acc[acc.length - 1].push(cur);
      return acc;
    }, [])
    .map(cur => {
      return cur.length > 1 ? `${cur[0]}-${cur[cur.length - 1]}` : `${cur[0]}`;
    });
}

export function parseRange(range: string[]) {
  const generateRange = (start: number, end = start) =>
    Array.from({ length: end - start + 1 }, (_, idx) => idx + start);

  return range.reduce<number[]>((acc, cur) => {
    const r = cur.split('-').map(cur => parseInt(cur, 10));
    return acc.concat(generateRange(r[0]!, r[1]));
  }, []);
}
