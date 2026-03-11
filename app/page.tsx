"use client"

import { useState, useRef, useCallback } from "react"
import { Download, Upload, Save, FileText } from "lucide-react"
import Timeline, { getSectionColor } from "@/components/timeline"
import SectionCard, {
  CHARS_PER_SECOND,
  calculateDuration,
  formatTime,
} from "@/components/section-card"

interface SectionData {
  id: string
  name: string
  targetDuration: number
  script: string
  color: string
  isCompleted: boolean
  topic: string
  narrationHistory: string[]
}

const CONTENT_TYPES = [
  "강의 영상 스크립트",
  "이러닝 나레이션",
  "튜토리얼 원고",
  "홍보 영상 대본",
  "제품 소개 영상",
  "브랜드 스토리",
  "유튜브 영상 대본",
  "팟캐스트 스크립트",
  "다큐멘터리 원고",
  "기타",
]

const RUNTIME_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 60]

const TONE_STYLES = [
  { value: "friendly", label: "친근하고 쉽게" },
  { value: "formal", label: "전문적·격식체" },
  { value: "energetic", label: "활기차고 생동감" },
  { value: "calm", label: "차분한 내레이션" },
]

const READING_SPEEDS = [
  { value: 220, label: "천천히 (강의용)" },
  { value: 280, label: "보통 (일반 영상)" },
  { value: 340, label: "빠르게 (홍보·광고용)" },
]

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function createSections(count: number, totalSeconds: number): SectionData[] {
  const baseDuration = Math.floor(totalSeconds / count)
  const remainder = totalSeconds - baseDuration * count
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    name: "",
    targetDuration: baseDuration + (i < remainder ? 1 : 0),
    script: "",
    color: getSectionColor(i),
    isCompleted: false,
    topic: "",
    narrationHistory: [],
  }))
}

