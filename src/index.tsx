import {
  ActionPanel,
  Action,
  List,
  Clipboard,
  getSelectedText,
  showToast,
  Toast,
  getPreferenceValues,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { Preferences, DraftOption } from "./types";
import { getPrompt, fetchGeminiDrafts, getActiveTones } from "./utils/gemini";
import { DetailDraftForm } from "./components/DetailDraftForm";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (targetText: string, tone: string) => {
    if (!targetText.trim()) return;
    setIsLoading(true);
    showToast({ title: "Asking Gemini...", style: Toast.Style.Animated });
    try {
      const apiKey = preferences.geminiApiKey?.trim();
      if (!apiKey) {
        throw new Error("Gemini API Key가 비어있습니다. 설정에서 입력해 주세요.");
      }
      const promptText = getPrompt(targetText, tone);
      const results = await fetchGeminiDrafts(apiKey, promptText);
      setCorrectedOptions(results);
      setResultsText(targetText);
      setResultsTone(tone);
      showToast({ title: "Corrections ready!", style: Toast.Style.Success });
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

  // 최초 마운트 시 드래그한 텍스트 감지 (클립보드 폴백 버그 방지)
  useEffect(() => {
    async function fetchSelectedText() {
      let originalClipboard = "";
      const marker = `__EMPTY_SELECTION_${Date.now()}__`;
      try {
        // 1. 기존 클립보드 백업
        const cbText = await Clipboard.readText();
        originalClipboard = cbText || "";

        // 2. 클립보드에 임시 마커 주입 (Raycast API 명세에 맞춰 Clipboard.copy 사용)
        await Clipboard.copy(marker);

        // 3. getSelectedText 호출 (Cmd+C 시뮬레이션 트리거)
        const text = await getSelectedText();

        // 4. 결과물이 마커와 같지 않고 존재할 때만 드래그 텍스트로 인정
        if (text && text !== marker && text.trim().length > 0) {
          const trimmed = text.trim();
          setSearchText(trimmed); // 검색창 텍스트 초기값으로 채움
          handleSearch(trimmed, selectedTone);
        }
      } catch {
        // 선택된 텍스트가 없는 경우는 조용히 넘어감
      } finally {
        // 5. 사용자의 원래 클립보드 복구 (Raycast API 명세에 맞춰 Clipboard.copy 사용)
        if (originalClipboard && originalClipboard !== marker) {
          await Clipboard.copy(originalClipboard);
        }
      }
    }
    fetchSelectedText();
  }, []);

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
