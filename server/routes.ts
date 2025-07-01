import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { openaiService } from "./services/openai";
import { leadScoringService } from "./services/leadScoring";
import { orchestrationService } from "./services/orchestration";
import { insertLeadSchema, insertWorkflowSchema, insertApprovalSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    // Send initial data
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to HeyJarvis real-time updates'
    }));
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/active", async (req, res) => {
    try {
      const workflows = await storage.getActiveWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active workflows" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const workflowData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(workflowData);
      
      broadcast({
        type: 'workflow_created',
        data: workflow
      });
      
      res.json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid workflow data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create workflow" });
      }
    }
  });

  app.patch("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const workflow = await storage.updateWorkflow(id, updates);
      
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      broadcast({
        type: 'workflow_updated',
        data: workflow
      });
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow" });
    }
  });

  // Approvals
  app.get("/api/approvals", async (req, res) => {
    try {
      const approvals = await storage.getApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  app.get("/api/approvals/pending", async (req, res) => {
    try {
      const approvals = await storage.getPendingApprovals();
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  });

  app.post("/api/approvals/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approvedBy } = req.body;
      
      const approval = await storage.updateApproval(id, {
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
      });

      if (!approval) {
        return res.status(404).json({ error: "Approval not found" });
      }

      // Trigger orchestration based on approval type
      if (approval.type === "outreach_message" && approval.data) {
        const data = approval.data as any;
        if (data.leadIds) {
          await orchestrationService.approveLead(data.leadIds);
        }
      }

      broadcast({
        type: 'approval_updated',
        data: approval
      });

      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve request" });
    }
  });

  app.post("/api/approvals/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rejectedBy, reason } = req.body;
      
      const approval = await storage.updateApproval(id, {
        status: "rejected",
        approvedBy: rejectedBy,
        data: { 
          ...(approval?.data as any || {}), 
          rejectionReason: reason 
        }
      });

      if (!approval) {
        return res.status(404).json({ error: "Approval not found" });
      }

      broadcast({
        type: 'approval_updated',
        data: approval
      });

      res.json(approval);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject request" });
    }
  });

  // Leads
  app.get("/api/leads", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const leads = await storage.getLeads(limit, offset);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/stats", async (req, res) => {
    try {
      const stats = await storage.getLeadStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead stats" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      
      broadcast({
        type: 'lead_created',
        data: lead
      });
      
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid lead data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create lead" });
      }
    }
  });

  app.post("/api/leads/import", async (req, res) => {
    try {
      const { leads: leadsData, source } = req.body;
      
      if (!Array.isArray(leadsData) || leadsData.length === 0) {
        return res.status(400).json({ error: "No leads provided" });
      }

      const createdLeads = [];
      const errors = [];

      for (const leadData of leadsData) {
        try {
          const validatedLead = insertLeadSchema.parse({ ...leadData, source });
          const lead = await storage.createLead(validatedLead);
          createdLeads.push(lead);
        } catch (error) {
          errors.push({ lead: leadData, error: error.message });
        }
      }

      // Trigger orchestration for imported leads
      if (createdLeads.length > 0) {
        const leadIds = createdLeads.map(lead => lead.id);
        await orchestrationService.startLeadImportWorkflow(leadIds);
      }

      broadcast({
        type: 'leads_imported',
        data: { 
          imported: createdLeads.length, 
          errors: errors.length,
          source 
        }
      });

      res.json({
        success: true,
        imported: createdLeads.length,
        errors: errors.length,
        leads: createdLeads,
        importErrors: errors
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to import leads" });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const lead = await storage.updateLead(id, updates);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      broadcast({
        type: 'lead_updated',
        data: lead
      });
      
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // Lead Scoring
  app.post("/api/leads/score", async (req, res) => {
    try {
      const { leadIds } = req.body;
      
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({ error: "No lead IDs provided" });
      }

      await leadScoringService.scoreExistingLeads(leadIds);
      
      broadcast({
        type: 'leads_scored',
        data: { leadIds }
      });

      res.json({ success: true, message: `Scored ${leadIds.length} leads` });
    } catch (error) {
      res.status(500).json({ error: "Failed to score leads" });
    }
  });

  app.get("/api/leads/score-distribution", async (req, res) => {
    try {
      const distribution = await leadScoringService.getLeadScoreDistribution();
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ error: "Failed to get score distribution" });
    }
  });

  // AI Services
  app.post("/api/ai/generate-outreach", async (req, res) => {
    try {
      const { name, company, title, recentActivity } = req.body;
      
      const message = await openaiService.generateOutreachMessage({
        name,
        company,
        title,
        recentActivity
      });
      
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate outreach message" });
    }
  });

  app.post("/api/ai/generate-site-content", async (req, res) => {
    try {
      const { industry, targetAudience, goals } = req.body;
      
      const content = await openaiService.generateSiteContent(industry, targetAudience, goals);
      
      res.json(content);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate site content" });
    }
  });

  // Activities
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Campaigns
  app.get("/api/campaigns/outreach", async (req, res) => {
    try {
      const campaigns = await storage.getOutreachCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outreach campaigns" });
    }
  });

  app.get("/api/campaigns/marketing", async (req, res) => {
    try {
      const campaigns = await storage.getMarketingCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch marketing campaigns" });
    }
  });

  // Generated Sites
  app.get("/api/sites", async (req, res) => {
    try {
      const sites = await storage.getGeneratedSites();
      res.json(sites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated sites" });
    }
  });

  return httpServer;
}
