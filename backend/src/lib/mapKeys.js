/**
 * MongoDB Map keys may not contain "." or start with "$". Category, source
 * and goal names are user text, so they are escaped with look-alike
 * full-width characters on write and restored on read. Names without those
 * characters (all v1 data) are stored unchanged.
 */
const ENCODE = [
  [/\./g, '．'],
  [/^\$/, '＄'],
];
const DECODE = [
  [/．/g, '.'],
  [/^＄/, '$'],
];

const replaceAll = (value, rules) =>
  rules.reduce(
    (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
    value
  );

export const encodeKey = (key) => replaceAll(key, ENCODE);
export const decodeKey = (key) => replaceAll(key, DECODE);

/** Plain object → Map-safe object. */
export function encodeKeys(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [encodeKey(key), value])
  );
}

/** Mongoose Map / plain object → plain object with original keys. */
export function decodeKeys(mapOrRecord) {
  const entries =
    mapOrRecord instanceof Map
      ? [...mapOrRecord.entries()]
      : Object.entries(mapOrRecord ?? {});
  return Object.fromEntries(
    entries.map(([key, value]) => [decodeKey(key), value])
  );
}
