import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, currentState, attachmentBase64, attachmentType, attachmentName } =
      await req.json()

    const readingSpeed: number = currentState?.readingSpeed || 280

    // ── 섹션별 목표 글자수를 미리 계산해서 프롬프트에 명시 ──────────
    const sectionsWithChars = (currentState?.sections || []).map(
      (s: { name: string; targetDuration: number; script: string }, i: number) => {
        const targetChars = Math.round((s.targetDuration / 60) * readingSpeed)
        const minChars    = Math.round(targetChars * 0.9)
        const maxChars    = Math.round(targetChars * 1.1)
        return {
          index: i + 1,
          name: s.name || `섹션${i + 1}`,
          targetDuration: s.targetDuration,
          durationStr: `${Math.floor(s.targetDuration / 60)}분${s.targetDuration % 60 > 0 ? s.targetDuration % 60 + "초" : ""}`,
          scriptLength: s.script ? s.script.replace(/\s/g, "").length : 0,
          targetChars,
          minChars,
          maxChars,
        }
      }
    )

    // ── 섹션별 글자수 규칙 블록 ──────────────────────────────────────
    const sectionCharRules = sectionsWithChars.length > 0
      ? `
## 섹션별 필수 글자수 (이 수치를 절대 어기면 안 됨)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sectionsWithChars.map(s =>
  `  섹션${s.index} "${s.name}" (${s.durationStr})\n` +
  `    → 목표: ${s.targetChars}자 | 허용범위: ${s.minChars}자 ~ ${s.maxChars}자\n` +
  `    → 현재 작성: ${s.scriptLength}자`
).join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
글자수 계산 기준: 낭독속도 ${readingSpeed}자/분 × 목표시간(분) = 목표글자수
공백 제외 기준으로 계산합니다.`
      : ""

    // ── 현재 상태 컨텍스트 ────────────────────────────────────────────
    const stateContext = currentState
      ? `
## 현재 프로젝트 상태
- 프로젝트명: ${currentState.projectName || "(없음)"}
- 콘텐츠 유형: ${currentState.contentType || "강의 영상 스크립트"}
- 러닝타임: ${currentState.totalMinutes}분
- 섹션 수: ${currentState.sectionCount}개
- 말투: ${currentState.toneStyle}
- 낭독속도: ${readingSpeed}자/분
${sectionCharRules}`
      : ""

    // ── 첨부파일 처리 ─────────────────────────────────────────────────
    let attachmentContext = ""
    const apiMessages: Array<{
      role: string
      content: string | Array<{ type: string; [key: string]: unknown }>
    }> = []

    if (attachmentBase64 && attachmentType) {
      attachmentContext = `\n[첨부파일: ${attachmentName || "파일"}]\n위 첨부파일의 내용을 분석하여 원고 작성에 활용하세요.\n`
      const userMessage = messages[messages.length - 1]?.content || ""
      const contentParts: Array<{ type: string; [key: string]: unknown }> = []

      if (attachmentType.startsWith("image/")) {
        contentParts.push({
          type: "image",
          source: { type: "base64", media_type: attachmentType, data: attachmentBase64 },
        })
      } else if (attachmentType === "application/pdf") {
        contentParts.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: attachmentBase64 },
        })
      }
      contentParts.push({ type: "text", text: userMessage })

      for (let i = 0; i < messages.length - 1; i++) {
        apiMessages.push({ role: messages[i].role, content: messages[i].content })
      }
      apiMessages.push({ role: "user", content: contentParts })
    } else {
      for (const msg of messages) {
        apiMessages.push({ role: msg.role, content: msg.content })
      }
    }

    // ── 시스템 프롬프트 ───────────────────────────────────────────────
    const systemPrompt = `당신은 영상 콘텐츠 원고 작성을 도와주는 AI 어시스턴트입니다.
사용자의 요청을 분석하여 적절한 액션을 JSON으로 반환합니다.
${stateContext}
${attachmentContext}

## ★ 글자수 절대 규칙 (가장 중요 — 원고 작성 시 반드시 준수)

원고를 작성할 때 각 섹션의 글자수는 위 "섹션별 필수 글자수" 범위를 반드시 지켜야 합니다.

글자수가 부족할 경우 다음 방법으로 반드시 보완하세요:
  1) 핵심 개념을 더 상세하게 풀어서 설명
  2) 구체적인 예시나 실제 사례를 추가
  3) "왜 중요한가"에 대한 이유와 배경 보완
  4) 학습자에게 질문을 던지거나 생각해볼 포인트 추가
  5) 내용과 관련된 추가 정보나 심화 내용 포함

원고 완성 후 반드시 각 섹션의 글자수(공백 제외)를 직접 세어보고,
minChars 미만이면 즉시 내용을 추가해서 범위 안에 들어오도록 하세요.
절대로 짧게 요약하거나 간략하게 작성하지 마세요.

## 응답 규칙

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 코드블록 없이 순수 JSON):

{
  "message": "사용자에게 보여줄 자연어 답변 (친근하고 간결하게)",
  "action": "none | update_settings | generate_all | generate_section | update_sections",
  "data": { ... }
}

## action 유형

### none
일반 대화, 질문 답변, 정보 제공 시 사용.
data: {}

### update_settings
프로젝트 설정(러닝타임, 섹션수, 콘텐츠유형, 말투 등) 변경 요청 시.
data: {
  "projectName": "string (선택)",
  "totalMinutes": number (선택),
  "sectionCount": number (선택),
  "contentType": "string (선택)",
  "toneStyle": "friendly|formal|energetic|calm (선택)",
  "readingSpeed": 220|280|340 (선택),
  "sections": [{ "name": "섹션명", "targetDuration": 초 }] (선택)
}

### generate_all
전체 섹션 원고를 일괄 생성할 때.

★ 각 섹션의 script 글자수(공백 제외)는 반드시 해당 섹션의 minChars ~ maxChars 범위여야 합니다.
★ script를 작성할 때마다 글자수를 계산해서 부족하면 즉시 내용을 추가하세요.

data: {
  "projectName": "string (선택)",
  "totalMinutes": number (선택),
  "contentType": "string (선택)",
  "toneStyle": "string (선택)",
  "sections": [
    {
      "name": "섹션명",
      "targetDuration": 초단위 숫자,
      "script": "완성된 나레이션 원고 — 반드시 해당 섹션 minChars 이상 maxChars 이하"
    }
  ]
}

섹션별 목표 글자수 재확인:
${sectionsWithChars.map(s =>
  `  섹션${s.index}: targetDuration=${s.targetDuration}초 → targetChars=${s.targetChars}자 → minChars=${s.minChars}자 ~ maxChars=${s.maxChars}자`
).join("\n") || "  (섹션 정보 없음 — 러닝타임과 섹션수 기준으로 균등 배분)"}

### generate_section
특정 섹션 하나만 원고 생성/수정.
해당 섹션의 목표 글자수 범위를 반드시 준수하세요.
data: {
  "sectionIndex": number,
  "script": "완성된 나레이션 원고 — 반드시 목표 글자수 90~110% 준수"
}

### update_sections
섹션명, 시간 배분 등 구성만 변경 (원고 유지).
data: {
  "sections": [{ "name": "섹션명", "targetDuration": 초 }]
}

## 원고 작성 공통 지침
- 원고는 강사가 카메라 앞에서 말하듯 자연스러운 구어체로 작성
- 이미지/PDF 첨부 시 해당 내용을 충분히 분석하여 원고에 반영
- 러닝타임을 명시하지 않으면 현재 설정(${currentState?.totalMinutes || 3}분) 유지
- 섹션 수를 명시하지 않으면 현재 설정(${currentState?.sectionCount || 3}개) 유지
- 섹션 간 전환이 자연스럽게 이어지도록 작성`

    // ── API 호출 ──────────────────────────────────────────────────────
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000, // ← 8000 → 16000: 섹션이 많거나 글자수가 많을 때 잘림 방지
        system: systemPrompt,
        messages: apiMessages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Anthropic API Error:", data)
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 })
    }

    const rawText =
      data.content?.[0]?.type === "text" ? data.content[0].text : "{}"

    // ── JSON 파싱 ─────────────────────────────────────────────────────
    let parsed: { message: string; action: string; data: Record<string, unknown> }
    try {
      const clean = rawText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      parsed = JSON.parse(clean)
    } catch {
      parsed = { message: rawText, action: "none", data: {} }
    }

    // ── 글자수 후처리 검증 로그 (개발 확인용) ────────────────────────
    if (parsed.action === "generate_all" && Array.isArray(parsed.data?.sections)) {
      const sections = parsed.data.sections as Array<{ name: string; targetDuration: number; script: string }>
      sections.forEach((s, i) => {
        const charCount = (s.script || "").replace(/\s/g, "").length
        const ref = sectionsWithChars[i]
        if (ref) {
          const status = charCount < ref.minChars ? "⚠️ 부족" : charCount > ref.maxChars ? "⚠️ 초과" : "✅ 적정"
          console.log(`[글자수 검증] 섹션${i+1} "${s.name}": ${charCount}자 / 목표 ${ref.targetChars}자 (${ref.minChars}~${ref.maxChars}) ${status}`)
        }
      })
    }

    return NextResponse.json(parsed)

  } catch (error) {
    console.error("Route Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
