import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hinifcylihestzqtpryk.supabase.co'

// using the anon/public JWT key - this is the correct format for supabase-js
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbmlmY3lsaWhlc3R6cXRwcnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0Mzg5ODEsImV4cCI6MjA5ODAxNDk4MX0.6jsMz_McpljWCmMHFZxLy5OU3BJU6HZ5j6VmB2gW3G0'

export const supabase = createClient(supabaseUrl, supabaseKey)