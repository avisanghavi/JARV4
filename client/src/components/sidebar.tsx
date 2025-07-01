import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Bot, 
  Handshake, 
  Users, 
  Send, 
  Megaphone, 
  Search, 
  DollarSign, 
  Code, 
  Globe, 
  FlaskConical, 
  Network, 
  Settings,
  TrendingUp
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <aside className={cn("w-64 bg-white shadow-lg flex-shrink-0", className)}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">HeyJarvis</h1>
            <p className="text-xs text-gray-500">Autonomous Orchestration</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {/* Dashboard */}
        <Link href="/" className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
          isActive("/") 
            ? "bg-primary/10 text-primary" 
            : "text-gray-600 hover:bg-gray-50"
        )}>
          <BarChart3 className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        
        {/* Sales Agent */}
        <Link href="/sales-agent" className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
          isActive("/sales-agent") 
            ? "bg-primary/10 text-primary" 
            : "text-gray-600 hover:bg-gray-50"
        )}>
          <Handshake className="w-5 h-5" />
          <span>Sales Agent</span>
        </Link>
        
        {/* Marketing Agent */}
        <Link href="/marketing-agent" className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
          isActive("/marketing-agent") 
            ? "bg-primary/10 text-primary" 
            : "text-gray-600 hover:bg-gray-50"
        )}>
          <TrendingUp className="w-5 h-5" />
          <span>Marketing Agent</span>
        </Link>
        
        {/* Engineering Agent */}
        <Link href="/engineering-agent" className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
          isActive("/engineering-agent") 
            ? "bg-primary/10 text-primary" 
            : "text-gray-600 hover:bg-gray-50"
        )}>
          <Code className="w-5 h-5" />
          <span>Engineering Agent</span>
        </Link>
        
        {/* Orchestration */}
        <Link href="/orchestration" className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
          isActive("/orchestration") 
            ? "bg-primary/10 text-primary" 
            : "text-gray-600 hover:bg-gray-50"
        )}>
          <Network className="w-5 h-5" />
          <span>Orchestration</span>
        </Link>
        
        {/* Settings */}
        <Link href="/settings" className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
          isActive("/settings") 
            ? "bg-primary/10 text-primary" 
            : "text-gray-600 hover:bg-gray-50"
        )}>
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>
    </aside>
  );
}
