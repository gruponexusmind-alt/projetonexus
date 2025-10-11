-- Add start_date column to gp_projects table
ALTER TABLE public.gp_projects 
ADD COLUMN start_date date;