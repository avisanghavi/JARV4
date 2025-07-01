import { 
  users, leads, workflows, approvals, outreachCampaigns, marketingCampaigns, 
  generatedSites, activities,
  type User, type Lead, type Workflow, type Approval, type OutreachCampaign, 
  type MarketingCampaign, type GeneratedSite, type Activity,
  type InsertUser, type InsertLead, type InsertWorkflow, type InsertApproval,
  type InsertOutreachCampaign, type InsertMarketingCampaign, type InsertGeneratedSite,
  type InsertActivity
} from "@shared/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Leads
  getLeads(limit?: number, offset?: number): Promise<Lead[]>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  getLeadStats(): Promise<{ total: number; pending: number; approved: number; contacted: number }>;

  // Workflows
  getWorkflows(limit?: number): Promise<Workflow[]>;
  getActiveWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: number): Promise<boolean>;

  // Approvals
  getApprovals(limit?: number): Promise<Approval[]>;
  getPendingApprovals(): Promise<Approval[]>;
  getApproval(id: number): Promise<Approval | undefined>;
  createApproval(approval: InsertApproval): Promise<Approval>;
  updateApproval(id: number, approval: Partial<InsertApproval>): Promise<Approval | undefined>;

  // Campaigns
  getOutreachCampaigns(): Promise<OutreachCampaign[]>;
  createOutreachCampaign(campaign: InsertOutreachCampaign): Promise<OutreachCampaign>;
  updateOutreachCampaign(id: number, campaign: Partial<InsertOutreachCampaign>): Promise<OutreachCampaign | undefined>;

  getMarketingCampaigns(): Promise<MarketingCampaign[]>;
  createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign>;
  updateMarketingCampaign(id: number, campaign: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign | undefined>;

  // Generated Sites
  getGeneratedSites(): Promise<GeneratedSite[]>;
  createGeneratedSite(site: InsertGeneratedSite): Promise<GeneratedSite>;
  updateGeneratedSite(id: number, site: Partial<InsertGeneratedSite>): Promise<GeneratedSite | undefined>;

  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    activeWorkflows: number;
    pendingApprovals: number;
    generatedLeads: number;
    conversionRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private leads: Map<number, Lead> = new Map();
  private workflows: Map<number, Workflow> = new Map();
  private approvals: Map<number, Approval> = new Map();
  private outreachCampaigns: Map<number, OutreachCampaign> = new Map();
  private marketingCampaigns: Map<number, MarketingCampaign> = new Map();
  private generatedSites: Map<number, GeneratedSite> = new Map();
  private activities: Map<number, Activity> = new Map();
  
  private currentUserId = 1;
  private currentLeadId = 1;
  private currentWorkflowId = 1;
  private currentApprovalId = 1;
  private currentOutreachCampaignId = 1;
  private currentMarketingCampaignId = 1;
  private currentGeneratedSiteId = 1;
  private currentActivityId = 1;

  constructor() {
    // Initialize with some default data
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Create default user
    const defaultUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: "admin123",
      name: "John Doe",
      role: "admin",
      linkedinEmail: null,
      linkedinPassword: null,
      crmApiKey: null,
      crmEndpoint: null,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create some sample workflows
    const workflows: Workflow[] = [
      {
        id: this.currentWorkflowId++,
        name: "Lead Outreach Campaign",
        description: "Processing 45 leads",
        domain: "sales",
        type: "outreach_campaign",
        status: "running",
        config: { targetCount: 45 },
        progress: 67,
        totalSteps: 4,
        results: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentWorkflowId++,
        name: "Competitor Analysis",
        description: "Monitoring 12 competitors",
        domain: "marketing",
        type: "competitor_analysis",
        status: "running",
        config: { competitors: 12 },
        progress: 85,
        totalSteps: 3,
        results: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.currentWorkflowId++,
        name: "Site Generation",
        description: "Building 3 landing pages",
        domain: "engineering",
        type: "site_generation",
        status: "pending",
        config: { pageCount: 3 },
        progress: 0,
        totalSteps: 5,
        results: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    workflows.forEach(workflow => this.workflows.set(workflow.id, workflow));

    // Create sample approvals
    const approvals: Approval[] = [
      {
        id: this.currentApprovalId++,
        title: "Outreach Message Template",
        description: "AI-generated message for TechCorp CEO",
        type: "outreach_message",
        priority: "high",
        status: "pending",
        requestedBy: "system",
        workflowId: 1,
        data: { message: "Hi {{name}}, I noticed your recent expansion..." },
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: this.currentApprovalId++,
        title: "Campaign Budget Increase",
        description: "Increase Google Ads budget by $2,500",
        type: "budget_increase",
        priority: "medium",
        status: "pending",
        requestedBy: "system",
        workflowId: 2,
        data: { currentBudget: 5000, requestedIncrease: 2500 },
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
    ];

    approvals.forEach(approval => this.approvals.set(approval.id, approval));

    // Create sample activities
    const activities: Activity[] = [
      {
        id: this.currentActivityId++,
        action: "Lead scoring completed",
        target: "247 LinkedIn leads",
        domain: "sales",
        userId: "system",
        metadata: { leadCount: 247 },
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      },
      {
        id: this.currentActivityId++,
        action: "Outreach campaign launched",
        target: "high-score prospects",
        domain: "sales",
        userId: "system",
        metadata: { campaignId: 1 },
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        id: this.currentActivityId++,
        action: "Approval required",
        target: "budget increase request",
        domain: "marketing",
        userId: "system",
        metadata: { approvalId: 2 },
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      },
      {
        id: this.currentActivityId++,
        action: "Landing page generated",
        target: "TechCorp campaign",
        domain: "engineering",
        userId: "system",
        metadata: { siteId: 1 },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
    ];

    activities.forEach(activity => this.activities.set(activity.id, activity));
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      role: insertUser.role || "user",
      linkedinEmail: insertUser.linkedinEmail || null,
      linkedinPassword: insertUser.linkedinPassword || null,
      crmApiKey: insertUser.crmApiKey || null,
      crmEndpoint: insertUser.crmEndpoint || null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = {
      ...existingUser,
      ...updateData,
      role: updateData.role || existingUser.role,
      linkedinEmail: updateData.linkedinEmail !== undefined ? updateData.linkedinEmail : existingUser.linkedinEmail,
      linkedinPassword: updateData.linkedinPassword !== undefined ? updateData.linkedinPassword : existingUser.linkedinPassword,
      crmApiKey: updateData.crmApiKey !== undefined ? updateData.crmApiKey : existingUser.crmApiKey,
      crmEndpoint: updateData.crmEndpoint !== undefined ? updateData.crmEndpoint : existingUser.crmEndpoint,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Leads
  async getLeads(limit = 50, offset = 0): Promise<Lead[]> {
    const allLeads = Array.from(this.leads.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allLeads.slice(offset, offset + limit);
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.status === status);
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const lead: Lead = {
      ...insertLead,
      id: this.currentLeadId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leads.set(lead.id, lead);
    return lead;
  }

  async updateLead(id: number, updateData: Partial<InsertLead>): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updatedLead: Lead = {
      ...lead,
      ...updateData,
      updatedAt: new Date(),
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id);
  }

  async getLeadStats(): Promise<{ total: number; pending: number; approved: number; contacted: number }> {
    const allLeads = Array.from(this.leads.values());
    return {
      total: allLeads.length,
      pending: allLeads.filter(l => l.status === 'pending').length,
      approved: allLeads.filter(l => l.status === 'approved').length,
      contacted: allLeads.filter(l => l.status === 'contacted').length,
    };
  }

  // Workflows
  async getWorkflows(limit = 50): Promise<Workflow[]> {
    const allWorkflows = Array.from(this.workflows.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allWorkflows.slice(0, limit);
  }

  async getActiveWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(w => w.status === 'running');
  }

  async getWorkflow(id: number): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const workflow: Workflow = {
      ...insertWorkflow,
      id: this.currentWorkflowId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  async updateWorkflow(id: number, updateData: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    const updatedWorkflow: Workflow = {
      ...workflow,
      ...updateData,
      updatedAt: new Date(),
    };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: number): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Approvals
  async getApprovals(limit = 50): Promise<Approval[]> {
    const allApprovals = Array.from(this.approvals.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allApprovals.slice(0, limit);
  }

  async getPendingApprovals(): Promise<Approval[]> {
    return Array.from(this.approvals.values()).filter(a => a.status === 'pending');
  }

  async getApproval(id: number): Promise<Approval | undefined> {
    return this.approvals.get(id);
  }

  async createApproval(insertApproval: InsertApproval): Promise<Approval> {
    const approval: Approval = {
      ...insertApproval,
      id: this.currentApprovalId++,
      createdAt: new Date(),
    };
    this.approvals.set(approval.id, approval);
    return approval;
  }

  async updateApproval(id: number, updateData: Partial<InsertApproval>): Promise<Approval | undefined> {
    const approval = this.approvals.get(id);
    if (!approval) return undefined;

    const updatedApproval: Approval = {
      ...approval,
      ...updateData,
    };
    this.approvals.set(id, updatedApproval);
    return updatedApproval;
  }

  // Campaigns
  async getOutreachCampaigns(): Promise<OutreachCampaign[]> {
    return Array.from(this.outreachCampaigns.values());
  }

  async createOutreachCampaign(insertCampaign: InsertOutreachCampaign): Promise<OutreachCampaign> {
    const campaign: OutreachCampaign = {
      ...insertCampaign,
      id: this.currentOutreachCampaignId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.outreachCampaigns.set(campaign.id, campaign);
    return campaign;
  }

  async updateOutreachCampaign(id: number, updateData: Partial<InsertOutreachCampaign>): Promise<OutreachCampaign | undefined> {
    const campaign = this.outreachCampaigns.get(id);
    if (!campaign) return undefined;

    const updatedCampaign: OutreachCampaign = {
      ...campaign,
      ...updateData,
      updatedAt: new Date(),
    };
    this.outreachCampaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async getMarketingCampaigns(): Promise<MarketingCampaign[]> {
    return Array.from(this.marketingCampaigns.values());
  }

  async createMarketingCampaign(insertCampaign: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const campaign: MarketingCampaign = {
      ...insertCampaign,
      id: this.currentMarketingCampaignId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.marketingCampaigns.set(campaign.id, campaign);
    return campaign;
  }

  async updateMarketingCampaign(id: number, updateData: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign | undefined> {
    const campaign = this.marketingCampaigns.get(id);
    if (!campaign) return undefined;

    const updatedCampaign: MarketingCampaign = {
      ...campaign,
      ...updateData,
      updatedAt: new Date(),
    };
    this.marketingCampaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  // Generated Sites
  async getGeneratedSites(): Promise<GeneratedSite[]> {
    return Array.from(this.generatedSites.values());
  }

  async createGeneratedSite(insertSite: InsertGeneratedSite): Promise<GeneratedSite> {
    const site: GeneratedSite = {
      ...insertSite,
      id: this.currentGeneratedSiteId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.generatedSites.set(site.id, site);
    return site;
  }

  async updateGeneratedSite(id: number, updateData: Partial<InsertGeneratedSite>): Promise<GeneratedSite | undefined> {
    const site = this.generatedSites.get(id);
    if (!site) return undefined;

    const updatedSite: GeneratedSite = {
      ...site,
      ...updateData,
      updatedAt: new Date(),
    };
    this.generatedSites.set(id, updatedSite);
    return updatedSite;
  }

  // Activities
  async getRecentActivities(limit = 20): Promise<Activity[]> {
    const allActivities = Array.from(this.activities.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allActivities.slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const activity: Activity = {
      ...insertActivity,
      id: this.currentActivityId++,
      createdAt: new Date(),
    };
    this.activities.set(activity.id, activity);
    return activity;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    activeWorkflows: number;
    pendingApprovals: number;
    generatedLeads: number;
    conversionRate: number;
  }> {
    const activeWorkflows = Array.from(this.workflows.values()).filter(w => w.status === 'running').length;
    const pendingApprovals = Array.from(this.approvals.values()).filter(a => a.status === 'pending').length;
    const generatedLeads = this.leads.size;
    
    // Calculate conversion rate based on leads
    const allLeads = Array.from(this.leads.values());
    const contactedLeads = allLeads.filter(l => l.status === 'contacted').length;
    const conversionRate = allLeads.length > 0 ? (contactedLeads / allLeads.length) * 100 : 0;

    return {
      activeWorkflows,
      pendingApprovals,
      generatedLeads,
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
    };
  }
}

export const storage = new MemStorage();
