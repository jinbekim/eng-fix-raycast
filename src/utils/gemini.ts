import { DraftOption } from "../types";

// 톤 별 Gemini 프롬프트 세부 지침 생성 함수
export function getPrompt(text: string, tone: string, customInstruction?: string): string {
  let toneInstruction = "";
  switch (tone) {
    case "professional":
      toneInstruction =
        "Write in a professional, polite, and formal tone, suitable for business emails, official correspondence, or corporate communications.";
      break;
    case "casual":
      toneInstruction =
        "Write in a casual, friendly, and conversational tone, suitable for everyday messaging, social media, or talking to colleagues/friends.";
      break;
    case "concise":
      toneInstruction =
        "Write in a highly concise, direct, and straight-to-the-point tone. Avoid unnecessary words while keeping it grammatically correct and natural.";
      break;
    case "academic":
      toneInstruction =
        "Write in an academic, formal, and sophisticated tone, suitable for research papers, essays, or formal reports using advanced vocabulary.";
      break;
    case "general":
    default:
      toneInstruction =
        "Correct the grammar, fix awkward phrasing, and make it sound natural and like a native English speaker.";
      break;
  }

  const customPart = customInstruction
    ? `Additionally, you MUST strictly follow this custom user requirement: "${customInstruction}"`
    : "";

  return `You are an expert English translator and drafting assistant.
The user has provided this text (which could be in Korean or English):
"${text}"

Your task is to translate this text into English (if it is in Korean) or refine/improve the English (if it is already in English), tailored to the following tone requirements:
${toneInstruction}
${customPart}

Provide 3 different versions of the English text that fit these requirements.
For each version, you must also provide a brief, helpful explanation in Korean describing why this version is appropriate, its nuances, or what changes were made.

Output ONLY a raw JSON array of objects.
Each object must have exactly two keys:
1. "text" : The generated/corrected English text.
2. "explanation" : A short explanation in Korean.

Example Output:
[
  { "text": "Hello, how are you?", "explanation": "가장 기본적이고 널리 쓰이는 정중한 인사말입니다." },
  { "text": "Hope you're doing well.", "explanation": "친근하면서도 비즈니스 이메일 서두에 쓰기 좋은 표현입니다." },
  { "text": "I hope this email finds you well.", "explanation": "격식 있는 비즈니스 서신에서 주로 사용되는 표현입니다." }
]
Only output the JSON array and nothing else. Do not wrap it in markdown block tags like \`\`\`json.`;
}

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
