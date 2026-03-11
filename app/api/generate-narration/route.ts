import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { topic, contentType, toneStyle, targetChars, duration } =
      await req.json()

    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `당신은 영상 콘텐츠 나레이션 전문 작가입니다.

콘텐츠 유형: ${contentType}
섹션 주제: ${topic}
목표 글자수: ${targetChars}자 (공백 제외, 이 글자수를 반드시 채울 것)
말투: ${toneStyle}
목표 시간: ${timeStr}

[필수 규칙]
- 공백 제외 정확히 ${targetChars}자 ±5% 범위로 작성
- 최소 ${Math.round(targetChars * 0.95)}자 이상 반드시 작성
- 글자수가 부족하면 내용을 더 구체적이고 풍부하게 풀어서 작성
- 문단 구분 없이 자연스럽게 이어지는 하나의 나레이션
- 나레이션 텍스트만 출력, 글자수 표기나 설명 없이`,
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Anthropic API Error:", data)
      return NextResponse.json(
        { error: JSON.stringify(data) },
        { status: 500 }
      )
    }

    const narration =
      data.content?.[0]?.type === "text" ? data.content[0].text : ""

    return NextResponse.json({ narration })
  } catch (error) {
    console.error("Route Error:", error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
