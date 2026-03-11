"use client"

import React from "react"

import { useRef, useState, useCallback, useEffect } from "react"

const SECTION_COLORS = [
  "#E9B4E8",
  "#A5D8E6",
  "#B8E986",
  "#F4C183",
  "#E88DB7",
  "#D4E157",
  "#80DEEA",
  "#F48FB1",
  "#CE93D8",
  "#90CAF9",
  "#A5D6A7",
  "#FFE082",
  "#FFAB91",
  "#B0BEC5",
  "#EF9A9A",
  "#81D4FA",
]

interface TimelineSection {
  id: string
  name: string
  targetDuration: number
  color: string
}

interface TimelineProps {
  sections: TimelineSection[]
  totalSeconds: number
  onDurationChange: (sectionIndex: number, newDuration: number) => void
  onDirectDurationEdit: (sectionIndex: number, newDuration: number) => void
  onResetDistribution?: () => void
}

function formatTimeShort(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins === 0) return `00:${secs.toString().padStart(2, "0")}`
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function parseTimeInput(input: string): number {
  const trimmed = input.trim()
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":")
    const minutes = parseInt(parts[0]) || 0
    const seconds = parseInt(parts[1]) || 0
    return minutes * 60 + seconds
  }
  return parseInt(trimmed) || 0
}

export function getSectionColor(index: number): string {
  return SECTION_COLORS[index % SECTION_COLORS.length]
}

