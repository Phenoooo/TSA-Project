import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  const body = await request.json();

  const answers = body.answers;
  const questions = body.questions;

  const result = await ai.models.generateContent({
    model: "google/gemma-4-31b",
    contents: [
      "Analyze the student's answers and written work. Choose only from these categories, multiple are ok, and store them each as seperate variables:" +
        " sign_error (integer), operation_error (integer), distribution_error (integer)," +
        " exponent_rule_error (integer), graph_interpretation_error (integer)," +
        " variable_isolation_error (integer), formula_error (integer)." +
        " Return a result for each submitted question." +
        " Include the question ID and a short explanation." +
        " Do not invent new categories.",
      "Student work: " + answers + " Questions: " + questions,
    ],
  });

  return Response.json({ feedback: result.text });
}
