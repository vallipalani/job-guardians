import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { MessageSquare, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/user-auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchUserReviews(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/user-auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchUserReviews(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    setProfile(data);
    setLoading(false);
  };

  const fetchUserReviews = async (userId: string) => {
    const { data } = await supabase
      .from("reviews")
      .select(`
        *,
        companies (name, base_score, verified)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    setReviews(data || []);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">My Profile</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-semibold">{profile?.full_name || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg">{profile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-lg">{new Date(profile?.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                My Reviews
              </CardTitle>
              <CardDescription>{reviews.length} reviews posted</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  You haven't posted any reviews yet.
                </p>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{review.companies?.name || "Unknown Company"}</h3>
                            {review.companies?.verified && (
                              <Badge variant="secondary" className="bg-success text-success-foreground">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {review.is_scam ? (
                            <Badge variant="destructive">Likely Scam</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-success text-success-foreground">
                              Likely Legitimate
                            </Badge>
                          )}
                          <div className={`text-2xl font-bold ${
                            (review.companies?.base_score ?? 0) >= 70 ? "text-success" :
                            (review.companies?.base_score ?? 0) >= 40 ? "text-warning" : "text-danger"
                          }`}>
                            {review.companies?.base_score ?? 0}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.review_text}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
