import { useEffect, useRef } from "react";
import { Clipboard, getSelectedText } from "@raycast/api";

export function useSelectedText(onDetected: (text: string) => void) {
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    async function fetchSelectedText() {
      let originalClipboard = "";
      const marker = `__EMPTY_SELECTION_${Date.now()}__`;
      try {
        // 1. 기존 클립보드 백업
        const cbText = await Clipboard.readText();
        originalClipboard = cbText || "";

        // 2. 클립보드에 임시 마커 주입
        await Clipboard.copy(marker);

        // 3. getSelectedText 호출 (Cmd+C 시뮬레이션 트리거)
        const text = await getSelectedText();

        // 4. 결과물이 마커와 같지 않고 존재할 때만 드래그 텍스트로 인정
        if (text && text !== marker && text.trim().length > 0) {
          onDetectedRef.current(text.trim());
        }
      } catch {
        // 선택된 텍스트가 없는 경우는 조용히 넘어감
      } finally {
        // 5. 사용자의 원래 클립보드 복구
        if (originalClipboard && originalClipboard !== marker) {
          await Clipboard.copy(originalClipboard);
        }
      }
    }
    fetchSelectedText();
  }, []);
}
