import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Handshake, Search, Globe, AlertCircle } from "lucide-react";
import type { Workflow } from "@/types";

const getDomainIcon = (domain: string) => {
  switch (domain) {
    case 'sales':
      return <Handshake className="w-4 h-4 text-primary" />;
    case 'marketing':
      return <Search className="w-4 h-4 text-orange-600" />;
    case 'engineering':
      return <Globe className="w-4 h-4 text-green-600" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function ActiveWorkflows() {
  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows/active'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Workflows</CardTitle>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!workflows) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Failed to load workflows</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Active Workflows</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {workflows.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No active workflows</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                  {getDomainIcon(workflow.domain)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{workflow.name}</p>
                  <p className="text-sm text-gray-500">{workflow.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {workflow.status === 'running' && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                <Badge variant="secondary" className={getStatusColor(workflow.status)}>
                  {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
