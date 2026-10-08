import { afterEach, describe, expect, it, vi } from 'vitest';

// A fake Gemini client whose behaviour each test scripts per model.
const behaviour = new Map();
const calls = [];
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: async ({ model }) => {
        calls.push(model);
        const result = behaviour.get(model);
        if (result instanceof Error) throw result;
        return { text: JSON.stringify(result) };
      },
    };
  },
}));

process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_MODELS = 'big-flash,small-flash-lite';

const { z } = await import('zod');
const { generateJson, modelOrder, resetModelCooldowns } =
  await import('../../src/modules/ai/gemini.js');

const schema = z.object({ ok: z.boolean() });
const quotaError = Object.assign(new Error('quota'), { status: 429 });

afterEach(() => {
  behaviour.clear();
  calls.length = 0;
  resetModelCooldowns();
});

describe('gemini model chain', () => {
  it('orders lite models first for fast requests', () => {
    expect(
      modelOrder(['big-flash', 'small-flash-lite'], { prefer: 'fast' })
    ).toEqual(['small-flash-lite', 'big-flash']);
    expect(modelOrder(['big-flash', 'small-flash-lite'])).toEqual([
      'big-flash',
      'small-flash-lite',
    ]);
  });

  it('falls back on quota errors and then skips the cooling model', async () => {
    behaviour.set('big-flash', quotaError);
    behaviour.set('small-flash-lite', { ok: true });

    const first = await generateJson({ system: '', contents: 'x', schema });
    expect(first.model).toBe('small-flash-lite');
    expect(calls).toEqual(['big-flash', 'small-flash-lite']);

    calls.length = 0;
    await generateJson({ system: '', contents: 'x', schema });
    // big-flash is cooling down, so it is no longer tried first.
    expect(calls).toEqual(['small-flash-lite']);
  });

  it('rejects output that does not match the schema and tries the next model', async () => {
    behaviour.set('big-flash', { ok: 'yes' });
    behaviour.set('small-flash-lite', { ok: false });
    const result = await generateJson({ system: '', contents: 'x', schema });
    expect(result).toEqual({ data: { ok: false }, model: 'small-flash-lite' });
  });

  it('reports "busy" when every model fails', async () => {
    behaviour.set('big-flash', quotaError);
    behaviour.set('small-flash-lite', quotaError);
    await expect(
      generateJson({ system: '', contents: 'x', schema })
    ).rejects.toMatchObject({
      status: 503,
    });
  });
});
