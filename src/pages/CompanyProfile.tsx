import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Shield, Upload, CheckCircle } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

export default function Company() {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompany(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompany(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCompany = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      toast.error("Failed to load company data");
    } else if (data) {
      setCompany(data);
      setFormData({
        name: data.name,
        description: data.description || "",
        website: data.website || "",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to register a company");
      navigate("/auth");
      return;
    }

    if (company) {
      // Update existing company
      const { error } = await supabase
        .from("companies")
        .update(formData)
        .eq("id", company.id);

      if (error) {
        toast.error("Failed to update company");
      } else {
        toast.success("Company updated successfully!");
        fetchCompany(user.id);
      }
    } else {
      // Create new company
      const { error } = await supabase
        .from("companies")
        .insert({
          ...formData,
          user_id: user.id,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("A company with this name already exists");
        } else {
          toast.error("Failed to register company");
        }
      } else {
        toast.success("Company registered successfully!");
        fetchCompany(user.id);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Company Hub</h1>
            <p className="text-muted-foreground text-lg">
              Register and verify your company to build trust
            </p>
          </div>

          {!user ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">Please login to register your company</p>
                <Button onClick={() => navigate("/auth")}>Login</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Company Form */}
              <Card>
                <CardHeader>
                  <CardTitle>{company ? "Update Company" : "Register Company"}</CardTitle>
                  <CardDescription>
                    {company ? "Update your company information" : "Create your company profile"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name*</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={!!company}
                      />
                      {company && (
                        <p className="text-xs text-muted-foreground">
                          Company name cannot be changed
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        placeholder="Tell us about your company..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      {company ? "Update Company" : "Register Company"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Company Status */}
              {company && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Company Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Verification Status</span>
                        {company.verified ? (
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Legitimacy Score</span>
                        <div className={`text-3xl font-bold ${
                          company.base_score >= 70 ? "text-success" :
                          company.base_score >= 40 ? "text-warning" : "text-danger"
                        }`}>
                          {company.base_score}%
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Reviews</span>
                            <span className="font-medium">{company.total_reviews}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Scam Reports</span>
                            <span className="font-medium">{company.scam_count}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {!company.verified && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Verification</CardTitle>
                        <CardDescription>
                          Upload business documents to verify your company
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload business license or registration certificate
                          </p>
                          <Button variant="secondary" disabled>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Document
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Document verification coming soon
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}