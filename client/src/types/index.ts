export interface DashboardStats {
  activeWorkflows: number;
  pendingApprovals: number;
  generatedLeads: number;
  conversionRate: number;
}

export interface Lead {
  id: number;
  source: string;
  name: string;
  company: string | null;
  title: string | null;
  email: string | null;
  profileUrl: string | null;
  recentActivity: string | null;
  score: number | null;
  status: string;
  rawData: any;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  domain: string;
  type: string;
  status: string;
  config: any;
  progress: number | null;
  totalSteps: number | null;
  results: any;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: number;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  requestedBy: string;
  workflowId: number | null;
  data: any;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface Activity {
  id: number;
  action: string;
  target: string | null;
  domain: string;
  userId: string | null;
  metadata: any;
  createdAt: string;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
}
