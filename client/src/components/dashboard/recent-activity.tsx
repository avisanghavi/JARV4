import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Send, AlertTriangle, Globe, AlertCircle } from "lucide-react";
import type { Activity } from "@/types";

const getActivityIcon = (action: string) => {
  if (action.toLowerCase().includes('completed') || action.toLowerCase().includes('scored')) {
    return <Check className="w-4 h-4 text-green-600" />;
  } else if (action.toLowerCase().includes('launched') || action.toLowerCase().includes('sent')) {
    return <Send className="w-4 h-4 text-blue-600" />;
  } else if (action.toLowerCase().includes('approval') || action.toLowerCase().includes('required')) {
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  } else if (action.toLowerCase().includes('generated') || action.toLowerCase().includes('created')) {
    return <Globe className="w-4 h-4 text-purple-600" />;
  } else {
    return <AlertCircle className="w-4 h-4 text-gray-600" />;
  }
};

const getActivityIconBg = (action: string) => {
  if (action.toLowerCase().includes('completed') || action.toLowerCase().includes('scored')) {
    return 'bg-green-100';
  } else if (action.toLowerCase().includes('launched') || action.toLowerCase().includes('sent')) {
    return 'bg-blue-100';
  } else if (action.toLowerCase().includes('approval') || action.toLowerCase().includes('required')) {
    return 'bg-yellow-100';
  } else if (action.toLowerCase().includes('generated') || action.toLowerCase().includes('created')) {
    return 'bg-purple-100';
  } else {
    return 'bg-gray-100';
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else {
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }
  }
};

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Failed to load recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${getActivityIconBg(activity.action)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{activity.action}</span>
                    {activity.target && (
                      <>
                        {' for '}
                        <span className="font-medium">{activity.target}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
