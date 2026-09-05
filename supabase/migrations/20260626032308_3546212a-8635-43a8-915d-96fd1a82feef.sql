
UPDATE public.opportunities SET study_level = 'undergraduate' WHERE study_level IS NULL AND title IN ('Mastercard Foundation Scholars Program');
UPDATE public.opportunities SET study_level = 'masters' WHERE study_level IS NULL AND title IN ('Chevening Scholarship 2026/27','Rhodes Scholarship — West Africa','Gates Cambridge Scholarship','MSc Management Information Systems');
UPDATE public.opportunities SET study_level = 'phd' WHERE study_level IS NULL AND title IN ('AAU Small Research Grant');
UPDATE public.opportunities SET study_level = 'fellowship' WHERE study_level IS NULL AND (category = 'fellowship' OR title IN ('UN Online Volunteer — Research Analyst','UN Volunteer — Communications Associate'));
UPDATE public.opportunities SET study_level = 'job' WHERE study_level IS NULL AND category IN ('job','programme','freelance');
UPDATE public.opportunities SET study_level = 'other' WHERE study_level IS NULL;
