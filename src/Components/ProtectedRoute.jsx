import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ role }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.log("No session found, redirecting to login");
          setAllowed(false);
          setLoading(false);
          return;
        }

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          
          // If profile doesn't exist, create a basic one
          if (profileError.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                role: 'employee'
              })
              .select()
              .single();

            if (!createError && newProfile) {
              setUserRole(newProfile.role);
              setAllowed(newProfile.role === role);
            } else {
              setAllowed(false);
            }
          } else {
            setAllowed(false);
          }
        } else if (profile) {
          setUserRole(profile.role);
          setAllowed(profile.role === role);
        } else {
          setAllowed(false);
        }
      } catch (error) {
        console.error("Error in ProtectedRoute:", error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Checking authentication...</span>
      </div>
    );
  }

  if (!allowed) {
    // Redirect based on user role
    if (userRole === 'admin' && role === 'employee') {
      console.log("Admin trying to access employee route, redirecting to /admin");
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'employee' && role === 'admin') {
      console.log("Employee trying to access admin route, redirecting to /employee");
      return <Navigate to="/employee" replace />;
    } else if (!userRole) {
      console.log("No user role found, redirecting to login");
      return <Navigate to="/login" replace />;
    }
    
    // Default redirect to login
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}