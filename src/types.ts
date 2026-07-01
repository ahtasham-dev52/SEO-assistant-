export type PriorityType = 'urgent' | 'important' | 'low' | 'pending' | 'completed';

export interface TaskStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: PriorityType;
  steps: TaskStep[];
  dueDate?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TimeLog {
  id: string;
  project: string;
  task: string;
  hours: number;
  date: string;
  details: string;
}

export interface DecisionOption {
  id: string;
  name: string;
  cost: 'low' | 'medium' | 'high';
  safety: 'low' | 'medium' | 'high';
  value: 'low' | 'medium' | 'high';
  easeOfUse: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  maintenance: 'low' | 'medium' | 'high';
  pros: string[];
  cons: string[];
}
