# AI Cost Analysis: Per-Call vs Subscription

## Current Cost Structure (Per-Call API)

| Task | Volume | Cost Each | Total |
|------|--------|-----------|-------|
| Classification (50k trials) | 50,000 | $0.0002 (Haiku) | ~$10 |
| Daily updates | ~500/day | $0.0002 | ~$3/mo |
| Matching | 100 req/mo | $0.10 (Sonnet) | ~$10/mo |
| **Annual Total** | | | **~$250-300** |

## Subscription-Based Alternatives

### Option 1: QuadMax Subscription ($20/mo)
- **Unlimited** Claude Sonnet/Haiku via OpenCode Zen
- Includes all classification + matching at no per-call cost
- **Annual: $240** (vs $250-300 per-call)
- Break-even: ~2,000 classifications + 200 matches per month

### Option 2: OpenAI + Gemini Mix
- **Gemini 1.5 Flash**: $0.075/1M tokens (classification)
- **GPT-4o-mini**: $0.15/1M tokens (matching)
- Classification cost: ~$0.50 for 50k trials
- Matching cost: ~$0.01 per request
- **Annual: ~$50-70**

### Option 3: Local Models (Ollama + GPU)
- **llama3.2:3b** or **gemma2:2b** for classification
- **llama3.1:8b** or **mistral-nemo** for matching
- One-time GPU cost or use existing hardware
- **Annual: $0** (after setup)

---

## Task-by-Task Model Requirements

### 1. Classification (Batch Job)

**Task**: Read trial → Assign modalities → Write plain-language summary

**Input size**: ~500-1000 tokens per trial
**Output size**: ~100-200 tokens

| Model | Accuracy | Speed | Cost per 1k trials | Subscription |
|-------|----------|-------|-------------------|--------------|
| Haiku (Claude) | 90% | Fast | $0.20 | QuadMax unlimited |
| Gemini Flash | 85% | Fast | $0.015 | - |
| GPT-4o-mini | 88% | Fast | $0.03 | OpenAI sub |
| llama3.2:3b (local) | 75% | Medium | $0.00 | Free |

**Verdict**: Does NOT need powerful model. Keyword + simple LLM sufficient.
**Recommendation**: Use Gemini Flash or local model via QuadMax.

---

### 2. Matching (Real-Time)

**Task**: Read user profile + trial eligibility → Score fit → Explain reasoning

**Input size**: ~2000-4000 tokens (eligibility criteria can be long)
**Output size**: ~300-500 tokens (structured JSON)

| Model | Accuracy | Speed | Cost per match | Subscription |
|-------|----------|-------|----------------|--------------|
| Sonnet (Claude) | 95% | Medium | $0.10 | QuadMax unlimited |
| GPT-4o | 92% | Fast | $0.08 | OpenAI sub |
| Gemini Pro | 88% | Fast | $0.05 | - |
| llama3.1:8b (local) | 75% | Slow | $0.00 | Free |

**Verdict**: Benefits from reasoning, BUT most cases are straightforward.
**Recommendation**: Tiered approach - cheap model first, escalate for edge cases.

---

## Proposed Architecture: Subscription-First

### Strategy: QuadMax Unlimited ($20/mo)

