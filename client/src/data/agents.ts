export interface Agent {
  id: string;
  name: string;
  fullName: string;
  role: string;
  avatar: string;
  status: "online" | "offline";
  tags: string[];
  description: string;
  capabilities: string[];
  metrics: {
    chats: number;
    messages: number;
    successRate?: number;
  };
  color: string; // Brand color for the agent
}

export const agents: Agent[] = [
  {
    id: "mj",
    name: "MJ",
    fullName: "Marketing Jarvis",
    role: "Marketing",
    avatar: "/MJ.png",
    status: "online",
    tags: ["Brand Strategy", "Campaign Design"],
    description: "I help you create compelling marketing campaigns and build your brand presence.",
    capabilities: [
      "Competitor Analysis",
      "Campaign Optimization", 
      "Market Intelligence",
      "Content Strategy"
    ],
    metrics: {
      chats: 0,
      messages: 0,
      successRate: 92
    },
    color: "#FF6B6B"
  },
  {
    id: "alfred",
    name: "Alfred",
    fullName: "Alfred Sales",
    role: "Sales",
    avatar: "/Alfred.png",
    status: "online",
    tags: ["Lead Generation", "Deal Closing"],
    description: "I help you find, qualify, and close deals with your ideal customers.",
    capabilities: [
      "LinkedIn Lead Scraping",
      "Lead Scoring",
      "Outreach Automation",
      "CRM Integration"
    ],
    metrics: {
      chats: 0,
      messages: 0,
      successRate: 87
    },
    color: "#4ECDC4"
  },
  {
    id: "edith",
    name: "Edith",
    fullName: "Edith Engineering",
    role: "Engineering",
    avatar: "/Ed1th.png",
    status: "online",
    tags: ["System Architecture", "Code Review"],
    description: "I help you build and optimize high-converting websites and applications.",
    capabilities: [
      "Website Generation",
      "A/B Testing",
      "Performance Optimization",
      "SEO Enhancement"
    ],
    metrics: {
      chats: 0,
      messages: 0,
      successRate: 95
    },
    color: "#95E1D3"
  },
  {
    id: "jarvis",
    name: "Jarvis",
    fullName: "Jarvis Orchestration",
    role: "Orchestration",
    avatar: "/Jarvis.png",
    status: "online",
    tags: ["Workflow Automation", "Team Coordination"],
    description: "I coordinate between all agents to ensure seamless workflow automation.",
    capabilities: [
      "Cross-Domain Triggers",
      "Workflow Management",
      "Approval Orchestration",
      "Team Synchronization"
    ],
    metrics: {
      chats: 0,
      messages: 0,
      successRate: 98
    },
    color: "#A8E6CF"
  }
];

// Helper function to get agent by ID
export const getAgentById = (id: string): Agent | undefined => {
  return agents.find(agent => agent.id === id);
};

// Helper function to get agent path
export const getAgentPath = (agentId: string): string => {
  switch(agentId) {
    case 'mj': return '/marketing-agent';
    case 'alfred': return '/sales-agent';
    case 'edith': return '/engineering-agent';
    case 'jarvis': return '/orchestration';
    default: return '/';
  }
}; 