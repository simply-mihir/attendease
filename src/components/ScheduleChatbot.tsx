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
  BookOpen,
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
        "Hey! I'm your AttendEase Assistant. I can help you with:\n\n📅 View & manage today's schedule\n✅ Mark attendance (voice or text)\n📊 Check analytics & streaks\n🎯 Skip/bunk optimizer\n🔄 Reschedule, cancel, or swap classes\n\nTry asking me anything:",
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
            rounded-2xl border-2 border-[#cc1a5e] bg-[#FF2D78] text-white
            shadow-[0_6px_0_0_#cc1a5e]
            hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#cc1a5e]
            active:translate-y-[4px] active:shadow-[0_2px_0_0_#cc1a5e]
            transition-all duration-150"
          style={{ animation: "sidebarTogglePulse 2s ease-in-out infinite" }}
          aria-label="Open AttendEase Assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* ===== CHAT PANEL ===== */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed bottom-0 right-0 left-0 z-50 flex flex-col
            h-[85vh]
            rounded-t-2xl border-t-2 border-x-0 border-[#FF2D78]/30 bg-white
            shadow-[0_8px_0_0_#d1d5db,0_20px_60px_-15px_rgba(0,0,0,0.2)]
            dark:bg-[#141425] dark:border-[#FF2D78]/20
            dark:shadow-[0_8px_0_0_#0d0d1a,0_20px_60px_-15px_rgba(0,0,0,0.5)]
            md:bottom-8 md:right-8 md:left-auto
            md:w-[400px] md:h-[580px] md:max-h-[80vh]
            md:rounded-2xl md:border-2 md:border-[#FF2D78]/30
            overflow-hidden animate-slideIn"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3
              border-b-2 border-gray-100 dark:border-[#2a2a3d]
              bg-gradient-to-r from-[#FF2D78]/5 to-[#9b5de5]/5
              dark:from-[#FF2D78]/10 dark:to-[#9b5de5]/10"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl
                  bg-[#FF2D78]/10 text-[#FF2D78]"
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1a1a2e] dark:text-white">
                    AttendEase Assistant
                  </h3>
                  <p className="text-[10px] text-[#9ca3af] dark:text-[#6b6b80]">
                    Voice & chat • Attendance • Analytics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg
                  text-[#9ca3af] hover:text-[#ef476f] hover:bg-[#ef476f]/10
                  transition-all duration-150"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold
                      ${msg.role === "assistant" ? "bg-[#9b5de5]" : "bg-[#FF2D78]"}`}
                  >
                    {msg.role === "assistant" ? (
                      <Bot className="h-3.5 w-3.5" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                      ${
                        msg.role === "user"
                          ? "bg-[#FF2D78] text-white rounded-tr-md"
                          : "bg-gray-100 text-[#1a1a2e] dark:bg-[#1e1e35] dark:text-[#c4c4d4] rounded-tl-md"
                      }`}
                  >
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                        {line}
                      </p>
                    ))}

                    {/* Action badges */}
                    {msg.actions?.includes("attendance_marked") && (
                      <div
                        className="mt-2 flex items-center gap-1.5 rounded-lg
                        bg-[#06d6a0]/15 px-2.5 py-1.5 text-xs font-semibold text-[#06d6a0]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Attendance updated
                      </div>
                    )}
                    {msg.actions?.includes("schedule_changed") && (
                      <div
                        className="mt-2 flex items-center gap-1.5 rounded-lg
                        bg-[#4361ee]/15 px-2.5 py-1.5 text-xs font-semibold text-[#4361ee]"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Calendar updated
                      </div>
                    )}

                    {/* Examples on welcome */}
                    {msg.id === "welcome" && (
                      <div className="mt-3 space-y-1.5">
                        {EXAMPLES.map((ex) => (
                          <button
                            key={ex}
                            onClick={() => {
                              setInput(ex);
                              inputRef.current?.focus();
                            }}
                            className="block w-full text-left rounded-lg px-2.5 py-1.5
                              text-xs text-[#4361ee] dark:text-[#4cc9f0]
                              bg-[#4361ee]/5 dark:bg-[#4cc9f0]/5
                              hover:bg-[#4361ee]/10 dark:hover:bg-[#4cc9f0]/10
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
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#9b5de5] text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-gray-100 dark:bg-[#1e1e35] px-4 py-3">
                    <div className="flex gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full bg-[#FF2D78]"
                        style={{ animation: "futuristicDot 1.4s ease-in-out infinite" }}
                      />
                      <div
                        className="h-2 w-2 rounded-full bg-[#9b5de5]"
                        style={{ animation: "futuristicDot 1.4s ease-in-out 0.2s infinite" }}
                      />
                      <div
                        className="h-2 w-2 rounded-full bg-[#4361ee]"
                        style={{ animation: "futuristicDot 1.4s ease-in-out 0.4s infinite" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick action chips */}
            <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t border-gray-100 dark:border-[#2a2a3d]/50">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border-2 border-gray-200 dark:border-[#2a2a3d]
                    px-3 py-1.5 text-[11px] font-bold
                    text-[#4a4a5a] dark:text-[#c4c4d4]
                    shadow-[0_2px_0_0_#d1d5db] dark:shadow-[0_2px_0_0_#0d0d1a]
                    hover:border-[#FF2D78]/30 hover:text-[#FF2D78] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#d1d5db]
                    disabled:opacity-40
                    transition-all duration-150"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t-2 border-gray-100 dark:border-[#2a2a3d]">
              <div
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2
                border-gray-200 bg-[#fafafa]
                dark:border-[#2a2a3d] dark:bg-[#0d0d1a]
                focus-within:border-[#FF2D78] focus-within:ring-2 focus-within:ring-[#FF2D78]/20
                transition-all
                ${isListening ? "border-[#ef476f] ring-2 ring-[#ef476f]/30" : ""}`}
              >
                {/* Voice button */}
                {speechSupported && (
                  <button
                    onClick={toggleVoice}
                    disabled={isLoading}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150
                      ${
                        isListening
                          ? "bg-[#ef476f] text-white"
                          : "text-[#9ca3af] hover:text-[#FF2D78] hover:bg-[#FF2D78]/10"
                      }
                      disabled:opacity-30`}
                    style={isListening ? { animation: "futuristicPulse 1s ease-in-out infinite" } : undefined}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
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
                      ? "Listening..."
                      : "Ask anything about attendance..."
                  }
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm text-[#1a1a2e] dark:text-white
                    placeholder-[#9ca3af] dark:placeholder-[#6b6b80]
                    outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg
                    bg-[#FF2D78] text-white
                    disabled:opacity-30 disabled:cursor-not-allowed
                    hover:bg-[#cc1a5e] transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {isListening && (
                <p className="text-[10px] text-[#ef476f] font-bold mt-1.5 text-center"
                  style={{ animation: "futuristicPulse 1.5s ease-in-out infinite" }}>
                  🎙️ Listening... speak now
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
