


const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type GenerationMode = "auto" | "custom";

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  mode: GenerationMode;
  files: UploadedFile[];
}

// Check backend health
export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error("Backend is unavailable");
  }

  return response.json();
}

// Retrieve our five AI agents
export async function getAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_URL}/api/agents`);

  if (!response.ok) {
    throw new Error("Failed to retrieve agents");
  }

  const data = await response.json();

  return data.agents;
}

// Upload teaching materials
export async function uploadMaterials(
  files: File[],
  mode: GenerationMode,
  instructions: string = ""
): Promise<UploadResponse> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: {
      "x-generation-mode": mode,
      "x-custom-instructions":
        mode === "custom"
          ? encodeURIComponent(instructions)
          : ""
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Upload failed");
  }

  return data;
}

export { API_URL };

export interface LessonAnalysis {
  title: string;
  subject: string;
  targetAudience: string;
  summary: string;
  learningObjectives: string[];
  keyConcepts: {
    name: string;
    explanation: string;
  }[];
  suggestedActivities: string[];
}

export interface WebsiteBlueprint {
  title: string;
  tagline: string;
  experienceType: string;
  theme: {
    style: string;
    primaryColor: string;
    backgroundColor: string;
  };
  pages: {
    title: string;
    purpose: string;
  }[];
  activities: {
    id: string;
    title: string;
    type: string;
    instructions: string;
    learningObjective: string;
    mechanics: string;
  }[];
}


export interface GenerationResult {
  success: boolean;
  message: string;
  agents: string[];
  analysis: LessonAnalysis;
  blueprint: WebsiteBlueprint;
  website: {
    id: string;
    title: string;
    html: string;
    implementationNotes: string[];
  };
  testReport: WebsiteTestReport;
  repairAttempts: number;
qualityStatus: "passed" | "needs_review";
}


export async function generateLearningExperience(
  fileIds: string[],
  mode: GenerationMode,
  instructions: string,
  jobId: string
): Promise<GenerationResult> {
  const response = await fetch(`${API_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fileIds,
      mode,
      instructions,
      jobId
    })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "AI generation failed"
    );
  }

  return result;
}


export interface WebsiteTestReport {
  passed: boolean;
  score: number;
  summary: string;
  tests: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  errors: string[];
}
