import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yyqpqkajqukqkmrgzgsu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cXBxa2FqcXVrcWttcmd6Z3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTkzNjUsImV4cCI6MjA3MDU3NTM2NX0.IIhnDQ1lFHp_m4bPIbAmWXURqLSCJ_bwKKGUMorTSic";
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cXBxa2FqcXVrcWttcmd6Z3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5OTM2NSwiZXhwIjoyMDcwNTc1MzY1fQ.cAs4EdyJ2COWl5d8cL2nY_S8qgPzAUuZRzoJ0Q_bTbA";

// Cliente padrão (anon)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com service_role (use apenas em backend/server)
export const supabaseService = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);
