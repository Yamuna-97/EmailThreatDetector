"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  X,
  Send,
  Sparkles,
  Bot,
  Copy,
  Check,
  Minimize2,
  RotateCcw
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
} from "@/components/ui/chat-bubble"
import { ragApi, type RAGQueryResponse } from "../../services/ragApi"
import { useAuth } from "../../context/AuthContext"

interface ChatMessage {
  id: string
  sender: "user" | "bot"
  text: string
  timestamp: string
  sources?: { doc_name: string; page: number; snippet: string }[]
  emailReferenced?: boolean
  model?: string
}

export const FloatingRAGChatWidget: React.FC = () => {
  const { user } = useAuth()
  const isInvestigator = user?.role === "investigator" || user?.role === "admin"

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: isInvestigator
        ? "Hello Investigator! I am your SOC Threat Intelligence Copilot. Ask me about RFC authentication protocols, MITRE ATT&CK techniques, forensic triage, or email incident containment."
        : "Hi there! I am your CyberTrace AI Security Assistant. Ask me anything about identifying dangerous emails, password safety, or how to protect your inbox.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [inputQuery, setInputQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<"user" | "investigator">(
    isInvestigator ? "investigator" : "user"
  )

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const suggestedPrompts =
    activeMode === "investigator"
      ? [
          "Explain SPF, DKIM, and DMARC alignment RFC standards.",
          "What is MITRE ATT&CK T1566 phishing sub-technique?",
          "How to extract and analyze email header hops?",
          "What are the CISA containment steps for BEC incidents?",
        ]
      : [
          "How do I spot a fake or spoofed sender address?",
          "What should I do if I clicked a suspicious link?",
          "What is Business Email Compromise (BEC)?",
          "What are the best practices for email security?",
        ]

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery.trim()
    if (!textToSend || isLoading) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputQuery("")
    setIsLoading(true)

    try {
      let res: RAGQueryResponse
      if (activeMode === "investigator") {
        res = await ragApi.queryInvestigatorRAG(textToSend, undefined, 4)
      } else {
        res = await ragApi.queryUserRAG(textToSend, undefined, 4)
      }

      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: res.sources,
        emailReferenced: res.email_referenced,
        model: res.model,
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: "bot",
        text: "I encountered a network issue while consulting the security knowledge base. Please try asking again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: "bot",
        text: activeMode === "investigator"
          ? "Chat reset. How can I assist your forensic investigation today?"
          : "Chat reset. How can I help protect your email security today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ])
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-body select-text">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-3 w-[360px] sm:w-[420px] h-[540px] max-h-[80vh] rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#192837]/15 shadow-2xl shadow-[#7342E2]/15 flex flex-col overflow-hidden"
          >
            {/* Widget Header */}
            <div className="bg-gradient-to-r from-[#7342E2] to-[#8B5CF6] px-4 py-3.5 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-extrabold flex items-center gap-1.5 leading-tight">
                    <span>CyberTrace AI</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider">
                      {activeMode === "investigator" ? "SOC RAG" : "Advisor"}
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/80 leading-tight">
                    Grounded in User Email Security & NIST Guidelines
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Mode Selector Toggle */}
                {isInvestigator && (
                  <button
                    type="button"
                    onClick={() => setActiveMode(activeMode === "user" ? "investigator" : "user")}
                    title={`Switch to ${activeMode === "user" ? "Investigator" : "User"} Mode`}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-bold"
                  >
                    {activeMode === "user" ? "User" : "SOC"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Clear & Reset Chat"
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 transition-all cursor-pointer"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimize Chat"
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 transition-all cursor-pointer"
                >
                  <Minimize2 size={16} />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F6]/50">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} variant={msg.sender === "user" ? "sent" : "received"}>
                  <ChatBubbleAvatar
                    fallback={msg.sender === "user" ? "YOU" : "AI"}
                    src={
                      msg.sender === "user"
                        ? undefined
                        : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
                    }
                  />
                  <div className="flex flex-col max-w-[82%]">
                    <ChatBubbleMessage variant={msg.sender === "user" ? "sent" : "received"}>
                      <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                        {msg.text}
                      </div>
                    </ChatBubbleMessage>

                    {/* Action Bar (Copy Button) */}
                    {msg.sender === "bot" && (
                      <ChatBubbleActionWrapper className="justify-start">
                        <ChatBubbleAction
                          icon={copiedId === msg.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:bg-white"
                        />
                        <span className="text-[10px] text-[#192837]/40">{msg.timestamp}</span>
                      </ChatBubbleActionWrapper>
                    )}
                  </div>
                </ChatBubble>
              ))}

              {/* Message Loading Spinner */}
              {isLoading && (
                <ChatBubble variant="received">
                  <ChatBubbleAvatar fallback="AI" />
                  <ChatBubbleMessage isLoading />
                </ChatBubble>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Pills */}
            {messages.length <= 2 && (
              <div className="px-3 py-2 bg-white border-t border-[#192837]/5 overflow-x-auto flex gap-1.5 scrollbar-none">
                {suggestedPrompts.slice(0, 3).map((prompt, pidx) => (
                  <button
                    key={pidx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="shrink-0 text-[11px] font-medium text-[#7342E2] bg-[#7342E2]/8 hover:bg-[#7342E2]/15 px-2.5 py-1 rounded-full transition-all text-left truncate max-w-[220px] cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="p-3 bg-white border-t border-[#192837]/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about email threats, security advice..."
                className="flex-1 rounded-2xl border border-[#192837]/15 bg-[#FAF9F6] px-3.5 py-2.5 text-xs sm:text-sm text-[#192837] placeholder-[#192837]/40 outline-none focus:bg-white focus:border-[#7342E2] focus:ring-2 focus:ring-[#7342E2]/30 transition-all"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#7342E2] text-white flex items-center justify-center shadow-md shadow-[#7342E2]/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Floating Trigger */}
      <motion.button
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-5 py-3 rounded-full cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #7342E2, #9B70F6)',
          boxShadow: '0 8px 32px rgba(115, 66, 226, 0.35), 0 2px 8px rgba(115, 66, 226, 0.2)',
          border: '1px solid rgba(255,255,255,0.25)',
        }}
      >
        {/* Animated ring when closed */}
        {!isOpen && (
          <span className="absolute -inset-0.5 rounded-full border-2 border-[#7342E2]/40 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
        )}

        <div className="relative z-10">
          {isOpen ? <X size={18} className="text-white" /> : <Bot size={18} className="text-white" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          )}
        </div>

        <span className="font-heading font-extrabold text-xs sm:text-sm tracking-wide text-white relative z-10">
          {isOpen ? 'Close Assistant' : 'AI Security Copilot'}
        </span>
      </motion.button>
    </div>
  )
}

export default FloatingRAGChatWidget
