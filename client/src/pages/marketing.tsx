import { useState } from "react";
import { useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, DollarSign, TrendingUp, Eye, MousePointer, Users } from "lucide-react";

export default function Marketing() {
  const params = useParams();
  const activeTab = params.tab || "intelligence";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">Marketing Domain</h2>
        <p className="text-sm text-gray-600">Competitor intelligence and campaign optimization</p>
      </div>

      {/* Marketing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-800">12</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Used</p>
                <p className="text-2xl font-bold text-gray-800">$18.5K</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ROI</p>
                <p className="text-2xl font-bold text-green-600">312%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Competitors</p>
                <p className="text-2xl font-bold text-gray-800">12</p>
              </div>
              <Search className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="intelligence">Competitor Intel</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="budget">Budget Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Competitor Intelligence</CardTitle>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Add Competitor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Competitor Analysis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">TechCorp Solutions</h3>
                        <Badge variant="destructive">High Threat</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Website Traffic</span>
                          <span className="font-medium">↑ 15.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ad Spend</span>
                          <span className="font-medium">$45K/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">New Features</span>
                          <span className="font-medium">3 this month</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">InnovateCorp</h3>
                        <Badge variant="secondary">Medium Threat</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Website Traffic</span>
                          <span className="font-medium">↓ 5.1%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ad Spend</span>
                          <span className="font-medium">$28K/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">New Features</span>
                          <span className="font-medium">1 this month</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-gray-800">125K</p>
                    <p className="text-sm text-gray-600">Impressions</p>
                  </div>
                  <div className="text-center">
                    <MousePointer className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold text-gray-800">3.2K</p>
                    <p className="text-sm text-gray-600">Clicks</p>
                  </div>
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold text-gray-800">156</p>
                    <p className="text-sm text-gray-600">Conversions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Google Ads - Tech Solutions</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Budget: $5,000</span>
                    <span>Spent: $3,750</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Budget optimization coming soon</h3>
                <p className="text-gray-500">AI-powered budget allocation and optimization tools will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
