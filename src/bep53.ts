const maxSelectOnlyFiles = 100_000;

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
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start) {
    return;
  }

  if (out.length + end - start + 1 > maxSelectOnlyFiles) {
    return;
  }

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
      const index = +cur;
      if (Number.isSafeInteger(index) && index >= 0 && acc.length < maxSelectOnlyFiles) {
        acc.push(index);
      }
    } else if (dash > 0 && dash < cur.length - 1) {
      generateRange(+cur.slice(0, dash), +cur.slice(dash + 1), acc);
    }
  }

  return acc;
}
