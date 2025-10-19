-- Drop the old trigger first
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
DROP TRIGGER IF EXISTS update_company_score_trigger ON public.reviews;

-- Drop the old function
DROP FUNCTION IF EXISTS public.update_company_score();

-- Update companies table to start with score 0 instead of 50
ALTER TABLE public.companies ALTER COLUMN base_score SET DEFAULT 0;

-- Create new simplified scoring function
CREATE OR REPLACE FUNCTION public.update_company_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update company total_reviews and scam_count
  UPDATE public.companies
  SET 
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE company_id = NEW.company_id),
    scam_count = (SELECT COUNT(*) FROM public.reviews WHERE company_id = NEW.company_id AND is_scam = true)
  WHERE id = NEW.company_id;
  
  -- Calculate new base_score: start at 0, +10 for legitimate, -10 for scam
  UPDATE public.companies
  SET base_score = (
    ((total_reviews - scam_count) * 10) - (scam_count * 10)
  )
  WHERE id = NEW.company_id;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_review_created
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_company_score();