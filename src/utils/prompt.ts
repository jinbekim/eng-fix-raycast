import { getPreferenceValues } from "@raycast/api";
import { Preferences } from "../types";
import { getActiveTones, loadConfigFile, DEFAULT_TONES } from "./config";

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
