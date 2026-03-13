import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { topic, contentType, toneStyle, targetChars, duration, existingScript } =
      await req.json()

    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    const minChars = Math.round(targetChars * 0.95)

    // 기존 원고가 있으면 수정 모드, 없으면 신규 생성 모드
    const isEditMode = existingScript && existingScript.trim().length > 20

    const userPrompt = isEditMode
      ? `당신은 영상 콘텐츠 나레이션 전문 작가입니다.

콘텐츠 유형: ${contentType}
목표 시간: ${timeStr} (${duration}초)

[기존 원고]
${existingScript}

[수정 요청]
${topic}

[글자수 필수 규칙]
- 공백 제외 글자수를 반드시 ${targetChars}자 ±5% 범위로 작성
- 최소 ${minChars}자 이상 반드시 작성할 것

[작성 규칙]
- 기존 원고의 핵심 내용과 구조를 유지하면서 수정 요청 사항을 반영
- 문단 구분 없이 자연스럽게 이어지는 하나의 나레이션
- 나레이션 텍스트만 출력, 글자수 표기나 부가 설명 없이`
      : `당신은 영상 콘텐츠 나레이션 전문 작가입니다.

콘텐츠 유형: ${contentType}
말투: ${toneStyle}
목표 시간: ${timeStr} (${duration}초)

[작성 요청]
${topic}

[글자수 필수 규칙 - 가장 중요]
- 공백 제외 글자수를 반드시 ${targetChars}자 ±5% 범위로 작성
- 최소 ${minChars}자 이상 반드시 작성할 것
- 글자수가 부족하면 내용을 더 구체적이고 풍부하게 풀어서 작성
- 예시, 비유, 부연 설명을 추가해서라도 글자수를 채울 것

[작성 규칙]
- 문단 구분 없이 자연스럽게 이어지는 하나의 나레이션
- 나레이션 텍스트만 출력
- 글자수 표기나 부가 설명 없이 나레이션만 작성`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
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
