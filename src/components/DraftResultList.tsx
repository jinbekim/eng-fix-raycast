import { ActionPanel, Action, List, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { DraftOption, Preferences } from "../types";
import { useGeminiDrafts } from "../hooks/useGeminiDrafts";

export function DraftResultList(props: { options: DraftOption[]; originalText: string }) {
  const preferences = getPreferenceValues<Preferences>();
  const [options, setOptions] = useState<DraftOption[]>(props.options);
  const { generateVocabulary } = useGeminiDrafts();

  const loadVocabulary = async (index: number) => {
    const draft = options[index];
    if (!draft || draft.isLoadingVocabulary) return;

    setOptions((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        isLoadingVocabulary: true,
        vocabularyError: undefined,
      };
      return next;
    });

    try {
      const vocabulary = await generateVocabulary(
        preferences.geminiApiKey,
        props.originalText,
        draft.text,
      );
      setOptions((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          vocabulary: vocabulary || undefined,
          isLoadingVocabulary: false,
        };
        return next;
      });
    } catch (err) {
      console.error(err);
      setOptions((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          isLoadingVocabulary: false,
          vocabularyError: "어휘 분석을 가져오는 중 오류가 발생했습니다.",
        };
        return next;
      });
    }
  };

  const getDetailMarkdown = (opt: DraftOption, idx: number) => {
    const nuanceSection = `### 📝 자연스러운 한글 해석\n${opt.translation || "해석이 없습니다."}`;

    let vocabSection = "";
    if (opt.isLoadingVocabulary) {
      vocabSection =
        "\n\n---\n\n### 🔤 주요 표현 및 단어 분석\n⏳ 어휘 분석을 생성하고 있습니다...";
    } else if (opt.vocabularyError) {
      vocabSection = `\n\n---\n\n### 🔤 주요 표현 및 단어 분석\n❌ ${opt.vocabularyError}`;
    } else if (opt.vocabulary) {
      vocabSection = `\n\n---\n\n### 🔤 주요 표현 및 단어 분석\n${opt.vocabulary}`;
    } else {
      vocabSection = `\n\n---\n\n💡 단축키 **Cmd + T** 또는 우측 액션 메뉴에서 **"어휘 분석 로드"**를 누르시면 주요 표현 및 어휘 해설을 추가로 볼 수 있습니다.`;
    }

    return `### 💡 영작 제안 ${idx + 1}\n\n${opt.text}\n\n---\n\n${nuanceSection}${vocabSection}`;
  };

  return (
    <List navigationTitle="AI 영작 결과" isShowingDetail={options.length > 0}>
      <List.Section title="AI 제안 영작문">
        {options.map((opt, idx) => (
          <List.Item
            key={idx}
            title={opt.text}
            detail={<List.Item.Detail markdown={getDetailMarkdown(opt, idx)} />}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action.Paste title="Paste Correction" content={opt.text} />
                  <Action.CopyToClipboard title="Copy to Clipboard" content={opt.text} />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  {!opt.vocabulary && (
                    <Action
                      title="어휘 분석 로드 (Load Vocabulary)"
                      onAction={() => loadVocabulary(idx)}
                      shortcut={{ modifiers: ["cmd"], key: "t" }}
                      icon="📝"
                    />
                  )}
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
