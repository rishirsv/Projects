# Model Selector Recommendations

The WatchLater summarizer benefits from models that balance long-context reasoning, factual grounding, and markdown-friendly output. The shortlist below prioritizes providers with reliable availability for transcript summarization, good latency, and strong abstraction skills when condensing long-form YouTube content.

| Model ID | Provider | Why it works well for WatchLater |
| --- | --- | --- |
| `gemini-2.5-pro` | Google | Highest quality Gemini model with robust multimedia grounding, excels at long transcripts and structured markdown summaries. |
| `gemini-2.5-flash` | Google | Faster, lower-cost alternative to Pro that still performs well on multi-thousand-token transcripts. |
| `gemini-1.5-pro` | Google | Reliable fallback for large-context jobs when the 2.5 tier is rate limited; consistent markdown output. |
| `openrouter/anthropic/claude-3.5-sonnet` | Anthropic (via OpenRouter) | Top-tier reasoning and narrative summarization, especially strong at extracting action items. |
| `openrouter/anthropic/claude-3.5-haiku` | Anthropic (via OpenRouter) | Lightweight Claude option with competitive latency while preserving good factual accuracy. |
| `openrouter/openai/gpt-4o` | OpenAI (via OpenRouter) | Balanced creativity and precision, handles long context and produces clean markdown. |
| `openrouter/openai/gpt-4o-mini` | OpenAI (via OpenRouter) | Cost-effective 4o variant that remains reliable for day-to-day batch processing. |
| `openrouter/x-ai/grok-4` | xAI (via OpenRouter) | Provides Grok coverage requested by stakeholders and offers concise, opinionated summaries. |
| `openrouter/meta-llama/llama-3.1-405b-instruct` | Meta (via OpenRouter) | Latest Llama flagship with strong world knowledge and controllable tone, great for academic-style recaps. |
| `openrouter/mistralai/mistral-large-latest` | Mistral (via OpenRouter) | European provider with competitive pricing, excels at structured bullet-point summarization. |

## Default + rotation strategy

- **Default**: `gemini-2.5-pro` (best observed quality for WatchLater prompts while staying inside the browser-only Gemini flow).
- **Quick iteration**: swap to `gemini-2.5-flash` or `openrouter/openai/gpt-4o-mini` when speed/cost is critical.
- **Diversity**: Claude, Llama, Mistral, and Grok ensure coverage when Gemini quotas or OpenAI policies throttle usage.

Update `VITE_MODEL_OPTIONS` and `VITE_MODEL_DEFAULT` with the comma-separated list above to expose all 10 selectors inside the UI.
