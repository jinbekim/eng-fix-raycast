/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Gemini API Key - Your Google Gemini API Key */
  "geminiApiKey": string,
  /** JSON Configuration File - Select a custom JSON configuration file (e.g., config.json) for custom tones. */
  "configFilePath"?: string,
  /** Number of Suggestions - How many English versions Gemini should suggest */
  "suggestionCount": "1" | "2" | "3" | "4" | "5"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
}

