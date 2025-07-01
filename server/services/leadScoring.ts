import { openaiService, type LeadScoringData } from "./openai";
import { storage } from "../storage";
import type { Lead } from "@shared/schema";

export class LeadScoringService {
  async scoreLeadsFromData(leadsData: LeadScoringData[]): Promise<Array<LeadScoringData & { score: number; reasoning: string }>> {
    if (leadsData.length === 0) return [];

    try {
      const scoredLeads = await openaiService.scoreLeads(leadsData);
      return scoredLeads;
    } catch (error) {
      console.error("Error in lead scoring:", error);
      // Fallback to simple scoring if AI fails
      return leadsData.map(lead => ({
        ...lead,
        score: this.calculateFallbackScore(lead),
        reasoning: "Fallback scoring due to AI service unavailability"
      }));
    }
  }

  async scoreExistingLeads(leadIds: number[]): Promise<void> {
    const leads = await Promise.all(
      leadIds.map(id => storage.getLead(id))
    );

    const validLeads = leads.filter(Boolean) as Lead[];
    const leadsData: LeadScoringData[] = validLeads.map(lead => ({
      name: lead.name,
      company: lead.company || "",
      title: lead.title || "",
      recentActivity: lead.recentActivity || undefined,
    }));

    const scoredLeads = await this.scoreLeadsFromData(leadsData);

    // Update leads with scores
    for (let i = 0; i < validLeads.length; i++) {
      const lead = validLeads[i];
      const scoredLead = scoredLeads[i];
      
      if (scoredLead) {
        await storage.updateLead(lead.id, {
          score: scoredLead.score,
          // Store reasoning in rawData
          rawData: {
            ...((lead.rawData as any) || {}),
            scoringReasoning: scoredLead.reasoning
          }
        });
      }
    }
  }

  private calculateFallbackScore(lead: LeadScoringData): number {
    let score = 50; // Base score

    // Company scoring
    if (lead.company) {
      score += 10;
      // Simple heuristics for company quality
      if (lead.company.toLowerCase().includes('inc') || 
          lead.company.toLowerCase().includes('corp') ||
          lead.company.toLowerCase().includes('ltd')) {
        score += 10;
      }
    }

    // Title scoring
    if (lead.title) {
      const title = lead.title.toLowerCase();
      if (title.includes('ceo') || title.includes('founder') || title.includes('president')) {
        score += 20;
      } else if (title.includes('vp') || title.includes('director') || title.includes('head')) {
        score += 15;
      } else if (title.includes('manager') || title.includes('lead')) {
        score += 10;
      }
    }

    // Recent activity scoring
    if (lead.recentActivity) {
      score += 15;
    }

    return Math.min(100, Math.max(1, score));
  }

  async getLeadScoreDistribution(): Promise<{
    high: number; // 80-100
    medium: number; // 50-79
    low: number; // 1-49
  }> {
    const leads = await storage.getLeads();
    const scoredLeads = leads.filter(lead => lead.score !== null && lead.score !== undefined);

    const distribution = {
      high: scoredLeads.filter(lead => (lead.score || 0) >= 80).length,
      medium: scoredLeads.filter(lead => (lead.score || 0) >= 50 && (lead.score || 0) < 80).length,
      low: scoredLeads.filter(lead => (lead.score || 0) < 50).length,
    };

    return distribution;
  }
}

export const leadScoringService = new LeadScoringService();
