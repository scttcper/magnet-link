import test from 'ava';

import { composeRange, parseRange } from '../src/bep53.js';

test('parse: a number', t => {
  const range = parseRange(['1']);

  t.deepEqual(range, [1]);
});

test('parse: one range', t => {
  const range = parseRange(['1-3']);

  t.deepEqual(range, [1, 2, 3]);
});

test('parse: multiple ranges', t => {
  const range = parseRange(['1-3', '11-13']);

  t.deepEqual(range, [1, 2, 3, 11, 12, 13]);
});

test('parse: multiple ranges between a number', t => {
  const range = parseRange(['1-3', '6', '11-13']);

  t.deepEqual(range, [1, 2, 3, 6, 11, 12, 13]);
});

test('compose: a number', t => {
  const range = composeRange([1]);

  t.deepEqual(range, ['1']);
});

test('compose: one range', t => {
  const range = composeRange([1, 2, 3]);

  t.deepEqual(range, ['1-3']);
});

test('compose: multiple ranges', t => {
  const range = composeRange([1, 2, 3, 11, 12, 13]);

  t.deepEqual(range, ['1-3', '11-13']);
});

test('compose: multiple ranges between a number', t => {
  const range = composeRange([1, 2, 3, 6, 11, 12, 13]);

  t.deepEqual(range, ['1-3', '6', '11-13']);
});
