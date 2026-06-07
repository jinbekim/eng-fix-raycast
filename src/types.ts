export interface Preferences {
  geminiApiKey: string;
  configFilePath?: string;
  suggestionCount?: string;
}

export interface DraftOption {
  text: string;
  explanation: string;
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
