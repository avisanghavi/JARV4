import { storage } from "../storage";
import { openaiService } from "./openai";
import { leadScoringService } from "./leadScoring";
import type { InsertWorkflow, InsertApproval, InsertActivity } from "@shared/schema";

export interface WorkflowTrigger {
  type: string;
  domain: string;
  data: any;
}

export interface WorkflowAction {
  type: string;
  domain: string;
  config: any;
}

export class OrchestrationService {
  private readonly TRIGGERS = {
    LEAD_IMPORTED: 'lead_imported',
    LEAD_SCORED: 'lead_scored',
    LEAD_APPROVED: 'lead_approved',
    CAMPAIGN_COMPLETED: 'campaign_completed',
    BUDGET_THRESHOLD_REACHED: 'budget_threshold_reached',
    SITE_GENERATED: 'site_generated',
    CONVERSION_DETECTED: 'conversion_detected',
  };

  async triggerWorkflow(trigger: WorkflowTrigger): Promise<void> {
    console.log(`Orchestration trigger: ${trigger.type} in ${trigger.domain}`);
    
    await this.logActivity({
      action: `Workflow triggered: ${trigger.type}`,
      target: trigger.domain,
      domain: "orchestration",
      userId: "system",
      metadata: trigger.data,
    });

    switch (trigger.type) {
      case this.TRIGGERS.LEAD_IMPORTED:
        await this.handleLeadImported(trigger.data);
        break;
      case this.TRIGGERS.LEAD_SCORED:
        await this.handleLeadScored(trigger.data);
        break;
      case this.TRIGGERS.LEAD_APPROVED:
        await this.handleLeadApproved(trigger.data);
        break;
      case this.TRIGGERS.CAMPAIGN_COMPLETED:
        await this.handleCampaignCompleted(trigger.data);
        break;
      case this.TRIGGERS.BUDGET_THRESHOLD_REACHED:
        await this.handleBudgetThreshold(trigger.data);
        break;
      case this.TRIGGERS.SITE_GENERATED:
        await this.handleSiteGenerated(trigger.data);
        break;
      case this.TRIGGERS.CONVERSION_DETECTED:
        await this.handleConversionDetected(trigger.data);
        break;
    }
  }

  private async handleLeadImported(data: { leadIds: number[] }): Promise<void> {
    // Automatically trigger lead scoring
    const workflow = await this.createWorkflow({
      name: "Auto Lead Scoring",
      description: `Scoring ${data.leadIds.length} newly imported leads`,
      domain: "sales",
      type: "lead_scoring",
      status: "running",
      config: { leadIds: data.leadIds },
      progress: 0,
      totalSteps: 2,
      results: null,
    });

    // Start scoring process
    try {
      await leadScoringService.scoreExistingLeads(data.leadIds);
      
      await storage.updateWorkflow(workflow.id, {
        status: "completed",
        progress: 100,
        results: { scoredLeads: data.leadIds.length }
      });

      // Trigger next step: check for high-scoring leads
      const highScoreLeads = await this.getHighScoreLeads(data.leadIds);
      if (highScoreLeads.length > 0) {
        await this.triggerWorkflow({
          type: this.TRIGGERS.LEAD_SCORED,
          domain: "sales",
          data: { highScoreLeadIds: highScoreLeads.map(l => l.id) }
        });
      }
    } catch (error) {
      await storage.updateWorkflow(workflow.id, {
        status: "failed",
        results: { error: error.message }
      });
    }
  }

  private async handleLeadScored(data: { highScoreLeadIds: number[] }): Promise<void> {
    // Create approval request for high-scoring leads
    const leads = await Promise.all(
      data.highScoreLeadIds.map(id => storage.getLead(id))
    );
    const validLeads = leads.filter(Boolean);

    if (validLeads.length > 0) {
      await this.createApproval({
        title: "High-Value Lead Outreach",
        description: `${validLeads.length} high-scoring leads ready for outreach campaign`,
        type: "outreach_campaign",
        priority: "high",
        status: "pending",
        requestedBy: "system",
        workflowId: null,
        data: {
          leadIds: validLeads.map(l => l.id),
          leadNames: validLeads.map(l => l.name),
          averageScore: validLeads.reduce((sum, l) => sum + (l.score || 0), 0) / validLeads.length
        },
        approvedBy: null,
        approvedAt: null,
      });
    }
  }

