import { getPreferenceValues } from "@raycast/api";
import { DraftOption, Preferences, ToneOption, ConfigSchema } from "../types";
import fs from "fs";
import path from "path";
import os from "os";

export const DEFAULT_TONES: ToneOption[] = [
  {
    id: "general",
    title: "General (기본 교정)",
    instruction: "Correct the grammar, fix awkward phrasing, and make it sound natural and like a native English speaker.",
  },
  {
    id: "professional",
    title: "Polite & Professional (비즈니스 이메일)",
    instruction: "Write in a professional, polite, and formal tone, suitable for business emails, official correspondence, or corporate communications.",
  },
  {
    id: "casual",
    title: "Casual & Friendly (일상 회화/메신저)",
    instruction: "Write in a casual, friendly, and conversational tone, suitable for everyday messaging, social media, or talking to colleagues/friends.",
  },
  {
    id: "concise",
    title: "Concise & Direct (간결하게)",
    instruction: "Write in a highly concise, direct, and straight-to-the-point tone. Avoid unnecessary words while keeping it grammatically correct and natural.",
  },
  {
    id: "academic",
    disabled: true,
    title: "Academic (논문/보고서)",
    instruction: "Write in an academic, formal, and sophisticated tone, suitable for research papers, essays, or formal reports using advanced vocabulary.",
  },
];

function resolveHome(filepath: string): string {
  if (filepath.startsWith("~")) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

export function loadConfigFile(preferences?: Preferences): ConfigSchema | null {
  const prefs = preferences || getPreferenceValues<Preferences>();
  const filepath = prefs.configFilePath?.trim();

  if (!filepath) {
    return null;
  }

  try {
    const resolvedPath = resolveHome(filepath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`Config file does not exist at path: ${resolvedPath}`);
      return null;
    }

    const content = fs.readFileSync(resolvedPath, "utf8");
    const parsed = JSON.parse(content) as ConfigSchema;
    return parsed;
  } catch (error) {
    console.error("Failed to read or parse configuration file:", error);
    return null;
  }
}

export function getActiveTones(preferences?: Preferences): ToneOption[] {
  const config = loadConfigFile(preferences);
  const customTones = config?.customTones;

  if (!customTones || !Array.isArray(customTones)) {
    return DEFAULT_TONES;
  }

  const toneMap = new Map<string, ToneOption>();

  // 1. Populate defaults
  DEFAULT_TONES.forEach((tone) => {
    toneMap.set(tone.id, { ...tone });
  });

  // 2. Override or add custom tones
  customTones.forEach((tone: unknown) => {
    if (tone && typeof tone === "object" && "id" in tone && typeof (tone as { id: unknown }).id === "string") {
      const toneObj = tone as Partial<ToneOption> & { id: string };
      if (toneObj.disabled) {
        toneMap.delete(toneObj.id);
      } else {
        const existing = toneMap.get(toneObj.id) || { id: toneObj.id, title: "", instruction: "" };
        toneMap.set(toneObj.id, {
          ...existing,
          ...toneObj,
        });
      }
    }
  });

  return Array.from(toneMap.values());
}

const DEFAULT_BASE_PROMPT = `You are an expert English translator and drafting assistant.
The user has provided this text (which could be in Korean or English):
"{text}"

Your task is to translate this text into English (if it is in Korean) or refine/improve the English (if it is already in English), tailored to the following tone requirements:
{toneInstruction}
{customInstruction}

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

// 톤 별 Gemini 프롬프트 세부 지침 생성 함수
export function getPrompt(text: string, tone: string, customInstruction?: string): string {
  const prefs = getPreferenceValues<Preferences>();
  const activeTones = getActiveTones(prefs);

  const toneOption = activeTones.find((t) => t.id === tone) || activeTones[0] || DEFAULT_TONES[0];
  const toneInstruction = toneOption.instruction;

  const customPart = customInstruction
    ? `Additionally, you MUST strictly follow this custom user requirement: "${customInstruction}"`
    : "";

  const config = loadConfigFile(prefs);
  const basePrompt = config?.customBasePrompt?.trim() || DEFAULT_BASE_PROMPT;

  return basePrompt
    .replace(/{text}/g, text)
    .replace(/{toneInstruction}/g, toneInstruction)
    .replace(/{customInstruction}/g, customPart);
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
