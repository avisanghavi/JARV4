import { useMutation } from "@tanstack/react-query";
import { ChatInterface } from "@/components/chat-interface";
import { getAgentById } from "@/data/agents";
import { apiRequest } from "@/lib/queryClient";

export default function EngineeringAgent() {
  const agent = getAgentById('edith');
  const engineeringAgentMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/agents/engineering/chat`, {
        method: "POST",
        body: JSON.stringify({ message }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to send message to engineering agent");
      }
      const data = await response.json();
      return data.response;
    },
  });

  const handleSendMessage = async (message: string): Promise<string> => {
    try {
      return await engineeringAgentMutation.mutateAsync(message);
    } catch (error) {
      throw new Error("Failed to communicate with engineering agent");
    }
  };

  return (
    <div className="h-full">
      <ChatInterface
        agentName="Engineering Agent"
        agentDescription="I help you generate websites, run A/B tests, and optimize technical performance through automated development"
        welcomeMessage="Hi! I'm your Engineering Agent. I can help you:

• Generate complete websites based on your requirements
• Create and deploy A/B test variations
• Optimize site performance and conversion rates
• Implement technical features and integrations
• Monitor site analytics and user behavior
• Deploy and manage website infrastructure

What engineering task would you like me to help you with today?"
        placeholder="e.g., 'Generate a landing page for our SaaS product with A/B test variants'"
        onSendMessage={handleSendMessage}
        className="h-full"
      />
    </div>
  );
}