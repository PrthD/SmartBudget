/** Rounds to cents, avoiding binary float artefacts (0.1 + 0.2). */
export const round2 = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const sum = (values) => round2(values.reduce((acc, v) => acc + v, 0));
