import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription } = await req.json();

    if (!jobDescription || jobDescription.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Job description is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a job posting legitimacy analyzer. Analyze job descriptions for signs of scams or fake postings.

Score the job posting from 0-100 based on legitimacy:
- 0-30: Very likely a scam
- 31-50: Suspicious, proceed with caution
- 51-70: Possibly legitimate, verify details
- 71-100: Likely legitimate

Consider these red flags:
- Unrealistic salary promises
- Vague job descriptions
- Requests for personal financial information
- Poor grammar and spelling
- Pressure to act quickly
- Requests for upfront payment
- No company details or contact information
- Too good to be true promises
- Pyramid scheme indicators

Consider these legitimacy indicators:
- Detailed job requirements
- Realistic salary ranges
- Professional communication
- Company verification details
- Clear application process
- Specific role responsibilities
- Industry-standard terminology

Return your analysis as JSON with this structure:
{
  "score": number (0-100),
  "explanation": "Brief explanation of the score",
  "factors": ["List of key factors that influenced the score"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this job posting:\n\n${jobDescription}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required. Please contact support." }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    const analysis = JSON.parse(aiResponse);

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in analyze-job function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to analyze job posting" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});