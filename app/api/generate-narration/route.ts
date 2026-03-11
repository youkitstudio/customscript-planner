import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { topic, contentType, toneStyle, targetChars, duration } =
      await req.json()

    if (!topic || topic.trim() === "") {
      return NextResponse.json(
        { error: "섹션명(주제)을 입력해주세요." },
        { status: 400 }
      )
    }

    const toneMap: Record<string, string> = {
      friendly: "친근하고 쉬운 말투로, 전문용어를 최소화하여",
      formal: "전문적이고 격식 있는 말투로",
      energetic: "활기차고 생동감 있는 말투로",
      calm: "차분하고 안정적인 내레이션 스타일로",
    }

    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `당신은 영상 콘텐츠 나레이션 전문 작가입니다.

콘텐츠 유형: ${contentType}
섹션 주제: ${topic}
목표 글자수: ${targetChars}자 내외 (±10% 허용)
말투: ${toneMap[toneStyle] || "친근하고 쉬운 말투로"}
목표 재생시간: ${timeStr} (${duration}초)

규칙:
- 자연스러운 나레이션 문체
- 문단 구분 없이 이어지는 하나의 흐름
- 글자수를 반드시 ${targetChars}자 내외로 맞출 것
- 나레이션 텍스트만 출력, 다른 설명 없이`,
        },
      ],
    })

    const narration =
      message.content[0].type === "text" ? message.content[0].text : ""
    return NextResponse.json({ narration })
  } catch (error) {
    console.error("AI 나레이션 생성 오류:", error)
    return NextResponse.json(
      { error: "나레이션 생성 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}
