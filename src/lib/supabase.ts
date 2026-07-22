import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqfdsarrcrncksbgxtz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cWZkc2FycmNybmNrc2JneHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyOTY0MDksImV4cCI6MjA5OTg3MjQwOX0.2lEmEtZCgwy0Z-T8LzO1ROmUmy_l0favGEsxDv6jno4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);