import { ActionPanel, Action, List, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import { Preferences, DraftOption } from "./types";
import { getActiveTones } from "./utils/config";
import { DetailDraftForm } from "./components/DetailDraftForm";
import { useSelectedText } from "./hooks/useSelectedText";
import { useGeminiDrafts } from "./hooks/useGeminiDrafts";

// 3. 메인 번역/영작 뷰 (List)
export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const activeTones = getActiveTones(preferences);
  const defaultToneId = activeTones[0]?.id || "general";

  const [searchText, setSearchText] = useState("");
  const [selectedTone, setSelectedTone] = useState(defaultToneId);
  const [correctedOptions, setCorrectedOptions] = useState<DraftOption[]>([]);
  const [resultsText, setResultsText] = useState("");
  const [resultsTone, setResultsTone] = useState(defaultToneId);

  const { isLoading, generateDrafts } = useGeminiDrafts();

  const handleSearch = async (targetText: string, tone: string) => {
    const results = await generateDrafts(preferences.geminiApiKey, targetText, tone);
    if (results) {
      setCorrectedOptions(results);
      setResultsText(targetText);
      setResultsTone(tone);
    }
  };

  // 최초 마운트 시 드래그한 텍스트 감지 (클립보드 폴백 버그 방지)
  useSelectedText((text) => {
    setSearchText(text);
    handleSearch(text, selectedTone);
  });

  const showTriggerItem =
    searchText.trim().length > 0 &&
    (searchText.trim() !== resultsText || selectedTone !== resultsTone);

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="번역/영작할 문장을 입력하거나 검색..."
      isShowingDetail={correctedOptions.length > 0 && !showTriggerItem}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Tone"
          storeValue={true}
          onChange={(newValue) => setSelectedTone(newValue)}
        >
          {activeTones.map((t) => (
            <List.Dropdown.Item key={t.id} title={t.title} value={t.id} />
          ))}
        </List.Dropdown>
      }
    >
      {!searchText.trim() ? (
        <List.EmptyView
          title="문장을 입력하거나 텍스트를 선택하세요"
          description="구글번역기처럼 텍스트를 입력하고 Enter를 누르거나, 마우스로 문장을 드래그 선택해 보세요."
          actions={
            <ActionPanel>
              <Action.Push
                title="Customize with Prompt (Form)"
                target={
                  <DetailDraftForm
                    defaultText=""
                    defaultTone={selectedTone}
                    geminiApiKey={preferences.geminiApiKey}
                  />
                }
              />
            </ActionPanel>
          }
        />
      ) : showTriggerItem ? (
        <List.Item
          icon="✨"
          title={`"${searchText.trim()}" 번역/영작 생성하기`}
          subtitle="Enter 키를 누르면 AI 영작이 시작됩니다."
          actions={
            <ActionPanel>
              <Action
                title="AI 영작 실행"
                onAction={() => handleSearch(searchText, selectedTone)}
              />
            </ActionPanel>
          }
        />
      ) : (
        <List.Section title={`입력 문장: ${resultsText}`}>
          {correctedOptions.map((opt, idx) => (
            <List.Item
              key={idx}
              title={opt.text}
              detail={
                <List.Item.Detail
                  markdown={`### 💡 영작 제안 ${idx + 1}\n\n${opt.text}\n\n---\n\n### 📝 설명 (뉘앙스)\n${opt.explanation}`}
                />
              }
              actions={
                <ActionPanel>
                  <Action.Paste title="Paste Correction" content={opt.text} />
                  <Action.CopyToClipboard title="Copy to Clipboard" content={opt.text} />
                  <Action.Push
                    title="Customize with Prompt (Form)"
                    target={
                      <DetailDraftForm
                        defaultText={resultsText}
                        defaultTone={selectedTone}
                        geminiApiKey={preferences.geminiApiKey}
                      />
                    }
                    shortcut={{ modifiers: ["cmd"], key: "e" }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
