import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://agjwbhsrjhdhegtkoffy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnandiaHNyamhkaGVndGtvZmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MDg5NzAsImV4cCI6MjA5MjM4NDk3MH0._wEMNazSLVebZblCLXLw1yEc8Exr0nYu3y4Rj7WMmc8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
