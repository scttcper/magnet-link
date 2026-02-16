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

function generateRange(start: number, end: number, out: number[]) {
  for (let i = start; i <= end; i++) {
    out.push(i);
  }
}

export function parseRange(range: string[]) {
  const acc: number[] = [];
  // eslint-disable-next-line typescript-eslint/prefer-for-of -- indexed for-loop is faster
  for (let i = 0; i < range.length; i++) {
    const cur = range[i];
    const dash = cur.indexOf('-');
    if (dash === -1) {
      acc.push(+cur);
    } else {
      generateRange(+cur.slice(0, dash), +cur.slice(dash + 1), acc);
    }
  }

  return acc;
}
