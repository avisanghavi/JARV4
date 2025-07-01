import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface LinkedInCredentialsFormProps {
  onCredentialsSaved: () => void;
}

export function LinkedInCredentialsForm({ onCredentialsSaved }: LinkedInCredentialsFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const saveCredentialsMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await fetch("/api/users/linkedin-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error("Failed to save LinkedIn credentials");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credentials Saved",
        description: "Your LinkedIn credentials have been securely stored.",
      });
      onCredentialsSaved();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and password.",
        variant: "destructive",
      });
      return;
    }
    saveCredentialsMutation.mutate({ email, password });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          LinkedIn Credentials
        </CardTitle>
        <CardDescription>
          Securely store your LinkedIn credentials for automated lead import
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your credentials are encrypted and stored securely. They're only used for LinkedIn automation and are never shared.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin-email">LinkedIn Email</Label>
            <Input
              id="linkedin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin-password">LinkedIn Password</Label>
            <div className="relative">
              <Input
                id="linkedin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your LinkedIn password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={saveCredentialsMutation.isPending}
          >
            {saveCredentialsMutation.isPending ? "Saving..." : "Save Credentials"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}