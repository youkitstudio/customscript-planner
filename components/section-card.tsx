"use client"

import { ChevronDown, ChevronUp, RotateCcw, History } from "lucide-react"
import { useState } from "react"

// 하위 호환용 상수
export const CHARS_PER_SECOND = 725 / 120

// readingSpeed(자/분) 기반 duration 계산 — readingSpeed 미전달 시 기존 방식 fallback
export function calculateDuration(text: string, readingSpeed?: number): number {
  if (!text) return 0
  const charCount = text.replace(/\s/g, "").length
  if (readingSpeed && readingSpeed > 0) {
    return Math.ceil(charCount / (readingSpeed / 60))
  }
  return Math.ceil(charCount / CHARS_PER_SECOND)
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
  const [showHistory, setShowHistory] = useState(false)

  const addToHistory = (content: string) => {
    if (!content || content.trim() === "" || !onHistoryChange) return
    const newHistory = [content, ...narrationHistory].slice(0, 5)
    onHistoryChange(newHistory)
  }

  const restoreFromHistory = (content: string) => {
    if (script && script.trim() !== "") {
      addToHistory(script)
    }
    onScriptChange(content)
    setShowHistory(false)
  }


  // readingSpeed 기반으로 duration과 percent 계산
  const duration = isCompleted
    ? targetDuration
    : calculateDuration(script, readingSpeed)

  // 글자수 기반 퍼센트 (readingSpeed 일치 보장)
  const charCount = script.replace(/\s/g, "").length
  const targetChars = Math.round((targetDuration / 60) * readingSpeed)
  const charPercent = targetChars > 0 ? Math.round((charCount / targetChars) * 100) : 0

  // 표시용 퍼센트: 글자수 기반 (100% 초과 허용, 캡핑 없음)
  const percent = isCompleted ? 100 : charPercent

  let statusColor = "text-krds-gray-30"
  let statusText = ""
  let barColor = "bg-krds-gray-30"

  if (isCompleted) {
    statusColor = "text-krds-success"
    statusText = "작성완료"
    barColor = "bg-krds-success"
  } else if (percent > 110) {
    // 110% 초과: 빨강 + 초과 글자수 표시
    statusColor = "text-krds-danger"
    statusText = `${percent}% (${charCount - targetChars}자 초과)`
    barColor = "bg-krds-danger"
  } else if (percent >= 90) {
    statusColor = "text-krds-success"
    statusText = "적정"
    barColor = "bg-krds-success"
  } else if (percent > 0) {
    barColor = "bg-krds-primary"
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E0E0E0] bg-white">
      {/* ─── 섹션 헤더 ─── */}
      <div
        className="flex w-full items-center justify-between gap-4 border-b border-[#E0E0E0] bg-[#F8F8F8] px-5 py-3.5"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        {/* 좌측: 번호 + 섹션명 */}
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
        </div>

        {/* 우측: 작성완료 + 되돌리기 + 시간 + 접기 */}
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
            <span className="whitespace-nowrap">원고 초기화</span>
          </button>

          <span className="whitespace-nowrap text-[13px] text-krds-gray-50">
            {formatTime(duration)} / {formatTime(targetDuration)} /{" "}
            <span className={`font-bold ${
              isCompleted ? "text-krds-success"
              : percent > 110 ? "text-krds-danger"
              : percent >= 90 ? "text-krds-success"
              : "text-krds-gray-50"
            }`}>{percent}%</span>
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

      {/* 프로그레스 바 — 초과 시 빨강, 최대 110%까지 시각적으로 표현 */}
      <div className="h-1 bg-krds-gray-10 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(percent, 110)}%` }}
        />
      </div>

      {/* 본문 */}
      {!collapsed && (
        <div className="p-5">
          {/* ─── 나레이션 주제 + AI 버튼 가로 배치 ─── */}


          <textarea
            value={script}
            onChange={(e) => onScriptChange(e.target.value)}
            onBlur={(e) => {
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
              {charCount > 0 && percent < 85 && (
                <span className="ml-2 text-amber-500">글자수 부족</span>
              )}
              {percent > 110 && (
                <span className="ml-2 text-krds-danger">{charCount - targetChars}자 초과</span>
              )}
              {percent >= 90 && percent <= 110 && !isCompleted && (
                <span className="ml-2 text-krds-success">✓ 적정</span>
              )}
            </span>

            <div className="flex items-center gap-3">
              {statusText && <span className={statusColor}>{statusText}</span>}

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

                  {showHistory && (
                    <>
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

        </div>
      )}
    </div>
  )
}
