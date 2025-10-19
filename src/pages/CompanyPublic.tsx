import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Shield, ShieldAlert, Building2, Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompanyPublic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    fetchCompany();

    return () => subscription.unsubscribe();
  }, [id]);

  const fetchCompany = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching company:", error);
    } else {
      setCompany(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Company not found</p>
              <Button onClick={() => navigate("/reviews")}>Back to Reviews</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const scoreColor = company.base_score >= 70 ? "text-success" :
                     company.base_score >= 40 ? "text-warning" : "text-danger";

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate("/reviews")}>
              ← Back to Reviews
            </Button>
          </div>

          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{company.name}</h1>
                <div className="flex items-center gap-2">
                  {company.verified ? (
                    <Badge variant="secondary" className="bg-success text-success-foreground">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified Company
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Legitimacy Score</p>
              <p className={`text-5xl font-bold ${scoreColor}`}>{company.base_score}</p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p>{company.description}</p>
                  </div>
                )}
                
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Contact via reviews page</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
                  <p className="text-2xl font-bold">{company.total_reviews}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Scam Reports</p>
                  <p className="text-2xl font-bold text-danger">{company.scam_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Legitimate Reviews</p>
                  <p className="text-2xl font-bold text-success">{company.total_reviews - company.scam_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                  <p className="text-sm">{new Date(company.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
