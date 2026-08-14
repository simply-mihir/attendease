"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Mic,
  MicOff,
  Calendar,
  CheckCircle2,
  BarChart3,
  Zap,
} from "lucide-react";
import { invalidatePrefix } from "@/hooks/useSWRFetch";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: string[];
}

const QUICK_ACTIONS = [
  { label: "Today's classes", icon: Calendar, prompt: "What are my classes today?" },
  { label: "Mark attendance", icon: CheckCircle2, prompt: "Show today's classes so I can mark attendance" },
  { label: "My analytics", icon: BarChart3, prompt: "Show my overall attendance analytics" },
  { label: "Can I bunk?", icon: Zap, prompt: "How many classes can I safely skip?" },
];

const EXAMPLES = [
  "Mark me present for DBMS",
  "What's my attendance in OS?",
  "Can I bunk 3 classes?",
  "Cancel math class tomorrow",
  "Mark all classes present today",
  "Show my attendance history",
];

export function ScheduleChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to AttendEase Assistant.\n\nI can help you with:\n\n- View and manage today's schedule\n- Mark attendance via voice or text\n- Check analytics and streaks\n- Skip/bunk optimizer\n- Reschedule, cancel, or swap classes\n\nHow can I assist you?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check speech support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setInput(transcript);
        // Auto-send on final result
        if (event.results[event.results.length - 1].isFinal) {
          setIsListening(false);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const sendMessage = useCallback(async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: msgText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Build history from recent messages (exclude welcome)
      const recentHistory = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/v1/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText, history: recentHistory }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || data.error || "Sorry, something went wrong.",
        timestamp: new Date(),
        actions: data.actions,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Trigger data refresh if actions were performed
      if (data.actions?.includes("attendance_marked")) {
        invalidatePrefix("/attendance");
        invalidatePrefix("/dashboard");
        invalidatePrefix("/schedules/today");
        invalidatePrefix("/analytics");
        invalidatePrefix("/achievements");
        window.dispatchEvent(new CustomEvent("attendanceMarked"));
      }
      if (data.actions?.includes("schedule_changed")) {
        invalidatePrefix("/schedule-override");
        invalidatePrefix("/schedules");
        window.dispatchEvent(new CustomEvent("scheduleOverrideChanged"));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Oops, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ===== FLOATING TRIGGER BUTTON ===== */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[88px] right-4 md:bottom-8 md:right-8 z-50 flex h-14 w-14 items-center justify-center
            rounded-full bg-gradient-to-br from-[#D8FFC5] to-[#06d6a0] text-[#1a1a2e]
            shadow-[0_8px_20px_-5px_rgba(6,214,160,0.5)]
            hover:scale-105 hover:shadow-[0_12px_25px_-5px_rgba(6,214,160,0.6)]
            active:scale-95
            transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          aria-label="Open AttendEase Assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* ===== CHAT PANEL ===== */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed bottom-0 right-0 left-0 z-50 flex flex-col
            h-[85vh]
            rounded-t-[32px] border-t border-white/20 bg-white/80 backdrop-blur-2xl
            shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)]
            dark:bg-[#070b14]/70 dark:border-white/10
            dark:shadow-[0_-10px_50px_-10px_rgba(0,0,0,0.6)]
            md:bottom-8 md:right-8 md:left-auto
            md:w-[420px] md:h-[620px] md:max-h-[85vh]
            md:rounded-[32px] md:border md:border-white/20
            overflow-hidden animate-slideIn"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4
              border-b border-gray-200/50 dark:border-white/5
              bg-white/50 dark:bg-black/20 backdrop-blur-xl shrink-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full
                  bg-gradient-to-br from-[#06d6a0]/20 to-[#D8FFC5]/30 text-[#06d6a0] dark:text-[#D8FFC5]
                  shadow-inner"
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-[#1a1a2e] dark:text-white">
                    AttendEase Assistant
                  </h3>
                  <p className="text-[11px] font-medium text-[#9ca3af] dark:text-[#6b6b80]">
                    Powered by AI ✨
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full
                  bg-gray-100/50 dark:bg-white/5 text-[#9ca3af] 
                  hover:text-[#1a1a2e] dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/10
                  transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold shadow-md
                      ${msg.role === "assistant" 
                        ? "bg-gradient-to-br from-[#9b5de5] to-[#4361ee]" 
                        : "bg-gradient-to-br from-[#D8FFC5] to-[#06d6a0] text-[#1a1a2e]"}`}
                  >
                    {msg.role === "assistant" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[82%] px-4 py-3 text-[13px] leading-relaxed shadow-sm
                      ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-[#D8FFC5] to-[#06d6a0] text-[#1a1a2e] font-medium rounded-2xl rounded-tr-sm shadow-[0_4px_15px_-3px_rgba(6,214,160,0.3)]"
                          : "bg-white/90 dark:bg-white/10 backdrop-blur-md border border-gray-100 dark:border-white/5 text-[#1a1a2e] dark:text-[#e2e2e9] rounded-2xl rounded-tl-sm"
                      }`}
                  >
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-2" : ""}>
                        {line}
                      </p>
                    ))}

                    {/* Action badges */}
                    {msg.actions?.includes("attendance_marked") && (
                      <div
                        className="mt-3 flex w-fit items-center gap-1.5 rounded-full
                        bg-[#06d6a0]/15 border border-[#06d6a0]/30 px-3 py-1 text-xs font-bold text-[#06d6a0]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Attendance updated
                      </div>
                    )}
                    {msg.actions?.includes("schedule_changed") && (
                      <div
                        className="mt-3 flex w-fit items-center gap-1.5 rounded-full
                        bg-[#4361ee]/15 border border-[#4361ee]/30 px-3 py-1 text-xs font-bold text-[#4361ee]"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Calendar updated
                      </div>
                    )}

                    {/* Examples on welcome */}
                    {msg.id === "welcome" && (
                      <div className="mt-4 space-y-2">
                        {EXAMPLES.map((ex) => (
                          <button
                            key={ex}
                            onClick={() => {
                              setInput(ex);
                              inputRef.current?.focus();
                            }}
                            className="block w-full text-left rounded-xl px-3 py-2
                              text-[12px] font-semibold text-[#4361ee] dark:text-[#4cc9f0]
                              bg-[#4361ee]/5 dark:bg-[#4cc9f0]/5 border border-[#4361ee]/10 dark:border-[#4cc9f0]/10
                              hover:bg-[#4361ee]/15 dark:hover:bg-[#4cc9f0]/15
                              transition-colors"
                          >
                            &ldquo;{ex}&rdquo;
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9b5de5] to-[#4361ee] text-white shadow-md">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-white/90 dark:bg-white/10 backdrop-blur-md border border-gray-100 dark:border-white/5 px-4 py-4 flex items-center justify-center shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-[#D8FFC5] to-[#06d6a0]" style={{ animation: "futuristicDot 1.4s ease-in-out infinite" }} />
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-[#9b5de5] to-[#4361ee]" style={{ animation: "futuristicDot 1.4s ease-in-out 0.2s infinite" }} />
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-[#06d6a0] to-[#4cc9f0]" style={{ animation: "futuristicDot 1.4s ease-in-out 0.4s infinite" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick action chips */}
            <div className="px-5 py-3 flex gap-2 overflow-x-auto border-t border-gray-200/50 dark:border-white/5 bg-white/30 dark:bg-black/10 backdrop-blur-md scrollbar-hide shrink-0">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/10
                    bg-white/80 dark:bg-white/5 backdrop-blur-md
                    px-4 py-2 text-[11px] font-bold text-[#4a4a5a] dark:text-[#c4c4d4]
                    hover:border-[#06d6a0]/40 hover:text-[#06d6a0] dark:hover:text-[#D8FFC5] hover:bg-[#06d6a0]/10
                    disabled:opacity-40 shadow-sm
                    transition-all duration-200"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-gray-200/50 dark:border-white/5 bg-white/60 dark:bg-black/30 backdrop-blur-xl shrink-0">
              <div
                className={`flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white/90 px-3 py-2.5
                dark:border-white/10 dark:bg-[#070b14]/80 backdrop-blur-xl shadow-inner
                focus-within:border-[#06d6a0]/50 focus-within:ring-2 focus-within:ring-[#06d6a0]/20
                transition-all duration-300
                ${isListening ? "border-[#ef476f] ring-2 ring-[#ef476f]/20" : ""}`}
              >
                {/* Voice button */}
                {speechSupported && (
                  <button
                    onClick={toggleVoice}
                    disabled={isLoading}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300
                      ${
                        isListening
                          ? "bg-gradient-to-br from-[#06d6a0] to-[#D8FFC5] text-[#1a1a2e] shadow-md"
                          : "text-[#9ca3af] bg-gray-100/50 dark:bg-white/5 hover:text-[#06d6a0] dark:hover:text-[#D8FFC5] hover:bg-[#06d6a0]/10"
                      }
                      disabled:opacity-30`}
                    style={isListening ? { animation: "futuristicPulse 1s ease-in-out infinite" } : undefined}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? (
                      <MicOff className="h-4.5 w-4.5" />
                    ) : (
                      <Mic className="h-4.5 w-4.5" />
                    )}
                  </button>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? "Listening... speak now"
                      : "Ask anything about attendance..."
                  }
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm font-medium text-[#1a1a2e] dark:text-white
                    placeholder-[#9ca3af] dark:placeholder-[#6b6b80]
                    outline-none disabled:opacity-50 px-1"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                    bg-gradient-to-br from-[#D8FFC5] to-[#06d6a0] text-[#1a1a2e] shadow-md
                    disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed
                    hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <Send className="h-4.5 w-4.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
