-- Drop existing constraints if they exist and add them fresh
DO $$ 
BEGIN
  ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
  ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_company_id_fkey;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add foreign key constraints
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES public.companies(id) 
  ON DELETE CASCADE;