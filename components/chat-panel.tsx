"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Paperclip, X, Sparkles, Loader2, ChevronDown, FileText, Image as ImageIcon } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  attachmentName?: string
}

interface ChatPanelProps {
  currentState: {
    projectName: string
    contentType: string
    totalMinutes: number
    sectionCount: number
    toneStyle: string
    readingSpeed: number
    sections: Array<{ name: string; targetDuration: number; script: string }>
  }
  onAction: (action: string, data: Record<string, unknown>) => void
  isGenerating: boolean
  setIsGenerating: (v: boolean) => void
}

const QUICK_PROMPTS = [
  "5분 강의 영상, 섹션 3개로 나눠줘",
  "현재 섹션 구성으로 전체 원고 작성해줘",
  "말투를 좀 더 친근하게 바꿔줘",
  "러닝타임을 10분으로 변경해줘",
]

export default function ChatPanel({ currentState, onAction, isGenerating, setIsGenerating }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 원고 작성을 도와드릴게요 ✦\n\n자연어로 말씀해 주시면 됩니다. 예를 들어:\n• \"5분 강의, 섹션 3개로 나눠줘\"\n• \"직업윤리 주제로 전체 원고 써줘\"\n• 이미지나 PDF를 올려서 분석 요청도 가능해요"
    }
  ])
  const [input, setInput] = useState("")
  const [attachment, setAttachment] = useState<{ base64: string; type: string; name: string; preview?: string } | null>(null)
  const [showQuick, setShowQuick] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleFile = useCallback(async (file: File) => {
    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"
    if (!isImage && !isPdf) {
      alert("이미지(JPG, PNG, GIF, WEBP) 또는 PDF 파일만 첨부 가능합니다.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하만 가능합니다.")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64 = result.split(",")[1]
      const preview = isImage ? result : undefined
      setAttachment({ base64, type: file.type, name: file.name, preview })
    }
    reader.readAsDataURL(file)
  }, [])

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content && !attachment) return
    if (isGenerating) return

    const userMsg: Message = {
      role: "user",
      content: content || "(첨부파일 분석 요청)",
      attachmentName: attachment?.name,
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setShowQuick(false)
    setIsGenerating(true)

    try {
      const res = await fetch("/api/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          currentState,
          attachmentBase64: attachment?.base64 || null,
          attachmentType: attachment?.type || null,
          attachmentName: attachment?.name || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "오류가 발생했습니다.")

      const assistantMsg: Message = {
        role: "assistant",
        content: data.message || "처리 완료했습니다.",
      }
      setMessages(prev => [...prev, assistantMsg])

      // 액션 실행
      if (data.action && data.action !== "none") {
        onAction(data.action, data.data || {})
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}`
      }])
    } finally {
      setIsGenerating(false)
      setAttachment(null)
    }
  }, [input, attachment, messages, currentState, isGenerating, onAction, setIsGenerating])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // textarea 높이 자동 조절
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px"
  }, [input])

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "#fff",
      overflow: "hidden",
    }}>
      {/* 헤더: page5의 AI 패널 타이틀로 대체 → 숨김 */}

      {/* 메시지 영역 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.attachmentName && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5, marginBottom: 4,
                background: "#F5F5F7", borderRadius: 8, padding: "5px 10px",
                fontSize: 11, color: "#6B6B6E",
              }}>
                <FileText size={11} />
                <span>{msg.attachmentName}</span>
              </div>
            )}
            <div style={{
              maxWidth: "88%",
              background: msg.role === "user" ? "#5B5BD6" : "#F5F5F7",
              color: msg.role === "user" ? "#fff" : "#1C1C1E",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              padding: "10px 13px",
              fontSize: 13,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              letterSpacing: "-0.01em",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{
              background: "#F5F5F7", borderRadius: "14px 14px 14px 4px",
              padding: "10px 14px", display: "flex", alignItems: "center", gap: 6,
            }}>
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite", color: "#5B5BD6" }} />
              <span style={{ fontSize: 13, color: "#6B6B6E" }}>원고 작성 중...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 제안 */}
      {showQuick && (
        <div style={{ padding: "0 14px 10px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 500 }}>빠른 시작</span>
            <button onClick={() => setShowQuick(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
              <ChevronDown size={13} color="#AEAEB2" />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)} disabled={isGenerating}
                style={{
                  background: "none", border: "1px solid #E5E5E5", borderRadius: 8,
                  padding: "7px 11px", fontSize: 12, color: "#3A3A3C",
                  cursor: "pointer", textAlign: "left", letterSpacing: "-0.01em",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "#5B5BD6"; (e.target as HTMLElement).style.color = "#5B5BD6" }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "#E5E5E5"; (e.target as HTMLElement).style.color = "#3A3A3C" }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 첨부파일 미리보기 */}
      {attachment && (
        <div style={{ padding: "0 14px 8px", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, background: "#F5F5F7",
            borderRadius: 8, padding: "7px 10px",
          }}>
            {attachment.preview
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={attachment.preview} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }} />
              : <FileText size={16} color="#5B5BD6" />
            }
            <span style={{ flex: 1, fontSize: 12, color: "#3A3A3C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {attachment.name}
            </span>
            <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#AEAEB2" }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div style={{
        padding: "10px 14px 14px", flexShrink: 0,
      }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 7,
          background: "#F7F7F8", padding: "8px 8px 8px 12px",
          transition: "border-color 0.15s",
        }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="무엇을 만들어드릴까요?"
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: 13, color: "#1C1C1E", resize: "none", lineHeight: 1.5,
              fontFamily: "inherit", letterSpacing: "-0.01em", overflowY: "hidden",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {/* 첨부 버튼 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              title="이미지 또는 PDF 첨부"
              style={{
                width: 30, height: 30, borderRadius: 7, border: "none",
                background: attachment ? "#EEF0FF" : "none",
                color: attachment ? "#5B5BD6" : "#AEAEB2",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <Paperclip size={15} />
            </button>
            {/* 전송 버튼 */}
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={isGenerating || (!input.trim() && !attachment)}
              style={{
                width: 30, height: 30, borderRadius: 7, border: "none",
                background: (!input.trim() && !attachment) || isGenerating ? "#E5E5E5" : "#5B5BD6",
                color: (!input.trim() && !attachment) || isGenerating ? "#AEAEB2" : "#fff",
                cursor: (!input.trim() && !attachment) || isGenerating ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
        <p style={{ fontSize: 10, color: "#AEAEB2", textAlign: "center", marginTop: 6, letterSpacing: "-0.01em" }}>
          이미지·PDF 첨부 가능 · Enter로 전송 · Shift+Enter 줄바꿈
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
