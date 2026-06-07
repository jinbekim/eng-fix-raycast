import { ActionPanel, Action, Form, showToast, Toast, useNavigation, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { getPrompt, fetchGeminiDrafts, getActiveTones } from "../utils/gemini";
import { DraftResultList } from "./DraftResultList";
import { Preferences } from "../types";

export function DetailDraftForm(props: {
  defaultText: string;
  defaultTone: string;
  geminiApiKey: string;
}) {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const preferences = getPreferenceValues<Preferences>();
  const activeTones = getActiveTones(preferences);
  const defaultToneId = activeTones.find((t) => t.id === props.defaultTone)
    ? props.defaultTone
    : (activeTones[0]?.id || "general");

  const [text, setText] = useState(props.defaultText);
  const [tone, setTone] = useState(defaultToneId);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) {
      showToast({
        title: "Text is empty",
        message: "Please type some text first.",
        style: Toast.Style.Failure,
      });
      return;
    }
    const apiKey = props.geminiApiKey?.trim();
    if (!apiKey) {
      showToast({
        title: "API Key Error",
        message: "Gemini API Key가 비어있습니다. 설정에서 입력해 주세요.",
        style: Toast.Style.Failure,
      });
      return;
    }
    setIsLoading(true);
    showToast({ title: "Asking Gemini...", style: Toast.Style.Animated });
    try {
      const promptText = getPrompt(text, tone, customPrompt);
      const results = await fetchGeminiDrafts(apiKey, promptText);
      showToast({ title: "Drafts generated!", style: Toast.Style.Success });
      push(<DraftResultList options={results} />);
    } catch (error) {
      const e = error as Error;
      console.error(e);
      showToast({
        title: "Error",
        message: e.message,
        style: Toast.Style.Failure,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Generate English" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="text"
        title="Source Text"
        placeholder="영작하고 싶거나 수정하고 싶은 문장을 입력하세요 (한글/영어 모두 가능)..."
        value={text}
        onChange={setText}
      />
      <Form.Dropdown id="tone" title="Tone Style" value={tone} onChange={setTone}>
        {activeTones.map((t) => (
          <Form.Dropdown.Item key={t.id} title={t.title} value={t.id} />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="customPrompt"
        title="Custom Instruction (AI 프롬프트)"
        placeholder="예: 질문 형식으로 바꿔줘, 격식의 끝판왕으로 해줘, 문법 오류 짚어줘 등..."
        value={customPrompt}
        onChange={setCustomPrompt}
      />
    </Form>
  );
}
