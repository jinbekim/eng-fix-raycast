// @ts-nocheck
import { ActionPanel, Action, List, Form, getSelectedText, showToast, Toast, getPreferenceValues, useNavigation } from "@raycast/api";
import { useState, useEffect, useRef } from "react";

interface Preferences {
  geminiApiKey: string;
}

interface DraftOption {
  text: string;
  explanation: string;
}

// 톤 별 Gemini 프롬프트 세부 지침 생성 함수
function getPrompt(text: string, tone: string, customInstruction?: string) {
  let toneInstruction = "";
  switch (tone) {
    case "professional":
      toneInstruction = "Write in a professional, polite, and formal tone, suitable for business emails, official correspondence, or corporate communications.";
      break;
    case "casual":
      toneInstruction = "Write in a casual, friendly, and conversational tone, suitable for everyday messaging, social media, or talking to colleagues/friends.";
      break;
    case "concise":
      toneInstruction = "Write in a highly concise, direct, and straight-to-the-point tone. Avoid unnecessary words while keeping it grammatically correct and natural.";
      break;
    case "academic":
      toneInstruction = "Write in an academic, formal, and sophisticated tone, suitable for research papers, essays, or formal reports using advanced vocabulary.";
      break;
    case "general":
    default:
      toneInstruction = "Correct the grammar, fix awkward phrasing, and make it sound natural and like a native English speaker.";
      break;
  }

  const customPart = customInstruction ? `Additionally, you MUST strictly follow this custom user requirement: "${customInstruction}"` : "";

  return `You are an expert English translator and drafting assistant.
The user has provided this text (which could be in Korean or English):
"${text}"

Your task is to translate this text into English (if it is in Korean) or refine/improve the English (if it is already in English), tailored to the following tone requirements:
${toneInstruction}
${customPart}

Provide 3 different versions of the English text that fit these requirements.
For each version, you must also provide a brief, helpful explanation in Korean describing why this version is appropriate, its nuances, or what changes were made.

Output ONLY a raw JSON array of objects.
Each object must have exactly two keys:
1. "text" : The generated/corrected English text.
2. "explanation" : A short explanation in Korean.

Example Output:
[
  { "text": "Hello, how are you?", "explanation": "가장 기본적이고 널리 쓰이는 정중한 인사말입니다." },
  { "text": "Hope you're doing well.", "explanation": "친근하면서도 비즈니스 이메일 서두에 쓰기 좋은 표현입니다." },
  { "text": "I hope this email finds you well.", "explanation": "격식 있는 비즈니스 서신에서 주로 사용되는 표현입니다." }
]
Only output the JSON array and nothing else. Do not wrap it in markdown block tags like \`\`\`json.`;
}

// Gemini API 호출 공통 함수
async function fetchGeminiDrafts(apiKey: string, prompt: string): Promise<DraftOption[]> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 }
    })
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    throw new Error(data?.error?.message || "Unknown API Error");
  }

  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  let jsonStr = responseText.trim();
  
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "");
  }
  jsonStr = jsonStr.trim();
  
  const parsed = JSON.parse(jsonStr);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  throw new Error("Invalid response format from Gemini");
}

