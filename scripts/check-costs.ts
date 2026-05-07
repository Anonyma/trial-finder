/**
 * Cost calculator and provider comparison tool.
 * 
 * Usage:
 *   npm run cost:check
 * 
 * Shows estimated costs for different providers based on your usage patterns.
 */

import { isUnlimitedProvider, getProvider } from "../src/lib/ai/providers";

interface UsagePattern {
  name: string;
  trialsToClassify: number;
  monthlyMatches: number;
}

const PATTERNS: UsagePattern[] = [
  { name: "Initial setup (full)", trialsToClassify: 50000, monthlyMatches: 100 },
  { name: "Testing (small)", trialsToClassify: 100, monthlyMatches: 10 },
  { name: "Production (daily)", trialsToClassify: 500, monthlyMatches: 500 },
  { name: "High traffic", trialsToClassify: 500, monthlyMatches: 5000 },
];

interface ProviderCost {
  name: string;
  subscription: number; // monthly
  classificationPer1k: number;
  matchingPer1k: number;
  models: string;
}

const PROVIDERS: ProviderCost[] = [
  {
    name: "quadmax",
    subscription: 20,
    classificationPer1k: 0,
    matchingPer1k: 0,
    models: "Claude Haiku/Sonnet",
  },
  {
    name: "gemini",
    subscription: 0,
    classificationPer1k: 0.002, // $0.075/1M tokens, ~750 tokens per classification
    matchingPer1k: 0.02, // ~2000 tokens per match
    models: "Gemini 1.5 Flash",
  },
  {
    name: "openai",
    subscription: 0,
    classificationPer1k: 0.01, // $0.15/1M tokens
    matchingPer1k: 0.08, // GPT-4o-mini
    models: "GPT-4o-mini",
  },
  {
    name: "anthropic",
    subscription: 0,
    classificationPer1k: 0.20, // Haiku $0.25/1M input + $1.25/1M output
    matchingPer1k: 1.50, // Sonnet $3/1M input + $15/1M output
    models: "Claude Haiku + Sonnet",
  },
  {
    name: "ollama",
    subscription: 0,
    classificationPer1k: 0,
    matchingPer1k: 0,
    models: "Llama 3.2, Mistral, etc.",
  },
];

function calculateCosts(pattern: UsagePattern, provider: ProviderCost) {
  const classificationCost = (pattern.trialsToClassify / 1000) * provider.classificationPer1k;
  const matchingCost = (pattern.monthlyMatches / 1000) * provider.matchingPer1k;
  const monthlyTotal = provider.subscription + classificationCost + matchingCost;
  
  // Annualize (assuming classification is one-time, matching is recurring)
  const annualTotal = provider.subscription * 12 + classificationCost + matchingCost * 12;
  
  return {
    classificationCost,
    matchingCost,
    monthlyTotal,
    annualTotal,
  };
}

function formatCurrency(n: number): string {
  if (n === 0) return "FREE";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

function main() {
  console.log("💰 Trial Finder Cost Analysis\n");
  console.log("=".repeat(80));
  
  const currentProvider = getProvider();
  console.log(`Current provider: ${currentProvider}`);
  
  if (isUnlimitedProvider()) {
    console.log("✅ You have unlimited calls - no per-request costs!");
  }
  console.log("\n");

  for (const pattern of PATTERNS) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`Scenario: ${pattern.name}`);
    console.log(`  - Classify ${pattern.trialsToClassify.toLocaleString()} trials`);
    console.log(`  - ${pattern.monthlyMatches} matching requests/month`);
    console.log("=".repeat(80));
    
    console.log("\n| Provider    | Subscription | Classification | Matching | Monthly | Annual |");
    console.log("|-------------|--------------|----------------|----------|---------|--------|");
    
    const results = PROVIDERS.map(provider => {
      const costs = calculateCosts(pattern, provider);
      const isCurrent = provider.name === currentProvider;
      return {
        provider,
        costs,
        isCurrent,
      };
    });
    
    // Sort by annual cost
    results.sort((a, b) => a.costs.annualTotal - b.costs.annualTotal);
    
    for (const { provider, costs, isCurrent } of results) {
      const marker = isCurrent ? " ← YOU" : "";
      console.log(
        `| ${provider.name.padEnd(11)} | ` +
        `${formatCurrency(provider.subscription).padStart(12)} | ` +
        `${formatCurrency(costs.classificationCost).padStart(14)} | ` +
        `${formatCurrency(costs.matchingCost).padStart(8)} | ` +
        `${formatCurrency(costs.monthlyTotal).padStart(7)} | ` +
        `${formatCurrency(costs.annualTotal).padStart(6)} |` +
        marker
      );
    }
    
    // Find best option
    const best = results[0];
    console.log(`\n🏆 Best value: ${best.provider.name} (${formatCurrency(best.costs.annualTotal)}/year)`);
    
    if (best.provider.name === "quadmax" && best.costs.annualTotal < 100) {
      console.log("   💡 QuadMax pays for itself at this scale!");
    }
    if (best.provider.name === "ollama") {
      console.log("   ⚠️  Ollama requires local GPU/CPU setup");
    }
  }

  console.log("\n\n" + "=".repeat(80));
  console.log("RECOMMENDATIONS");
  console.log("=".repeat(80));
  
  console.log(`
1. FOR TESTING (small datasets):
   → USE_CHEAP_MATCHING="true" (rule-based, FREE)
   → Or: AI_PROVIDER="gemini" (cheapest per-call)

2. FOR PRODUCTION (high volume):
   → AI_PROVIDER="quadmax" ($20/mo unlimited)
   → Best quality, no cost anxiety

3. FOR SELF-HOSTING:
   → AI_PROVIDER="ollama" (FREE after setup)
   → Requires GPU or patience with CPU

4. FOR BALANCE:
   → AI_PROVIDER="openai" with GPT-4o-mini
   → Good quality, reasonable cost (~$4/mo at scale)
`);

  // Show current configuration
  console.log("=".repeat(80));
  console.log("YOUR CURRENT SETUP");
  console.log("=".repeat(80));
  console.log(`Provider: ${currentProvider}`);
  console.log(`Unlimited: ${isUnlimitedProvider() ? "YES ✅" : "NO"}`);
  console.log(`Cheap matching: ${process.env.USE_CHEAP_MATCHING === "true" ? "ENABLED" : "disabled"}`);
  console.log(`Dummy matching: ${process.env.USE_DUMMY_MATCHING === "true" ? "ENABLED" : "disabled"}`);
}

main();
