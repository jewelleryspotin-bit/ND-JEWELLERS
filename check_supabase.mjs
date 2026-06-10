import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mysceikgkhvuewohxtzf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15c2NlaWtna2h2dWV3b2h4dHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDk1NzAsImV4cCI6MjA5NTE4NTU3MH0.REXzTCouzjoMsj2x5sr4vlSGWUOGGlibVMeqEMLrzMI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabase() {
  console.log("Checking Supabase connection...");
  
  // 1. Check custom_users
  const { data: users, error: err1 } = await supabase.from('custom_users').select('*').limit(1);
  console.log("Custom Users:", err1 ? "ERROR: " + err1.message : "OK (" + users.length + " rows)");
  
  // 2. Check storage buckets
  console.log("Checking storage buckets...");
  const { data: buckets, error: err2 } = await supabase.storage.listBuckets();
  if (err2) {
    console.log("Buckets ERROR:", err2.message);
  } else {
    console.log("Buckets:", buckets.map(b => b.name));
    
    // Check if payment_screenshots exists
    const hasBucket = buckets.find(b => b.name === 'payment_screenshots');
    if (!hasBucket) {
      console.log("ERROR: payment_screenshots bucket DOES NOT EXIST!");
    } else {
      console.log("payment_screenshots bucket exists. Public:", hasBucket.public);
      
      // Try to upload a test file to check policies
      const { error: uploadErr } = await supabase.storage.from('payment_screenshots').upload('test.txt', 'hello world', { upsert: true });
      if (uploadErr) {
        console.log("Upload ERROR:", uploadErr.message);
      } else {
        console.log("Upload test: OK");
      }
    }
  }
}

checkSupabase();
