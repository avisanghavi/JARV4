import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Bot, 
  Network, 
  Settings,
  MessageSquare,
  FileText,
  Users,
  Inbox,
  HelpCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { agents, getAgentPath } from "@/data/agents";
import { AgentAvatar } from "@/components/agent-avatar";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <aside className={cn("w-64 bg-gray-900 text-white flex flex-col h-screen", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Your AI Team</h1>
            <p className="text-xs text-gray-400 mt-1">6 active</p>
          </div>
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-0">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
            Online
          </Badge>
        </div>
      </div>

      {/* Agents Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Agents</h2>
          <div className="space-y-2">
            {agents.map((agent) => {
              const path = getAgentPath(agent.id);
              const active = isActive(path);
              
              return (
                <Link
                  key={agent.id}
                  href={path}
                  className={cn(
                    "block p-3 rounded-lg transition-all duration-200",
                    active 
                      ? "bg-gray-800 shadow-lg" 
                      : "hover:bg-gray-800/50"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <AgentAvatar
                      src={agent.avatar}
                      alt={agent.name}
                      size="md"
                      status={agent.status}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{agent.name}</h3>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0">
                          {agent.metrics?.chats || 0}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">{agent.role}</p>
                      {agent.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.tags.map((tag, i) => (
                            <span key={i} className="text-xs text-gray-500">
                              {tag}
                              {i < agent.tags!.length - 1 && " •"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {active && (
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {agent.metrics?.messages || 0} chats
                      </span>
                      <span>Just now</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="p-4 border-t border-gray-800">
          <nav className="space-y-1">
            <Link href="/" className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive("/") 
                ? "bg-gray-800 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            )}>
              <Inbox className="w-4 h-4" />
              <span>Dashboard</span>
              <Badge variant="secondary" className="ml-auto bg-blue-500/20 text-blue-400 text-xs">
                3
              </Badge>
            </Link>

            <Link href="/outcomes" className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive("/outcomes") 
                ? "bg-gray-800 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            )}>
              <BarChart3 className="w-4 h-4" />
              <span>Outcomes</span>
              <Badge variant="secondary" className="ml-auto bg-gray-700 text-gray-400 text-xs">
                3
              </Badge>
            </Link>

            <Link href="/suggestions" className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive("/suggestions") 
                ? "bg-gray-800 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            )}>
              <HelpCircle className="w-4 h-4" />
              <span>Suggestions</span>
              <Badge variant="secondary" className="ml-auto bg-gray-700 text-gray-400 text-xs">
                3
              </Badge>
            </Link>
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link href="/settings" className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
          isActive("/settings") 
            ? "bg-gray-800 text-white" 
            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
        )}>
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
