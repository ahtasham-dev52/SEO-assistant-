import React, { useState, useEffect } from "react";
import { Mail, MessageSquare, Send, Copy, Check, Bookmark, Sparkles, Trash2, ArrowRight } from "lucide-react";

interface SavedDraft {
  id: string;
  title: string;
  content: string;
  platform: string;
  tone: string;
  createdAt: string;
}

interface CommunicationSuiteProps {
  onAddDraft: (title: string, content: string, type: string) => void;
  savedDrafts: any[];
  onDeleteDraft: (id: string) => void;
}

export default function CommunicationSuite({ onAddDraft, savedDrafts, onDeleteDraft }: CommunicationSuiteProps) {
  const [platform, setPlatform] = useState("Email");
  const [audience, setAudience] = useState("Manager");
  const [tone, setTone] = useState("Professional");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setResult("");
    
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email-message",
          payload: {
            description,
            audience,
            platform,
            tone,
            context
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const data = await response.json();
      
      // Separate Subject and Body for nice display if it's an email
      let text = data.result;
      const subMatch = text.match(/Subject:\s*(.*)/i);
      if (subMatch && subMatch[1]) {
        setSubject(subMatch[1].trim());
        // Strip out the subject line from the body display
        text = text.replace(/Subject:\s*.*\n?/i, "").trim();
      } else {
        setSubject("");
      }
      
      setResult(text);
    } catch (error: any) {
      console.error(error);
      setResult(`❌ Error: ${error.message || "Failed to generate message."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const fullText = subject ? `Subject: ${subject}\n\n${result}` : result;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const fullText = subject ? `Subject: ${subject}\n\n${result}` : result;
    const title = subject || `${platform} to ${audience} (${tone})`;
    onAddDraft(title, fullText, "Communication");
  };

  const handleLoadDraftTemplate = (type: string) => {
    if (type === "afc-update") {
      setPlatform("Email");
      setAudience("Manager");
      setTone("Professional");
      setDescription("Summary of weekly testing and optimization for https://www.afcind.com/. Focus on fastener catalog SKU search options, bulk RFQ spreadsheet uploads, responsive margins for shop floor use, prominent VMI login routes, and technical product schema tags.");
      setContext("The manager appreciates concise updates with clear action steps.");
    } else if (type === "client-followup") {
      setPlatform("Slack");
      setAudience("Client");
      setTone("Short/Concise");
      setDescription("Polite nudge to a prospective client regarding the HubSpot and WordPress integration estimate I sent over on Monday.");
      setContext("We want to build rapport but keep it brief.");
    } else if (type === "bug-pm") {
      setPlatform("WhatsApp");
      setAudience("PM");
      setTone("Urdu/Hindi Mixed");
      setDescription("Explaining why the Vercel deployment of the React hydration bug is taking another 2 hours to resolve because of cache issues.");
      setContext("Include a polite promise to keep them updated.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Settings Panel */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3.5 flex items-center gap-1.5">
            <Mail size={16} className="text-teal-500" />
            Generator Preferences
          </h3>

          <div className="space-y-3.5">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleLoadDraftTemplate("afc-update")}
                className="text-[11px] font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-all cursor-pointer"
              >
                Load AFC industries Progress
              </button>
              <button
                type="button"
                onClick={() => handleLoadDraftTemplate("client-followup")}
                className="text-[11px] font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded transition-all cursor-pointer"
              >
                Load Follow-up
              </button>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Destination Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="Email">📧 Professional Email</option>
                <option value="Slack">💬 Slack Message</option>
                <option value="WhatsApp">📱 WhatsApp Message</option>
                <option value="Client Reply">🧑‍💼 Client Reply / Update</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Target Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="Manager">Manager / Director</option>
                <option value="Client">Client / Client Stakeholder</option>
                <option value="PM">Project Manager</option>
                <option value="Team Members">Team / Developers</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Writing Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              >
                <option value="Professional">💼 Elegant & Professional</option>
                <option value="Simple/Clear">🌱 Simple English (No Jargon)</option>
                <option value="Short/Concise">⚡ Extremely Short & Concise</option>
                <option value="Urdu/Hindi Mixed">🇵🇰🇮🇳 Casual Urdu/Hindi (Roman Script)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Saved Workspace Drafts Sidecard */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm max-h-[250px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
            <Bookmark size={15} className="text-amber-500" />
            My Workspace Drafts ({savedDrafts.length})
          </h3>
          
          {savedDrafts.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No drafted messages saved yet. Generate one and click Save as Draft.</p>
          ) : (
            <div className="space-y-2">
              {savedDrafts.map((dr) => (
                <div key={dr.id} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 truncate">{dr.title}</p>
                    <span className="text-[9px] text-slate-400 uppercase">{dr.type}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        // Quick Load
                        const sub = dr.content.match(/Subject:\s*(.*)/i);
                        if (sub && sub[1]) {
                          setSubject(sub[1].trim());
                          setResult(dr.content.replace(/Subject:\s*.*\n?/i, "").trim());
                        } else {
                          setSubject("");
                          setResult(dr.content);
                        }
                      }}
                      className="text-[10px] text-teal-600 hover:underline px-1.5"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDeleteDraft(dr.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input / Form area */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col h-full justify-between">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 flex justify-between">
                <span>Core Message Details</span>
                <span className="text-[10px] text-slate-400">Describe what you want to communicate</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Tell the client the DNS records for Vercel are pointing correctly. Let them know there is a small delay on SSL verification, which normally takes an hour. Tell them we will follow up as soon as it goes live."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Additional Instructions or Context (Optional)</label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Mention that I'm working late today. Reassure them of no data loss."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 rounded-xl px-5 py-2.5 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles size={14} className="text-teal-400" />
                {loading ? "Drafting communication..." : "Generate Ready-to-Send Draft"}
              </button>
            </div>
          </form>

          {/* Result Block */}
          {(result || loading) && (
            <div className="mt-6 border-t border-slate-100 pt-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 flex items-center gap-1">
                  <Sparkles size={11} />
                  Ready-to-Send Output
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!result}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={12} className="text-green-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Draft</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!result}
                    className="flex items-center gap-1 text-[11px] font-semibold text-white bg-slate-900 rounded-lg px-2.5 py-1.5 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Bookmark size={12} />
                    <span>Save to Workspace</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="h-28 flex flex-col items-center justify-center space-y-2 bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                  <div className="h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-400 font-mono">Formulating communication draft...</span>
                </div>
              ) : (
                <div className="bg-slate-50/40 rounded-xl border border-slate-100 p-4 font-sans text-sm space-y-3">
                  {subject && (
                    <div className="border-b border-slate-100 pb-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Subject Line</span>
                      <p className="text-slate-800 font-semibold">{subject}</p>
                    </div>
                  )}
                  <div className="text-slate-700 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {result}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
