import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages, currentState, attachmentBase64, attachmentType, attachmentName } =
      await req.json()

    // 현재 프로젝트 상태를 컨텍스트로 포함
    const stateContext = currentState
      ? `
[현재 프로젝트 상태]
- 프로젝트명: ${currentState.projectName || "(없음)"}
- 콘텐츠 유형: ${currentState.contentType || "강의 영상 스크립트"}
- 러닝타임: ${currentState.totalMinutes}분
- 섹션 수: ${currentState.sectionCount}개
- 말투: ${currentState.toneStyle}
- 낭독속도: ${currentState.readingSpeed}자/분
- 섹션 목록:
${currentState.sections?.map((s: { name: string; targetDuration: number; script: string }, i: number) =>
  `  #${i+1} ${s.name || "(이름없음)"} (목표: ${Math.floor(s.targetDuration/60)}분${s.targetDuration%60}초, 원고: ${s.script ? s.script.length+"자" : "미작성"})`
).join("\n") || "  (섹션 없음)"}
`
      : ""

    // 첨부파일 처리
    let attachmentContext = ""
    const apiMessages: Array<{role: string; content: string | Array<{type: string; [key: string]: unknown}>}> = []

    if (attachmentBase64 && attachmentType) {
      attachmentContext = `\n[첨부파일: ${attachmentName || "파일"}]\n위 첨부파일의 내용을 분석하여 원고 작성에 활용하세요.\n`

      // 첨부파일이 있는 경우 멀티모달 메시지 구성
      const userMessage = messages[messages.length - 1]?.content || ""

      const contentParts: Array<{type: string; [key: string]: unknown}> = []

      if (attachmentType.startsWith("image/")) {
        contentParts.push({
          type: "image",
          source: {
            type: "base64",
            media_type: attachmentType,
            data: attachmentBase64,
          }
        })
      } else if (attachmentType === "application/pdf") {
        contentParts.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: attachmentBase64,
          }
        })
      }

      contentParts.push({ type: "text", text: userMessage })

      // 이전 메시지들 (첨부파일 제외)
      for (let i = 0; i < messages.length - 1; i++) {
        apiMessages.push({ role: messages[i].role, content: messages[i].content })
      }
      apiMessages.push({ role: "user", content: contentParts })

    } else {
      // 일반 텍스트 메시지
      for (const msg of messages) {
        apiMessages.push({ role: msg.role, content: msg.content })
      }
    }

    const systemPrompt = `당신은 영상 콘텐츠 원고 작성을 도와주는 AI 어시스턴트입니다.
사용자의 요청을 분석하여 적절한 액션을 JSON으로 반환합니다.
${stateContext}
${attachmentContext}

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
  "sections": [{ "name": "섹션명", "targetDuration": 초 }] (선택 - 섹션명 설정 시)
}

### generate_all
전체 섹션 원고를 일괄 생성할 때. 섹션 구성(이름/시간)과 원고 모두 포함.
data: {
  "projectName": "string (선택)",
  "totalMinutes": number (선택),
  "contentType": "string (선택)",
  "toneStyle": "string (선택)",
  "sections": [
    {
      "name": "섹션명",
      "targetDuration": 초단위 숫자,
      "script": "완성된 나레이션 원고 (목표글자수의 90~110% 분량)"
    }
  ]
}

스크립트 분량 계산:
- 목표글자수 = (targetDuration / 60) * readingSpeed (현재: ${currentState?.readingSpeed || 220}자/분)
- 각 섹션의 script는 목표글자수의 90~110% 분량으로 작성
- 공백 제외 기준

### generate_section
특정 섹션 하나만 원고 생성/수정.
data: {
  "sectionIndex": number,
  "script": "완성된 나레이션 원고"
}

### update_sections
섹션명, 시간 배분 등 구성만 변경 (원고 유지).
data: {
  "sections": [{ "name": "섹션명", "targetDuration": 초 }]
}

## 중요 규칙
- generate_all 시 섹션별 원고는 반드시 충분한 분량으로 작성 (90~110% 준수)
- 원고는 강사가 카메라 앞에서 말하듯 자연스러운 구어체
- 이미지/PDF 첨부 시 해당 내용을 충분히 분석하여 원고에 반영
- 러닝타임을 명시하지 않으면 현재 설정(${currentState?.totalMinutes || 25}분) 유지
- 섹션 수를 명시하지 않으면 현재 설정(${currentState?.sectionCount || 7}개) 유지`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: systemPrompt,
        messages: apiMessages,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Anthropic API Error:", data)
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 })
    }

    const rawText = data.content?.[0]?.type === "text" ? data.content[0].text : "{}"

    // JSON 파싱 시도
    let parsed
    try {
      // 코드블록 제거 후 파싱
      const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      parsed = JSON.parse(clean)
    } catch {
      // 파싱 실패 시 일반 메시지로 처리
      parsed = { message: rawText, action: "none", data: {} }
    }

    return NextResponse.json(parsed)

  } catch (error) {
    console.error("Route Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
