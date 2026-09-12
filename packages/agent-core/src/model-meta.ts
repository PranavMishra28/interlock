export const DEFAULT_MODEL = "gpt-5.4-mini-2026-03-17";

/**
 * Verified against the personal OpenAI project's model list on 2026-09-12.
 * The dated snapshot keeps live-eval behavior reproducible.
 */
export const MODEL_NOTES = {
  "gpt-5.4-mini-2026-03-17":
    "default · economical · $0.75 input / $4.50 output per MTok",
} as const;
