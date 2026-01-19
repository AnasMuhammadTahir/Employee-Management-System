import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useEffect, useState } from "react";

const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours

export default function ProtectedRoute({ role }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const loginTime = localStorage.getItem("login_time");

      // ⏳ Session expired
      if (!loginTime || Date.now() - loginTime > SESSION_DURATION) {
        await supabase.auth.signOut();
        localStorage.removeItem("login_time");
        setAllowed(false);
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      setAllowed(!error && profile?.role === role);
      setLoading(false);
    };

    checkAccess();
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Checking session...</p>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
