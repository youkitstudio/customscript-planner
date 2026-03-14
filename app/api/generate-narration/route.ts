import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { topic, contentType, toneStyle, targetChars, duration, existingScript } =
      await req.json()

    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

    // 90%~110% 범위로 설정
    const minChars = Math.round(targetChars * 0.90)
    const maxChars = Math.round(targetChars * 1.10)

    // 기존 원고가 있으면 수정 모드, 없으면 신규 생성 모드
    const isEditMode = existingScript && existingScript.trim().length > 20

    const charRule = `
━━━━━━━━━━━━━━━━
[글자수 절대 규칙 - 반드시 준수]
- 목표 글자수: ${targetChars}자 (공백 제외)
- 허용 범위: 최소 ${minChars}자 ~ 최대 ${maxChars}자
- ${minChars}자 미만이면 절대 안 됨. 내용이 부족하면 아래 방법으로 채울 것:
  1) 핵심 개념을 더 상세히 풀어서 설명
  2) 구체적인 예시나 사례 추가
  3) "왜 중요한가"에 대한 이유와 근거 보완
  4) 학습자에게 질문을 던지거나 생각해볼 포인트 추가
- 완성 후 스스로 글자수를 세어보고 ${minChars}자 미만이면 내용을 더 추가할 것
━━━━━━━━━━━━━━━━`

    const userPrompt = isEditMode
      ? `당신은 영상 콘텐츠 나레이션 전문 작가입니다.

콘텐츠 유형: ${contentType}
목표 시간: ${timeStr} (${duration}초)
${charRule}

[기존 원고]
${existingScript}

[수정 요청]
${topic}

[작성 규칙]
- 기존 원고의 핵심 내용과 구조를 유지하면서 수정 요청 사항을 반영
- 문단 구분 없이 자연스럽게 이어지는 하나의 나레이션으로 작성
- 나레이션 텍스트만 출력 (글자수 표기, 설명, 주석 없이)`
      : `당신은 영상 콘텐츠 나레이션 전문 작가입니다.

콘텐츠 유형: ${contentType}
말투: ${toneStyle}
목표 시간: ${timeStr} (${duration}초)
${charRule}

[작성 요청]
${topic}

[작성 규칙]
- 문단 구분 없이 자연스럽게 이어지는 하나의 나레이션으로 작성
- 나레이션 텍스트만 출력 (글자수 표기, 설명, 주석 없이)
- 강사가 카메라 앞에서 말하듯 자연스러운 구어체로 작성`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Anthropic API Error:", data)
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 })
    }

    const narration =
      data.content?.[0]?.type === "text" ? data.content[0].text : ""

    return NextResponse.json({ narration })
  } catch (error) {
    console.error("Route Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
