import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, MessageSquare, Shield, AlertTriangle } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

export default function Reviews() {
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ isScam: "false", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    fetchCompanies();

    return () => subscription.unsubscribe();
  }, []);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load companies");
    } else {
      setCompanies(data || []);
    }
  };

  const fetchReviews = async (companyId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        profiles (full_name, email)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load reviews");
    } else {
      setReviews(data || []);
    }
  };

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    fetchReviews(company.id);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to submit a review");
      navigate("/auth");
      return;
    }

    if (!selectedCompany) {
      toast.error("Please select a company first");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("reviews")
      .insert({
        company_id: selectedCompany.id,
        user_id: user.id,
        is_scam: newReview.isScam === "true",
        review_text: newReview.text
      });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted successfully!");
      setNewReview({ isScam: "false", text: "" });
      fetchReviews(selectedCompany.id);
      fetchCompanies();
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Company Reviews</h1>
            <p className="text-muted-foreground text-lg">
              Search companies and share your experiences
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Company Search */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Search Companies</CardTitle>
                  <CardDescription>Find companies to review or check their reputation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search company name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredCompanies.map((company) => (
                  <Card
                    key={company.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCompany?.id === company.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleCompanySelect(company)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{company.name}</h3>
                          {company.verified && (
                            <Badge variant="secondary" className="bg-success text-success-foreground">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className={`text-2xl font-bold ${
                          company.base_score >= 70 ? "text-success" :
                          company.base_score >= 40 ? "text-warning" : "text-danger"
                        }`}>
                          {company.base_score}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {company.total_reviews} reviews • {company.scam_count} scam reports
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-4">
              {selectedCompany ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Write a Review</CardTitle>
                      <CardDescription>Share your experience with {selectedCompany.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Is this company a scam?</Label>
                          <RadioGroup
                            value={newReview.isScam}
                            onValueChange={(value) => setNewReview({ ...newReview, isScam: value })}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="not-scam" />
                              <Label htmlFor="not-scam" className="cursor-pointer">Not a Scam</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="scam" />
                              <Label htmlFor="scam" className="cursor-pointer">Scam</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="review-text">Your Review</Label>
                          <Textarea
                            id="review-text"
                            placeholder="Share your experience..."
                            value={newReview.text}
                            onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                            rows={4}
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={submitting || !user}>
                          {submitting ? "Submitting..." : user ? "Submit Review" : "Login to Review"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Reviews</CardTitle>
                      <CardDescription>{reviews.length} total reviews</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                      {reviews.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No reviews yet. Be the first to review!</p>
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium">{review.profiles?.full_name || "Anonymous"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                {review.is_scam ? (
                                  <Badge variant="destructive">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Scam
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-success text-success-foreground">
                                    Legitimate
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{review.review_text}</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Select a company to view reviews</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}