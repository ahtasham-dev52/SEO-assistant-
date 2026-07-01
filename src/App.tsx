import React, { useState, useEffect } from "react";
import { Bot, CheckSquare, Mail, Clock, Table, Sparkles, User, Sun, Calendar, Menu, X, BookOpen, AlertCircle, Globe } from "lucide-react";
import ChatHub from "./components/ChatHub";
import TaskManager from "./components/TaskManager";
import CommunicationSuite from "./components/CommunicationSuite";
import WorkAssistant from "./components/WorkAssistant";
import DecisionHub from "./components/DecisionHub";
import WebsiteGrader from "./components/WebsiteGrader";

interface SavedDraft {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "tasks" | "comms" | "work" | "decision" | "grader">("chat");
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [currentTime, setCurrentTime] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    // Current time ticking helper
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load saved drafts and tasks
  useEffect(() => {
    const drafts = localStorage.getItem("assistant_saved_drafts");
    if (drafts) {
      setSavedDrafts(JSON.parse(drafts));
    }

    const tasks = localStorage.getItem("assistant_tasks");
    if (tasks) {
      const parsedTasks = JSON.parse(tasks);
      const urgents = parsedTasks.filter((t: any) => t.priority === "urgent").length;
      setUrgentCount(urgents);
    }
  }, [activeTab]);

  const handleAddDraft = (title: string, content: string, type: string) => {
    const newDraft: SavedDraft = {
      id: `draft-${Date.now()}`,
      title,
      content,
      type,
      createdAt: new Date().toISOString()
    };
    const updated = [newDraft, ...savedDrafts];
    setSavedDrafts(updated);
    localStorage.setItem("assistant_saved_drafts", JSON.stringify(updated));
    alert(`🎉 Draft saved successfully to your Workspace Drafts!`);
  };

  const handleDeleteDraft = (id: string) => {
    const updated = savedDrafts.filter(d => d.id !== id);
    setSavedDrafts(updated);
    localStorage.setItem("assistant_saved_drafts", JSON.stringify(updated));
  };

  const navItems = [
    { id: "chat", label: "Assistant Chat", icon: Bot, desc: "Direct dialogue & query audits" },
    { id: "grader", label: "Website Grader", icon: Globe, desc: "SEO, speed & usability review" },
    { id: "tasks", label: "Daily Task Board", icon: CheckSquare, desc: "Action items & step checklist", badge: urgentCount > 0 ? `${urgentCount} urgent` : undefined },
    { id: "comms", label: "Email & Msg Drafts", icon: Mail, desc: "Audience/Tone customized drafts" },
    { id: "work", label: "Time Log & Bug Explainer", icon: Clock, desc: "Status reports & tech diagnostics" },
    { id: "decision", label: "Decision & Research Hub", icon: Table, desc: "Side-by-side qualitative matrix" }
  ];

  const renderActiveWorkspace = () => {
    switch (activeTab) {
      case "chat":
        return <ChatHub onAddDraft={handleAddDraft} />;
      case "grader":
        return <WebsiteGrader onAddDraft={handleAddDraft} />;
      case "tasks":
        return <TaskManager />;
      case "comms":
        return (
          <CommunicationSuite
            onAddDraft={handleAddDraft}
            savedDrafts={savedDrafts}
            onDeleteDraft={handleDeleteDraft}
          />
        );
      case "work":
        return <WorkAssistant onAddDraft={handleAddDraft} />;
      case "decision":
        return <DecisionHub onAddDraft={handleAddDraft} />;
      default:
        return <ChatHub onAddDraft={handleAddDraft} />;
    }
  };

  return (
    <div id="app-root-shell" className="flex h-screen w-screen bg-slate-50 font-sans overflow-hidden text-slate-800">
      
      {/* LEFT SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 border-r border-slate-800 p-5 text-slate-300 select-none shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-slate-900 shadow-sm shadow-teal-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">Personal Assistant</h1>
              <span className="text-[10px] text-teal-400 font-semibold font-mono uppercase tracking-wider">Workspace • v1.1</span>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Assistant profile block */}
          <div className="bg-slate-850 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-teal-400">
                AI
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white leading-tight">Gemini Assistant</p>
                <span className="text-[10px] text-slate-500 block truncate">ahtasham6338@gmail.com</span>
              </div>
            </div>
            <div className="bg-teal-950/20 border border-teal-900/30 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-[10px] text-teal-500 font-semibold font-mono">STATUS</span>
              <span className="flex items-center gap-1 text-[10px] text-teal-400 font-semibold uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                Live & Guarded
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 px-2 block mb-2">Workspaces</span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                      : "hover:bg-slate-800/50 hover:text-slate-200 text-slate-400 border border-transparent"
                  }`}
                >
                  <Icon size={16} className={`shrink-0 mt-0.5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold text-red-400 bg-red-950/30 border border-red-900/40 px-1.5 py-0.5 rounded-full uppercase leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate">{item.desc}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info (Local clock) */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>SESSION TIME</span>
            <span className="text-slate-300 font-semibold">{currentTime || "--:--:--"}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>WORKING STYLE</span>
            <span className="text-teal-500 font-semibold">WebDev/DNS</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP NAVBAR (Mobile & Desktop Status) */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-6 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Workspace</span>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {navItems.find(n => n.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Display time logs or task quick metrics */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
              <Calendar size={13} className="text-teal-500" />
              <span className="text-xs font-semibold">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-teal-600 font-bold text-xs" title="User Session Profile">
              A
            </div>
          </div>
        </header>

        {/* ACTIVE WORKSPACE MODULE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto h-full">
            {renderActiveWorkspace()}
          </div>
        </main>
      </div>

      {/* MOBILE SIDEBAR DRAWEROVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-xs">
          <div className="relative flex flex-col w-72 max-w-xs bg-slate-900 p-5 text-slate-300">
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-slate-900">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white leading-none">Personal Assistant</h1>
                  <span className="text-[10px] text-teal-400 font-semibold font-mono uppercase tracking-wider">Mobile Hub</span>
                </div>
              </div>

              <hr className="border-slate-800" />

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all cursor-pointer ${
                        isActive ? "bg-slate-800 text-white" : "hover:bg-slate-800/50 text-slate-400"
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-teal-400' : 'text-slate-500'} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

