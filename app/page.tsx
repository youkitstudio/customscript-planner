"use client"

import { useState, useRef, useCallback } from "react"
import { Download, Upload, Save, FileText } from "lucide-react"
import Timeline, { getSectionColor } from "@/components/timeline"
import SectionCard, {
  calculateDuration,
  formatTime,
} from "@/components/section-card"

// ── 비밀번호 변경 시 여기만 수정 ──────────
const SITE_PASSWORD = "youkit2026"
// ─────────────────────────────────────────

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
  "강의 영상 스크립트", "이러닝 나레이션", "튜토리얼 원고",
  "홍보 영상 대본", "제품 소개 영상", "브랜드 스토리",
  "유튜브 영상 대본", "팟캐스트 스크립트", "다큐멘터리 원고", "기타",
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

// ── 비밀번호 화면 (별도 컴포넌트) ─────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pwInput, setPwInput] = useState("")
  const [pwError, setPwError] = useState(false)

  const handleSubmit = () => {
    if (pwInput === SITE_PASSWORD) {
      onUnlock()
    } else {
      setPwError(true)
      setPwInput("")
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#F8F8F8",
      fontFamily: "Pretendard, Apple SD Gothic Neo, sans-serif",
    }}>
      <div style={{
        background: "#fff", border: "1px solid #E0E0E0", borderRadius: 16,
        padding: "40px 36px", width: 360,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
          콘텐츠 원고 작성 도구
        </h2>
        <p style={{ fontSize: 14, color: "#767676", marginBottom: 24 }}>
          접근하려면 비밀번호를 입력하세요
        </p>
        <input
          type="password"
          value={pwInput}
          onChange={(e) => { setPwInput(e.target.value); setPwError(false) }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="비밀번호 입력"
          autoFocus
          style={{
            width: "100%", padding: "12px 16px",
            border: pwError ? "1.5px solid #D32F2F" : "1.5px solid #E0E0E0",
            borderRadius: 8, fontSize: 15, outline: "none",
            marginBottom: 8, boxSizing: "border-box", color: "#1A1A1A",
          }}
        />
        {pwError && (
          <p style={{ fontSize: 13, color: "#D32F2F", marginBottom: 8 }}>
            비밀번호가 올바르지 않습니다
          </p>
        )}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%", padding: "12px", background: "#256EF4",
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4,
          }}
        >
          입장하기
        </button>
        <p style={{ fontSize: 12, color: "#B0B0B0", marginTop: 16 }}>
          © 2026 YouKit. All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

// ── 메인 플래너 컴포넌트 ──────────────────
function ContentPlannerMain() {
  const [projectName, setProjectName] = useState("")
  const [author, setAuthor] = useState("")
  const [contentType, setContentType] = useState("강의 영상 스크립트")
  const [totalMinutes, setTotalMinutes] = useState(25)
  const [sectionCount, setSectionCount] = useState(7)
  const [sections, setSections] = useState<SectionData[]>(() => createSections(7, 25 * 60))
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [isCustomRuntime, setIsCustomRuntime] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(0)
  const [customSeconds, setCustomSeconds] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [toneStyle, setToneStyle] = useState("friendly")
  const [readingSpeed, setReadingSpeed] = useState(280)

  const totalSeconds = Math.round(totalMinutes * 60)
  const totalTargetChars = Math.round((totalSeconds / 60) * readingSpeed)

  const correctTotal = (secs: SectionData[], targetTotal: number): SectionData[] => {
    const total = secs.reduce((sum, s) => sum + s.targetDuration, 0)
    const diff = targetTotal - total
    if (diff === 0) return secs
    let maxIdx = 0, maxVal = 0
    secs.forEach((s, i) => { if (s.targetDuration > maxVal) { maxVal = s.targetDuration; maxIdx = i } })
    return secs.map((s, i) => i === maxIdx ? { ...s, targetDuration: Math.max(1, s.targetDuration + diff) } : s)
  }

  const handleSectionCountChange = useCallback((newCount: number) => {
    setSectionCount(newCount)
    setSections((prev) => {
      const targetTotal = Math.round(totalMinutes * 60)
      const baseDuration = Math.floor(targetTotal / newCount)
      const remainder = targetTotal - baseDuration * newCount
      const result: SectionData[] = []
      for (let i = 0; i < newCount; i++) {
        const dur = baseDuration + (i < remainder ? 1 : 0)
        if (i < prev.length) {
          result.push({ ...prev[i], targetDuration: dur, color: getSectionColor(i) })
        } else {
          result.push({ id: generateId(), name: "", targetDuration: dur, script: "", color: getSectionColor(i), isCompleted: false, topic: "", narrationHistory: [] })
        }
      }
      return result
    })
  }, [totalMinutes])

  const handleRuntimeChange = useCallback((newMinutes: number) => {
    setTotalMinutes(newMinutes)
    const newTotal = Math.round(newMinutes * 60)
    setSections((prev) => {
      const oldTotal = prev.reduce((sum, s) => sum + s.targetDuration, 0)
      if (oldTotal === 0) return createSections(prev.length, newTotal)
      const ratio = newTotal / oldTotal
      const updated = prev.map((s) => ({ ...s, targetDuration: Math.max(1, Math.round(s.targetDuration * ratio)) }))
      return correctTotal(updated, newTotal)
    })
  }, [])

  const handleDurationChange = useCallback((index: number, newDuration: number) => {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, targetDuration: Math.max(1, newDuration) } : s))
  }, [])

  const handleDirectDurationEdit = useCallback((index: number, newDuration: number) => {
    setSections((prev) => {
      const difference = newDuration - prev[index].targetDuration
      const otherTotal = prev.reduce((sum, s, i) => i !== index ? sum + s.targetDuration : sum, 0)
      if (otherTotal <= 0) return prev.map((s, i) => i === index ? { ...s, targetDuration: Math.max(1, newDuration) } : s)
      const updated = prev.map((s, i) => {
        if (i === index) return { ...s, targetDuration: Math.max(1, newDuration) }
        return { ...s, targetDuration: Math.max(1, Math.round(s.targetDuration - difference * (s.targetDuration / otherTotal))) }
      })
      const total = updated.reduce((sum, s) => sum + s.targetDuration, 0)
      const target = Math.round(totalMinutes * 60)
      if (Math.abs(total - target) > 0) {
        const diff = target - total
        let maxIdx = -1, maxVal = 0
        updated.forEach((s, i) => { if (i !== index && s.targetDuration > maxVal) { maxVal = s.targetDuration; maxIdx = i } })
        if (maxIdx >= 0) updated[maxIdx] = { ...updated[maxIdx], targetDuration: Math.max(1, updated[maxIdx].targetDuration + diff) }
      }
      return updated
    })
  }, [totalMinutes])

  const handleNameChange = useCallback((index: number, name: string) => {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, name } : s))
  }, [])

  const handleScriptChange = useCallback((index: number, script: string) => {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, script } : s))
  }, [])

  const handleTopicChange = useCallback((index: number, topic: string) => {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, topic } : s))
  }, [])

  const handleHistoryChange = useCallback((index: number, narrationHistory: string[]) => {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, narrationHistory } : s))
  }, [])

  const handleCompletedChange = useCallback((index: number, isCompleted: boolean) => {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, isCompleted } : s))
  }, [])

  const handleReset = useCallback((index: number) => {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, script: "", isCompleted: false } : s))
  }, [])

  const handleResetDistribution = useCallback(() => {
    if (!window.confirm("모든 섹션을 균등하게 재분배하시겠습니까?\n현재 설정된 시간 배분이 초기화됩니다.")) return
    const targetTotal = Math.round(totalMinutes * 60)
    const count = sections.length
    const baseDuration = Math.floor(targetTotal / count)
    const remainder = targetTotal - baseDuration * count
    setSections((prev) => prev.map((section, idx) => ({ ...section, targetDuration: baseDuration + (idx < remainder ? 1 : 0) })))
  }, [totalMinutes, sections.length])

  const totalActual = sections.reduce((sum, s) => sum + (s.isCompleted ? s.targetDuration : calculateDuration(s.script)), 0)
  const totalPercent = totalSeconds > 0 ? Math.round((totalActual / totalSeconds) * 100) : 0

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
**전체 러닝타임:** ${totalMinutes}분  
**섹션 수:** ${sections.length}

