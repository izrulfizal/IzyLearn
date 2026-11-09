
import type { Server } from "socket.io";

import type {
  AgentReporter,
  AgentActivity
} from "../agents/agentEvents";

let io: Server | null = null;

export function configureAgentEvents(server: Server) {
  io = server;
}

export function createAgentReporter(
  jobId: string
): AgentReporter {
  return (agent, status, message) => {
    const activity: AgentActivity = {
      jobId,
      agent,
      status,
      message,
      timestamp: new Date().toISOString()
    };

    console.log(
      `📡 ${agent} [${status}]: ${message}`
    );

    io?.to(jobId).emit("agent:activity", activity);
  };
}
