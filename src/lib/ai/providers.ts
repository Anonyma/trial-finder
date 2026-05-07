/**
 * Multi-provider AI client configuration.
 * 
 * Supports:
 * - QuadMax (unlimited Claude via OpenCode Zen) - RECOMMENDED
 * - OpenAI (GPT-4o, GPT-4o-mini)
 * - Google Gemini
 * - Anthropic (original per-call)
 * - Local Ollama (free, self-hosted)
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Provider type
type AIProvider = "quadmax" | "openai" | "gemini" | "anthropic" | "ollama";

// Get configured provider
export function getProvider(): AIProvider {
  return (process.env.AI_PROVIDER as AIProvider) || "anthropic";
}

// Check if using unlimited/subscription model
export function isUnlimitedProvider(): boolean {
  const provider = getProvider();
  return provider === "quadmax" || provider === "ollama";
}

// ==================== QUADMAX (RECOMMENDED) ====================

const QUADMAX_BASE_URL = "https://api.opencode.ai/v1";

export function getQuadMaxClient(): Anthropic {
  const apiKey = process.env.QUADMAX_API_KEY;
  if (!apiKey) {
    throw new Error("QUADMAX_API_KEY not set");
  }
  return new Anthropic({
    apiKey,
    baseURL: QUADMAX_BASE_URL,
  });
}

// ==================== OPENAI ====================

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }
  return new OpenAI({ apiKey });
}

// ==================== GEMINI ====================

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

// ==================== ANTHROPIC (Original) ====================

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  return new Anthropic({ apiKey });
}

// ==================== UNIFIED INTERFACE ====================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface ChatCompletionResult {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
}

/**
 * Unified chat completion - works with any provider
 */
export async function chatCompletion(
  opts: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const provider = getProvider();

  switch (provider) {
    case "quadmax":
      return chatQuadMax(opts);
    case "openai":
      return chatOpenAI(opts);
    case "gemini":
      return chatGemini(opts);
    case "anthropic":
      return chatAnthropic(opts);
    case "ollama":
      return chatOllama(opts);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Provider-specific implementations

async function chatQuadMax(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const client = getQuadMaxClient();
  
  // Convert messages to Anthropic format
  const systemMessage = opts.messages.find(m => m.role === "system")?.content;
  const userMessages = opts.messages.filter(m => m.role !== "system");
  
  const response = await client.messages.create({
    model: opts.model || "claude-haiku-4-5-20251001",
    max_tokens: opts.maxTokens || 1000,
    temperature: opts.temperature ?? 0.3,
    system: systemMessage,
    messages: userMessages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })) as any,
  });

  const content = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  return {
    content,
    model: response.model,
    usage: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    },
  };
}

async function chatOpenAI(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: opts.model || "gpt-4o-mini",
    messages: opts.messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens,
    response_format: opts.responseFormat === "json" ? { type: "json_object" } : undefined,
  });

  return {
    content: response.choices[0]?.message?.content || "",
    model: response.model,
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
    },
  };
}

async function chatGemini(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const client = getGeminiClient();
  
  const model = client.getGenerativeModel({
    model: opts.model || "gemini-1.5-flash",
    generationConfig: {
      temperature: opts.temperature ?? 0.3,
      maxOutputTokens: opts.maxTokens,
      responseMimeType: opts.responseFormat === "json" ? "application/json" : "text/plain",
    },
  });

  // Gemini uses different format - combine system + user
  const systemMsg = opts.messages.find(m => m.role === "system")?.content || "";
  const userMsgs = opts.messages.filter(m => m.role === "user").map(m => m.content);
  
  const prompt = systemMsg 
    ? `${systemMsg}\n\n${userMsgs.join("\n")}`
    : userMsgs.join("\n");

  const result = await model.generateContent(prompt);
  const response = result.response;

  return {
    content: response.text(),
    model: opts.model || "gemini-1.5-flash",
  };
}

async function chatAnthropic(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const client = getAnthropicClient();
  
  const systemMessage = opts.messages.find(m => m.role === "system")?.content;
  const userMessages = opts.messages.filter(m => m.role !== "system");
  
  const response = await client.messages.create({
    model: opts.model || "claude-haiku-4-5-20251001",
    max_tokens: opts.maxTokens || 1000,
    temperature: opts.temperature ?? 0.3,
    system: systemMessage,
    messages: userMessages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })) as any,
  });

  const content = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  return {
    content,
    model: response.model,
    usage: {
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
    },
  };
}

async function chatOllama(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const model = opts.model || "llama3.2:3b";
  
  // Combine messages into single prompt for Ollama
  const prompt = opts.messages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: opts.responseFormat === "json" ? "json" : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    content: data.response,
    model,
  };
}

// ==================== COST TRACKING ====================

export function logUsage(result: ChatCompletionResult, task: string): void {
  if (isUnlimitedProvider()) {
    console.log(`[${task}] Used ${result.model} (unlimited provider - $0.00)`);
    return;
  }

  const provider = getProvider();
  const { inputTokens = 0, outputTokens = 0 } = result.usage || {};
  
  // Rough cost estimates per 1M tokens
  const costs: Record<string, { input: number; output: number }> = {
    "anthropic/claude-haiku-4-5": { input: 0.25, output: 1.25 },
    "anthropic/claude-sonnet-4-6": { input: 3, output: 15 },
    "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
    "openai/gpt-4o": { input: 2.5, output: 10 },
    "google/gemini-1.5-flash": { input: 0.075, output: 0.3 },
    "google/gemini-1.5-pro": { input: 3.5, output: 10.5 },
  };

  const costModel = costs[result.model] || costs["anthropic/claude-haiku-4-5"];
  const inputCost = (inputTokens / 1_000_000) * costModel.input;
  const outputCost = (outputTokens / 1_000_000) * costModel.output;
  const totalCost = inputCost + outputCost;

  console.log(`[${task}] ${result.model}: ${inputTokens} in / ${outputTokens} out = ~$${totalCost.toFixed(4)}`);
}
