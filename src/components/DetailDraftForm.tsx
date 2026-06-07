import {
  ActionPanel,
  Action,
  Form,
  showToast,
  Toast,
  useNavigation,
  getPreferenceValues,
} from "@raycast/api";
import { useState } from "react";
import { getActiveTones } from "../utils/config";
import { DraftResultList } from "./DraftResultList";
import { Preferences } from "../types";
import { useGeminiDrafts } from "../hooks/useGeminiDrafts";

export function DetailDraftForm(props: {
  defaultText: string;
  defaultTone: string;
  geminiApiKey: string;
}) {
  const { push } = useNavigation();
  const preferences = getPreferenceValues<Preferences>();
  const activeTones = getActiveTones(preferences);
  const defaultToneId = activeTones.find((t) => t.id === props.defaultTone)
    ? props.defaultTone
    : activeTones[0]?.id || "general";

  const [text, setText] = useState(props.defaultText);
  const [tone, setTone] = useState(defaultToneId);
  const [customPrompt, setCustomPrompt] = useState("");

  const { isLoading, generateDrafts } = useGeminiDrafts();

  const handleSubmit = async () => {
    if (!text.trim()) {
      showToast({
        title: "Text is empty",
        message: "Please type some text first.",
        style: Toast.Style.Failure,
      });
      return;
    }
    const results = await generateDrafts(props.geminiApiKey, text, tone, customPrompt);
    if (results) {
      push(<DraftResultList options={results} originalText={text} />);
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
