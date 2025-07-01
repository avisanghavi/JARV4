import { useMutation } from "@tanstack/react-query";
import { ChatInterface } from "@/components/chat-interface";
import { apiRequest } from "@/lib/queryClient";

export default function SalesAgent() {
  const salesAgentMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(`/api/agents/sales/chat`, {
        method: "POST",
        body: JSON.stringify({ message }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to send message to sales agent");
      }
      const data = await response.json();
      return data.response;
    },
  });

  const handleSendMessage = async (message: string): Promise<string> => {
    try {
      return await salesAgentMutation.mutateAsync(message);
    } catch (error) {
      throw new Error("Failed to communicate with sales agent");
    }
  };

  return (
    <div className="h-full">
      <ChatInterface
        agentName="Sales Agent"
        agentDescription="I help you find, score, and reach out to potential customers through LinkedIn and CRM automation"
        welcomeMessage="Hi! I'm your Sales Agent. I can help you:

• Find and import leads from LinkedIn based on your ICP
• Score leads using AI to prioritize outreach
• Generate personalized outreach messages
• Automate outreach campaigns
• Connect and sync with your CRM

To get started, I'll need your LinkedIn credentials for lead scraping. What would you like to work on today?"
        placeholder="e.g., 'Reach out to 10 LinkedIn ICP targets and 10 CRM profiles'"
        onSendMessage={handleSendMessage}
        className="h-full"
      />
    </div>
  );
}