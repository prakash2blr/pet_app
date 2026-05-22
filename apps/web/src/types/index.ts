export type TaskStatus = "pending" | "done" | "skipped" | "issue";
export type Severity = "normal" | "watch" | "urgent";

export type Dog = {
  _id: string;
  ownerName?: string;
  name: string;
  breed?: string;
  age?: string;
  weight?: string;
  allergies?: string[];
  medications?: string[];
  foodRoutine?: string;
  behaviourNotes?: string;
  vet?: { name?: string; phone?: string };
  emergencyContact?: { name?: string; phone?: string };
  photoUrl?: string;
};

export type CarePlan = {
  _id: string;
  dogId: string;
  title: string;
  startDate: string;
  endDate: string;
  caregiverName?: string;
  caregiverContact?: string;
  ownerInstructionsRaw: string;
  aiGeneratedSummary: string;
  caregiverInstructions: string;
  criticalWarnings: string[];
  missingInfo: string[];
  shareToken: string;
  status: "draft" | "active" | "completed";
};

export type CareTask = {
  _id: string;
  planId: string;
  dogId: string;
  title: string;
  description?: string;
  type: string;
  dueTime?: string;
  critical: boolean;
  status: TaskStatus;
  latestCheckInId?: string;
};

export type CheckIn = {
  _id: string;
  taskId: string;
  planId: string;
  dogId: string;
  status: TaskStatus;
  note?: string;
  photoUrl?: string;
  severity: Severity;
  submittedBy?: string;
  createdAt: string;
};

export type PlanContext = {
  dog: Dog;
  plan: CarePlan;
  tasks: CareTask[];
  checkIns: CheckIn[];
  caregiverUrl?: string;
  dashboardUrl?: string;
  reviewUrl?: string;
  medicalDisclaimer?: string;
};
