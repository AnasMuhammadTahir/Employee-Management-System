import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔁 Auto-redirect if session exists and is valid
  useEffect(() => {
    const checkSession = async () => {
      const loginTime = localStorage.getItem("login_time");

      if (!loginTime) return;

      // ⏳ 12 hours = 43200000 ms
      if (Date.now() - loginTime > 12 * 60 * 60 * 1000) {
        await supabase.auth.signOut();
        localStorage.removeItem("login_time");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role === "admin") navigate("/admin");
      if (profile?.role === "employee") navigate("/employee");
    };

    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError("Profile not found. Contact admin.");
      setLoading(false);
      return;
    }

    // 🕒 Store login timestamp (session TTL workaround)
    localStorage.setItem("login_time", Date.now());

    navigate(profile.role === "admin" ? "/admin" : "/employee");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-700 px-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={22} />
        </button>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Sign in to your EMS Lite account
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
