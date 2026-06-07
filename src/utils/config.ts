import { getPreferenceValues } from "@raycast/api";
import { Preferences, ToneOption, ConfigSchema } from "../types";
import fs from "fs";
import path from "path";
import os from "os";

export const DEFAULT_TONES: ToneOption[] = [
  {
    id: "general",
    title: "General (기본 교정)",
    instruction:
      "Correct the grammar, fix awkward phrasing, and make it sound natural and like a native English speaker.",
  },
  {
    id: "professional",
    title: "Polite & Professional (비즈니스 이메일)",
    instruction:
      "Write in a professional, polite, and formal tone, suitable for business emails, official correspondence, or corporate communications.",
  },
  {
    id: "casual",
    title: "Casual & Friendly (일상 회화/메신저)",
    instruction:
      "Write in a casual, friendly, and conversational tone, suitable for everyday messaging, social media, or talking to colleagues/friends.",
  },
  {
    id: "concise",
    title: "Concise & Direct (간결하게)",
    instruction:
      "Write in a highly concise, direct, and straight-to-the-point tone. Avoid unnecessary words while keeping it grammatically correct and natural.",
  },
  {
    id: "academic",
    disabled: true,
    title: "Academic (논문/보고서)",
    instruction:
      "Write in an academic, formal, and sophisticated tone, suitable for research papers, essays, or formal reports using advanced vocabulary.",
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
    if (
      tone &&
      typeof tone === "object" &&
      "id" in tone &&
      typeof (tone as { id: unknown }).id === "string"
    ) {
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
