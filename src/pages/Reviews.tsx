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
import { Search, MessageSquare, Shield, AlertTriangle, Filter, ShieldAlert } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterType = "all" | "legitimate" | "scam";

export default function Reviews() {
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ companyName: "", isScam: "false", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    fetchAllReviews();

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        profiles (full_name, email),
        companies (name, base_score, verified)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load reviews");
    } else {
      setAllReviews(data || []);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to submit a review");
      navigate("/user-auth");
      return;
    }

    if (!newReview.companyName.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    setSubmitting(true);

    try {
      // Check if company exists
      let { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", newReview.companyName.trim())
        .maybeSingle();

      let companyId: string;

      if (!existingCompany) {
        // Create new company
        const { data: newCompany, error: createError } = await supabase
          .from("companies")
          .insert({
            name: newReview.companyName.trim(),
            user_id: user.id,
            base_score: 50
          })
          .select()
          .single();

        if (createError) {
          toast.error("Failed to create company");
          setSubmitting(false);
          return;
        }

        companyId = newCompany.id;
      } else {
        companyId = existingCompany.id;
      }

      // Insert review
      const { error } = await supabase
        .from("reviews")
        .insert({
          company_id: companyId,
          user_id: user.id,
          is_scam: newReview.isScam === "true",
          review_text: newReview.text
        });

      if (error) {
        toast.error("Failed to submit review");
      } else {
        toast.success("Review submitted successfully!");
        setNewReview({ companyName: "", isScam: "false", text: "" });
        fetchAllReviews();
      }
    } catch (error) {
      toast.error("An error occurred");
    }

    setSubmitting(false);
  };

  const filteredReviews = allReviews.filter(review => {
    const matchesSearch = 
      review.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_text.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === "legitimate") return !review.is_scam;
    if (filter === "scam") return review.is_scam;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Company Reviews</h1>
            <p className="text-muted-foreground text-lg">
              Search companies and share your experiences
            </p>
          </div>

          {/* Search Bar and Filter */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search company name or review text..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2 md:w-64">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter reviews" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reviews</SelectItem>
                      <SelectItem value="legitimate">Likely Legitimate Only</SelectItem>
                      <SelectItem value="scam">Likely Scam Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Reviews List - Left Side (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                  <CardDescription>{filteredReviews.length} reviews found</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[800px] overflow-y-auto">
                  {filteredReviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No reviews found. Try adjusting your search or filter.</p>
                    </div>
                  ) : (
                    filteredReviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <button
                                  onClick={() => navigate(`/company/${review.company_id}`)}
                                  className="font-semibold text-lg hover:text-primary hover:underline text-left"
                                >
                                  {review.companies?.name || "Unknown Company"}
                                </button>
                                {review.companies?.verified ? (
                                  <Badge variant="secondary" className="bg-success text-success-foreground">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Unverified</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <p className="font-medium">{review.profiles?.full_name || "Anonymous"}</p>
                                <span>•</span>
                                <p>{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {review.is_scam ? (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Likely Scam
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-success text-success-foreground">
                                  Likely Legitimate
                                </Badge>
                              )}
                              <div className={`text-2xl font-bold ${
                                (review.companies?.base_score ?? 50) >= 70 ? "text-success" :
                                (review.companies?.base_score ?? 50) >= 40 ? "text-warning" : "text-danger"
                              }`}>
                                {review.companies?.base_score ?? 50}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{review.review_text}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Review Form - Right Side (1/3 width) */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                  <CardDescription>Share your experience with a company</CardDescription>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input
                          id="company-name"
                          placeholder="Enter company name..."
                          value={newReview.companyName}
                          onChange={(e) => setNewReview({ ...newReview, companyName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Scam Status</Label>
                        <RadioGroup
                          value={newReview.isScam}
                          onValueChange={(value) => setNewReview({ ...newReview, isScam: value })}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="legitimate" />
                            <Label htmlFor="legitimate" className="cursor-pointer">Likely Legitimate</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="scam" />
                            <Label htmlFor="scam" className="cursor-pointer">Likely Scam</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="review-text">Review</Label>
                        <Textarea
                          id="review-text"
                          placeholder="Share your experience..."
                          value={newReview.text}
                          onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                          rows={6}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit Review"}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-4">You must be signed in to post a review.</p>
                      <Button onClick={() => navigate("/user-auth")} className="w-full">
                        Sign In
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}