export default function Timeline({
  sections,
  totalSeconds,
  onDurationChange,
  onDirectDurationEdit,
  onResetDistribution,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragTooltip, setDragTooltip] = useState<{
    x: number
    leftTime: string
    rightTime: string
  } | null>(null)
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(
    null
  )
  const [editingValue, setEditingValue] = useState("")
  const dragStartX = useRef(0)
  const dragStartDurations = useRef<number[]>([])

  const totalDuration = sections.reduce((sum, s) => sum + s.targetDuration, 0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, boundaryIndex: number) => {
      e.preventDefault()
      setDraggingIndex(boundaryIndex)
      dragStartX.current = e.clientX
      dragStartDurations.current = sections.map((s) => s.targetDuration)
    },
    [sections]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, boundaryIndex: number) => {
      e.preventDefault()
      setDraggingIndex(boundaryIndex)
      dragStartX.current = e.touches[0].clientX
      dragStartDurations.current = sections.map((s) => s.targetDuration)
    },
    [sections]
  )

  const processMove = useCallback(
    (clientX: number) => {
      if (draggingIndex === null || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const timelineWidth = rect.width
      const deltaX = clientX - dragStartX.current
      const pixelsPerSecond = timelineWidth / totalDuration
      let secondsChange = deltaX / pixelsPerSecond

      // 1초 단위 스냅
      secondsChange = Math.round(secondsChange)

      const leftOriginal = dragStartDurations.current[draggingIndex]
      const rightOriginal = dragStartDurations.current[draggingIndex + 1]
      const MIN_DURATION = 1

      let newLeft = leftOriginal + secondsChange
      let newRight = rightOriginal - secondsChange

      if (newLeft < MIN_DURATION) {
        newLeft = MIN_DURATION
        newRight = leftOriginal + rightOriginal - MIN_DURATION
      }
      if (newRight < MIN_DURATION) {
        newRight = MIN_DURATION
        newLeft = leftOriginal + rightOriginal - MIN_DURATION
      }

      onDurationChange(draggingIndex, newLeft)
      onDurationChange(draggingIndex + 1, newRight)

      // 툴팁 위치 계산
      const leftSumBefore = dragStartDurations.current
        .slice(0, draggingIndex)
        .reduce((a, b) => a + b, 0)
      const boundaryPos =
        ((leftSumBefore + newLeft) / totalDuration) * timelineWidth
      setDragTooltip({
        x: boundaryPos,
        leftTime: formatTimeShort(newLeft),
        rightTime: formatTimeShort(newRight),
      })
    },
    [draggingIndex, totalDuration, onDurationChange]
  )

  useEffect(() => {
    if (draggingIndex === null) return

    const handleMouseMove = (e: MouseEvent) => processMove(e.clientX)
    const handleTouchMove = (e: TouchEvent) =>
      processMove(e.touches[0].clientX)
    const handleEnd = () => {
      setDraggingIndex(null)
      setDragTooltip(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleEnd)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleEnd)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleEnd)
    }
  }, [draggingIndex, processMove])

  const handleEditConfirm = useCallback(() => {
    if (editingSectionIndex === null) return
    const newDuration = parseTimeInput(editingValue)
    if (newDuration >= 1) {
      onDirectDurationEdit(editingSectionIndex, newDuration)
    }
    setEditingSectionIndex(null)
    setEditingValue("")
  }, [editingSectionIndex, editingValue, onDirectDurationEdit])

  // 누적 시간 계산
  const cumulativeTimes: number[] = [0]
  sections.forEach((s, i) => {
    cumulativeTimes.push(cumulativeTimes[i] + s.targetDuration)
  })

  return (
    <div className="relative select-none">
      {/* 상단 라벨 + 균등 분배 버튼 */}
      <div className="mb-1 flex items-center justify-between text-[13px] text-krds-gray-50">
        <span>start {formatTimeShort(0)}</span>
        {onResetDistribution && (
          <button
            type="button"
            onClick={onResetDistribution}
            className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-krds-border bg-krds-bg-default px-3 py-1.5 text-[13px] font-medium text-krds-gray-70 transition-colors hover:border-krds-gray-30 hover:bg-krds-gray-05 hover:text-krds-gray-90 focus:outline-2 focus:outline-offset-2 focus:outline-krds-primary"
            title="섹션을 균등하게 재분배"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>균등 분배</span>
          </button>
        )}
        <span>Finish {formatTimeShort(totalSeconds)}</span>
      </div>

      {/* 빨간 삼각형 (상단) */}
      <div className="relative mb-0.5 h-4">
        {cumulativeTimes.slice(1, -1).map((time, index) => {
          const leftPercent = (time / totalDuration) * 100
          return (
            <div
              key={index}
              className="absolute flex flex-col items-center"
              style={{
                left: `${leftPercent}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div
                className="h-0 w-0"
                style={{
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "6px solid #EF4444",
                }}
              />
            </div>
          )
        })}
      </div>

      {/* 타임라인 바 */}
      <div
        ref={containerRef}
        className="relative flex h-16 overflow-hidden rounded-lg shadow-md"
        style={{ cursor: draggingIndex !== null ? "col-resize" : "default" }}
      >
        {sections.map((section, index) => {
          const widthPercent = (section.targetDuration / totalDuration) * 100
          const isEditing = editingSectionIndex === index
          return (
            <div
              key={section.id}
              className="relative flex items-center justify-center overflow-hidden text-xs font-bold text-neutral-700 transition-colors"
              style={{
                width: `${widthPercent}%`,
                backgroundColor: section.color,
                minWidth: 0,
              }}
            >
              <div className="pointer-events-none flex flex-col items-center truncate px-1">
                <span className="text-sm leading-tight">
                  #{(index + 1).toString().padStart(2, "0")}
                </span>
                {widthPercent > 6 &&
                  (isEditing ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={handleEditConfirm}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          ;(e.target as HTMLInputElement).blur()
                        }
                        if (e.key === "Escape") {
                          setEditingSectionIndex(null)
                          setEditingValue("")
                        }
                      }}
                      autoFocus
                      className="pointer-events-auto mt-0.5 w-14 rounded border border-white/50 bg-white/20 px-1 py-0.5 text-center text-[10px] leading-tight text-neutral-800 outline-none backdrop-blur-sm"
                      placeholder="MM:SS"
                    />
                  ) : (
                    <span
                      className="pointer-events-auto mt-0.5 cursor-pointer text-[10px] leading-tight opacity-80 hover:underline hover:opacity-100"
                      onClick={() => {
                        setEditingSectionIndex(index)
                        setEditingValue(
                          formatTimeShort(section.targetDuration)
                        )
                      }}
                      title="클릭하여 시간 직접 입력"
                    >
                      {formatTimeShort(section.targetDuration)}
                    </span>
                  ))}
              </div>

              {/* 드래그 핸들 (마지막 섹션 제외) */}
              {index < sections.length - 1 && (
                <div
                  className="absolute right-0 top-0 z-10 h-full w-3 cursor-col-resize opacity-0 hover:opacity-100"
                  style={{ transform: "translateX(50%)" }}
                  onMouseDown={(e) => handleMouseDown(e, index)}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                >
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-8 w-0.5 rounded-full bg-neutral-800/50" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 시간 라벨 (하단) */}
      <div className="relative mt-1 h-5">
        {cumulativeTimes.slice(1, -1).map((time, index) => {
          const leftPercent = (time / totalDuration) * 100
          return (
            <div
              key={index}
              className="absolute text-[11px] font-medium text-krds-gray-50"
              style={{
                left: `${leftPercent}%`,
                transform: "translateX(-50%)",
              }}
            >
              {formatTimeShort(time)}
            </div>
          )
        })}
      </div>

      {/* 팁 안내 */}
      <p className="mt-2 text-center text-[12px] text-krds-gray-30">
        막대그래프의 시간을 클릭하면 직접 입력할 수 있습니다 (MM:SS 또는 초 단위)
      </p>

      {/* 드래그 툴팁 */}
      {dragTooltip && (
        <div
          className="absolute -top-10 z-20 rounded-lg bg-krds-gray-90 px-2 py-1 text-[11px] font-medium text-white shadow-lg"
          style={{
            left: `${dragTooltip.x}px`,
            transform: "translateX(-50%)",
          }}
        >
          {dragTooltip.leftTime} | {dragTooltip.rightTime}
        </div>
      )}
    </div>
  )
}