  private async handleLeadApproved(data: { leadIds: number[], campaignType: string }): Promise<void> {
    // Generate outreach messages for approved leads
    const workflow = await this.createWorkflow({
      name: "Outreach Message Generation",
      description: `Generating personalized messages for ${data.leadIds.length} approved leads`,
      domain: "sales",
      type: "outreach_generation",
      status: "running",
      config: { leadIds: data.leadIds, campaignType: data.campaignType },
      progress: 0,
      totalSteps: 3,
      results: null,
    });

    try {
      const leads = await Promise.all(data.leadIds.map(id => storage.getLead(id)));
      const validLeads = leads.filter(Boolean);
      const messages = [];

      for (const lead of validLeads) {
        const message = await openaiService.generateOutreachMessage({
          name: lead.name,
          company: lead.company || "",
          title: lead.title || "",
          recentActivity: lead.recentActivity,
        });
        messages.push({ leadId: lead.id, message });
      }

      await storage.updateWorkflow(workflow.id, {
        status: "completed",
        progress: 100,
        results: { generatedMessages: messages.length }
      });

      // Create approval for sending messages
      await this.createApproval({
        title: "Outreach Messages Ready",
        description: `${messages.length} personalized messages generated and ready to send`,
        type: "outreach_send",
        priority: "medium",
        status: "pending",
        requestedBy: "system",
        workflowId: workflow.id,
        data: { messages },
        approvedBy: null,
        approvedAt: null,
      });

    } catch (error) {
      await storage.updateWorkflow(workflow.id, {
        status: "failed",
        results: { error: error.message }
      });
    }
  }

  private async handleCampaignCompleted(data: { campaignId: number, results: any }): Promise<void> {
    // Trigger marketing analysis and engineering optimization
    await this.triggerWorkflow({
      type: this.TRIGGERS.CONVERSION_DETECTED,
      domain: "marketing",
      data: { campaignResults: data.results }
    });

    // Log campaign completion
    await this.logActivity({
      action: "Campaign completed",
      target: `Campaign ${data.campaignId}`,
      domain: "sales",
      userId: "system",
      metadata: data.results,
    });
  }

  private async handleBudgetThreshold(data: { campaignId: number, currentSpend: number, threshold: number }): Promise<void> {
    // Create budget increase approval
    await this.createApproval({
      title: "Budget Threshold Reached",
      description: `Campaign ${data.campaignId} has reached ${Math.round((data.currentSpend / data.threshold) * 100)}% of budget`,
      type: "budget_increase",
      priority: "high",
      status: "pending",
      requestedBy: "system",
      workflowId: null,
      data: {
        campaignId: data.campaignId,
        currentSpend: data.currentSpend,
        threshold: data.threshold,
        recommendedIncrease: data.threshold * 0.5 // 50% increase
      },
      approvedBy: null,
      approvedAt: null,
    });
  }

  private async handleSiteGenerated(data: { siteId: number, industry: string }): Promise<void> {
    // Trigger A/B testing setup
    const workflow = await this.createWorkflow({
      name: "A/B Testing Setup",
      description: `Setting up A/B tests for generated site ${data.siteId}`,
      domain: "engineering",
      type: "ab_testing",
      status: "running",
      config: { siteId: data.siteId, industry: data.industry },
      progress: 0,
      totalSteps: 4,
      results: null,
    });

    // Simulate A/B test setup
    setTimeout(async () => {
      await storage.updateWorkflow(workflow.id, {
        status: "completed",
        progress: 100,
        results: { testsCreated: 3, expectedDuration: "2 weeks" }
      });
    }, 2000);
  }

  private async handleConversionDetected(data: { campaignResults: any }): Promise<void> {
    // Trigger site optimization based on conversion data
    await this.logActivity({
      action: "Conversion optimization triggered",
      target: "High-performing campaign elements",
      domain: "engineering",
      userId: "system",
      metadata: data.campaignResults,
    });
  }

  private async getHighScoreLeads(leadIds: number[]): Promise<any[]> {
    const leads = await Promise.all(leadIds.map(id => storage.getLead(id)));
    return leads.filter(lead => lead && lead.score && lead.score >= 80);
  }

  private async createWorkflow(workflow: InsertWorkflow) {
    return await storage.createWorkflow(workflow);
  }

  private async createApproval(approval: InsertApproval) {
    return await storage.createApproval(approval);
  }

  private async logActivity(activity: InsertActivity) {
    return await storage.createActivity(activity);
  }

  // Public methods for triggering common workflows
  async startLeadImportWorkflow(leadIds: number[]): Promise<void> {
    await this.triggerWorkflow({
      type: this.TRIGGERS.LEAD_IMPORTED,
      domain: "sales",
      data: { leadIds }
    });
  }

  async approveLead(leadIds: number[], campaignType: string = "outreach"): Promise<void> {
    await this.triggerWorkflow({
      type: this.TRIGGERS.LEAD_APPROVED,
      domain: "sales",
      data: { leadIds, campaignType }
    });
  }

  async completeCampaign(campaignId: number, results: any): Promise<void> {
    await this.triggerWorkflow({
      type: this.TRIGGERS.CAMPAIGN_COMPLETED,
      domain: "sales",
      data: { campaignId, results }
    });
  }
}

export const orchestrationService = new OrchestrationService();
