import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

// ── 콘텐츠 유형별 최적 섹션 구성 (균등 배분 금지 — 실무 비율 적용) ──────
const CONTENT_STRUCTURE_GUIDE: Record<string, {
  description: string
  sectionRatios: { name: string; ratio: number; role: string }[]
}> = {
  "홍보 영상 대본": {
    description: "후킹(짧고 강하게) → 핵심 기능(가장 길게) → CTA(명확하게)",
    sectionRatios: [
      { name: "후킹 & 문제제기", ratio: 0.20, role: "시청자의 주의를 잡는 강렬한 공감/질문/충격. 짧고 강하게." },
      { name: "핵심 기능 소개",  ratio: 0.45, role: "제품의 핵심 가치와 차별점 상세 설명. 가장 긴 섹션." },
      { name: "혜택 & 구매유도", ratio: 0.35, role: "구체적 혜택, 사용자 변화, 명확한 CTA. 행동 유도." },
    ],
  },
  "제품 소개 영상": {
    description: "핵심가치 → 기능 상세 → 구매 안내",
    sectionRatios: [
      { name: "제품 핵심 가치", ratio: 0.25, role: "제품이 해결하는 문제와 핵심 가치 한 줄 정의" },
      { name: "주요 기능 상세", ratio: 0.45, role: "핵심 기능 3가지를 시연하듯 구체적으로 설명" },
      { name: "구매 안내",     ratio: 0.30, role: "가격, 구매처, 혜택, 행동 촉구" },
    ],
  },
  "강의 영상 스크립트": {
    description: "도입(흥미유발) → 본론(핵심, 가장 길게) → 정리",
    sectionRatios: [
      { name: "도입",  ratio: 0.20, role: "학습 목표 제시, 흥미 유발, 오늘 배울 것 예고" },
      { name: "본론",  ratio: 0.60, role: "핵심 개념 설명, 예시, 실습. 가장 긴 섹션." },
      { name: "정리",  ratio: 0.20, role: "핵심 내용 요약, 다음 강의 예고, 과제 안내" },
    ],
  },
  "이러닝 나레이션": {
    description: "학습목표 → 개념설명 → 예시/적용 → 정리",
    sectionRatios: [
      { name: "학습 목표", ratio: 0.15, role: "오늘 배울 내용 명확히 제시" },
      { name: "개념 설명", ratio: 0.40, role: "핵심 개념을 쉽고 체계적으로 설명" },
      { name: "예시 & 적용", ratio: 0.30, role: "실제 사례와 적용 방법" },
      { name: "정리",      ratio: 0.15, role: "핵심 요약 및 다음 단계 안내" },
    ],
  },
  "유튜브 영상 대본": {
    description: "후킹(짧게) → 메인 콘텐츠(길게) → 아웃트로",
    sectionRatios: [
      { name: "후킹 & 인트로",  ratio: 0.15, role: "30초 안에 끝까지 볼 이유를 제시" },
      { name: "메인 콘텐츠",    ratio: 0.70, role: "약속한 정보를 충실히 전달" },
      { name: "아웃트로",       ratio: 0.15, role: "핵심 요약, 구독/좋아요 유도, 다음 영상 예고" },
    ],
  },
  "브랜드 스토리": {
    description: "공감 → 여정/변화 → 현재/비전",
    sectionRatios: [
      { name: "공감 & 시작", ratio: 0.30, role: "브랜드가 시작된 문제의식과 공감" },
      { name: "도전 & 변화", ratio: 0.40, role: "극복 과정과 핵심 가치 확립" },
      { name: "현재 & 비전", ratio: 0.30, role: "현재 브랜드 모습과 앞으로의 약속" },
    ],
  },
  "튜토리얼 원고": {
    description: "개요 → 단계별 설명 → 마무리",
    sectionRatios: [
      { name: "개요 & 준비", ratio: 0.20, role: "무엇을 만들지, 필요한 것은 무엇인지 안내" },
      { name: "핵심 단계",   ratio: 0.60, role: "단계별 과정을 순서대로 명확하게 설명" },
      { name: "마무리",      ratio: 0.20, role: "완성 확인, 팁, 응용 방법 안내" },
    ],
  },
}

