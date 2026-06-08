export interface Preferences {
  geminiApiKey: string;
  configFilePath?: string;
  suggestionCount?: string;
  defaultExplanationStyle?: "simple" | "verbose";
}

export interface DraftOption {
  text: string;
  translation: string;
  vocabulary?: string;
  isLoadingVocabulary?: boolean;
  vocabularyError?: string;
}

export interface ToneOption {
  id: string;
  title: string;
  instruction: string;
  disabled?: boolean;
}

export interface ConfigSchema {
  customTones?: ToneOption[];
}
