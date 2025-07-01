import { useMutation } from "@tanstack/react-query";
import { ChatInterface } from "@/components/chat-interface";
import { apiRequest } from "@/lib/queryClient";

export default function MarketingAgent() {
  const marketingAgentMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/agents/marketing/chat`, {
        method: "POST",
        body: JSON.stringify({ message }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to send message to marketing agent");
      }
      const data = await response.json();
      return data.response;
    },
  });

  const handleSendMessage = async (message: string): Promise<string> => {
    try {
      return await marketingAgentMutation.mutateAsync(message);
    } catch (error) {
      throw new Error("Failed to communicate with marketing agent");
    }
  };

  return (
    <div className="h-full">
      <ChatInterface
        agentName="Marketing Agent"
        agentDescription="I help you analyze competitors, optimize campaigns, and discover market opportunities through AI-powered intelligence"
        welcomeMessage="Hi! I'm your Marketing Agent. I can help you:

• Analyze competitor strategies and pricing
• Monitor market trends and opportunities
• Optimize ad campaigns across platforms (Google, Facebook, LinkedIn)
• Generate marketing insights and recommendations
• Track ROAS and campaign performance
• Identify new market segments and keywords

What marketing challenge would you like me to help you with today?"
        placeholder="e.g., 'Analyze our top 5 competitors and find campaign optimization opportunities'"
        onSendMessage={handleSendMessage}
        className="h-full"
      />
    </div>
  );
}