function getContentGuide(contentType: string) {
  const key = Object.keys(CONTENT_STRUCTURE_GUIDE).find(k =>
    contentType.includes(k) || k.includes(contentType)
  )
  return key ? CONTENT_STRUCTURE_GUIDE[key] : null
}

function getToneLabel(toneStyle: string): string {
  const map: Record<string, string> = {
    friendly:  "친근하고 쉬운 구어체",
    formal:    "전문적이고 격식 있는 말투",
    energetic: "활기차고 생동감 넘치는 말투",
    calm:      "차분하고 신뢰감 있는 내레이션",
  }
  return map[toneStyle] || toneStyle
}

export async function POST(req: NextRequest) {
  try {
    const { messages, currentState, attachmentBase64, attachmentType, attachmentName } =
      await req.json()

    const readingSpeed: number = currentState?.readingSpeed || 280
    const totalMinutes: number = currentState?.totalMinutes || 3
    const totalSeconds: number = Math.round(totalMinutes * 60)
    const contentType: string  = currentState?.contentType || "강의 영상 스크립트"
    const sectionCount: number = currentState?.sectionCount || 3
    const toneStyle: string    = currentState?.toneStyle || "friendly"
    const totalTargetChars     = Math.round((totalSeconds / 60) * readingSpeed)

    // ── 현재 섹션별 글자수 현황 ─────────────────────────────────────
    const currentSections = (currentState?.sections || []).map(
      (s: { name: string; targetDuration: number; script: string }, i: number) => {
        const targetChars = Math.round((s.targetDuration / 60) * readingSpeed)
        const minChars    = Math.round(targetChars * 0.9)
        const maxChars    = Math.round(targetChars * 1.1)
        const currentChars = s.script ? s.script.replace(/\s/g, "").length : 0
        const status = currentChars === 0 ? "미작성"
          : currentChars < minChars ? `⚠️ ${minChars - currentChars}자 부족`
          : currentChars > maxChars ? `⚠️ ${currentChars - maxChars}자 초과`
          : "✅ 적정"
        return { index: i + 1, name: s.name || `섹션${i+1}`, targetDuration: s.targetDuration,
          targetChars, minChars, maxChars, currentChars, status }
      }
    )

    // ── 콘텐츠 구조 가이드 ──────────────────────────────────────────
    const guide = getContentGuide(contentType)
    const ratioList = guide
      ? guide.sectionRatios.slice(0, sectionCount)
      : Array.from({ length: sectionCount }, (_, i) => ({
          name: `섹션${i + 1}`,
          ratio: 1 / sectionCount,
          role: "내용 작성",
        }))

    // 섹션 수가 guide보다 많으면 마지막 비율로 채움
    while (ratioList.length < sectionCount) {
      ratioList.push({ name: `섹션${ratioList.length + 1}`, ratio: 0.15, role: "추가 내용" })
    }

    const structureBlock = `
## ★ 섹션 구성 및 시간 배분 (generate_all 시 반드시 이 값으로 targetDuration 설정)
콘텐츠 유형: ${contentType}
${guide ? `구조 원칙: ${guide.description}` : ""}
전체 ${totalSeconds}초 / 낭독속도 ${readingSpeed}자/분 기준:

${ratioList.map((r, i) => {
  const sec   = Math.round(totalSeconds * r.ratio)
  const chars = Math.round((sec / 60) * readingSpeed)
  const minC  = Math.round(chars * 0.9)
  const maxC  = Math.round(chars * 1.1)
  return `  섹션${i+1} "${r.name}"
    targetDuration = ${sec}초
    목표 글자수    = ${chars}자 (허용 ${minC}~${maxC}자)
    섹션 역할      : ${r.role}`
}).join("\n\n")}

균등 배분(${Math.round(totalSeconds/sectionCount)}초씩) 절대 금지.
위 targetDuration 값을 그대로 data.sections[].targetDuration에 사용하세요.`

    const charStatusBlock = currentSections.length > 0
      ? `\n## 현재 작성 현황\n${currentSections.map(s =>
          `  섹션${s.index} "${s.name}": ${s.currentChars}자 / 목표 ${s.targetChars}자 → ${s.status}`
        ).join("\n")}`
      : ""

    // ── 첨부파일 처리 ───────────────────────────────────────────────
    let attachmentContext = ""
    const apiMessages: Array<{
      role: string
      content: string | Array<{ type: string; [key: string]: unknown }>
    }> = []

    if (attachmentBase64 && attachmentType) {
      attachmentContext = `\n[첨부파일: ${attachmentName || "파일"}]\n내용을 분석하여 원고 주제/핵심내용에 반영하세요.\n`
      const userMessage = messages[messages.length - 1]?.content || ""
      const parts: Array<{ type: string; [key: string]: unknown }> = []
      if (attachmentType.startsWith("image/")) {
        parts.push({ type: "image", source: { type: "base64", media_type: attachmentType, data: attachmentBase64 } })
      } else if (attachmentType === "application/pdf") {
        parts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: attachmentBase64 } })
      }
      parts.push({ type: "text", text: userMessage })
      for (let i = 0; i < messages.length - 1; i++) {
        apiMessages.push({ role: messages[i].role, content: messages[i].content })
      }
      apiMessages.push({ role: "user", content: parts })
    } else {
      for (const msg of messages) {
        apiMessages.push({ role: msg.role, content: msg.content })
      }
    }

    // ── 시스템 프롬프트 ─────────────────────────────────────────────
    const systemPrompt = `당신은 영상 콘텐츠 원고 작성 전문 AI입니다.
낭독 속도 기반 정밀 글자수 계산과 콘텐츠 유형별 최적 섹션 구조를 적용하는 전문 도구입니다.
일반 AI 채팅과 달리 실제 방송/광고/이러닝 원고 전문가 수준의 구성과 분량을 보장합니다.

## 프로젝트
- 프로젝트명: ${currentState?.projectName || "(없음)"}
- 콘텐츠 유형: ${contentType}
- 러닝타임: ${totalMinutes}분 (${totalSeconds}초)
- 섹션 수: ${sectionCount}개
- 말투: ${getToneLabel(toneStyle)}
- 낭독속도: ${readingSpeed}자/분
- 전체 목표 글자수: ${totalTargetChars}자
${structureBlock}
${charStatusBlock}
${attachmentContext}

## ★★★ 글자수 절대 규칙 ★★★

generate_all / generate_section 원고 작성 시:
1. 각 섹션 script의 글자수(공백 제외)는 반드시 목표 글자수의 90%~110% 범위 안에 있어야 합니다.
2. script 작성 직후 글자수를 세어보고, 부족하면 아래 방법으로 즉시 보완하세요:
   • 핵심 메시지를 더 구체적인 예시/사례로 풀어 설명
   • "왜 이것이 중요한가"에 대한 근거와 배경 추가
   • 시청자가 공감할 수 있는 상황/경험 묘사 추가
   • 제품/서비스의 구체적인 사용 장면이나 효과 묘사
   • 감정적 연결고리나 스토리 요소 추가
3. 짧게 요약하거나 간략하게 쓰지 마세요. 목표 글자수 달성이 최우선입니다.

글자수 빠른 계산표 (낭독속도 ${readingSpeed}자/분):
${[10,15,20,25,30,40,50,60,90,120].map(sec => {
  const c = Math.round(sec/60*readingSpeed)
  return `  ${sec}초 → ${c}자 (허용 ${Math.round(c*0.9)}~${Math.round(c*1.1)}자)`
}).join("\n")}

## 응답 형식 (반드시 순수 JSON, 코드블록 없이)

{"message":"...","action":"...","data":{...}}

## action 유형

none — 일반 대화/정보 제공
data: {}

update_settings — 설정 변경
data: { "projectName"?:string, "totalMinutes"?:number, "sectionCount"?:number,
        "contentType"?:string, "toneStyle"?:string, "readingSpeed"?:number,
        "sections"?:[{"name":string,"targetDuration":number}] }

generate_all — 전체 원고 생성 (섹션 구성 + 원고 포함)
★ targetDuration은 위 "섹션 구성 및 시간 배분" 표의 값을 그대로 사용 (균등 배분 금지)
★ script는 해당 targetDuration 기준 목표 글자수의 90~110% 반드시 준수
★ totalMinutes는 반드시 포함 — 섹션 targetDuration 합계를 분 단위로 변환한 값 (예: 60초 → 1)
data: {
  "totalMinutes": number (필수 — 섹션 합산 초 ÷ 60, 예: 18+30+12=60초 → 1),
  "sections": [{"name":string,"targetDuration":number,"script":string}]
}

generate_section — 특정 섹션만 생성/수정
★ 해당 섹션 targetDuration 기준 목표 글자수 90~110% 반드시 준수
data: { "sectionIndex":number, "script":string }

update_sections — 구성만 변경 (원고 유지)
data: { "sections": [{"name":string,"targetDuration":number}] }

## 원고 품질 기준
- ${getToneLabel(toneStyle)}로 일관되게 작성
- 나레이터가 카메라 앞에서 말하듯 자연스러운 구어체
- 섹션 간 연결이 자연스럽게 이어지도록 작성
- 홍보/광고: 감성적 공감 → 논리적 설득 → 강한 행동 촉구
- 교육: 흥미 유발 → 명확한 설명 → 기억에 남는 정리
- 러닝타임 미명시 시 현재값(${totalMinutes}분) 유지
- 섹션수 미명시 시 현재값(${sectionCount}개) 유지`

    // ── API 호출 ────────────────────────────────────────────────────
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        system: systemPrompt,
        messages: apiMessages,
      }),
    })

    const apiData = await response.json()

    if (!response.ok) {
      console.error("Anthropic API Error:", apiData)
      return NextResponse.json({ error: JSON.stringify(apiData) }, { status: 500 })
    }

    const rawText = apiData.content?.[0]?.type === "text" ? apiData.content[0].text : "{}"

    // ── JSON 파싱 ───────────────────────────────────────────────────
    let parsed: { message: string; action: string; data: Record<string, unknown> }
    try {
      const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      parsed = JSON.parse(clean)
    } catch {
      parsed = { message: rawText, action: "none", data: {} }
    }

    // ── generate_all: totalMinutes 누락 시 섹션 합산으로 자동 보완 ──
    if (parsed.action === "generate_all" && Array.isArray(parsed.data?.sections)) {
      const secs = parsed.data.sections as Array<{ name: string; targetDuration: number; script: string }>

      // totalMinutes가 없으면 섹션 targetDuration 합산으로 자동 설정
      if (!parsed.data.totalMinutes) {
        const sumSec = secs.reduce((s, sec) => s + (sec.targetDuration || 0), 0)
        if (sumSec > 0) {
          parsed.data.totalMinutes = sumSec / 60
          console.log(`[자동보완] totalMinutes=${parsed.data.totalMinutes} (섹션 합산 ${sumSec}초)`)
        }
      }

      // 글자수 검증 로그
      let shortCount = 0
      secs.forEach((s, i) => {
        const charCount  = (s.script || "").replace(/\s/g, "").length
        const targetC    = Math.round((s.targetDuration / 60) * readingSpeed)
        const minC       = Math.round(targetC * 0.9)
        const maxC       = Math.round(targetC * 1.1)
        const ok         = charCount >= minC && charCount <= maxC
        console.log(`[검증] 섹션${i+1} "${s.name}": ${charCount}자 / 목표 ${targetC}자 (${minC}~${maxC}) ${ok ? "✅" : "⚠️"}`)
        if (!ok) shortCount++
      })
      if (shortCount > 0) {
        parsed.message += `\n\n⚠️ ${shortCount}개 섹션의 글자수가 목표에 미치지 못했습니다. 해당 섹션에서 '원고 보강해줘'라고 요청하시면 글자수를 채워드립니다.`
      }
    }

    if (parsed.action === "generate_section" && parsed.data?.script) {
      const script    = parsed.data.script as string
      const charCount = script.replace(/\s/g, "").length
      const idx       = parsed.data.sectionIndex as number
      const sec       = currentSections[idx]
      if (sec) {
        const ok = charCount >= sec.minChars && charCount <= sec.maxChars
        console.log(`[검증] 섹션${idx+1}: ${charCount}자 / 목표 ${sec.targetChars}자 (${sec.minChars}~${sec.maxChars}) ${ok ? "✅" : "⚠️"}`)
      }
    }

    return NextResponse.json(parsed)

  } catch (error) {
    console.error("Route Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
