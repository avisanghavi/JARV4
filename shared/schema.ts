import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  linkedinEmail: text("linkedin_email"),
  linkedinPassword: text("linkedin_password"),
  crmApiKey: text("crm_api_key"),
  crmEndpoint: text("crm_endpoint"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(), // 'linkedin', 'gmail', 'salesforce', 'hubspot', 'csv'
  name: text("name").notNull(),
  company: text("company"),
  title: text("title"),
  email: text("email"),
  profileUrl: text("profile_url"),
  recentActivity: text("recent_activity"),
  score: integer("score"),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected', 'contacted'
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  domain: text("domain").notNull(), // 'sales', 'marketing', 'engineering'
  type: text("type").notNull(), // 'lead_import', 'outreach_campaign', 'competitor_analysis', 'site_generation'
  status: text("status").notNull().default("pending"), // 'pending', 'running', 'completed', 'failed', 'paused'
  config: jsonb("config"),
  progress: integer("progress").default(0),
  totalSteps: integer("total_steps").default(1),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'outreach_message', 'budget_increase', 'campaign_launch', 'site_deployment'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'urgent'
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  requestedBy: text("requested_by").notNull(),
  workflowId: integer("workflow_id").references(() => workflows.id),
  data: jsonb("data"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outreachCampaigns = pgTable("outreach_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  messageTemplate: text("message_template").notNull(),
  status: text("status").notNull().default("draft"), // 'draft', 'approved', 'active', 'paused', 'completed'
  targetCount: integer("target_count").default(0),
  sentCount: integer("sent_count").default(0),
  responseCount: integer("response_count").default(0),
  workflowId: integer("workflow_id").references(() => workflows.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull(), // 'google_ads', 'facebook', 'linkedin', 'twitter'
  budget: decimal("budget", { precision: 10, scale: 2 }),
  spent: decimal("spent", { precision: 10, scale: 2 }).default("0"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  status: text("status").notNull().default("draft"), // 'draft', 'active', 'paused', 'completed'
  workflowId: integer("workflow_id").references(() => workflows.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const generatedSites = pgTable("generated_sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry"),
  colorScheme: text("color_scheme"),
  content: jsonb("content"),
  status: text("status").notNull().default("draft"), // 'draft', 'generated', 'deployed', 'live'
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  workflowId: integer("workflow_id").references(() => workflows.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  target: text("target"),
  domain: text("domain").notNull(),
  userId: text("user_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApprovalSchema = createInsertSchema(approvals).omit({ id: true, createdAt: true });
export const insertOutreachCampaignSchema = createInsertSchema(outreachCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGeneratedSiteSchema = createInsertSchema(generatedSites).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type GeneratedSite = typeof generatedSites.$inferSelect;
export type Activity = typeof activities.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;
export type InsertOutreachCampaign = z.infer<typeof insertOutreachCampaignSchema>;
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type InsertGeneratedSite = z.infer<typeof insertGeneratedSiteSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
