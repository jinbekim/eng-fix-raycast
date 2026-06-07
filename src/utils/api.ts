import { DraftOption } from "../types";

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
  error?: {
    message?: string;
  };
}

// Gemini API 호출 공통 함수
export async function fetchGeminiDrafts(apiKey: string, prompt: string): Promise<DraftOption[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
    },
  );

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data?.error?.message || "Unknown API Error");
  }

  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  let jsonStr = responseText.trim();

  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "");
  }
  jsonStr = jsonStr.trim();

  const parsed = JSON.parse(jsonStr);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  throw new Error("Invalid response format from Gemini");
}
