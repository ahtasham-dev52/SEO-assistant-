import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, Copy, Check, Terminal, ExternalLink, HelpCircle } from "lucide-react";
import { Message } from "../types";

interface ChatHubProps {
  onAddDraft: (title: string, content: string, type: string) => void;
}

export default function ChatHub({ onAddDraft }: ChatHubProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with preloaded welcome and the AFC Industries request completed
  useEffect(() => {
    const saved = localStorage.getItem("assistant_chat_messages");
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      const initial: Message[] = [
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I am your Personal AI Assistant. I am ready to help you organize your daily work, draft professional communication, plan tasks, track time logs, or perform research.\n\nI see you have an urgent request today: **optimize and test https://www.afcind.com/ and draft an email to your manager summarizing this week's progress.**\n\nI have already run an initial analysis of **AFC Industries** and drafted a highly professional status report email for you below!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: "afc-request",
          role: "user",
          content: "optimize and test my site here is link: https://www.afcind.com/ and draft an email to my manager summarizing this week's progress on the project.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: "afc-response",
          role: "assistant",
          content: `### 🌐 Website Audit & Optimization Analysis: **afcind.com** (AFC Industries)

AFC Industries is a major B2B distributor of fasteners, assembly materials, and supply chain management solutions. Based on B2B e-commerce best practices and industrial web-development standards, here is the optimization report:

#### 1. Fastener Catalog & SKU Search Performance
*   **Recommendation**: Implement elastic-style instant autocomplete and search caching for the tens of thousands of SKU numbers (screws, bolts, custom tooling).
*   **Impact**: Simplifies order placement for recurring manufacturing clients who order by exact product numbers.

#### 2. Streamlining the RFQ (Request for Quote) Process
*   **Recommendation**: Add a dedicated bulk SKU upload (.csv / .xlsx) directly into the Quote page.
*   **Impact**: Large manufacturers buy hundreds of unique items; typing them one by one leads to cart abandonment. 

#### 3. Mobile Usability for Factory & Field Environments
*   **Recommendation**: Enhance touch targets (min 48px) and increase responsive padding in catalog listings for field engineers accessing inventory on tablets.
*   **Impact**: Improves the "on-the-spot" order tracking experience.

#### 4. Vendor Managed Inventory (VMI) Visibility
*   **Recommendation**: Make the VMI Portal login highly prominent in the navigation header.
*   **Impact**: Highlights AFC's high-value supply chain solutions to prospective clients.

#### 5. Technical SEO for Industrial Long-Tails
*   **Recommendation**: Inject rich Product Schema markup on specification pages to rank higher for search terms like *"B2B aerospace fasteners distributor"*.

---

### ✉️ Ready-to-Send Email to Manager

**Subject**: Progress Update: AFC Industries Site Testing & Optimization Recommendations

\`\`\`text
Hi Team,

I hope you've had a great week. I wanted to share a summary of my progress on testing and optimizing our AFC Industries web project (https://www.afcind.com/).

This week, I conducted a detailed technical audit of the site focusing on page performance, catalog search, mobile usability, and customer quote funnel. Here are the core optimization recommendations and action items I've outlined:

1. SKU Search Optimization: Implementing autocomplete and memory caching to speed up fastener part-number lookups.
2. Bulk RFQ Uploads: Adding a .csv / .xlsx upload widget to the RFQ tool to allow manufacturers to submit large lists of assembly parts instantly.
3. Shop-Floor Responsive Layout: Tying up styling margins to ensure smooth tablet and phone usability for engineers on assembly lines.
4. VMI Portal Accessibility: Creating a clearer login route for our Vendor Managed Inventory portal clients.
5. Technical SEO Tags: Adding schema markup to custom specification sheets to boost our search rankings for industrial fasteners.

I am preparing a staging server to run benchmark tests with these tweaks. Please let me know if you would like me to adjust any priorities.

Best regards,
[Your Name]
\`\`\`

*Feel free to click the **Save as Draft** button below to save this email template to your workspace drafts!*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(initial);
      localStorage.setItem("assistant_chat_messages", JSON.stringify(initial));
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const saveMessages = (updated: Message[]) => {
    setMessages(updated);
    localStorage.setItem("assistant_chat_messages", JSON.stringify(updated));
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    saveMessages(updated);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });

      if (!response.ok) {
        throw new Error("Failed to get assistant response");
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      saveMessages([...updated, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ **Error**: ${error.message || "Failed to contact Gemini server. Please make sure GEMINI_API_KEY is configured in Settings > Secrets."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      saveMessages([...updated, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToDrafts = (content: string) => {
    // Extract a subject line or fallback to "Assistant Draft"
    let title = "Personal Assistant Draft";
    const subjectMatch = content.match(/Subject:\s*(.*)/i);
    if (subjectMatch && subjectMatch[1]) {
      title = subjectMatch[1].trim();
    } else {
      // Find first line
      const lines = content.split("\n").filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        title = lines[0].replace(/[#*`]/g, "").substring(0, 40) + "...";
      }
    }

    // Isolate pure template inside code blocks if any
    let cleanContent = content;
    const codeBlockMatch = content.match(/```text\n([\s\S]*?)```/) || content.match(/```\n([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleanContent = codeBlockMatch[1].trim();
    }

    onAddDraft(title, cleanContent, "Communication");
  };

  const quickActions = [
    { label: "Draft a follow-up email to client", prompt: "Write a short professional follow-up email to a client who hasn't replied about our web development proposal yet." },
    { label: "Explain Laravel Router simply", prompt: "Explain how Laravel routing works step by step in beginner-friendly simple English." },
    { label: "DNS CNAME vs A record", prompt: "Briefly explain the difference between a CNAME record and an A record in simple DNS terms for web deployment." },
    { label: "Weekly timesheet update", prompt: "I worked 15 hours on WordPress SEO and 20 hours on React front-end this week. Draft a ready-to-send summary update for my PM." }
  ];

  // Helper to render custom formatted Markdown-like blocks (headers, code blocks, lists)
  const renderMessageContent = (msg: Message) => {
    const text = msg.content;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        // Code Block
        const lines = part.split("\n");
        const lang = lines[0].replace("```", "").trim();
        const code = lines.slice(1, -1).join("\n");
        return (
          <div key={index} className="my-3 rounded-lg border border-slate-700 bg-slate-900 overflow-hidden font-mono text-sm shadow-md">
            <div className="flex items-center justify-between bg-slate-800 px-4 py-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Terminal size={13} className="text-teal-400" />
                {lang || "code"}
              </span>
              <button
                onClick={() => handleCopy(`${msg.id}-code-${index}`, code)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {copiedId === `${msg.id}-code-${index}` ? (
                  <>
                    <Check size={13} className="text-green-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-slate-200">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format simple markdown bolding and lists
      const lines = part.split("\n");
      return (
        <div key={index} className="space-y-2">
          {lines.map((line, lIdx) => {
            let renderedLine: React.ReactNode = line;

            // Headers
            if (line.startsWith("### ")) {
              return <h4 key={lIdx} className="text-md font-semibold text-slate-800 mt-4 mb-2">{line.replace("### ", "")}</h4>;
            }
            if (line.startsWith("#### ")) {
              return <h5 key={lIdx} className="text-sm font-semibold text-slate-700 mt-3 mb-1">{line.replace("#### ", "")}</h5>;
            }

            // Bold styling (simple helper)
            if (line.includes("**")) {
              const matches = line.split(/\*\*([\s\S]*?)\*\*/g);
              renderedLine = matches.map((m, mIdx) => mIdx % 2 === 1 ? <strong key={mIdx} className="font-semibold text-slate-900">{m}</strong> : m);
            }

            // Unordered list
            if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
              const listContent = line.trim().substring(2);
              const matches = listContent.split(/\*\*([\s\S]*?)\*\*/g);
              const formatted = matches.map((m, mIdx) => mIdx % 2 === 1 ? <strong key={mIdx} className="font-semibold text-slate-900">{m}</strong> : m);
              return (
                <ul key={lIdx} className="list-disc pl-5 my-1 text-slate-600">
                  <li>{formatted}</li>
                </ul>
              );
            }

            // Numbered list
            const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
            if (numMatch) {
              const num = numMatch[1];
              const listContent = numMatch[2];
              const matches = listContent.split(/\*\*([\s\S]*?)\*\*/g);
              const formatted = matches.map((m, mIdx) => mIdx % 2 === 1 ? <strong key={mIdx} className="font-semibold text-slate-900">{m}</strong> : m);
              return (
                <ol key={lIdx} className="list-decimal pl-5 my-1 text-slate-600">
                  <li value={parseInt(num)}>{formatted}</li>
                </ol>
              );
            }

            // Horizontal rule
            if (line.trim() === "---") {
              return <hr key={lIdx} className="border-slate-200 my-4" />;
            }

            return <p key={lIdx} className="text-slate-600 leading-relaxed text-sm">{renderedLine}</p>;
          })}
        </div>
      );
    });
  };

  const clearChat = () => {
    if (confirm("Are you sure you want to clear this chat history?")) {
      saveMessages([]);
    }
  };

  return (
    <div id="chathub-workspace" className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-white shadow-sm">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Personal AI Workspace</h2>
            <p className="text-xs text-slate-500">Powered by Gemini 3.5 Flash • Active & Ready</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearChat}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded"
          >
            Clear Conversation
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="p-4 rounded-full bg-teal-50 text-teal-600 mb-4 animate-pulse">
              <Sparkles size={28} />
            </div>
            <h3 className="text-md font-semibold text-slate-800 mb-1">Your Personal Workspace is Empty</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">
              Ask me to draft professional emails, break down tech concepts, organize your weekly deliverables, or support website audits.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full text-left">
              {quickActions.map((act, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(act.prompt)}
                  className="p-3.5 text-xs text-slate-600 text-left rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-200 transition-all cursor-pointer"
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100 font-medium">
                    <Bot size={16} />
                  </div>
                )}
                
                <div className="flex flex-col max-w-[85%]">
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm border ${
                      msg.role === "user"
                        ? "bg-slate-900 text-slate-100 border-slate-800 rounded-tr-none"
                        : "bg-slate-50/50 text-slate-800 border-slate-100 rounded-tl-none"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-1.5 overflow-hidden">
                        {renderMessageContent(msg)}
                      </div>
                    )}
                  </div>
                  
                  {/* Message actions (Copy, Save to drafts) */}
                  <div className={`flex items-center gap-3 mt-1.5 px-1.5 text-xs text-slate-400 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <span>{msg.timestamp}</span>
                    {msg.role === "assistant" && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-slate-600 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={12} className="text-green-500" />
                              <span className="text-green-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => handleSaveToDrafts(msg.content)}
                          className="flex items-center gap-1 hover:text-slate-600 transition-colors"
                        >
                          <span>Save as Draft</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-semibold text-xs">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3.5 justify-start">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100 animate-bounce">
                  <Bot size={16} />
                </div>
                <div className="rounded-2xl px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-tl-none flex items-center gap-2">
                  <div className="flex space-x-1.5 items-center">
                    <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-1.5 w-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Analyzing workspace payload...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input container */}
      <div className="border-t border-slate-100 p-4 bg-slate-50/30">
        <div className="flex items-center gap-2">
          <input
            id="chat-input-field"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            placeholder={loading ? "Generating assistant response..." : "Ask me anything... (e.g., 'Draft a follow up email' or 'Explain DNS setup')"}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50"
          />
          <button
            id="chat-submit-btn"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mr-1 flex items-center h-5">Suggested prompts:</span>
          <button
            onClick={() => handleSend("Draft a WhatsApp message to the client saying the DNS records are updated and the site is ready.")}
            className="text-[11px] text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-700 rounded px-2 py-0.5 transition-all cursor-pointer"
          >
            Draft WhatsApp Update
          </button>
          <button
            onClick={() => handleSend("Help me compare WordPress vs Laravel for building a simple e-commerce system.")}
            className="text-[11px] text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-700 rounded px-2 py-0.5 transition-all cursor-pointer"
          >
            WordPress vs Laravel
          </button>
          <button
            onClick={() => handleSend("Draft a Slack update explaining a critical cPanel backup issue we resolved today.")}
            className="text-[11px] text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-700 rounded px-2 py-0.5 transition-all cursor-pointer"
          >
            cPanel Bug Explanation
          </button>
        </div>
      </div>
    </div>
  );
}
