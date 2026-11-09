
export type AgentName =
  | "Izzy"
  | "Suria"
  | "Saujana"
  | "Arus"
  | "Embun";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "working"
  | "reviewing"
  | "completed"
  | "failed";

export interface AgentActivity {
  jobId: string;
  agent: AgentName;
  status: AgentStatus;
  message: string;
  timestamp: string;
}

export type AgentReporter = (
  agent: AgentName,
  status: AgentStatus,
  message: string
) => void;
