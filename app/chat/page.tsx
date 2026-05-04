"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { API_BASE_URL, aiConfigAPI } from "@/lib/api";
import { authAPI } from "@/lib/authApi";
import { UserRoute } from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import { ChatMessage } from "@/lib/types";

const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const PROVIDER_TO_MODEL: Record<string, string> = {
  openai: "GPT4",
  grok: "Grok",
  claude: "Claude",
  gemini: "Gemini",
};
const MODEL_TO_PROVIDER: Record<string, string> = {
  GPT4: "openai",
  Grok: "grok",
  Claude: "claude",
  Gemini: "gemini",
};

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
};

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState("GPT4");
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeText, setWelcomeText] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [disabledProviders, setDisabledProviders] = useState<Set<string>>(
    new Set(),
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getMe();
        if (response.success && response.data?.user?.name) {
          setUserName(response.data.user.name);
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const updateGreeting = () => setWelcomeText(getTimeGreeting());
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current AI config + provider statuses on load
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [configData, statusData] = await Promise.all([
          aiConfigAPI.getConfig(),
          aiConfigAPI.getProviderStatus(),
        ]);

        if (configData.success && configData.data?.provider) {
          setCurrentModel(
            PROVIDER_TO_MODEL[configData.data.provider] || "GPT4",
          );
        }

        if (statusData.success && statusData.data?.statuses) {
          const disabled = new Set<string>(
            Object.entries(statusData.data.statuses)
              .filter(([, s]) => s.disabled)
              .map(([key]) => key),
          );
          setDisabledProviders(disabled);
        }
      } catch (err) {
        console.error("Failed to fetch AI config:", err);
      }
    };
    fetchConfig();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowWelcome(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ query: input, sessionId }),
      });

      const data = await response.json();

      if (response.status === 429 || data.limitExceeded) {
        const currentProvider = MODEL_TO_PROVIDER[currentModel] || "openai";
        setDisabledProviders((prev) => new Set([...prev, currentProvider]));
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              data.message ||
              `You've reached the limit for ${currentModel}. Please switch to another model to continue.`,
          },
        ]);
        return;
      }

      if (data.data?.sessionId) setSessionId(data.data.sessionId);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.data?.answer || "",
        summary: data.data?.summary || "",
        bulletPoints: data.data?.bulletPoints || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = async (model: string) => {
    const provider = MODEL_TO_PROVIDER[model] || "openai";
    if (disabledProviders.has(provider)) return;
    setCurrentModel(model);
    try {
      const data = await aiConfigAPI.updateConfig({ provider, model });
      if (!data.success)
        console.error("Failed to update AI provider:", data.error);
    } catch (err) {
      console.error("Error updating AI provider:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const disabledModels = [...disabledProviders]
    .map((p) => PROVIDER_TO_MODEL[p])
    .filter(Boolean);

  return (
    <AdminLayout
      showModelSelector={true}
      currentModel={currentModel}
      onModelChange={handleModelChange}
      disabledModels={disabledModels}
    >
      <div className="pb-32">
        <div className="max-w-4xl mx-auto px-4">
          {showWelcome && messages.length === 0 ? (
            <div className="pt-20">
              <Image
                src="/images/logo.png"
                alt="Welcome"
                width={300}
                height={400}
                className="mx-auto mb-6"
              />
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-center text-white mb-4 transition-opacity duration-500">
                {welcomeText}
                {userName && (
                  <>
                    , <span className="">{userName.split(" ")[0]}</span>
                  </>
                )}
                !
              </h2>
            </div>
          ) : (
            <div className="py-8 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-6 py-4 ${
                      message.role === "user"
                        ? "bg-pink-500/20 border border-pink-500/30 rounded-t-2xl rounded-bl-2xl rounded-br-sm"
                        : "bg-white/5 border border-white/10 rounded-t-2xl rounded-br-2xl rounded-bl-sm"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="space-y-4">
                        {message.summary && (
                          <div className="bg-white/5 rounded-lg p-4 border-l-4 border-pink-500">
                            <h3 className="text-pink-400 font-semibold mb-2 text-sm uppercase tracking-wide">
                              Summary
                            </h3>
                            <p className="text-gray-200 leading-relaxed">
                              {message.summary}
                            </p>
                          </div>
                        )}
                        {message.bulletPoints &&
                          message.bulletPoints.length > 0 && (
                            <div className="bg-white/5 rounded-lg p-4 border-l-4 border-blue-500">
                              <h3 className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-wide">
                                Key Points
                              </h3>
                              <ul className="space-y-3">
                                {message.bulletPoints.map((point, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-3 text-gray-300"
                                  >
                                    <span className="text-pink-400 text-lg font-bold mt-0.5">
                                      •
                                    </span>
                                    <span className="flex-1">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        <p className="text-gray-300 whitespace-pre-line">
                          {message.content}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-300 whitespace-pre-line">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-6 py-4 rounded-t-2xl rounded-br-2xl rounded-bl-sm">
                    <div className="flex gap-1.5 items-center h-5">
                      <span
                        className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-5 left-0 right-0 p-4 z-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-primary-border p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Hey there! Ask me anything..."
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-gradient-primary rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function ProtectedChatPage() {
  return (
    <UserRoute>
      <ChatPage />
    </UserRoute>
  );
}