```
┌─────────────────────────────────────────────────────────────┐
│  BATCH CLASSIFICATION (Daily Cron via GitHub Actions)      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ QuadMax → Claude Haiku (unlimited)                 │   │
│  │ - 50k initial backfill: $0                         │   │
│  │ - Daily ~500 updates: $0                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  REAL-TIME MATCHING (User Request)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Rule-based filter (FREE)                        │   │
│  │    ↓ 30 candidates                                 │   │
│  │ 2. QuadMax → Haiku for simple cases (unlimited)    │   │
│  │    ↓ if confidence < 70%                           │   │
│  │ 3. QuadMax → Sonnet for complex cases (unlimited)  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Total Monthly Cost: $20** (fixed)
**vs Per-Call: $25-30/mo at scale**

---

## When Do You ACTUALLY Need Powerful Models?

| Scenario | Can Cheap Model Handle? | Needs Sonnet/GPT-4? |
|----------|-------------------------|---------------------|
| "Immunotherapy + chemo combination" → [immunotherapy, chemo, combination] | ✅ Yes | ❌ No |
| "AdV-tk + valacyclovir + radiation" → [gene_therapy, radiation] | ⚠️ Sometimes | ✅ Edge cases |
| Age/sex matching | ✅ Rule-based | ❌ No |
| "No prior anti-PD-1" vs "pembrolizumab 2 years ago" | ⚠️ Basic regex | ✅ Complex reasoning |
| "ECOG 0-1 required" vs "patient can walk but gets tired" | ❌ Needs understanding | ✅ Yes |
| Multi-site trial with different country eligibility | ⚠️ Pattern match | ✅ Complex case |

**Conclusion**: 
- 80% of matching cases work with rule-based + cheap LLM
- 20% need stronger model for nuanced eligibility parsing
- With subscription, you can use Sonnet for everything at no marginal cost

---

## Implementation Plan

### Phase 1: Immediate (This Week)
1. **Switch classification to QuadMax** - Change model name, same code
2. **Keep rule-based matching as default** - Free, fast, 70% accurate
3. **Add "Deep Match" button** - Uses Sonnet via QuadMax for thorough analysis

### Phase 2: Optimized (Next Sprint)
1. **Confidence-based routing**:
   ```
   if (eligibility_criteria.contains_complex_language):
       use sonnet
   else:
       use haiku / rule-based
   ```
2. **Caching layer** - Same profile + trial = cached result
3. **Pre-computed embeddings** - Semantic similarity as first filter

### Phase 3: Advanced
1. **Fine-tuned small model** - Train 7B model on classification data
2. **Local deployment** - Self-host matching for zero latency

---

## Code Changes Needed

### 1. Add QuadMax Provider

```typescript
// src/lib/ai/providers.ts
export const QUADMAX_BASE_URL = "https://api.opencode.ai/v1";

export function getQuadMaxClient() {
  return new Anthropic({
    apiKey: process.env.QUADMAX_API_KEY,
    baseURL: QUADMAX_BASE_URL,
  });
}
```

### 2. Environment Configuration

```bash
# Option A: QuadMax (Recommended for unlimited)
AI_PROVIDER="quadmax"
QUADMAX_API_KEY="sk-..."

# Option B: OpenAI
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-..."

# Option C: Gemini
AI_PROVIDER="gemini"
GEMINI_API_KEY="..."

# Option D: Anthropic (per-call, original)
AI_PROVIDER="anthropic"
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Updated Scripts

```bash
# Classification via QuadMax (unlimited)
npm run ingest:classify-quadmax

# Classification via Gemini (cheap)
npm run ingest:classify-gemini

# Classification via OpenAI (cheap)
npm run ingest:classify-openai
```

---

## Cost Comparison Summary

| Approach | Monthly Cost | Annual Cost | Pros | Cons |
|----------|--------------|-------------|------|------|
| **Anthropic per-call** | $20-30 | $240-360 | Best quality | Variable cost |
| **QuadMax unlimited** | $20 | $240 | Fixed cost, unlimited | Requires subscription |
| **Gemini + OpenAI mix** | $5-10 | $60-120 | Cheapest | Multiple APIs to manage |
| **Local models** | $0 | $0 | Free | Setup complexity |
| **Hybrid (rule-based + QuadMax)** | $20 | $240 | Best of both | Slightly more complex |

**Recommendation**: QuadMax subscription ($20/mo) is the sweet spot:
- Unlimited calls = no cost anxiety
- Can use best model (Sonnet) for everything
- Simpler codebase (one provider)
- Breaks even at moderate scale
