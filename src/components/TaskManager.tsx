import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Clock, ChevronRight, ChevronLeft, Calendar, FileText, CheckSquare, Square, AlertCircle, Bookmark, Eye } from "lucide-react";
import { Task, PriorityType, TaskStep } from "../types";

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<PriorityType>("important");
  const [newDueDate, setNewDueDate] = useState("");
  
  // Custom checklist items inside modal or task creation
  const [newStepsText, setNewStepsText] = useState("");
  
  // Selected task for detailed view modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [stepInput, setStepInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("assistant_tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      // Pre-load default tasks including the AFC Industries task!
      const initial: Task[] = [
        {
          id: "task-afc",
          title: "Optimize and Test AFC Industries website",
          description: "Perform site speed audit, responsive design test, and SKU search enhancement planning for www.afcind.com.",
          priority: "urgent",
          dueDate: "2026-07-03",
          createdAt: new Date().toISOString(),
          steps: [
            { id: "step-1", text: "Analyze fastener catalog SKU search options", completed: true },
            { id: "step-2", text: "Test responsive breakpoints for shop floor use", completed: true },
            { id: "step-3", text: "Audit Lead RFQ forms & VMI logins", completed: true },
            { id: "step-4", text: "Draft comprehensive summary email to manager", completed: true },
            { id: "step-5", text: "Configure staging environment for benchmark tests", completed: false }
          ]
        },
        {
          id: "task-followup",
          title: "Follow up with client regarding proposal",
          description: "Send professional Slack/Email update regarding web application estimate.",
          priority: "important",
          dueDate: "2026-07-02",
          createdAt: new Date().toISOString(),
          steps: [
            { id: "step-f1", text: "Draft ready-to-send brief", completed: false }
          ]
        },
        {
          id: "task-dns",
          title: "Configure DNS settings & cPanel backups",
          description: "Update client A records, point CNAME to Vercel and establish auto backup schedules.",
          priority: "pending",
          dueDate: "2026-07-05",
          createdAt: new Date().toISOString(),
          steps: [
            { id: "step-d1", text: "Verify cPanel backup destination is external cloud storage", completed: true },
            { id: "step-d2", text: "Update A records in registrar", completed: false }
          ]
        }
      ];
      setTasks(initial);
      localStorage.setItem("assistant_tasks", JSON.stringify(initial));
    }
  }, []);

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem("assistant_tasks", JSON.stringify(updated));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Split step input by comma or line breaks to create initial steps
    const steps: TaskStep[] = [];
    if (newStepsText.trim()) {
      newStepsText.split(/[,\n]/).forEach((txt, idx) => {
        if (txt.trim()) {
          steps.push({
            id: `step-${Date.now()}-${idx}`,
            text: txt.trim(),
            completed: false
          });
        }
      });
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      dueDate: newDueDate || undefined,
      createdAt: new Date().toISOString(),
      steps
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);

    // Reset fields
    setNewTitle("");
    setNewDesc("");
    setNewPriority("important");
    setNewDueDate("");
    setNewStepsText("");
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      const updated = tasks.filter(t => t.id !== id);
      saveTasks(updated);
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
    }
  };

  const handleUpdatePriority = (id: string, priority: PriorityType) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        return { ...t, priority };
      }
      return t;
    });
    saveTasks(updated);
    if (selectedTask?.id === id) {
      setSelectedTask({ ...selectedTask, priority });
    }
  };

  const handleToggleStep = (taskId: string, stepId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const steps = t.steps.map(s => {
          if (s.id === stepId) {
            return { ...s, completed: !s.completed };
          }
          return s;
        });

        // Auto-move task to completed priority if all steps are completed and it wasn't already?
        // Let's keep it manual or let user decide, but we can compute and suggest it.
        return { ...t, steps };
      }
      return t;
    });

    saveTasks(updated);

    // Sync selected task modal
    if (selectedTask?.id === taskId) {
      const task = updated.find(t => t.id === taskId);
      if (task) setSelectedTask(task);
    }
  };

  const handleAddStepToSelected = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !stepInput.trim()) return;

    const newStep: TaskStep = {
      id: `step-${Date.now()}`,
      text: stepInput.trim(),
      completed: false
    };

    const updated = tasks.map(t => {
      if (t.id === selectedTask.id) {
        return {
          ...t,
          steps: [...t.steps, newStep]
        };
      }
      return t;
    });

    saveTasks(updated);
    setStepInput("");

    const updatedSelected = updated.find(t => t.id === selectedTask.id);
    if (updatedSelected) {
      setSelectedTask(updatedSelected);
    }
  };

  const handleDeleteStepFromSelected = (stepId: string) => {
    if (!selectedTask) return;

    const updated = tasks.map(t => {
      if (t.id === selectedTask.id) {
        return {
          ...t,
          steps: t.steps.filter(s => s.id !== stepId)
        };
      }
      return t;
    });

    saveTasks(updated);

    const updatedSelected = updated.find(t => t.id === selectedTask.id);
    if (updatedSelected) {
      setSelectedTask(updatedSelected);
    }
  };

  // Grouping tasks
  const columns: { key: PriorityType; title: string; color: string; bg: string; text: string }[] = [
    { key: "urgent", title: "Urgent", color: "bg-red-500", bg: "bg-red-50/40", text: "text-red-700" },
    { key: "important", title: "Important", color: "bg-amber-500", bg: "bg-amber-50/40", text: "text-amber-700" },
    { key: "low", title: "Low Priority", color: "bg-green-500", bg: "bg-green-50/40", text: "text-green-700" },
    { key: "pending", title: "Pending", color: "bg-blue-500", bg: "bg-blue-50/40", text: "text-blue-700" },
    { key: "completed", title: "Completed", color: "bg-slate-500", bg: "bg-slate-50/80", text: "text-slate-600" }
  ];

  return (
    <div className="space-y-6">
      {/* Task input form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-teal-500" />
          Create New Task & Steps
        </h3>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500">Task Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Optimize SKU Search for afcind.com"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Priority Category</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as PriorityType)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="important">🟡 Important</option>
                <option value="low">🟢 Low Priority</option>
                <option value="pending">🔵 Pending</option>
                <option value="completed">⚪ Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Short outline of the objective or problem..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Due Date (Optional)</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-slate-500">Breakdown Action Steps (Optional)</label>
              <span className="text-[10px] text-slate-400">Separate items with commas or new lines</span>
            </div>
            <textarea
              rows={2}
              value={newStepsText}
              onChange={(e) => setNewStepsText(e.target.value)}
              placeholder="e.g. Audit home page speed, Compress assets, Draft final email to client"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-5 py-2.5 text-xs font-medium transition-colors cursor-pointer"
            >
              Add Task to Board
            </button>
          </div>
        </form>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.priority === col.key);
          return (
            <div
              key={col.key}
              className={`rounded-2xl border border-slate-100 ${col.bg} p-4 flex flex-col h-[520px] shadow-xs`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${col.color}`} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">{col.title}</h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-100">
                  {colTasks.length}
                </span>
              </div>

              {/* Scrollable Column Body */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-28 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-[10px] text-slate-400 font-medium">No tasks here</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const completedSteps = task.steps.filter(s => s.completed).length;
                    const totalSteps = task.steps.length;
                    const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

                    return (
                      <div
                        key={task.id}
                        className="bg-white rounded-xl border border-slate-100 p-3.5 shadow-xs hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h5 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-teal-600 transition-colors">
                            {task.title}
                          </h5>
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                            title="Detailed view"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                        
                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}

                        {/* Progress Bar */}
                        {totalSteps > 0 && (
                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-slate-400">Steps completed:</span>
                              <span className="font-bold text-slate-500">{completedSteps}/{totalSteps} ({pct}%)</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}

                        {/* Due Date Indicator */}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-2">
                            <Calendar size={11} />
                            <span>Due: {task.dueDate}</span>
                          </div>
                        )}

                        {/* Column Quick Mover & Delete */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={task.priority}
                              onChange={(e) => handleUpdatePriority(task.id, e.target.value as PriorityType)}
                              className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                            >
                              <option value="urgent">🔴 Urgent</option>
                              <option value="important">🟡 Important</option>
                              <option value="low">🟢 Low</option>
                              <option value="pending">🔵 Pending</option>
                              <option value="completed">⚪ Completed</option>
                            </select>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedTask.priority === 'urgent' ? 'bg-red-50 text-red-700 border border-red-100' :
                    selectedTask.priority === 'important' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    selectedTask.priority === 'low' ? 'bg-green-50 text-green-700 border border-green-100' :
                    selectedTask.priority === 'pending' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    {selectedTask.priority}
                  </span>
                  {selectedTask.dueDate && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar size={11} />
                      Due {selectedTask.dueDate}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-slate-800">{selectedTask.title}</h4>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {selectedTask.description && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Description</span>
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Steps Checklist */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <CheckSquare size={12} className="text-teal-500" />
                  Action Steps Checklist
                </span>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedTask.steps.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No checklist steps established yet.</p>
                  ) : (
                    selectedTask.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                      >
                        <button
                          onClick={() => handleToggleStep(selectedTask.id, step.id)}
                          className="flex items-center gap-2.5 text-left text-xs"
                        >
                          {step.completed ? (
                            <CheckCircle2 size={16} className="text-teal-500 shrink-0" />
                          ) : (
                            <Circle size={16} className="text-slate-300 shrink-0" />
                          )}
                          <span className={`text-slate-600 leading-snug ${step.completed ? 'line-through text-slate-400' : ''}`}>
                            {step.text}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteStepFromSelected(step.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add a Step form */}
              <form onSubmit={handleAddStepToSelected} className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Add Next Action Step</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={stepInput}
                    onChange={(e) => setStepInput(e.target.value)}
                    placeholder="e.g. Test mobile menu on Safari"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-950 text-white hover:bg-slate-800 text-xs font-semibold px-3.5 py-1.5 rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <span className="text-[11px] text-slate-400">Created on {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTask.priority}
                  onChange={(e) => handleUpdatePriority(selectedTask.id, e.target.value as PriorityType)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="important">🟡 Important</option>
                  <option value="low">🟢 Low</option>
                  <option value="pending">🔵 Pending</option>
                  <option value="completed">⚪ Completed</option>
                </select>
                <button
                  onClick={() => {
                    handleDeleteTask(selectedTask.id);
                  }}
                  className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
