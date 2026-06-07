import { ActionPanel, Action, List } from "@raycast/api";
import { DraftOption } from "../types";

export function DraftResultList(props: { options: DraftOption[] }) {
  return (
    <List navigationTitle="AI 영작 결과" isShowingDetail={props.options.length > 0}>
      <List.Section title="AI 제안 영작문">
        {props.options.map((opt, idx) => (
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
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
