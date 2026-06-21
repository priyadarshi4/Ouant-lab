import { GoogleGenAI } from "@google/genai";

// Gemini's free tier (as of 2026) covers the Flash / Flash-Lite model
// families with no billing required. Pro models are paid-only, so we
// default to Flash, which is multimodal (text + images) and free-tier
// eligible. Override via GEMINI_MODEL in .env if you want a newer Flash
// release once one's available on your account.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Strips markdown code fences some models wrap JSON responses in.
export function cleanJsonResponse(text) {
  return text.replace(/```json|```/g, "").trim();
}
