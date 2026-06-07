import { useState } from "react";
import { showToast, Toast } from "@raycast/api";
import { DraftOption } from "../types";
import { getPrompt, getVocabularyPrompt } from "../utils/prompt";
import { fetchGeminiDrafts, fetchGeminiVocabulary } from "../utils/api";

export function useGeminiDrafts() {
  const [isLoading, setIsLoading] = useState(false);

  const generateDrafts = async (
    apiKey: string | undefined,
    text: string,
    tone: string,
    customInstruction?: string,
  ): Promise<DraftOption[] | null> => {
    if (!text.trim()) return null;
    const key = apiKey?.trim();
    if (!key) {
      showToast({
        title: "API Key Error",
        message: "Gemini API Key가 비어있습니다. 설정에서 입력해 주세요.",
        style: Toast.Style.Failure,
      });
      return null;
    }

    setIsLoading(true);
    showToast({ title: "Asking Gemini...", style: Toast.Style.Animated });
    try {
      const promptText = getPrompt(text, tone, customInstruction);
      const results = await fetchGeminiDrafts(key, promptText);
      showToast({ title: "Corrections ready!", style: Toast.Style.Success });
      return results;
    } catch (error) {
      const e = error as Error;
      console.error(e);
      showToast({
        title: "Error",
        message: e.message,
        style: Toast.Style.Failure,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateVocabulary = async (
    apiKey: string | undefined,
    originalText: string,
    correctedText: string,
  ): Promise<string | null> => {
    const key = apiKey?.trim();
    if (!key) return null;

    try {
      const promptText = getVocabularyPrompt(originalText, correctedText);
      const vocabulary = await fetchGeminiVocabulary(key, promptText);
      return vocabulary;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return { isLoading, generateDrafts, generateVocabulary };
}
