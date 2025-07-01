import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ActiveWorkflows } from "@/components/dashboard/active-workflows";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { DomainOverview } from "@/components/dashboard/domain-overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-600">Autonomous orchestration across all domains</p>
      </div>

      <StatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveWorkflows />
        <PendingApprovals />
      </div>

      <DomainOverview />

      <RecentActivity />
    </div>
  );
}
