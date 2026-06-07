import { ActionPanel, Action, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { getPrompt, fetchGeminiDrafts } from "../utils/gemini";
import { DraftResultList } from "./DraftResultList";

export function DetailDraftForm(props: {
  defaultText: string;
  defaultTone: string;
  geminiApiKey: string;
}) {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState(props.defaultText);
  const [tone, setTone] = useState(props.defaultTone);
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
        <Form.Dropdown.Item title="General (기본 교정)" value="general" />
        <Form.Dropdown.Item title="Polite & Professional (비즈니스 이메일)" value="professional" />
        <Form.Dropdown.Item title="Casual & Friendly (일상 회화/메신저)" value="casual" />
        <Form.Dropdown.Item title="Concise & Direct (간결하게)" value="concise" />
        <Form.Dropdown.Item title="Academic (논문/보고서)" value="academic" />
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
