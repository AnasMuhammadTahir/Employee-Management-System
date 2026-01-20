import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


serve(async (req) => {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Delete auth user
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 500 }
      );
    }

    // 2️⃣ Delete profile
    await supabaseAdmin.from("profiles").delete().eq("id", user_id);

    // 3️⃣ Delete employee
    await supabaseAdmin.from("employees").delete().eq("user_id", user_id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400 }
    );
  }
});
