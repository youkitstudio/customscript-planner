"use client"

import { ChevronDown, ChevronUp, RotateCcw, Sparkles, Loader2, History } from "lucide-react"
import { useState, useRef } from "react"

// 2분(120초) 기준 725자 = 초당 약 6.04자
export const CHARS_PER_SECOND = 725 / 120

export function calculateDuration(text: string): number {
  if (!text) return 0
  return Math.ceil(text.replace(/\s/g, "").length / CHARS_PER_SECOND)
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

interface SectionCardProps {
  index: number
  name: string
  targetDuration: number
  script: string
  color: string
  isCompleted: boolean
  readingSpeed?: number
  contentType?: string
  toneStyle?: string
  topic?: string
  narrationHistory?: string[]
  onNameChange: (name: string) => void
  onScriptChange: (script: string) => void
  onCompletedChange: (completed: boolean) => void
  onReset: () => void
  onTopicChange?: (topic: string) => void
  onHistoryChange?: (history: string[]) => void
}

export default function SectionCard({
  index,
  name,
  targetDuration,
  script,
  color,
  isCompleted,
  readingSpeed = 280,
  contentType = "강의 영상 스크립트",
  toneStyle = "friendly",
  topic = "",
  narrationHistory = [],
  onNameChange,
  onScriptChange,
  onCompletedChange,
  onReset,
  onTopicChange,
  onHistoryChange,
}: SectionCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const topicInputRef = useRef<HTMLInputElement>(null)

  // 히스토리에 추가하는 함수
  const addToHistory = (content: string) => {
    if (!content || content.trim() === "" || !onHistoryChange) return
    const newHistory = [content, ...narrationHistory].slice(0, 5)
    onHistoryChange(newHistory)
  }

  // 히스토리에서 복원하는 함수
  const restoreFromHistory = (content: string) => {
    if (script && script.trim() !== "") {
      addToHistory(script)
    }
    onScriptChange(content)
    setShowHistory(false)
  }

  const handleGenerateNarration = async () => {
    if (!topic || topic.trim() === "") {
      setError("나레이션 주제를 입력해주세요")
      topicInputRef.current?.focus()
      return
    }

    // 기존 원고가 있으면 히스토리에 저장
    if (script && script.trim() !== "") {
      addToHistory(script)
    }

    setIsGenerating(true)
    setError(null)

    try {
      const targetChars = Math.round((targetDuration / 60) * readingSpeed)

      const response = await fetch("/api/generate-narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic,
          contentType: contentType,
          toneStyle: toneStyle,
          targetChars: targetChars,
          duration: targetDuration,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "나레이션 생성에 실패했습니다.")
      }

      onScriptChange(data.narration)
    } catch (err) {
      setError(err instanceof Error ? err.message : "나레이션 생성 중 오류가 발생했습니다.")
    } finally {
      setIsGenerating(false)
    }
  }

  const duration = calculateDuration(script)
  const percent = isCompleted
    ? 100
    : targetDuration > 0
      ? Math.round((duration / targetDuration) * 100)
      : 0
  const charCount = script.replace(/\s/g, "").length
  const targetChars = Math.round((targetDuration / 60) * readingSpeed)

  let statusColor = "text-krds-gray-30"
  let statusText = ""
  let barColor = "bg-krds-gray-30"

  if (isCompleted) {
    statusColor = "text-krds-success"
    statusText = "작성완료"
    barColor = "bg-krds-success"
  } else if (percent > 105) {
    statusColor = "text-krds-danger"
    statusText = `${formatTime(duration - targetDuration)} 초과`
    barColor = "bg-krds-danger"
  } else if (percent >= 95) {
    statusColor = "text-krds-success"
    statusText = "적정"
    barColor = "bg-krds-success"
  } else if (percent > 0) {
    barColor = "bg-krds-primary"
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E0E0E0] bg-white">
      {/* 헤더 */}
      <div
        className="flex w-full items-center justify-between gap-4 border-b border-[#E0E0E0] bg-[#F8F8F8] px-5 py-3.5"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        {/* 좌측: 번호 + 이름 */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            #{index + 1}
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="섹션명을 입력하세요"
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] font-semibold text-krds-gray-90 outline-none placeholder:text-krds-gray-40 placeholder:font-normal placeholder:italic"
          />
          <button
            type="button"
            onClick={handleGenerateNarration}
            disabled={isGenerating}
            className="ml-2 flex shrink-0 items-center gap-1.5 rounded-lg bg-krds-primary px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-krds-primary-dark focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI 나레이션 생성</span>
              </>
            )}
          </button>
        </div>

        {/* 우측: 작성완료 체크 + 되돌리기 + 시간 + 접기 버튼 */}
        <div className="flex shrink-0 items-center gap-3">
          <label className="hidden cursor-pointer items-center gap-1.5 text-[13px] select-none sm:flex">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => onCompletedChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-krds-primary"
            />
            <span className="whitespace-nowrap text-krds-gray-50">작성완료(분량 상관없음)</span>
          </label>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onReset()
            }}
            className="hidden items-center gap-1 text-[13px] text-krds-gray-50 transition-colors hover:text-krds-danger focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary sm:flex"
            title="원고 초기화"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="whitespace-nowrap">되돌리기</span>
          </button>

          <span className="whitespace-nowrap text-[13px] text-krds-gray-50">
            {formatTime(duration)} / {formatTime(targetDuration)} /{" "}
            <span className={`font-bold ${statusColor}`}>{percent}%</span>
          </span>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 transition-colors hover:bg-krds-gray-10 focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary"
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4 text-krds-gray-50" />
            ) : (
              <ChevronUp className="h-4 w-4 text-krds-gray-50" />
            )}
          </button>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-1 bg-krds-gray-10">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* 본문 */}
      {!collapsed && (
        <div className="p-5">
          {/* 나레이션 주제 입력 필드 */}
          <div className="mb-3">
            <label className="mb-2 block text-[13px] font-medium text-krds-gray-70">
              나레이션 주제 / 키워드
            </label>
            <input
              ref={topicInputRef}
              type="text"
              value={topic}
              onChange={(e) => onTopicChange?.(e.target.value)}
              placeholder="예) 포토샵 레이어 기초 개념과 활용법"
              className="w-full rounded-lg border-[1.5px] border-krds-border px-4 py-2.5 text-[15px] outline-none transition-colors placeholder:text-krds-gray-30 focus:border-krds-primary"
            />
          </div>

          <textarea
            value={script}
            onChange={(e) => onScriptChange(e.target.value)}
            onBlur={(e) => {
              // 포커스를 잃을 때 히스토리에 저장
              const val = e.target.value
              if (
                val.trim() !== "" &&
                (narrationHistory.length === 0 || narrationHistory[0] !== val)
              ) {
                addToHistory(val)
              }
            }}
            placeholder={`원고를 입력하세요 (목표: ${formatTime(targetDuration)}, 약 ${targetChars}자)`}
            className="min-h-36 w-full resize-y rounded-lg border-[1.5px] border-krds-border p-4 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-krds-gray-30 focus:border-krds-primary"
          />

          {/* 하단: 글자수 + 히스토리 */}
          <div className="mt-2 flex items-center justify-between text-[13px]">
            <span className="text-krds-gray-50">
              {charCount}자
              <span className="ml-1 text-krds-gray-30">/ 목표 {targetChars}자</span>
              {charCount > 0 && charCount < targetChars * 0.85 && (
                <span className="ml-2 text-amber-500">글자수 부족</span>
              )}
              {charCount >= targetChars * 0.95 && charCount <= targetChars * 1.1 && (
                <span className="ml-2 text-krds-success">✓ 적정</span>
              )}
            </span>

            <div className="flex items-center gap-3">
              {statusText && <span className={statusColor}>{statusText}</span>}

              {/* 히스토리 버튼 */}
              {narrationHistory.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1 rounded border border-[#E0E0E0] px-2.5 py-1 text-[12px] text-krds-gray-50 transition-colors hover:border-krds-primary hover:text-krds-primary"
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>이전 버전 ({narrationHistory.length}개)</span>
                  </button>

                  {/* 히스토리 드롭다운 */}
                  {showHistory && (
                    <>
                      {/* 바깥 클릭 감지용 오버레이 */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowHistory(false)}
                      />
                      <div className="absolute right-0 bottom-full z-50 mb-2 w-80 rounded-xl border border-[#E0E0E0] bg-white p-3 shadow-lg">
                        <div className="mb-2 text-[13px] font-semibold text-krds-gray-70">
                          이전 버전 ({narrationHistory.length}/5)
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {narrationHistory.map((content, idx) => (
                            <div
                              key={idx}
                              className="flex items-start justify-between gap-2 rounded-lg border border-[#E0E0E0] bg-[#F8F8F8] p-2.5"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-krds-gray-30 mb-1">
                                  버전 {narrationHistory.length - idx}
                                  <span className="ml-1">
                                    ({content.replace(/\s/g, "").length}자)
                                  </span>
                                </div>
                                <p className="text-[12px] text-krds-gray-70 line-clamp-2 leading-relaxed">
                                  {content.slice(0, 50)}
                                  {content.length > 50 ? "..." : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => restoreFromHistory(content)}
                                className="shrink-0 rounded-md bg-krds-primary px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-krds-primary-dark"
                              >
                                복원
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-krds-danger">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
