import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Pages
import Dashboard from "@/pages/dashboard";
import Sales from "@/pages/sales";
import Marketing from "@/pages/marketing";
import Engineering from "@/pages/engineering";
import SalesAgent from "@/pages/sales-agent";
import MarketingAgent from "@/pages/marketing-agent";
import EngineeringAgent from "@/pages/engineering-agent";
import Orchestration from "@/pages/orchestration";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { toast } = useToast();
  const { isConnected, lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      // Handle real-time notifications
      switch (lastMessage.type) {
        case 'workflow_created':
          toast({
            title: "Workflow Created",
            description: `New workflow: ${lastMessage.data?.name}`,
          });
          break;
        case 'workflow_updated':
          if (lastMessage.data?.status === 'completed') {
            toast({
              title: "Workflow Completed",
              description: `${lastMessage.data?.name} has finished successfully`,
            });
          }
          break;
        case 'leads_imported':
          toast({
            title: "Leads Imported",
            description: `${lastMessage.data?.imported} leads imported from ${lastMessage.data?.source}`,
          });
          break;
        case 'approval_updated':
          if (lastMessage.data?.status === 'approved') {
            toast({
              title: "Request Approved",
              description: `${lastMessage.data?.title} has been approved`,
            });
          }
          break;
      }
    }
  }, [lastMessage, toast]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-100">
        <div className="flex items-center justify-between bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">JD</span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-800">John Doe</p>
                <p className="text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>
        
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/sales" component={Sales} />
          <Route path="/sales/:tab?" component={Sales} />
          <Route path="/marketing" component={Marketing} />
          <Route path="/marketing/:tab?" component={Marketing} />
          <Route path="/engineering" component={Engineering} />
          <Route path="/engineering/:tab?" component={Engineering} />
          <Route path="/sales-agent" component={SalesAgent} />
          <Route path="/marketing-agent" component={MarketingAgent} />
          <Route path="/engineering-agent" component={EngineeringAgent} />
          <Route path="/orchestration" component={Orchestration} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
