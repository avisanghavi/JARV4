import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { LinkedInCredentialsForm } from "@/components/linkedin-credentials-form";
import { apiRequest } from "@/lib/queryClient";

export default function SalesAgent() {
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const salesAgentMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/agents/sales/chat`, {
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
      // Check if user wants to add LinkedIn credentials
      if (message.toLowerCase().includes("linkedin") && message.toLowerCase().includes("credential")) {
        setShowCredentialsForm(true);
        return "I'll help you add your LinkedIn credentials. Please fill out the secure form that just appeared.";
      }
      
      return await salesAgentMutation.mutateAsync(message);
    } catch (error) {
      throw new Error("Failed to communicate with sales agent");
    }
  };

  const handleCredentialsSaved = () => {
    setShowCredentialsForm(false);
  };

  if (showCredentialsForm) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <LinkedInCredentialsForm onCredentialsSaved={handleCredentialsSaved} />
      </div>
    );
  }

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

To get started, you can say 'add LinkedIn credentials' to securely store your login info. What would you like to work on today?"
        placeholder="e.g., 'Reach out to 10 LinkedIn ICP targets' or 'add LinkedIn credentials'"
        onSendMessage={handleSendMessage}
        className="h-full"
      />
    </div>
  );
}