// 1. 결과 리스트 컴포넌트 (상세 영작 폼에서 사용)
function DraftResultList(props: { options: DraftOption[] }) {
  return (
    <List navigationTitle="AI 영작 결과">
      <List.Section title="AI 제안 영작문">
        {props.options.map((opt, idx) => (
          <List.Item
            key={idx}
            title={opt.text}
            subtitle={opt.explanation}
            actions={
              <ActionPanel>
                <Action.Paste title="Paste Correction" content={opt.text} />
                <Action.CopyToClipboard title="Copy to Clipboard" content={opt.text} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

// 2. 상세 커스텀 영작 폼 컴포넌트 (Form)
function DetailDraftForm(props: { defaultText: string; defaultTone: string; geminiApiKey: string }) {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState(props.defaultText);
  const [tone, setTone] = useState(props.defaultTone);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) {
      showToast({ title: "Text is empty", message: "Please type some text first.", style: Toast.Style.Failure });
      return;
    }
    const apiKey = props.geminiApiKey?.trim();
    if (!apiKey) {
      showToast({ title: "API Key Error", message: "Gemini API Key가 비어있습니다. 설정에서 입력해 주세요.", style: Toast.Style.Failure });
      return;
    }
    setIsLoading(true);
    showToast({ title: "Asking Gemini...", style: Toast.Style.Animated });
    try {
      const promptText = getPrompt(text, tone, customPrompt);
      const results = await fetchGeminiDrafts(apiKey, promptText);
      showToast({ title: "Drafts generated!", style: Toast.Style.Success });
      push(<DraftResultList options={results} />);
    } catch (e: any) {
      console.error(e);
      showToast({ title: "Error", message: e.message, style: Toast.Style.Failure });
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

// 3. 메인 번역/영작 뷰 (List)
export default function Command() {
  const [originalText, setOriginalText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [selectedTone, setSelectedTone] = useState("general");
  const [correctedOptions, setCorrectedOptions] = useState<DraftOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const preferences = getPreferenceValues<Preferences>();

  // 중복 API 호출 방지를 위한 ref
  const lastCallRef = useRef({ text: "", tone: "" });

  // 최초 마운트 시 드래그한 텍스트 감지
  useEffect(() => {
    async function fetchSelectedText() {
      try {
        const text = await getSelectedText();
        if (text && text.trim().length > 0) {
          setOriginalText(text.trim());
        }
      } catch (e) {
        // 선택된 텍스트가 없는 경우는 조용히 넘어감
      }
    }
    fetchSelectedText();
  }, []);

  // 검색어 입력 디바운스 처리 (800ms로 증가하여 타이핑 중 빈번한 호출 제어)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchText(searchText.trim());
    }, 800);

    return () => {
      clearTimeout(handler);
    };
  }, [searchText]);

  // 대상 텍스트 또는 톤이 바뀌면 API 자동 호출
  useEffect(() => {
    // 사용자가 검색창에 타이핑하는 중에는 API 호출을 유보함
    if (searchText.trim() !== debouncedSearchText) {
      return;
    }

    const targetText = debouncedSearchText || originalText;

    if (!targetText) {
      setCorrectedOptions([]);
      return;
    }

    // 이미 같은 텍스트와 톤으로 호출된 상태라면 불필요한 API 요청 생략
    if (lastCallRef.current.text === targetText && lastCallRef.current.tone === selectedTone) {
      return;
    }

    const loadDrafts = async () => {
      setIsLoading(true);
      showToast({ title: "Asking Gemini...", style: Toast.Style.Animated });
      try {
        const apiKey = preferences.geminiApiKey?.trim();
        if (!apiKey) {
          throw new Error("Gemini API Key가 비어있습니다. 설정에서 입력해 주세요.");
        }
        const promptText = getPrompt(targetText, selectedTone);
        const results = await fetchGeminiDrafts(apiKey, promptText);
        setCorrectedOptions(results);
        
        // 성공적으로 가져오면 마지막 호출 기록 갱신
        lastCallRef.current = { text: targetText, tone: selectedTone };
        
        showToast({ title: "Corrections ready!", style: Toast.Style.Success });
      } catch (e: any) {
        console.error(e);
        showToast({ title: "Error", message: e.message, style: Toast.Style.Failure });
      } finally {
        setIsLoading(false);
      }
    };

    loadDrafts();
  }, [debouncedSearchText, originalText, selectedTone]);

  const targetText = debouncedSearchText || originalText;

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="번역/영작할 문장을 입력하거나 검색..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Select Tone"
          storeValue={true}
          onChange={(newValue) => setSelectedTone(newValue)}
        >
          <List.Dropdown.Item title="General" value="general" />
          <List.Dropdown.Item title="Business & Polite" value="professional" />
          <List.Dropdown.Item title="Casual & Friendly" value="casual" />
          <List.Dropdown.Item title="Concise & Direct" value="concise" />
          <List.Dropdown.Item title="Academic" value="academic" />
        </List.Dropdown>
      }
    >
      {targetText ? (
        <List.Section title={`입력 문장: ${targetText}`}>
          {correctedOptions.map((opt, idx) => (
            <List.Item
              key={idx}
              title={opt.text}
              subtitle={opt.explanation}
              actions={
                <ActionPanel>
                  <Action.Paste title="Paste Correction" content={opt.text} />
                  <Action.CopyToClipboard title="Copy to Clipboard" content={opt.text} />
                  <Action.Push
                    title="Customize with Prompt (Form)"
                    target={<DetailDraftForm defaultText={targetText} defaultTone={selectedTone} geminiApiKey={preferences.geminiApiKey} />}
                    shortcut={{ modifiers: ["cmd"], key: "e" }}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : (
        <List.EmptyView
          title="문장을 입력하거나 텍스트를 선택하세요"
          description="구글번역기처럼 텍스트를 입력하거나, 마우스로 문장을 드래그 선택한 후 단축키를 눌러보세요."
          actions={
            <ActionPanel>
              <Action.Push
                title="Customize with Prompt (Form)"
                target={<DetailDraftForm defaultText="" defaultTone={selectedTone} geminiApiKey={preferences.geminiApiKey} />}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}

