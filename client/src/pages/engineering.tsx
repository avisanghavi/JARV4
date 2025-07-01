import { useState } from "react";
import { useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Globe, FlaskConical, Code, Zap } from "lucide-react";

export default function Engineering() {
  const params = useParams();
  const activeTab = params.tab || "sites";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">Engineering Domain</h2>
        <p className="text-sm text-gray-600">Automated site generation and A/B testing framework</p>
      </div>

      {/* Engineering Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Generated Sites</p>
                <p className="text-2xl font-bold text-gray-800">34</p>
              </div>
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">A/B Tests</p>
                <p className="text-2xl font-bold text-gray-800">8</p>
              </div>
              <FlaskConical className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Lift</p>
                <p className="text-2xl font-bold text-green-600">+18.4%</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Deploy Queue</p>
                <p className="text-2xl font-bold text-gray-800">3</p>
              </div>
              <Code className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sites">Site Generator</TabsTrigger>
          <TabsTrigger value="testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Sites</CardTitle>
                <Button>
                  <Globe className="w-4 h-4 mr-2" />
                  Generate New Site
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">TechCorp Landing</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Live</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Industry</span>
                          <span className="font-medium">Technology</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conversion Rate</span>
                          <span className="font-medium">4.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Visitors</span>
                          <span className="font-medium">1,234</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        View Site
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">FinanceApp Page</h3>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">Testing</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Industry</span>
                          <span className="font-medium">Finance</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conversion Rate</span>
                          <span className="font-medium">3.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Visitors</span>
                          <span className="font-medium">892</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        View Site
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">Healthcare Hub</h3>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">Draft</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Industry</span>
                          <span className="font-medium">Healthcare</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conversion Rate</span>
                          <span className="font-medium">-</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Visitors</span>
                          <span className="font-medium">-</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-3">
                        Deploy Site
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>A/B Testing Framework</CardTitle>
                <Button variant="outline">
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Create Test
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">CTA Button Test</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Running</Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Traffic Split</span>
                          <span className="font-medium">50/50</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Variant A</span>
                            <span className="font-medium">3.2% CVR</span>
                          </div>
                          <Progress value={32} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Variant B</span>
                            <span className="font-medium">4.1% CVR</span>
                          </div>
                          <Progress value={41} className="h-2" />
                        </div>
                        <div className="text-xs text-gray-500">
                          Statistical significance: 87%
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-800">Headline Test</h3>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pending</Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Traffic Split</span>
                          <span className="font-medium">33/33/33</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Testing three different headline variations to optimize conversion rates.
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          Start Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Performance analytics coming soon</h3>
                <p className="text-gray-500">Detailed performance metrics and optimization suggestions will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
