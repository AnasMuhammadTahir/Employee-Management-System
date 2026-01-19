import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur shadow-sm fixed top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="text-2xl font-bold text-indigo-600 cursor-pointer"
        >
          StaffNet
        </div>

        {/* Center links */}
        <div className="hidden md:flex space-x-8 text-gray-700 font-medium">
          <button onClick={() => scrollTo("home")} className="hover:text-indigo-600">
            Home
          </button>
          <button onClick={() => scrollTo("about")} className="hover:text-indigo-600">
            About
          </button>
          <button onClick={() => scrollTo("features")} className="hover:text-indigo-600">
            Features
          </button>
        </div>

        {/* Login */}
        <button
          onClick={() => navigate("/login")}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Login
        </button>
      </div>
    </nav>
  );
}
