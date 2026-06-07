export interface Preferences {
  geminiApiKey: string;
  configFilePath?: string;
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
  customBasePrompt?: string;
  customTones?: ToneOption[];
}
