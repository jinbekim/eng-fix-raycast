import { getPreferenceValues } from "@raycast/api";
import { Preferences } from "../types";
import { getActiveTones, DEFAULT_TONES } from "./config";

const DEFAULT_BASE_PROMPT = `You are an expert English translator and drafting assistant.
The user has provided this text (which could be in Korean or English):
"{text}"

Your task is to translate this text into English (if it is in Korean) or refine/improve the English (if it is already in English), tailored to the following tone requirements:
{toneInstruction}
{customInstruction}

Provide {suggestionCount} different versions of the English text that fit these requirements.
For each version, you must also provide a brief, helpful explanation in Korean describing why this version is appropriate, its nuances, or what changes were made (1-2 sentences).

Output ONLY a raw JSON array of objects.
Each object must have exactly two keys:
1. "text" : The generated/corrected English text.
2. "explanation" : A short explanation in Korean focusing on the nuance and context.

Example Output:
[
  { "text": "Hello, how are you?", "explanation": "가장 기본적이고 널리 쓰이는 정중한 인사말입니다." },
  { "text": "I hope this email finds you well.", "explanation": "격식 있는 비즈니스 서신에서 주로 사용되는 표현입니다." }
]
Only output the JSON array and nothing else. Do not wrap it in markdown block tags like \`\`\`json.`;

const VOCABULARY_BASE_PROMPT = `You are an expert English teacher.
The user's original text (Korean/English):
"{originalText}"

The proposed English correction/translation is:
"{correctedText}"

Provide a structured markdown bulleted list of key vocabulary, expressions, phrases, idioms, or grammatical structures used in the proposed English text along with their Korean meanings and usage notes.
Format your response as a clean markdown list (e.g. "- word/phrase: explanation").
Only output the markdown list directly. Do not wrap it in JSON, code blocks, or markdown code block tags. Just output the explanation text.`;

export function getPrompt(text: string, tone: string, customInstruction?: string): string {
  const prefs = getPreferenceValues<Preferences>();
  const activeTones = getActiveTones(prefs);

  const toneOption = activeTones.find((t) => t.id === tone) || activeTones[0] || DEFAULT_TONES[0];
  const toneInstruction = toneOption.instruction;

  const customPart = customInstruction
    ? `Additionally, you MUST strictly follow this custom user requirement: "${customInstruction}"`
    : "";

  const count = prefs.suggestionCount || "3";

  return DEFAULT_BASE_PROMPT.replace(/{text}/g, text)
    .replace(/{toneInstruction}/g, toneInstruction)
    .replace(/{customInstruction}/g, customPart)
    .replace(/{suggestionCount}/g, count);
}

export function getVocabularyPrompt(originalText: string, correctedText: string): string {
  return VOCABULARY_BASE_PROMPT.replace(/{originalText}/g, originalText).replace(
    /{correctedText}/g,
    correctedText,
  );
}
