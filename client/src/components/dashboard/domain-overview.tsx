import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Handshake, Megaphone, Code } from "lucide-react";
import { Link } from "wouter";

// Mock data for domain overview
const domainData = {
  sales: {
    activeLeads: 247,
    outreachSent: 89,
    responseRate: 24.3,
    pipelineProgress: 78,
  },
  marketing: {
    activeCampaigns: 12,
    budgetUtilized: 18450,
    roi: 312,
    monthProgress: 65,
  },
  engineering: {
    generatedSites: 34,
    abTests: 8,
    conversionLift: 18.4,
    deployQueue: 25, // percentage of queue filled
  },
};

export function DomainOverview() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sales Domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Handshake className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Sales Domain</CardTitle>
              <p className="text-sm text-gray-500">Lead generation & outreach</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Active Leads</span>
            <span className="font-semibold text-gray-800">{domainData.sales.activeLeads}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Outreach Sent</span>
            <span className="font-semibold text-gray-800">{domainData.sales.outreachSent}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Response Rate</span>
            <span className="font-semibold text-green-600">{domainData.sales.responseRate}%</span>
          </div>
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Pipeline Progress</span>
              <span className="text-gray-800">{domainData.sales.pipelineProgress}%</span>
            </div>
            <Progress value={domainData.sales.pipelineProgress} className="h-2" />
          </div>
          <Link href="/sales">
            <Button 
              variant="outline" 
              className="w-full bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 hover:border-primary/30"
            >
              Manage Sales
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Marketing Domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Marketing Domain</CardTitle>
              <p className="text-sm text-gray-500">Intelligence & campaigns</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Active Campaigns</span>
            <span className="font-semibold text-gray-800">{domainData.marketing.activeCampaigns}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Budget Utilized</span>
            <span className="font-semibold text-gray-800">${domainData.marketing.budgetUtilized.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">ROI</span>
            <span className="font-semibold text-green-600">{domainData.marketing.roi}%</span>
          </div>
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Month Progress</span>
              <span className="text-gray-800">{domainData.marketing.monthProgress}%</span>
            </div>
            <Progress value={domainData.marketing.monthProgress} className="h-2" />
          </div>
          <Link href="/marketing">
            <Button 
              variant="outline" 
              className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 hover:border-orange-300"
            >
              Manage Marketing
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Engineering Domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Engineering Domain</CardTitle>
              <p className="text-sm text-gray-500">Sites & A/B testing</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Generated Sites</span>
            <span className="font-semibold text-gray-800">{domainData.engineering.generatedSites}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">A/B Tests</span>
            <span className="font-semibold text-gray-800">{domainData.engineering.abTests}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Conversion Lift</span>
            <span className="font-semibold text-green-600">+{domainData.engineering.conversionLift}%</span>
          </div>
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Deploy Queue</span>
              <span className="text-gray-800">3 pending</span>
            </div>
            <Progress value={domainData.engineering.deployQueue} className="h-2" />
          </div>
          <Link href="/engineering">
            <Button 
              variant="outline" 
              className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
            >
              Manage Engineering
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
