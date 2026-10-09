import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { serviceUnavailable } from '../../lib/errors.js';

const REQUEST_TIMEOUT_MS = 10_000;
// After a quota error, overload or timeout, skip that model for a while
// instead of paying the same failure (or wait) on every request.
const COOLDOWN_MS = 60_000;
const cooldownUntil = new Map();

let client;
const getClient = () => {
  if (!env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
};

export const isAiConfigured = () => Boolean(env.GEMINI_API_KEY);

function toResponseSchema(schema) {
  // eslint-disable-next-line no-unused-vars
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema);
  return jsonSchema;
}

const isTransient = (error) =>
  error?.status === 429 ||
  error?.status === 503 ||
  error?.name === 'TimeoutError' ||
  error?.name === 'AbortError';

/**
 * The order to try models in: healthy models first (cooling-down ones last,
 * so something is still attempted when all are cooling), and for `fast`
 * requests the "lite" models ahead of the rest.
 */
export function modelOrder(models, { prefer, now = Date.now() } = {}) {
  const rank = (model) =>
    (cooldownUntil.get(model) > now ? 2 : 0) +
    (prefer === 'fast' && !model.includes('lite') ? 1 : 0);
  return [...models].sort((a, b) => rank(a) - rank(b));
}

/** Test hook. */
export const resetModelCooldowns = () => cooldownUntil.clear();

/**
 * Generates JSON matching `schema`, walking the configured model chain. Free
 * tier quotas are per project and per model, so a 429 on one model is
 * answered by the next. Output is validated with zod — never trusted.
 *
 * @template T
 * @param {{ system: string, contents: unknown, schema: z.ZodType<T>, temperature?: number, prefer?: 'fast' }} request
 * @returns {Promise<{ data: T, model: string }>}
 */
export async function generateJson({
  system,
  contents,
  schema,
  temperature = 0.2,
  prefer,
}) {
  const ai = getClient();
  if (!ai) throw serviceUnavailable('AI features are not configured.');

  const responseJsonSchema = toResponseSchema(schema);
  for (const model of modelOrder(env.geminiModels, { prefer })) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: system,
          responseMimeType: 'application/json',
          responseJsonSchema,
          temperature,
          maxOutputTokens: 2048,
          // These are reasoning models; unbounded thinking eats the output
          // budget (and latency) for what are simple extraction tasks.
          thinkingConfig: { thinkingLevel: 'low' },
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      });
      const data = schema.parse(JSON.parse(response.text ?? ''));
      cooldownUntil.delete(model);
      return { data, model };
    } catch (error) {
      if (isTransient(error))
        cooldownUntil.set(model, Date.now() + COOLDOWN_MS);
      // Quota, outage, retired model or malformed output: try the next model.
      logger.warn(
        { model, status: error?.status, err: error?.message },
        'Gemini call failed'
      );
    }
  }
  throw serviceUnavailable(
    'AI is busy right now. Please try again in a minute.'
  );
}
