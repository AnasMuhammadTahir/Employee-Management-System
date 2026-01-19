import Navbar from "../Components/Navbar";
import { useNavigate } from "react-router-dom";
import { Users, Briefcase, Wallet, CheckCircle } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    
    <div className="bg-gradient-to-br from-indigo-50 to-blue-100">
      <Navbar />

      {/* HERO */}
      <section
        id="home"
        className="min-h-screen pt-32 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center"
      >
        <div className="animate-fadeIn">
          <h1 className="text-5xl font-extrabold text-gray-800 leading-tight">
            Modern Employee <br />
            <span className="text-indigo-600">Management System</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Manage employees, departments, salaries, and leave requests
            with a clean and powerful dashboard.
          </p>

          <div className="mt-8 flex space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-indigo-700 transition"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/login")}
              className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg text-lg hover:bg-indigo-50 transition"
            >
              Demo
            </button>
          </div>
        </div>

        {/* Right visual */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slideUp">
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Users />} title="Employees" />
            <StatCard icon={<Briefcase />} title="Departments" />
            <StatCard icon={<Wallet />} title="Salaries" />
            <StatCard icon={<CheckCircle />} title="Leaves" />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            About StaffNet
          </h2>
          <p className="text-gray-600 text-lg">
            StaffNet is a lightweight employee management system designed
            for small teams and startups who want clarity, speed, and control
            without complexity.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-indigo-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users />}
              title="Employee Management"
              desc="Add, update, and manage employee records easily."
            />
            <FeatureCard
              icon={<Briefcase />}
              title="Department Control"
              desc="Organize teams into departments efficiently."
            />
            <FeatureCard
              icon={<Wallet />}
              title="Salary Tracking"
              desc="View monthly salary and payment records."
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 text-center py-6">
        © {new Date().getFullYear()} StaffNet. All rights reserved.
      </footer>
    </div>
    
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow hover:shadow-xl hover:-translate-y-1 transition">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{desc}</p>
    </div>
  );
}

function StatCard({ icon, title }) {
  return (
    <div className="bg-indigo-50 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-indigo-100 transition">
      <div className="text-indigo-600 mb-2">{icon}</div>
      <p className="font-medium">{title}</p>
    </div>
  );
}