export default function ContentPlanner() {
  const [projectName, setProjectName] = useState("")
  const [author, setAuthor] = useState("")
  const [contentType, setContentType] = useState("강의 영상 스크립트")
  const [totalMinutes, setTotalMinutes] = useState(25)
  const [sectionCount, setSectionCount] = useState(7)
  const [sections, setSections] = useState<SectionData[]>(() =>
    createSections(7, 25 * 60)
  )
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [isCustomRuntime, setIsCustomRuntime] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(0)
  const [customSeconds, setCustomSeconds] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [customRuntimeValue, setCustomRuntimeValue] = useState("")
  const [toneStyle, setToneStyle] = useState("friendly")
  const [readingSpeed, setReadingSpeed] = useState(280)

  const totalSeconds = Math.round(totalMinutes * 60)
  const totalTargetChars = Math.round((totalSeconds / 60) * readingSpeed)

  // 정확한 총합 보정 유틸리티
  const correctTotal = (
    secs: SectionData[],
    targetTotal: number
  ): SectionData[] => {
    const total = secs.reduce((sum, s) => sum + s.targetDuration, 0)
    const diff = targetTotal - total
    if (diff === 0) return secs
    // 가장 큰 섹션에서 차이를 보정
    let maxIdx = 0
    let maxVal = 0
    secs.forEach((s, i) => {
      if (s.targetDuration > maxVal) {
        maxVal = s.targetDuration
        maxIdx = i
      }
    })
    return secs.map((s, i) =>
      i === maxIdx
        ? { ...s, targetDuration: Math.max(1, s.targetDuration + diff) }
        : s
    )
  }

  // 섹션 수 변경 - 균등 재분배
  const handleSectionCountChange = useCallback(
    (newCount: number) => {
      setSectionCount(newCount)
      const targetTotal = Math.round(totalMinutes * 60)
      const baseDuration = Math.floor(targetTotal / newCount)
      const remainder = targetTotal - baseDuration * newCount

      setSections((prev) => {
        // 기존 섹션 내용 보존: 줄이면 유지, 늘리면 새로 추가
        const result: SectionData[] = []
        for (let i = 0; i < newCount; i++) {
          const dur = baseDuration + (i < remainder ? 1 : 0)
          if (i < prev.length) {
            result.push({ ...prev[i], targetDuration: dur, color: getSectionColor(i) })
          } else {
            result.push({
              id: generateId(),
              name: "",
              targetDuration: dur,
              script: "",
              color: getSectionColor(i),
              isCompleted: false,
              topic: "",
              narrationHistory: [],
            })
          }
        }
        return result
      })
    },
    [totalMinutes]
  )

  const handleRuntimeChange = useCallback(
    (newMinutes: number) => {
      setTotalMinutes(newMinutes)
      const newTotal = Math.round(newMinutes * 60)
      setSections((prev) => {
        const oldTotal = prev.reduce(
          (sum, s) => sum + s.targetDuration,
          0
        )
        if (oldTotal === 0) return createSections(prev.length, newTotal)
        const ratio = newTotal / oldTotal
        const updated = prev.map((s) => ({
          ...s,
          targetDuration: Math.max(1, Math.round(s.targetDuration * ratio)),
        }))
        return correctTotal(updated, newTotal)
      })
    },
    []
  )

  const handleDurationChange = useCallback(
    (index: number, newDuration: number) => {
      setSections((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, targetDuration: Math.max(1, newDuration) } : s
        )
      )
    },
    []
  )

  // 타임라인 직접 편집: 해당 섹션 시간 변경 후 나머지 비례 재분배
  const handleDirectDurationEdit = useCallback(
    (index: number, newDuration: number) => {
      setSections((prev) => {
        const oldDuration = prev[index].targetDuration
        const difference = newDuration - oldDuration
        const otherTotal = prev.reduce(
          (sum, s, i) => (i !== index ? sum + s.targetDuration : sum),
          0
        )

        if (otherTotal <= 0) {
          return prev.map((s, i) =>
            i === index ? { ...s, targetDuration: Math.max(1, newDuration) } : s
          )
        }

        const updated = prev.map((s, i) => {
          if (i === index) {
            return { ...s, targetDuration: Math.max(1, newDuration) }
          }
          const ratio = s.targetDuration / otherTotal
          const adjustment = difference * ratio
          return {
            ...s,
            targetDuration: Math.max(1, Math.round(s.targetDuration - adjustment)),
          }
        })

        // 총합이 전체 러닝타임과 일치하도록 보정
        const total = updated.reduce((sum, s) => sum + s.targetDuration, 0)
        const target = Math.round(totalMinutes * 60)
        if (Math.abs(total - target) > 0) {
          const diff = target - total
          // 가장 큰 섹션에서 보정 (편집 중인 섹션 제외)
          let maxIdx = -1
          let maxVal = 0
          updated.forEach((s, i) => {
            if (i !== index && s.targetDuration > maxVal) {
              maxVal = s.targetDuration
              maxIdx = i
            }
          })
          if (maxIdx >= 0) {
            updated[maxIdx] = {
              ...updated[maxIdx],
              targetDuration: Math.max(1, updated[maxIdx].targetDuration + diff),
            }
          }
        }

        return updated
      })
    },
    [totalMinutes]
  )

  const handleNameChange = useCallback((index: number, name: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name } : s))
    )
  }, [])

  const handleScriptChange = useCallback((index: number, script: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, script } : s))
    )
  }, [])

  const handleTopicChange = useCallback((index: number, topic: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, topic } : s))
    )
  }, [])

  const handleHistoryChange = useCallback((index: number, narrationHistory: string[]) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, narrationHistory } : s))
    )
  }, [])

  const handleCompletedChange = useCallback((index: number, isCompleted: boolean) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, isCompleted } : s))
    )
  }, [])

  const handleReset = useCallback((index: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, script: "", isCompleted: false } : s
      )
    )
  }, [])

  // 균등 분배 리셋
  const handleResetDistribution = useCallback(() => {
    const confirmed = window.confirm(
      "모든 섹션을 균등하게 재분배하시겠습니까?\n현재 설정된 시간 배분이 초기화됩니다."
    )
    if (!confirmed) return

    const targetTotal = Math.round(totalMinutes * 60)
    const count = sections.length
    const baseDuration = Math.floor(targetTotal / count)
    const remainder = targetTotal - baseDuration * count

    setSections((prev) =>
      prev.map((section, idx) => ({
        ...section,
        targetDuration: baseDuration + (idx < remainder ? 1 : 0),
      }))
    )
  }, [totalMinutes, sections.length])

  // 전체 실제 시간 계산 (작성완료 섹션은 목��시간으로)
  const totalActual = sections.reduce(
    (sum, s) => sum + (s.isCompleted ? s.targetDuration : calculateDuration(s.script)),
    0
  )
  const totalPercent =
    totalSeconds > 0 ? Math.round((totalActual / totalSeconds) * 100) : 0

  // 프로젝트 저장 (Markdown)
  const exportToMd = useCallback(() => {
    const markdown = `---
title: ${projectName || "제목없음"}
author: ${author || ""}
contentType: ${contentType}
runtime: ${totalMinutes}
sections: ${sections.length}
created: ${new Date().toISOString()}
---

# ${projectName || "제목없음"}

**작성자:** ${author || "-"}  
**콘텐츠 유형:** ${contentType}  
**전체 러닝타���:** ${totalMinutes}분  
**섹션 수:** ${sections.length}

---

${sections
  .map(
    (section, idx) => `
## #${idx + 1} ${section.name}

**목표 시간:** ${formatTime(section.targetDuration)}  
**작성 시간:** ${formatTime(calculateDuration(section.script))}  
**작성완료:** ${section.isCompleted ? "예" : "아니오"}

### 원고

${section.script || "(작성된 내용 없음)"}

---
`
  )
  .join("\n")}
`

    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectName || "script"}_${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [projectName, author, contentType, totalMinutes, sections])

  // 프로젝트 불러오기 (Markdown)
  const importFromMd = useCallback(async (file: File) => {
    setIsLoadingFile(true)
    try {
      const text = await file.text()

      const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/)
      let title = ""
      let authorValue = ""
      let cType = "강의 영상 스크립트"
      let runtime = 25
      let secCount = 7

      if (frontmatterMatch) {
        const fm = frontmatterMatch[1]
        const titleMatch = fm.match(/title:\s*(.+)/)
        const authorMatch = fm.match(/author:\s*(.+)/)
        const ctMatch = fm.match(/contentType:\s*(.+)/)
        const rtMatch = fm.match(/runtime:\s*([\d.]+)/)
        const scMatch = fm.match(/sections:\s*(\d+)/)
        if (titleMatch) title = titleMatch[1].trim()
        if (authorMatch) authorValue = authorMatch[1].trim()
        if (ctMatch) cType = ctMatch[1].trim()
        if (rtMatch) runtime = parseFloat(rtMatch[1])
        if (scMatch) secCount = parseInt(scMatch[1])
      }

      const sectionRegex =
        /## #(\d+) (.*?)\n[\s\S]*?(?:\*\*작성완료:\*\*\s*(예|아니오)\s*\n)?[\s\S]*?### 원고\n([\s\S]*?)(?=\n## #|\n---\s*$|$)/g
      const parsedSections: { number: number; name: string; script: string; isCompleted: boolean }[] = []
      let match: RegExpExecArray | null

      while (true) {
        match = sectionRegex.exec(text)
        if (match === null) break
        parsedSections.push({
          number: parseInt(match[1]),
          name: match[2].trim(),
          isCompleted: match[3] === "예",
          script: match[4].trim().replace("(작성된 내용 없음)", ""),
        })
      }

      // fallback: 기존 포맷 파싱
      if (parsedSections.length === 0) {
        const oldRegex =
          /## #(\d+) (.*?)\n[\s\S]*?### 원고\n([\s\S]*?)(?=\n## #|\n---\s*$|$)/g
        while (true) {
          match = oldRegex.exec(text)
          if (match === null) break
          parsedSections.push({
            number: parseInt(match[1]),
            name: match[2].trim(),
            isCompleted: false,
            script: match[3].trim().replace("(작성된 내용 없음)", ""),
          })
        }
      }

      setProjectName(title)
      setAuthor(authorValue)
      setContentType(cType)
      setTotalMinutes(runtime)
      setSectionCount(secCount)

      // 직접 입력 모드 확인
      if (!RUNTIME_OPTIONS.includes(runtime)) {
        setIsCustomRuntime(true)
        setCustomMinutes(Math.floor(runtime))
        setCustomSeconds(Math.round((runtime % 1) * 60))
      } else {
        setIsCustomRuntime(false)
        setCustomMinutes(0)
        setCustomSeconds(0)
      }

      if (parsedSections.length > 0) {
        const totalSec = Math.round(runtime * 60)
        const count = parsedSections.length
        const baseDuration = Math.floor(totalSec / count)
        const remainder = totalSec - baseDuration * count
        setSections(
          parsedSections.map((ps, i) => ({
            id: generateId(),
            name: ps.name,
            targetDuration: baseDuration + (i < remainder ? 1 : 0),
            script: ps.script,
            color: getSectionColor(i),
            isCompleted: ps.isCompleted,
          }))
        )
      } else {
        setSections(createSections(secCount, Math.round(runtime * 60)))
      }
    } catch {
      alert("파일을 읽는 중 오류가 발생했습니다.")
    } finally {
      setIsLoadingFile(false)
    }
  }, [])

  // PDF 다운로드
  const downloadPDF = async () => {
    const html2canvas = (await import("html2canvas")).default
    const { jsPDF } = await import("jspdf")

    if (!printRef.current) return

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    })

    const pdf = new jsPDF("p", "mm", "a4")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    const marginX = 10
    const marginY = 15
    const contentWidth = pdfWidth - marginX * 2
    const contentHeight = pdfHeight - marginY * 2

    const scale = contentWidth / canvas.width
    const scaledPageHeight = contentHeight / scale

    const findBestBreakPoint = (
      targetY: number,
      searchRange: number
    ): number => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return targetY

      const startY = Math.max(0, Math.floor(targetY - searchRange))
      const endY = Math.floor(targetY)

      for (let y = endY; y >= startY; y--) {
        const imageData = ctx.getImageData(0, y, canvas.width, 1)
        const data = imageData.data
        let isWhiteRow = true

        for (let x = 0; x < canvas.width; x++) {
          const idx = x * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          if (r < 250 || g < 250 || b < 250) {
            isWhiteRow = false
            break
          }
        }

        if (isWhiteRow) {
          return y
        }
      }

      return targetY
    }

    const pageBreaks: number[] = [0]
    let currentY = 0

    while (currentY < canvas.height) {
      const nextTargetY = currentY + scaledPageHeight

      if (nextTargetY >= canvas.height) {
        pageBreaks.push(canvas.height)
        break
      }

      const bestBreakY = findBestBreakPoint(nextTargetY, 100)
      pageBreaks.push(bestBreakY)
      currentY = bestBreakY
    }

    for (let i = 0; i < pageBreaks.length - 1; i++) {
      if (i > 0) {
        pdf.addPage()
      }

      const sourceY = pageBreaks[i]
      const sourceHeight = pageBreaks[i + 1] - pageBreaks[i]

      const pageCanvas = document.createElement("canvas")
      pageCanvas.width = canvas.width
      pageCanvas.height = sourceHeight

      const ctx = pageCanvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        )
      }

      const pageImgData = pageCanvas.toDataURL("image/png")
      const imgHeight = sourceHeight * scale

      pdf.addImage(
        pageImgData,
        "PNG",
        marginX,
        marginY,
        contentWidth,
        imgHeight
      )
    }

    pdf.save(`${projectName || "원고"}_${Date.now()}.pdf`)
  }

  // 텍스트 파일 다운로드
  const downloadText = useCallback(() => {
    const toneLabel = TONE_STYLES.find(t => t.value === toneStyle)?.label || toneStyle
    const speedInfo = READING_SPEEDS.find(s => s.value === readingSpeed)
    const speedLabel = speedInfo ? `${speedInfo.label} (${speedInfo.description})` : `${readingSpeed}자/분`

    const textContent = `${projectName || "제목없음"}
${"=".repeat(50)}

작성자: ${author || "-"}
콘텐츠 유형: ${contentType}
전체 러닝타임: ${totalMinutes}분
섹션 수: ${sections.length}개
말투 스타일: ${toneLabel}
낭독 속도: ${speedLabel}
전체 목표 글자수: ${totalTargetChars.toLocaleString()}자

${"=".repeat(50)}

${sections
  .map(
    (section, idx) => `
[#${idx + 1}] ${section.name}
${"-".repeat(40)}
목표 시간: ${formatTime(section.targetDuration)}
작성 시간: ${formatTime(calculateDuration(section.script))}
작성완료: ${section.isCompleted ? "예" : "아니오"}

${section.script || "(작성된 내용 없음)"}
`
  )
  .join("\n")}

${"=".repeat(50)}
콘텐츠 원고 작성 도구 - youkit
`

    const blob = new Blob([textContent], {
      type: "text/plain;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectName || "원고"}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [projectName, author, contentType, totalMinutes, sections, toneStyle, readingSpeed, totalTargetChars])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto max-w-[1100px] px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-krds-gray-90">
              콘텐츠 원고 작성 도구
            </h1>
            <a
              href="/guide"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-krds-primary px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-krds-primary-dark focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary"
            >
              작성가이드
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        {/* 프로젝트 설정 */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="프로젝트 명 (예: 재난영화 홍보영상)"
              className="flex-[3] rounded-xl border border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-krds-gray-30 focus:border-krds-primary"
            />
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="작성자"
              className="flex-[2] rounded-xl border border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-krds-gray-30 focus:border-krds-primary"
            />
          </div>

          {/* 설정 패널 카드 */}
          <div className="rounded-xl border border-[#E0E0E0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            {/* 상단: 콘텐츠 유형 / 러닝타임 / 섹션 수 (3열 그리드) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* 콘텐츠 유형 */}
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">
                  콘텐츠 유형
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-krds-primary"
                >
                  {CONTENT_TYPES.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>

              {/* 러닝타임 */}
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">
                  러닝타임
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={isCustomRuntime ? "custom" : totalMinutes}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomRuntime(true)
                        setCustomMinutes(Math.floor(totalMinutes))
                        setCustomSeconds(Math.round((totalMinutes % 1) * 60))
                      } else {
                        setIsCustomRuntime(false)
                        setCustomMinutes(0)
                        setCustomSeconds(0)
                        handleRuntimeChange(parseInt(e.target.value))
                      }
                    }}
                    className={`rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-krds-primary ${isCustomRuntime ? "w-auto" : "w-full"}`}
                  >
                    {RUNTIME_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}분
                      </option>
                    ))}
                    <option value="custom">직접 입력</option>
                  </select>
                  {isCustomRuntime && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={300}
                          value={customMinutes}
                          onChange={(e) => {
                            const mins = Math.max(0, Math.min(300, parseInt(e.target.value) || 0))
                            setCustomMinutes(mins)
                            const newTotal = mins + customSeconds / 60
                            if (newTotal > 0) handleRuntimeChange(newTotal)
                          }}
                          placeholder="0"
                          className="w-16 rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-2 py-3 text-center text-[15px] outline-none transition-colors focus:border-krds-primary"
                        />
                        <span className="whitespace-nowrap text-[13px] text-krds-gray-50">분</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          step={10}
                          value={customSeconds}
                          onChange={(e) => {
                            let secs = parseInt(e.target.value) || 0
                            secs = Math.round(secs / 10) * 10
                            if (secs < 0) secs = 0
                            if (secs >= 60) secs = 50
                            setCustomSeconds(secs)
                            const newTotal = customMinutes + secs / 60
                            if (newTotal > 0) handleRuntimeChange(newTotal)
                          }}
                          placeholder="0"
                          className="w-16 rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-2 py-3 text-center text-[15px] outline-none transition-colors focus:border-krds-primary"
                        />
                        <span className="whitespace-nowrap text-[13px] text-krds-gray-50">초</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 섹션 수 */}
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">
                  섹션 수
                </label>
                <select
                  value={sectionCount}
                  onChange={(e) =>
                    handleSectionCountChange(parseInt(e.target.value))
                  }
                  className="w-full rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-krds-primary"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((n) => (
                    <option key={n} value={n}>
                      {n}개
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 구분선 */}
            <div className="my-5 border-b border-[#F0F0F0]" />

            {/* 하단: 말투 스타일 / 낭독 속도 (2열 그리드) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 말투 스타일 */}
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">
                  말투 스타일
                </label>
                <div className="flex flex-wrap gap-2">
                  {TONE_STYLES.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => setToneStyle(tone.value)}
                      className={`rounded-lg border-[1.5px] px-4 py-2 text-[14px] font-medium transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary ${
                        toneStyle === tone.value
                          ? "border-krds-primary bg-[#EBF1FE] font-semibold text-krds-primary"
                          : "border-[#E0E0E0] bg-[#F8F8F8] text-[#474747] hover:border-krds-gray-30"
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 낭독 속도 */}
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">
                  낭독 속도
                </label>
                <div className="flex gap-2">
                  {READING_SPEEDS.map((speed) => (
                    <button
                      key={speed.value}
                      type="button"
                      onClick={() => setReadingSpeed(speed.value)}
                      className={`flex flex-1 flex-col items-center rounded-lg border-[1.5px] px-4 py-2 text-[14px] font-medium whitespace-nowrap transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary ${
                        readingSpeed === speed.value
                          ? "border-krds-primary bg-[#EBF1FE] font-semibold text-krds-primary"
                          : "border-[#E0E0E0] bg-[#F8F8F8] text-[#474747] hover:border-krds-gray-30"
                      }`}
                    >
                      <span>{speed.label}</span>
                      <span className="mt-0.5 text-[11px] font-normal text-[#9CA3AF]">
                        1분 = {speed.value}자
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 목표 글자수 - 우측 정렬 */}
            <div className="mt-5 flex justify-end">
              <span className="text-[15px] font-medium text-krds-primary">
                목표 글자수: {totalTargetChars.toLocaleString()}자
              </span>
            </div>
          </div>
        </div>

        {/* 타임라인 */}
        <div className="mb-6 rounded-xl border border-krds-border bg-krds-bg-default p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <Timeline
            sections={sections.map((s) => ({
              id: s.id,
              name: s.name,
              targetDuration: s.targetDuration,
              color: s.color,
            }))}
            totalSeconds={totalSeconds}
            onDurationChange={handleDurationChange}
            onDirectDurationEdit={handleDirectDurationEdit}
            onResetDistribution={handleResetDistribution}
          />
        </div>

        {/* 저장/불러오기 버튼 */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoadingFile}
            className="flex items-center gap-2 rounded-lg border-[1.5px] border-krds-primary bg-transparent px-5 py-2.5 text-[15px] font-semibold text-krds-primary transition-colors hover:bg-krds-primary-light focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isLoadingFile ? "불러오는 중..." : "프로젝트 불러오기"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importFromMd(file)
              e.target.value = ""
            }}
          />
          <button
            type="button"
            onClick={exportToMd}
            className="flex items-center gap-2 rounded-lg bg-krds-gray-10 px-5 py-2.5 text-[15px] font-semibold text-krds-gray-90 transition-colors hover:bg-krds-gray-30 focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary"
          >
            <Save className="h-4 w-4" />
            프로젝트 저장
          </button>
        </div>

        {/* 전체 러닝타임 진행률 */}
        <div className="mb-8 rounded-xl border border-krds-border bg-krds-bg-default p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[13px] text-krds-gray-50">전체 러닝타임</p>
              <p className="text-2xl font-bold text-krds-gray-90">
                {formatTime(totalActual)}{" "}
                <span className="text-krds-gray-30">
                  / {formatTime(totalSeconds)}
                </span>
              </p>
            </div>
            <div
              className={`text-3xl font-bold ${
                totalPercent > 105
                  ? "text-krds-danger"
                  : totalPercent >= 95
                    ? "text-krds-success"
                    : "text-krds-gray-30"
              }`}
            >
              {totalPercent}%
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-krds-gray-10">
            <div
              className={`h-full transition-all duration-300 ${
                totalPercent > 105
                  ? "bg-krds-danger"
                  : totalPercent >= 95
                    ? "bg-krds-success"
                    : "bg-krds-primary"
              }`}
              style={{ width: `${Math.min(totalPercent, 100)}%` }}
            />
          </div>
          {totalPercent > 105 && (
            <p className="mt-3 text-[15px] text-krds-danger">
              {formatTime(totalActual - totalSeconds)} 초과
            </p>
          )}
        </div>

        {/* 섹션 카드 */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              index={index}
              name={section.name}
              targetDuration={section.targetDuration}
              script={section.script}
              color={section.color}
              isCompleted={section.isCompleted}
              readingSpeed={readingSpeed}
              contentType={contentType}
              toneStyle={toneStyle}
              topic={section.topic}
              narrationHistory={section.narrationHistory}
              onNameChange={(name) => handleNameChange(index, name)}
              onScriptChange={(script) => handleScriptChange(index, script)}
              onCompletedChange={(completed) => handleCompletedChange(index, completed)}
              onReset={() => handleReset(index)}
              onTopicChange={(topic) => handleTopicChange(index, topic)}
              onHistoryChange={(history) => handleHistoryChange(index, history)}
            />
          ))}
        </div>

        {/* 다운로드 버튼 */}
        <div className="mt-10 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={downloadText}
              className="flex items-center gap-2 rounded-lg bg-krds-gray-10 px-6 py-3 text-[15px] font-semibold text-krds-gray-90 transition-colors hover:bg-krds-gray-30 focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary"
            >
              <FileText className="h-4 w-4" />
              텍스트 다운로드
            </button>
            <button
              type="button"
              onClick={downloadPDF}
              className="flex items-center gap-2 rounded-lg bg-krds-primary px-8 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-krds-primary-dark focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary"
            >
              <Download className="h-4 w-4" />
              PDF 다운로드
            </button>
          </div>
          <p className="mt-3 text-[13px] text-krds-gray-50">
            다운로드 버튼 클릭 후 약 3초 정도 후에 다운로드가 진행됩니다.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-krds-border bg-krds-bg-default">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <div className="text-center text-[15px] leading-relaxed text-krds-gray-50">
            <p>
              본 사이트에 포함된 모든 콘텐츠의 저작권은 유킷(youkit)에 있으며,
            </p>
            <p>
              본 콘텐츠는 대덕대학교 RISE 사업 관련 원고 작성 및 학습 콘텐츠
              개발을 위한 목적에 한하여 활용됩니다.
            </p>
            <p className="mt-4">문의: youkitmedia@naver.com</p>
            <p className="mt-2 text-krds-gray-30">
              &copy; 2026 youkit. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Hidden Print Area for PDF */}
      <div className="fixed -left-[9999px] top-0">
        <div
          ref={printRef}
          className="w-[800px] bg-white p-10 font-sans"
          style={{ fontFamily: "Noto Sans KR, system-ui, sans-serif" }}
        >
          <div className="mb-8 border-b border-neutral-200 pb-6">
            <h1 className="text-2xl font-bold text-neutral-900">
              {projectName || "콘텐츠 원고"}
            </h1>
            {author && (
              <p className="mt-1 text-neutral-600">작성자: {author}</p>
            )}
            <p className="mt-2 text-neutral-600">
              콘텐츠 유형: {contentType} | 러닝타임: {totalMinutes}분
            </p>
            <p className="mt-1 text-neutral-600">
              전체 러닝타임: {formatTime(totalActual)} /{" "}
              {formatTime(totalSeconds)} ({totalPercent}%)
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((section, index) => {
              const duration = section.isCompleted
                ? section.targetDuration
                : calculateDuration(section.script)
              const sectionPercent = section.isCompleted
                ? 100
                : section.targetDuration > 0
                  ? Math.round(
                      (duration / section.targetDuration) * 100
                    )
                  : 0

              return (
                <div
                  key={section.id}
                  className="border-b border-neutral-100 pb-6"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-neutral-900">
                      #{index + 1} {section.name}
                    </span>
                    {section.isCompleted && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        작성완료
                      </span>
                    )}
                  </div>
                  <p className="mb-3 text-sm text-neutral-500">
                    시간: {formatTime(duration)} / 목표:{" "}
                    {formatTime(section.targetDuration)} /{" "}
                    <span className="font-bold">{sectionPercent}%</span>
                  </p>
                  {section.script && (
                    <div className="rounded bg-neutral-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
                        {section.script}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-neutral-400">
            <FileText className="h-3 w-3" />
            <span>콘텐츠 원고 작성 도구</span>
          </div>
        </div>
      </div>
    </div>
  )
}
