import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { User } from "@supabase/supabase-js";

export default function Detect() {
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-job", {
        body: { jobDescription }
      });

      if (error) throw error;

      setResult(data);
      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error("Error analyzing job:", error);
      toast.error(error.message || "Failed to analyze job posting");
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 40) return "text-warning";
    return "text-danger";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="h-8 w-8 text-success" />;
    if (score >= 40) return <AlertTriangle className="h-8 w-8 text-warning" />;
    return <Shield className="h-8 w-8 text-danger" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Job Posting Detector</h1>
            <p className="text-muted-foreground text-lg">
              Analyze job descriptions for legitimacy using AI
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Paste Job Description</CardTitle>
              <CardDescription>
                Enter the complete job posting text for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={10}
                className="resize-none"
              />
              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing || !jobDescription.trim()}
                className="w-full"
                size="lg"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Analyze Job Posting
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {getScoreIcon(result.score)}
                    <div>
                      <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}%
                      </div>
                      <div className="text-sm text-muted-foreground">Legitimacy Score</div>
                    </div>
                  </div>
                  <Progress value={result.score} className="h-3" />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Analysis Summary</h3>
                    <p className="text-muted-foreground">{result.explanation}</p>
                  </div>

                  {result.factors && result.factors.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Factors</h3>
                      <ul className="space-y-2">
                        {result.factors.map((factor: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-muted-foreground">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}