import { GoogleGenAI, Type } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

export async function POST(request: Request) {
  const body = await request.json();
}
