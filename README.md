# EngFix 🚀

> Raycast에서 Google Gemini API를 활용하여 문장을 자연스럽고 올바른 영어 표현으로 번역 및 교정해 주는 Raycast Extension입니다.

일반적인 번역기와 달리, 원하는 **톤앤매너(Tone)**에 맞춰 3가지 버전의 추천 문장과 함께 각 문장의 세밀한 **뉘앙스 차이(설명)**를 한국어로 제공합니다.

---

## 주요 기능 ✨

1. **자동 텍스트 감지 (Selected Text):**
   * 익스텐션을 실행하면 현재 화면에서 마우스로 선택(드래그)한 텍스트를 자동으로 감지하여 바로 교정 프로세스를 시작합니다.

2. **다양한 톤앤매너 지원 (Tones):**
   * **General:** 가장 자연스럽고 표준적인 표현
   * **Business & Polite:** 비즈니스 이메일, 격식 있는 자리에 어울리는 정중한 표현
   * **Casual & Friendly:** 친구나 동료와의 메신저 대화에 적합한 친근한 표현
   * **Concise & Direct:** 불필요한 단어를 뺀 직관적이고 간결한 표현
   * **Academic:** 에세이, 논문, 보고서용 학술적인 표현

3. **뉘앙스 설명 제공:**
   * 생성된 3가지 옵션마다 어떤 상황에 적합한지 한국어 설명이 함께 표시됩니다.

4. **단축키 및 연동:**
   * 생성된 문장 중 마음에 드는 표현을 선택해 바로 붙여넣기(`Enter` / Paste) 하거나 클립보드에 복사할 수 있습니다.
   * `Cmd + E`를 눌러 세부 조정을 위한 프롬프트 폼(Form)으로 이동하여 추가 요구사항을 입력할 수 있습니다.

---

## 설치 및 실행 방법 🛠️

### 1. 요구사항
* [Raycast](https://www.raycast.com/)가 설치되어 있어야 합니다.
* Node.js 환경이 필요합니다.

### 2. 로컬 설치 및 실행
저장소를 클론한 뒤, 의존성을 설치하고 개발 모드로 실행합니다.

```bash
# 1. 저장소 클론
git clone git@github.com:jinbekim/eng-fix-raycast.git
cd eng-fix-raycast

# 2. 의존성 패키지 설치
npm install

# 3. Raycast 개발 모드 실행
npm run dev
```
실행 후 Raycast 창이 열리며 `Fix English` (EngFix) 명령어가 자동으로 등록됩니다.

> 💡 **꿀팁: 개발 서버를 항상 켜두어야 하나요?**
> 아닙니다! 최초 실행을 통해 Raycast에 익스텐션이 한 번 등록되고 나면, 터미널에서 `Ctrl + C`로 개발 서버를 종료하더라도 Raycast 내에서 상시 실행 및 사용이 가능합니다. 개발 서버는 코드를 수정하며 실시간 반영(Hot Reload)을 확인하거나 디버깅을 할 때만 켜두시면 됩니다.
> 
> 일상적인 상시 사용을 위해 최적화된 빌드본을 만들고 싶다면 아래 명령어를 실행해 주세요:
> ```bash
> npm run build
> ```

---

## 설정 방법 (Gemini API Key) 🔑

이 익스텐션은 Google Gemini API를 직접 호출합니다. 따라서 개인 API Key 등록이 필요합니다.

1. [Google AI Studio](https://aistudio.google.com/)에서 무료로 Gemini API Key를 발급받습니다.
2. Raycast에서 `Fix English` 명령어를 최초 실행하거나 익스텐션 설정화면으로 이동합니다.
3. 발급받은 API Key를 **Gemini API Key** 설정 항목에 입력합니다.

---

## 기술 스택 💻
* React (Raycast API Component)
* TypeScript
* Google Gemini API (`gemini-flash-latest` model)
* oxlint & oxfmt (Lint & Format)

---

## 라이선스 📄
이 프로젝트는 [MIT License](LICENSE)에 따라 라이선스가 부여됩니다.
