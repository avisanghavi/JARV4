import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface LeadScoringData {
  name: string;
  company: string;
  title: string;
  recentActivity?: string;
  companySize?: string;
  industry?: string;
}

export interface ScoredLead extends LeadScoringData {
  score: number;
  reasoning: string;
}

export interface OutreachMessage {
  subject: string;
  body: string;
  personalizedElements: string[];
}

export class OpenAIService {
  async scoreLeads(leads: LeadScoringData[]): Promise<ScoredLead[]> {
    const prompt = `
You are an expert sales lead scoring AI. Score each lead from 1-100 based on:
- Company size and industry relevance (40%)
- Job title and decision-making authority (30%)
- Recent activity and engagement potential (30%)

For each lead, provide a score and brief reasoning. Respond with JSON in this format:
{
  "scoredLeads": [
    {
      "name": "...",
      "company": "...",
      "title": "...",
      "score": 85,
      "reasoning": "High-value target: VP at growing tech company with recent expansion news"
    }
  ]
}

Leads to score: ${JSON.stringify(leads)}
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert sales lead scoring assistant. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.scoredLeads || [];
    } catch (error) {
      console.error("Error scoring leads:", error);
      throw new Error("Failed to score leads with AI");
    }
  }

  async generateOutreachMessage(lead: LeadScoringData): Promise<OutreachMessage> {
    const prompt = `
Generate a personalized outreach message for this lead:
Name: ${lead.name}
Company: ${lead.company}
Title: ${lead.title}
Recent Activity: ${lead.recentActivity || "None available"}

Create a compelling, professional message that:
1. References something specific about their company/role
2. Offers clear value proposition
3. Includes a soft call-to-action
4. Keeps it under 150 words

Respond with JSON in this format:
{
  "subject": "Brief, compelling subject line",
  "body": "Personalized message body",
  "personalizedElements": ["List of specific personalization elements used"]
}
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert sales outreach specialist. Create compelling, personalized messages."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        subject: result.subject || "Partnership Opportunity",
        body: result.body || "Hi there, I'd love to connect about potential synergies between our companies.",
        personalizedElements: result.personalizedElements || []
      };
    } catch (error) {
      console.error("Error generating outreach message:", error);
      throw new Error("Failed to generate outreach message");
    }
  }

  async generateMarketingInsights(competitorData: any[]): Promise<{
    insights: string[];
    recommendations: string[];
    opportunityScore: number;
  }> {
    const prompt = `
Analyze this competitor data and provide marketing insights:
${JSON.stringify(competitorData)}

Provide actionable insights and recommendations. Respond with JSON in this format:
{
  "insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"],
  "opportunityScore": 85
}
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a marketing intelligence expert. Provide actionable insights from competitive data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        opportunityScore: result.opportunityScore || 50
      };
    } catch (error) {
      console.error("Error generating marketing insights:", error);
      throw new Error("Failed to generate marketing insights");
    }
  }

  async generateSiteContent(industry: string, targetAudience: string, goals: string[]): Promise<{
    headline: string;
    subheadline: string;
    ctaText: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
  }> {
    const prompt = `
Generate website content for:
Industry: ${industry}
Target Audience: ${targetAudience}
Goals: ${goals.join(", ")}

Create compelling, conversion-focused content. Respond with JSON in this format:
{
  "headline": "Compelling main headline",
  "subheadline": "Supporting subheadline",
  "ctaText": "Call-to-action button text",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content"
    }
  ]
}
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a conversion copywriting expert. Create high-converting website content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        headline: result.headline || "Transform Your Business Today",
        subheadline: result.subheadline || "Discover how our solutions can help you achieve your goals.",
        ctaText: result.ctaText || "Get Started",
        sections: result.sections || []
      };
    } catch (error) {
      console.error("Error generating site content:", error);
      throw new Error("Failed to generate site content");
    }
  }
}

export const openaiService = new OpenAIService();
