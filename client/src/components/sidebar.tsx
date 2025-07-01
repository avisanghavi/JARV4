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
  Settings 
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
        
        {/* Sales Domain */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700">
            <Handshake className="w-4 h-4" />
            <span>Sales</span>
          </div>
          <Link href="/sales" className={cn(
            "flex items-center space-x-3 px-6 py-2 rounded-lg text-sm transition-colors",
            isActive("/sales") 
              ? "bg-primary/10 text-primary" 
              : "text-gray-600 hover:bg-gray-50"
          )}>
            <Users className="w-4 h-4" />
            <span>Lead Management</span>
          </Link>
          <Link href="/sales/campaigns" className={cn(
            "flex items-center space-x-3 px-6 py-2 rounded-lg text-sm transition-colors",
            isActive("/sales/campaigns") 
              ? "bg-primary/10 text-primary" 
              : "text-gray-600 hover:bg-gray-50"
          )}>
            <Send className="w-4 h-4" />
            <span>Outreach Campaigns</span>
          </Link>
        </div>
        
        {/* Marketing Domain */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700">
            <Megaphone className="w-4 h-4" />
            <span>Marketing</span>
          </div>
          <Link href="/marketing" className={cn(
            "flex items-center space-x-3 px-6 py-2 rounded-lg text-sm transition-colors",
            isActive("/marketing") 
              ? "bg-primary/10 text-primary" 
              : "text-gray-600 hover:bg-gray-50"
          )}>
            <Search className="w-4 h-4" />
            <span>Competitor Intel</span>
          </Link>
          <Link href="/marketing/budget" className={cn(
            "flex items-center space-x-3 px-6 py-2 rounded-lg text-sm transition-colors",
            isActive("/marketing/budget") 
              ? "bg-primary/10 text-primary" 
              : "text-gray-600 hover:bg-gray-50"
          )}>
            <DollarSign className="w-4 h-4" />
            <span>Budget Optimization</span>
          </Link>
        </div>
        
        {/* Engineering Domain */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700">
            <Code className="w-4 h-4" />
            <span>Engineering</span>
          </div>
          <Link href="/engineering" className={cn(
            "flex items-center space-x-3 px-6 py-2 rounded-lg text-sm transition-colors",
            isActive("/engineering") 
              ? "bg-primary/10 text-primary" 
              : "text-gray-600 hover:bg-gray-50"
          )}>
            <Globe className="w-4 h-4" />
            <span>Site Generator</span>
          </Link>
          <Link href="/engineering/testing" className={cn(
            "flex items-center space-x-3 px-6 py-2 rounded-lg text-sm transition-colors",
            isActive("/engineering/testing") 
              ? "bg-primary/10 text-primary" 
              : "text-gray-600 hover:bg-gray-50"
          )}>
            <FlaskConical className="w-4 h-4" />
            <span>A/B Testing</span>
          </Link>
        </div>
        
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
