"use client"

import { useState, useRef, useCallback } from "react"
import { Download, Upload, Save, FileText } from "lucide-react"
import Timeline, { getSectionColor } from "@/components/timeline"
import SectionCard, {
  calculateDuration,
  formatTime,
} from "@/components/section-card"

// ── 비밀번호 변경 시 여기만 수정 ──────────
const SITE_PASSWORD = "youkit2013"
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

// ── 비밀번호 화면 ─────────────────────────
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
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F7F7F8",
      fontFamily: "Pretendard, Apple SD Gothic Neo, sans-serif",
    }}>
      <div style={{
        background: "#fff",
        border: "1px solid #E5E5E5",
        borderRadius: 16,
        padding: "48px 40px",
        width: 380,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.04)",
        textAlign: "center",
      }}>
        {/* 로고 영역 */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 32,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#5B5BD6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#fff",
            fontWeight: 700,
          }}>Y</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.02em" }}>
            YouKit Studio
          </span>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C1C1E", marginBottom: 6, letterSpacing: "-0.03em" }}>
          콘텐츠 원고 작성 도구
        </h2>
        <p style={{ fontSize: 14, color: "#6B6B6E", marginBottom: 28, lineHeight: 1.6 }}>
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
            width: "100%",
            padding: "11px 14px",
            border: pwError ? "1.5px solid #DC2626" : "1.5px solid #E5E5E5",
            borderRadius: 10,
            fontSize: 14,
            outline: "none",
            marginBottom: 8,
            boxSizing: "border-box",
            color: "#1C1C1E",
            background: "#FAFAFA",
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
        />
        {pwError && (
          <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 8 }}>
            비밀번호가 올바르지 않습니다
          </p>
        )}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "11px",
            background: "#5B5BD6",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 4,
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
          }}
        >
          입장하기
        </button>
        <p style={{ fontSize: 12, color: "#AEAEB2", marginTop: 20 }}>
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
    const markdown = `---\ntitle: ${projectName || "제목없음"}\nauthor: ${author || ""}\ncontentType: ${contentType}\nruntime: ${totalMinutes}\nsections: ${sections.length}\ncreated: ${new Date().toISOString()}\n---\n\n# ${projectName || "제목없음"}\n\n**작성자:** ${author || "-"}  \n**콘텐츠 유형:** ${contentType}  \n**전체 러닝타임:** ${totalMinutes}분  \n**섹션 수:** ${sections.length}\n\n---\n\n${sections.map((section, idx) => `\n## #${idx + 1} ${section.name}\n\n**목표 시간:** ${formatTime(section.targetDuration)}  \n**작성 시간:** ${formatTime(calculateDuration(section.script))}  \n**작성완료:** ${section.isCompleted ? "예" : "아니오"}\n\n### 원고\n\n${section.script || "(작성된 내용 없음)"}\n\n---\n`).join("\n")}`
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

  const downloadPDF = () => {
    // window.print() 방식: 한글 완벽 지원 + 텍스트 복사 가능 + 용량 최소화
    const toneLabel = TONE_STYLES.find(t => t.value === toneStyle)?.label || toneStyle
    const speedInfo = READING_SPEEDS.find(s => s.value === readingSpeed)

    const sectionsHtml = sections.map((section, idx) => {
      const dur = section.isCompleted ? section.targetDuration : calculateDuration(section.script)
      const pct = section.isCompleted ? 100 : section.targetDuration > 0 ? Math.round((dur / section.targetDuration) * 100) : 0
      const scriptHtml = section.script
        ? section.script.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>")
        : "<span style='color:#aaa'>(작성된 내용 없음)</span>"
      return `
        <div class="section">
          <div class="section-header">
            <span class="section-num">#${idx + 1}</span>
            <span class="section-name">${section.name || "(섹션명 없음)"}</span>
            ${section.isCompleted ? '<span class="badge-done">작성완료</span>' : ''}
          </div>
          <div class="section-meta">목표 ${formatTime(section.targetDuration)} / 작성 ${formatTime(dur)} / <strong>${pct}%</strong></div>
          <div class="script-box">${scriptHtml}</div>
        </div>`
    }).join("")

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${projectName || "원고"}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; font-size: 12px; color: #1C1C1E; background: #fff; padding: 20px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .meta { color: #666; font-size: 11px; margin-bottom: 2px; }
  .divider { border: none; border-top: 1px solid #E5E5E5; margin: 8px 0; }
  .section { border-bottom: 1px solid #F0F0F0; padding-bottom: 10px; margin-bottom: 10px; }
  .section-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
  .section-num { font-size: 12px; font-weight: 700; color: #6C5CE7; }
  .section-name { font-size: 13px; font-weight: 700; }
  .badge-done { font-size: 10px; font-weight: 700; color: #1A7F45; background: #DCFCE7; border-radius: 3px; padding: 1px 6px; }
  .section-meta { font-size: 10px; color: #888; margin-bottom: 5px; }
  .script-box { background: #FAFAFA; border-radius: 4px; padding: 8px 12px; font-size: 12px; line-height: 1.75; color: #333; white-space: pre-wrap; word-break: keep-all; }
  .footer { margin-top: 16px; font-size: 10px; color: #AEAEB2; text-align: center; }
  @media print {
    body { padding: 0; }
    @page { margin: 12mm 13mm; size: A4; }
  }
</style>
</head>
<body>
  <h1>${projectName || "콘텐츠 원고"}</h1>
  ${author ? `<p class="meta">작성자: ${author}</p>` : ""}
  <p class="meta">콘텐츠 유형: ${contentType}  |  러닝타임: ${totalMinutes}분  |  말투: ${toneLabel}  |  낭독속도: ${speedInfo?.value || readingSpeed}자/분</p>
  <p class="meta">전체 러닝타임: ${formatTime(totalActual)} / ${formatTime(totalSeconds)} (${totalPercent}%)</p>
  <hr class="divider">
  ${sectionsHtml}
  <div class="footer">콘텐츠 원고 작성 도구 · YouKit</div>
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
</body>
</html>`

    const win = window.open("", "_blank", "width=900,height=700")
    if (win) { win.document.write(html); win.document.close() }
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

  /* ── 스타일 상수 (StoryKit 감성) ── */
  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E5E5E5",
    borderRadius: 12,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  }
  const inputBase: React.CSSProperties = {
    borderRadius: 8,
    border: "1px solid #E5E5E5",
    background: "#FAFAFA",
    padding: "10px 13px",
    fontSize: 14,
    outline: "none",
    color: "#1C1C1E",
    fontFamily: "inherit",
    letterSpacing: "-0.01em",
    width: "100%",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  }
  const labelBase: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#6B6B6E",
    marginBottom: 7,
    letterSpacing: "-0.01em",
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F8", fontFamily: "Pretendard, Apple SD Gothic Neo, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E5E5", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* 로고 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: "#5B5BD6",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#fff", fontWeight: 700,
            }}>Y</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.03em" }}>
              콘텐츠 원고 작성 도구
            </span>
          </div>
          {/* 작성가이드 버튼 */}
          <a href="/guide" target="_blank" rel="noopener noreferrer"
            style={{
              background: "#5B5BD6",
              color: "#fff",
              borderRadius: 8,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}>
            작성가이드
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── 프로젝트 정보 입력 ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input
            type="text" value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="프로젝트 명 (예: 재난영화 홍보영상)"
            style={{ ...inputBase, flex: 3 }}
            onFocus={e => (e.target.style.borderColor = "#5B5BD6")}
            onBlur={e => (e.target.style.borderColor = "#E5E5E5")}
          />
          <input
            type="text" value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="작성자"
            style={{ ...inputBase, flex: 2 }}
            onFocus={e => (e.target.style.borderColor = "#5B5BD6")}
            onBlur={e => (e.target.style.borderColor = "#E5E5E5")}
          />
        </div>

        {/* ── 설정 카드 ── */}
        <div style={{ ...card, padding: "24px", marginBottom: 16 }}>

          {/* 상단 3열: 콘텐츠 유형 / 러닝타임 / 섹션 수 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={labelBase}>콘텐츠 유형</label>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)} style={inputBase}
                onFocus={e => (e.target.style.borderColor = "#5B5BD6")}
                onBlur={e => (e.target.style.borderColor = "#E5E5E5")}>
                {CONTENT_TYPES.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
              </select>
            </div>
            <div>
              <label style={labelBase}>러닝타임</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  value={isCustomRuntime ? "custom" : totalMinutes}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setIsCustomRuntime(true); setCustomMinutes(Math.floor(totalMinutes)); setCustomSeconds(Math.round((totalMinutes % 1) * 60))
                    } else {
                      setIsCustomRuntime(false); setCustomMinutes(0); setCustomSeconds(0); handleRuntimeChange(parseInt(e.target.value))
                    }
                  }}
                  style={{ ...inputBase, width: isCustomRuntime ? "auto" : "100%", flex: isCustomRuntime ? "none" : 1 }}
                  onFocus={e => (e.target.style.borderColor = "#5B5BD6")}
                  onBlur={e => (e.target.style.borderColor = "#E5E5E5")}>
                  {RUNTIME_OPTIONS.map((m) => <option key={m} value={m}>{m}분</option>)}
                  <option value="custom">직접 입력</option>
                </select>
                {isCustomRuntime && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input type="number" min={0} max={300} value={customMinutes} placeholder="0"
                        onChange={(e) => { const mins = Math.max(0, Math.min(300, parseInt(e.target.value) || 0)); setCustomMinutes(mins); const t = mins + customSeconds / 60; if (t > 0) handleRuntimeChange(t) }}
                        style={{ ...inputBase, width: 52, textAlign: "center", padding: "10px 6px" }} />
                      <span style={{ fontSize: 12, color: "#6B6B6E" }}>분</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input type="number" min={0} max={50} step={10} value={customSeconds} placeholder="0"
                        onChange={(e) => { let secs = Math.round((parseInt(e.target.value) || 0) / 10) * 10; if (secs < 0) secs = 0; if (secs >= 60) secs = 50; setCustomSeconds(secs); const t = customMinutes + secs / 60; if (t > 0) handleRuntimeChange(t) }}
                        style={{ ...inputBase, width: 52, textAlign: "center", padding: "10px 6px" }} />
                      <span style={{ fontSize: 12, color: "#6B6B6E" }}>초</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={labelBase}>섹션 수</label>
              <select value={sectionCount} onChange={(e) => handleSectionCountChange(parseInt(e.target.value))} style={inputBase}
                onFocus={e => (e.target.style.borderColor = "#5B5BD6")}
                onBlur={e => (e.target.style.borderColor = "#E5E5E5")}>
                {[2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map((n) => <option key={n} value={n}>{n}개</option>)}
              </select>
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ height: 1, background: "#F5F5F5", marginBottom: 20 }} />

          {/* 하단 2열: 말투 스타일 / 낭독 속도 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelBase}>말투 스타일</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TONE_STYLES.map((tone) => (
                  <button key={tone.value} type="button" onClick={() => setToneStyle(tone.value)}
                    style={{
                      borderRadius: 7,
                      border: toneStyle === tone.value ? "1.5px solid #5B5BD6" : "1px solid #E5E5E5",
                      background: toneStyle === tone.value ? "#EFEFFD" : "#FAFAFA",
                      color: toneStyle === tone.value ? "#5B5BD6" : "#3A3A3C",
                      padding: "7px 13px",
                      fontSize: 13,
                      fontWeight: toneStyle === tone.value ? 600 : 400,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "-0.01em",
                      transition: "all 0.12s",
                    }}>
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelBase}>낭독 속도</label>
              <div style={{ display: "flex", gap: 6 }}>
                {READING_SPEEDS.map((speed) => (
                  <button key={speed.value} type="button" onClick={() => setReadingSpeed(speed.value)}
                    style={{
                      flex: 1,
                      borderRadius: 7,
                      border: readingSpeed === speed.value ? "1.5px solid #5B5BD6" : "1px solid #E5E5E5",
                      background: readingSpeed === speed.value ? "#EFEFFD" : "#FAFAFA",
                      color: readingSpeed === speed.value ? "#5B5BD6" : "#3A3A3C",
                      padding: "8px 6px",
                      fontSize: 12,
                      fontWeight: readingSpeed === speed.value ? 600 : 400,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                      transition: "all 0.12s",
                    }}>
                    <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{speed.label}</span>
                    <span style={{ fontSize: 10, color: readingSpeed === speed.value ? "#8B8BDF" : "#AEAEB2" }}>1분 = {speed.value}자</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 목표 글자수 */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <span style={{
              fontSize: 13, fontWeight: 600, color: "#5B5BD6",
              background: "#EFEFFD", borderRadius: 6,
              padding: "4px 12px", letterSpacing: "-0.01em",
            }}>
              목표 글자수: {totalTargetChars.toLocaleString()}자
            </span>
          </div>
        </div>

        {/* ── 타임라인 ── */}
        <div style={{ ...card, padding: "20px 24px", marginBottom: 16 }}>
          <Timeline
            sections={sections.map((s) => ({ id: s.id, name: s.name, targetDuration: s.targetDuration, color: s.color }))}
            totalSeconds={totalSeconds}
            onDurationChange={handleDurationChange}
            onDirectDurationEdit={handleDirectDurationEdit}
            onResetDistribution={handleResetDistribution}
          />
        </div>

        {/* ── 프로젝트 저장/불러오기 ── */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoadingFile}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              border: "1px solid #5B5BD6", background: "transparent",
              color: "#5B5BD6", borderRadius: 8,
              padding: "9px 18px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
              opacity: isLoadingFile ? 0.5 : 1,
            }}>
            <Upload style={{ width: 14, height: 14 }} />
            {isLoadingFile ? "불러오는 중..." : "프로젝트 불러오기"}
          </button>
          <input ref={fileInputRef} type="file" accept=".md" style={{ display: "none" }}
            onChange={(e) => { const file = e.target.files?.[0]; if (file) importFromMd(file); e.target.value = "" }} />
          <button type="button" onClick={exportToMd}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#F5F5F5", color: "#3A3A3C",
              border: "1px solid #E5E5E5", borderRadius: 8,
              padding: "9px 18px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
            }}>
            <Save style={{ width: 14, height: 14 }} />프로젝트 저장
          </button>
        </div>

        {/* ── 전체 진행률 ── */}
        <div style={{ ...card, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: "#6B6B6E", marginBottom: 4, letterSpacing: "-0.01em" }}>전체 러닝타임</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.04em", lineHeight: 1 }}>
                {formatTime(totalActual)}
                <span style={{ fontSize: 16, fontWeight: 400, color: "#AEAEB2", marginLeft: 6 }}>/ {formatTime(totalSeconds)}</span>
              </p>
            </div>
            <p style={{
              fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em",
              color: totalPercent > 105 ? "#DC2626" : totalPercent >= 95 ? "#1A7F45" : "#AEAEB2",
            }}>{totalPercent}%</p>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "#F5F5F5", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              borderRadius: 99,
              width: `${Math.min(totalPercent, 100)}%`,
              background: totalPercent > 105 ? "#DC2626" : totalPercent >= 95 ? "#1A7F45" : "#5B5BD6",
              transition: "width 0.3s ease",
            }} />
          </div>
          {totalPercent > 105 && (
            <p style={{ marginTop: 8, fontSize: 13, color: "#DC2626", fontWeight: 500 }}>
              {formatTime(totalActual - totalSeconds)} 초과
            </p>
          )}
        </div>

        {/* ── 섹션 카드 목록 ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

        {/* ── 다운로드 ── */}
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={downloadText}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#F5F5F5", color: "#3A3A3C",
                border: "1px solid #E5E5E5", borderRadius: 9,
                padding: "11px 20px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
              }}>
              <FileText style={{ width: 15, height: 15 }} />텍스트 다운로드
            </button>
            <button type="button" onClick={downloadPDF}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#5B5BD6", color: "#fff",
                border: "none", borderRadius: 9,
                padding: "11px 24px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
              }}>
              <Download style={{ width: 15, height: 15 }} />PDF 인쇄/저장
            </button>
          </div>
          <p style={{ fontSize: 12, color: "#AEAEB2", letterSpacing: "-0.01em" }}>
            다운로드 버튼 클릭 후 약 3초 정도 후에 다운로드가 진행됩니다.
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ marginTop: 60, borderTop: "1px solid #E5E5E5", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#6B6B6E", lineHeight: 1.8, letterSpacing: "-0.01em" }}>
            본 사이트에 포함된 모든 콘텐츠의 저작권은 유킷(youkit)에 있으며,<br />
            본 콘텐츠는 대덕대학교 RISE 사업 관련 원고 작성 및 학습 콘텐츠 개발을 위한 목적에 한하여 활용됩니다.
          </p>
          <p style={{ marginTop: 12, fontSize: 13, color: "#6B6B6E", letterSpacing: "-0.01em" }}>문의: youkitmedia@naver.com</p>
          <p style={{ marginTop: 6, fontSize: 12, color: "#AEAEB2" }}>&copy; 2026 youkit. All Rights Reserved.</p>
        </div>
      </footer>

      {/* ── PDF 인쇄용 숨김 영역 (로직 완전 동일) ── */}
      <div style={{ position: "fixed", left: -9999, top: 0 }}>
        <div ref={printRef} style={{ width: 800, background: "#fff", padding: 40, fontFamily: "Noto Sans KR, system-ui, sans-serif" }}>
          <div style={{ marginBottom: 32, borderBottom: "1px solid #E5E5E5", paddingBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1C1C1E" }}>{projectName || "콘텐츠 원고"}</h1>
            {author && <p style={{ marginTop: 4, color: "#6B6B6E" }}>작성자: {author}</p>}
            <p style={{ marginTop: 8, color: "#6B6B6E" }}>콘텐츠 유형: {contentType} | 러닝타임: {totalMinutes}분</p>
            <p style={{ marginTop: 4, color: "#6B6B6E" }}>전체 러닝타임: {formatTime(totalActual)} / {formatTime(totalSeconds)} ({totalPercent}%)</p>
          </div>
          <div>
            {sections.map((section, index) => {
              const dur = section.isCompleted ? section.targetDuration : calculateDuration(section.script)
              const pct = section.isCompleted ? 100 : section.targetDuration > 0 ? Math.round((dur / section.targetDuration) * 100) : 0
              return (
                <div key={section.id} style={{ borderBottom: "1px solid #F5F5F5", paddingBottom: 24, marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E" }}>#{index + 1} {section.name}</span>
                    {section.isCompleted && <span style={{ fontSize: 11, fontWeight: 600, color: "#1A7F45", background: "#DCFCE7", borderRadius: 4, padding: "2px 8px" }}>작성완료</span>}
                  </div>
                  <p style={{ fontSize: 13, color: "#6B6B6E", marginBottom: 12 }}>시간: {formatTime(dur)} / 목표: {formatTime(section.targetDuration)} / <strong>{pct}%</strong></p>
                  {section.script && <div style={{ background: "#FAFAFA", borderRadius: 8, padding: 16 }}><p style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.8, color: "#1C1C1E" }}>{section.script}</p></div>}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 6, color: "#AEAEB2", fontSize: 11 }}>
            <FileText style={{ width: 12, height: 12 }} /><span>콘텐츠 원고 작성 도구</span>
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
