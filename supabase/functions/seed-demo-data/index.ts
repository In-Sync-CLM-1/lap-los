import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const authHeader = req.headers.get('Authorization');
  const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

  const names = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Gupta', 'Vikram Joshi', 'Meera Singh', 'Rahul Verma', 'Anjali Desai'];
  const products = ['business_loan', 'personal_loan', 'stpl', 'po_finance'] as const;
  const statuses = ['new', 'in_progress', 'documents_pending', 'submitted'] as const;

  for (let i = 0; i < 10; i++) {
    await supabase.from('leads').insert({
      ro_id: user.id,
      customer_name: names[i % names.length] + ` ${i + 1}`,
      customer_phone: `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`,
      product_type: products[i % products.length],
      requested_amount: (Math.floor(Math.random() * 20) + 1) * 100000,
      requested_tenure_months: [12, 24, 36][i % 3],
      status: statuses[i % statuses.length],
      business_name: `${names[i % names.length]} Enterprises`,
      business_type: ['retail', 'services', 'trading'][i % 3],
    });
  }

  return new Response(JSON.stringify({ success: true, created: 10 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
