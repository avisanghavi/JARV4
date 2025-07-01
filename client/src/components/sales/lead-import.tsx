import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Download, AlertCircle, CheckCircle, Users, Linkedin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  leads: any[];
  importErrors: any[];
}

export function LeadImport() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>("");
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const csvImportMutation = useMutation({
    mutationFn: async (data: { leads: any[], source: string }) => {
      const response = await apiRequest("POST", "/api/leads/import", data);
      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.imported} leads`,
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Failed to import leads. Please try again.",
        variant: "destructive",
      });
    },
  });

  const linkedinImportMutation = useMutation({
    mutationFn: async (searchParams: any) => {
      // This would integrate with the LinkedIn scraper
      // For now, we'll simulate the process
      const mockLeads = [
        {
          name: "John Smith",
          company: "TechCorp Inc",
          title: "VP of Engineering",
          profileUrl: "https://linkedin.com/in/johnsmith",
          recentActivity: "Recently posted about AI developments",
          source: "linkedin"
        },
        {
          name: "Sarah Johnson",
          company: "InnovateCorp",
          title: "CTO",
          profileUrl: "https://linkedin.com/in/sarahjohnson",
          recentActivity: "Shared article about cloud computing",
          source: "linkedin"
        }
      ];

      return apiRequest("POST", "/api/leads/import", {
        leads: mockLeads,
        source: "linkedin"
      }).then(res => res.json());
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "LinkedIn Import Completed",
        description: `Successfully imported ${result.imported} leads from LinkedIn`,
      });
    },
    onError: () => {
      toast({
        title: "LinkedIn Import Failed",
        description: "Failed to import from LinkedIn. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleCsvImport = () => {
    if (!csvFile || !csvData) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    // Parse CSV data
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const leads = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(v => v.trim());
      const lead: any = { source: 'csv' };
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'name':
          case 'full name':
            lead.name = value;
            break;
          case 'company':
          case 'company name':
            lead.company = value;
            break;
          case 'title':
          case 'job title':
            lead.title = value;
            break;
          case 'email':
          case 'email address':
            lead.email = value;
            break;
          case 'profile url':
          case 'linkedin':
            lead.profileUrl = value;
            break;
        }
      });
      
      return lead;
    }).filter(lead => lead.name); // Filter out empty leads

    csvImportMutation.mutate({ leads, source: 'csv' });
  };

  const handleLinkedInImport = () => {
    // Simulate LinkedIn search parameters
    const searchParams = {
      keywords: "VP Engineering CTO",
      location: "San Francisco Bay Area",
      company_size: "51-200"
    };
    
    linkedinImportMutation.mutate(searchParams);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Lead Import Center</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="csv" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn Scraper</TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Upload CSV File</Label>
                  <div className="mt-2">
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Supported formats: Gmail, Salesforce, HubSpot CSV exports
                  </p>
                </div>

                {csvFile && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">{csvFile.name}</span>
                      <Badge variant="secondary">
                        {(csvFile.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleCsvImport}
                    disabled={!csvFile || csvImportMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {csvImportMutation.isPending ? 'Importing...' : 'Import CSV'}
                    </span>
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="linkedin" className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">LinkedIn Integration</h3>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Connect your LinkedIn account to automatically import leads based on search criteria.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="keywords">Search Keywords</Label>
                    <Input
                      id="keywords"
                      placeholder="VP Engineering, CTO, Technical Director"
                      defaultValue="VP Engineering CTO"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="San Francisco Bay Area"
                      defaultValue="San Francisco Bay Area"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company-size">Company Size</Label>
                  <Input
                    id="company-size"
                    placeholder="51-200 employees"
                    defaultValue="51-200"
                  />
                </div>

                <Button
                  onClick={handleLinkedInImport}
                  disabled={linkedinImportMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>
                    {linkedinImportMutation.isPending ? 'Importing from LinkedIn...' : 'Import from LinkedIn'}
                  </span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Progress */}
      {(csvImportMutation.isPending || linkedinImportMutation.isPending) && (
        <Card>
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Processing leads...</span>
              </div>
              <Progress value={85} className="h-2" />
              <div className="text-sm text-gray-600">
                Stage: Lead scoring and enrichment
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Import Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-sm text-gray-600">Successfully Imported</p>
                </div>
                <div className="text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                  <p className="text-sm text-gray-600">Import Errors</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">
                    {importResult.imported + importResult.errors}
                  </p>
                  <p className="text-sm text-gray-600">Total Processed</p>
                </div>
              </div>

              {importResult.importErrors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Import Errors:</h4>
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.importErrors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded mb-1">
                        Row {index + 2}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-600">
                  Import completed successfully
                </span>
                <Button variant="outline" size="sm">
                  View Imported Leads
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