---

${sections.map((section, idx) => `
## #${idx + 1} ${section.name}

**목표 시간:** ${formatTime(section.targetDuration)}  
**작성 시간:** ${formatTime(calculateDuration(section.script))}  
**작성완료:** ${section.isCompleted ? "예" : "아니오"}

### 원고

${section.script || "(작성된 내용 없음)"}

---
`).join("\n")}`
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectName || "script"}_${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [projectName, author, contentType, totalMinutes, sections])

  const importFromMd = useCallback(async (file: File) => {
    setIsLoadingFile(true)
    try {
      const text = await file.text()
      const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/)
      let title = "", authorValue = "", cType = "강의 영상 스크립트", runtime = 25, secCount = 7
      if (frontmatterMatch) {
        const fm = frontmatterMatch[1]
        const titleMatch = fm.match(/title:\s*(.+)/); if (titleMatch) title = titleMatch[1].trim()
        const authorMatch = fm.match(/author:\s*(.+)/); if (authorMatch) authorValue = authorMatch[1].trim()
        const ctMatch = fm.match(/contentType:\s*(.+)/); if (ctMatch) cType = ctMatch[1].trim()
        const rtMatch = fm.match(/runtime:\s*([\d.]+)/); if (rtMatch) runtime = parseFloat(rtMatch[1])
        const scMatch = fm.match(/sections:\s*(\d+)/); if (scMatch) secCount = parseInt(scMatch[1])
      }
      const sectionRegex = /## #(\d+) (.*?)\n[\s\S]*?(?:\*\*작성완료:\*\*\s*(예|아니오)\s*\n)?[\s\S]*?### 원고\n([\s\S]*?)(?=\n## #|\n---\s*$|$)/g
      const parsedSections: { number: number; name: string; script: string; isCompleted: boolean }[] = []
      let match: RegExpExecArray | null
      while ((match = sectionRegex.exec(text)) !== null) {
        parsedSections.push({ number: parseInt(match[1]), name: match[2].trim(), isCompleted: match[3] === "예", script: match[4].trim().replace("(작성된 내용 없음)", "") })
      }
      if (parsedSections.length === 0) {
        const oldRegex = /## #(\d+) (.*?)\n[\s\S]*?### 원고\n([\s\S]*?)(?=\n## #|\n---\s*$|$)/g
        while ((match = oldRegex.exec(text)) !== null) {
          parsedSections.push({ number: parseInt(match[1]), name: match[2].trim(), isCompleted: false, script: match[3].trim().replace("(작성된 내용 없음)", "") })
        }
      }
      setProjectName(title); setAuthor(authorValue); setContentType(cType)
      setTotalMinutes(runtime); setSectionCount(secCount)
      if (!RUNTIME_OPTIONS.includes(runtime)) {
        setIsCustomRuntime(true); setCustomMinutes(Math.floor(runtime)); setCustomSeconds(Math.round((runtime % 1) * 60))
      } else {
        setIsCustomRuntime(false); setCustomMinutes(0); setCustomSeconds(0)
      }
      if (parsedSections.length > 0) {
        const totalSec = Math.round(runtime * 60)
        const count = parsedSections.length
        const baseDuration = Math.floor(totalSec / count)
        const remainder = totalSec - baseDuration * count
        setSections(parsedSections.map((ps, i) => ({ id: generateId(), name: ps.name, targetDuration: baseDuration + (i < remainder ? 1 : 0), script: ps.script, color: getSectionColor(i), isCompleted: ps.isCompleted, topic: "", narrationHistory: [] })))
      } else {
        setSections(createSections(secCount, Math.round(runtime * 60)))
      }
    } catch { alert("파일을 읽는 중 오류가 발생했습니다.") }
    finally { setIsLoadingFile(false) }
  }, [])

  const downloadPDF = async () => {
    const html2canvas = (await import("html2canvas")).default
    const { jsPDF } = await import("jspdf")
    if (!printRef.current) return
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" })
    const pdf = new jsPDF("p", "mm", "a4")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const marginX = 10, marginY = 15
    const contentWidth = pdfWidth - marginX * 2
    const contentHeight = pdfHeight - marginY * 2
    const scale = contentWidth / canvas.width
    const scaledPageHeight = contentHeight / scale
    const findBestBreakPoint = (targetY: number, searchRange: number): number => {
      const ctx = canvas.getContext("2d"); if (!ctx) return targetY
      for (let y = Math.floor(targetY); y >= Math.max(0, Math.floor(targetY - searchRange)); y--) {
        const data = ctx.getImageData(0, y, canvas.width, 1).data
        let isWhite = true
        for (let x = 0; x < canvas.width; x++) { const idx = x * 4; if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) { isWhite = false; break } }
        if (isWhite) return y
      }
      return targetY
    }
    const pageBreaks: number[] = [0]; let currentY = 0
    while (currentY < canvas.height) {
      const nextTargetY = currentY + scaledPageHeight
      if (nextTargetY >= canvas.height) { pageBreaks.push(canvas.height); break }
      const bestBreakY = findBestBreakPoint(nextTargetY, 100)
      pageBreaks.push(bestBreakY); currentY = bestBreakY
    }
    for (let i = 0; i < pageBreaks.length - 1; i++) {
      if (i > 0) pdf.addPage()
      const sourceY = pageBreaks[i], sourceHeight = pageBreaks[i + 1] - pageBreaks[i]
      const pageCanvas = document.createElement("canvas")
      pageCanvas.width = canvas.width; pageCanvas.height = sourceHeight
      const ctx = pageCanvas.getContext("2d")
      if (ctx) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height); ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight) }
      pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", marginX, marginY, contentWidth, sourceHeight * scale)
    }
    pdf.save(`${projectName || "원고"}_${Date.now()}.pdf`)
  }

  const downloadText = useCallback(() => {
    const toneLabel = TONE_STYLES.find(t => t.value === toneStyle)?.label || toneStyle
    const speedInfo = READING_SPEEDS.find(s => s.value === readingSpeed)
    const speedLabel = speedInfo ? `${speedInfo.label} (1분 = ${speedInfo.value}자)` : `${readingSpeed}자/분`
    const textContent = `${projectName || "제목없음"}\n${"=".repeat(50)}\n\n작성자: ${author || "-"}\n콘텐츠 유형: ${contentType}\n전체 러닝타임: ${totalMinutes}분\n섹션 수: ${sections.length}개\n말투 스타일: ${toneLabel}\n낭독 속도: ${speedLabel}\n전체 목표 글자수: ${totalTargetChars.toLocaleString()}자\n\n${"=".repeat(50)}\n\n${sections.map((section, idx) => `\n[#${idx + 1}] ${section.name}\n${"-".repeat(40)}\n목표 시간: ${formatTime(section.targetDuration)}\n작성 시간: ${formatTime(calculateDuration(section.script))}\n작성완료: ${section.isCompleted ? "예" : "아니오"}\n\n${section.script || "(작성된 내용 없음)"}\n`).join("\n")}\n\n${"=".repeat(50)}\n콘텐츠 원고 작성 도구 - youkit`
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob); const a = document.createElement("a")
    a.href = url; a.download = `${projectName || "원고"}_${Date.now()}.txt`; a.click(); URL.revokeObjectURL(url)
  }, [projectName, author, contentType, totalMinutes, sections, toneStyle, readingSpeed, totalTargetChars])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto max-w-[1100px] px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-krds-gray-90">콘텐츠 원고 작성 도구</h1>
            <a href="/guide" target="_blank" rel="noopener noreferrer"
              className="rounded-lg bg-krds-primary px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-krds-primary-dark">
              작성가이드
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
              placeholder="프로젝트 명 (예: 재난영화 홍보영상)"
              className="flex-[3] rounded-xl border border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-krds-gray-30 focus:border-krds-primary" />
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)}
              placeholder="작성자"
              className="flex-[2] rounded-xl border border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-krds-gray-30 focus:border-krds-primary" />
          </div>

          <div className="rounded-xl border border-[#E0E0E0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">콘텐츠 유형</label>
                <select value={contentType} onChange={(e) => setContentType(e.target.value)}
                  className="w-full rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-krds-primary">
                  {CONTENT_TYPES.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">러닝타임</label>
                <div className="flex items-center gap-2">
                  <select
                    value={isCustomRuntime ? "custom" : totalMinutes}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomRuntime(true); setCustomMinutes(Math.floor(totalMinutes)); setCustomSeconds(Math.round((totalMinutes % 1) * 60))
                      } else {
                        setIsCustomRuntime(false); setCustomMinutes(0); setCustomSeconds(0); handleRuntimeChange(parseInt(e.target.value))
                      }
                    }}
                    className={`rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-krds-primary ${isCustomRuntime ? "w-auto" : "w-full"}`}>
                    {RUNTIME_OPTIONS.map((m) => <option key={m} value={m}>{m}분</option>)}
                    <option value="custom">직접 입력</option>
                  </select>
                  {isCustomRuntime && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} max={300} value={customMinutes} placeholder="0"
                          onChange={(e) => { const mins = Math.max(0, Math.min(300, parseInt(e.target.value) || 0)); setCustomMinutes(mins); const t = mins + customSeconds / 60; if (t > 0) handleRuntimeChange(t) }}
                          className="w-16 rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-2 py-3 text-center text-[15px] outline-none focus:border-krds-primary" />
                        <span className="text-[13px] text-krds-gray-50">분</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} max={50} step={10} value={customSeconds} placeholder="0"
                          onChange={(e) => { let secs = Math.round((parseInt(e.target.value) || 0) / 10) * 10; if (secs < 0) secs = 0; if (secs >= 60) secs = 50; setCustomSeconds(secs); const t = customMinutes + secs / 60; if (t > 0) handleRuntimeChange(t) }}
                          className="w-16 rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-2 py-3 text-center text-[15px] outline-none focus:border-krds-primary" />
                        <span className="text-[13px] text-krds-gray-50">초</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">섹션 수</label>
                <select value={sectionCount} onChange={(e) => handleSectionCountChange(parseInt(e.target.value))}
                  className="w-full rounded-lg border-[1.5px] border-[#E0E0E0] bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-krds-primary">
                  {[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map((n) => <option key={n} value={n}>{n}개</option>)}
                </select>
              </div>
            </div>

            <div className="my-5 border-b border-[#F0F0F0]" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">말투 스타일</label>
                <div className="flex flex-wrap gap-2">
                  {TONE_STYLES.map((tone) => (
                    <button key={tone.value} type="button" onClick={() => setToneStyle(tone.value)}
                      className={`rounded-lg border-[1.5px] px-4 py-2 text-[14px] font-medium transition-colors ${toneStyle === tone.value ? "border-krds-primary bg-[#EBF1FE] font-semibold text-krds-primary" : "border-[#E0E0E0] bg-[#F8F8F8] text-[#474747] hover:border-krds-gray-30"}`}>
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#474747]">낭독 속도</label>
                <div className="flex gap-2">
                  {READING_SPEEDS.map((speed) => (
                    <button key={speed.value} type="button" onClick={() => setReadingSpeed(speed.value)}
                      className={`flex flex-1 flex-col items-center rounded-lg border-[1.5px] px-4 py-2 text-[14px] font-medium whitespace-nowrap transition-colors ${readingSpeed === speed.value ? "border-krds-primary bg-[#EBF1FE] font-semibold text-krds-primary" : "border-[#E0E0E0] bg-[#F8F8F8] text-[#474747] hover:border-krds-gray-30"}`}>
                      <span>{speed.label}</span>
                      <span className="mt-0.5 text-[11px] font-normal text-[#9CA3AF]">1분 = {speed.value}자</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <span className="text-[15px] font-medium text-krds-primary">목표 글자수: {totalTargetChars.toLocaleString()}자</span>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-krds-border bg-krds-bg-default p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <Timeline
            sections={sections.map((s) => ({ id: s.id, name: s.name, targetDuration: s.targetDuration, color: s.color }))}
            totalSeconds={totalSeconds} onDurationChange={handleDurationChange}
            onDirectDurationEdit={handleDirectDurationEdit} onResetDistribution={handleResetDistribution} />
        </div>

        <div className="mb-6 flex items-center justify-center gap-3">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoadingFile}
            className="flex items-center gap-2 rounded-lg border-[1.5px] border-krds-primary bg-transparent px-5 py-2.5 text-[15px] font-semibold text-krds-primary transition-colors hover:bg-krds-primary-light disabled:opacity-50">
            <Upload className="h-4 w-4" />{isLoadingFile ? "불러오는 중..." : "프로젝트 불러오기"}
          </button>
          <input ref={fileInputRef} type="file" accept=".md" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) importFromMd(file); e.target.value = "" }} />
          <button type="button" onClick={exportToMd}
            className="flex items-center gap-2 rounded-lg bg-krds-gray-10 px-5 py-2.5 text-[15px] font-semibold text-krds-gray-90 transition-colors hover:bg-krds-gray-30">
            <Save className="h-4 w-4" />프로젝트 저장
          </button>
        </div>

        <div className="mb-8 rounded-xl border border-krds-border bg-krds-bg-default p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[13px] text-krds-gray-50">전체 러닝타임</p>
              <p className="text-2xl font-bold text-krds-gray-90">{formatTime(totalActual)} <span className="text-krds-gray-30">/ {formatTime(totalSeconds)}</span></p>
            </div>
            <div className={`text-3xl font-bold ${totalPercent > 105 ? "text-krds-danger" : totalPercent >= 95 ? "text-krds-success" : "text-krds-gray-30"}`}>{totalPercent}%</div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-krds-gray-10">
            <div className={`h-full transition-all duration-300 ${totalPercent > 105 ? "bg-krds-danger" : totalPercent >= 95 ? "bg-krds-success" : "bg-krds-primary"}`}
              style={{ width: `${Math.min(totalPercent, 100)}%` }} />
          </div>
          {totalPercent > 105 && <p className="mt-3 text-[15px] text-krds-danger">{formatTime(totalActual - totalSeconds)} 초과</p>}
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <SectionCard key={section.id} index={index} name={section.name}
              targetDuration={section.targetDuration} script={section.script}
              color={section.color} isCompleted={section.isCompleted}
              readingSpeed={readingSpeed} contentType={contentType} toneStyle={toneStyle}
              topic={section.topic} narrationHistory={section.narrationHistory}
              onNameChange={(name) => handleNameChange(index, name)}
              onScriptChange={(script) => handleScriptChange(index, script)}
              onCompletedChange={(completed) => handleCompletedChange(index, completed)}
              onReset={() => handleReset(index)}
              onTopicChange={(topic) => handleTopicChange(index, topic)}
              onHistoryChange={(history) => handleHistoryChange(index, history)} />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <button type="button" onClick={downloadText}
              className="flex items-center gap-2 rounded-lg bg-krds-gray-10 px-6 py-3 text-[15px] font-semibold text-krds-gray-90 transition-colors hover:bg-krds-gray-30">
              <FileText className="h-4 w-4" />텍스트 다운로드
            </button>
            <button type="button" onClick={downloadPDF}
              className="flex items-center gap-2 rounded-lg bg-krds-primary px-8 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-krds-primary-dark">
              <Download className="h-4 w-4" />PDF 다운로드
            </button>
          </div>
          <p className="mt-3 text-[13px] text-krds-gray-50">다운로드 버튼 클릭 후 약 3초 정도 후에 다운로드가 진행됩니다.</p>
        </div>
      </main>

      <footer className="mt-12 border-t border-krds-border bg-krds-bg-default">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <div className="text-center text-[15px] leading-relaxed text-krds-gray-50">
            <p>본 사이트에 포함된 모든 콘텐츠의 저작권은 유킷(youkit)에 있으며,</p>
            <p>본 콘텐츠는 대덕대학교 RISE 사업 관련 원고 작성 및 학습 콘텐츠 개발을 위한 목적에 한하여 활용됩니다.</p>
            <p className="mt-4">문의: youkitmedia@naver.com</p>
            <p className="mt-2 text-krds-gray-30">&copy; 2026 youkit. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      <div className="fixed -left-[9999px] top-0">
        <div ref={printRef} className="w-[800px] bg-white p-10 font-sans" style={{ fontFamily: "Noto Sans KR, system-ui, sans-serif" }}>
          <div className="mb-8 border-b border-neutral-200 pb-6">
            <h1 className="text-2xl font-bold text-neutral-900">{projectName || "콘텐츠 원고"}</h1>
            {author && <p className="mt-1 text-neutral-600">작성자: {author}</p>}
            <p className="mt-2 text-neutral-600">콘텐츠 유형: {contentType} | 러닝타임: {totalMinutes}분</p>
            <p className="mt-1 text-neutral-600">전체 러닝타임: {formatTime(totalActual)} / {formatTime(totalSeconds)} ({totalPercent}%)</p>
          </div>
          <div className="space-y-6">
            {sections.map((section, index) => {
              const dur = section.isCompleted ? section.targetDuration : calculateDuration(section.script)
              const pct = section.isCompleted ? 100 : section.targetDuration > 0 ? Math.round((dur / section.targetDuration) * 100) : 0
              return (
                <div key={section.id} className="border-b border-neutral-100 pb-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-neutral-900">#{index + 1} {section.name}</span>
                    {section.isCompleted && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">작성완료</span>}
                  </div>
                  <p className="mb-3 text-sm text-neutral-500">시간: {formatTime(dur)} / 목표: {formatTime(section.targetDuration)} / <span className="font-bold">{pct}%</span></p>
                  {section.script && <div className="rounded bg-neutral-50 p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{section.script}</p></div>}
                </div>
              )
            })}
          </div>
          <div className="mt-8 flex items-center gap-2 text-xs text-neutral-400">
            <FileText className="h-3 w-3" /><span>콘텐츠 원고 작성 도구</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 최종 export ───────────────────────────
export default function ContentPlanner() {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />
  return <ContentPlannerMain />
}
