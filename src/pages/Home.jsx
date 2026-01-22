import Navbar from "../Components/Navbar";
import { useNavigate } from "react-router-dom";
import { 
  Users, Briefcase, Wallet, CheckCircle, 
  Shield, BarChart, Clock, FileText,
  Zap, Globe, Lock, Bell, TrendingUp,
  Award, Users2, Calendar, CreditCard
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Navbar />

      {/* HERO SECTION */}
      <section
        id="home"
        className="min-h-screen pt-24 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center"
      >
        <div className="animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Streamline Your Workforce Management
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Empower Your Team with
            <span className="block text-indigo-600 mt-2">Smart Employee Solutions</span>
          </h1>

          <p className="mt-6 text-xl text-gray-600 max-w-2xl">
            A comprehensive platform that simplifies employee management, automates payroll, 
            tracks attendance, and manages leave requests—all in one intuitive dashboard.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Get Started Free
              <TrendingUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-all duration-300"
            >
              Watch Demo (2 min)
            </button>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Shield className="text-green-500 w-6 h-6" />
              <span className="text-gray-700 font-medium">Secure & Compliant</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="text-blue-500 w-6 h-6" />
              <span className="text-gray-700 font-medium">Cloud-Based</span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="text-purple-500 w-6 h-6" />
              <span className="text-gray-700 font-medium">Role-Based Access</span>
            </div>
          </div>
        </div>

        {/* Right visual */}
        <div className="relative">
          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-slideUp transform hover:scale-[1.02] transition duration-500">
            <div className="grid grid-cols-2 gap-6">
              <StatCard icon={<Users className="w-8 h-8" />} title="Employee Management" count="500+" />
              <StatCard icon={<Briefcase className="w-8 h-8" />} title="Departments" count="20+" />
              <StatCard icon={<Wallet className="w-8 h-8" />} title="Payroll Processed" count="$2M+" />
              <StatCard icon={<CheckCircle className="w-8 h-8" />} title="Leave Requests" count="1K+" />
            </div>
            
            {/* Dashboard Preview */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Live Dashboard Preview</h3>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="h-32 bg-gradient-to-r from-white to-blue-100 rounded-lg border border-blue-200 flex items-center justify-center">
                <p className="text-gray-500 font-medium">Real-time Analytics Dashboard</p>
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-4 -right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
            Trusted by 200+ Companies
          </div>
        </div>
      </section>

      {/* ABOUT SECTION - ENHANCED */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About <span className="text-indigo-600">StaffNet</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              StaffNet revolutionizes how modern organizations manage their most valuable asset—their people.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-700 mb-6">
                  To provide small and medium-sized businesses with enterprise-grade employee management tools that are 
                  affordable, intuitive, and scalable. We believe every company deserves access to 
                  powerful workforce management solutions.
                </p>
                <div className="flex items-center gap-4">
                  <Award className="text-indigo-600 w-8 h-8" />
                  <div>
                    <p className="font-semibold">Award-Winning Platform</p>
                    <p className="text-sm text-gray-600">Best Employee Management Software 2023</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Users2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">For Growing Teams</h4>
                  <p className="text-gray-600">Perfect for startups and SMEs with 10-500 employees.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Real-time Updates</h4>
                  <p className="text-gray-600">Instant notifications and live dashboard updates.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">Transparent Pricing</h4>
                  <p className="text-gray-600">No hidden fees. Pay per active employee.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION - ENHANCED */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your workforce efficiently in one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Users className="w-10 h-10" />}
              title="Employee Management"
              desc="Complete employee profiles, documents, and performance tracking."
              features={["Profile Management", "Document Storage", "Performance Reviews"]}
            />
            <FeatureCard
              icon={<Wallet className="w-10 h-10" />}
              title="Payroll Automation"
              desc="Automated salary calculations, tax deductions, and payment processing."
              features={["Auto Calculations", "Tax Compliance", "Direct Deposit"]}
            />
            <FeatureCard
              icon={<CheckCircle className="w-10 h-10" />}
              title="Leave Management"
              desc="Streamlined leave requests, approvals, and balance tracking."
              features={["Leave Requests", "Approval Workflow", "Balance Tracking"]}
            />
            <FeatureCard
              icon={<BarChart className="w-10 h-10" />}
              title="Advanced Analytics"
              desc="Insightful reports and dashboards for data-driven decisions."
              features={["Custom Reports", "Real-time Dashboard", "Export Data"]}
            />
            <FeatureCard
              icon={<Clock className="w-10 h-10" />}
              title="Time & Attendance"
              desc="Track working hours, overtime, and attendance patterns."
              features={["Time Tracking", "Overtime Management", "Absence Patterns"]}
            />
            <FeatureCard
              icon={<FileText className="w-10 h-10" />}
              title="Document Management"
              desc="Secure storage for contracts, policies, and employee documents."
              features={["Secure Storage", "Version Control", "Digital Signatures"]}
            />
            <FeatureCard
              icon={<Bell className="w-10 h-10" />}
              title="Notifications"
              desc="Real-time alerts for important updates and deadlines."
              features={["Email Alerts", "Push Notifications", "Reminder System"]}
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Security & Compliance"
              desc="Enterprise-grade security with GDPR and labor law compliance."
              features={["Data Encryption", "Access Control", "Audit Logs"]}
            />
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Employee Management?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Join thousands of companies using StaffNet to streamline their employee processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-indigo-600 px-10 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition"
            >
              Schedule a Demo
            </button>
          </div>
          <p className="mt-8 text-sm opacity-80">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-2xl font-bold text-white mb-2">StaffNet</div>
              <p>Modern Employee Management Simplified</p>
            </div>
            <div className="flex gap-8">
              <a href="#home" className="hover:text-white transition">Home</a>
              <a href="#about" className="hover:text-white transition">About</a>
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="/login" className="hover:text-white transition">Login</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            © {new Date().getFullYear()} StaffNet. All rights reserved. | Privacy Policy | Terms of Service
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, features = [] }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100">
      <div className="text-indigo-600 mb-6">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-6">{desc}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-gray-700">
            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({ icon, title, count }) {
  return (
    <div className="bg-gradient-to-br from-white to-indigo-50 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-white transition-all duration-300 border border-gray-100 hover:border-indigo-200">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <p className="font-bold text-2xl text-gray-900 mb-1">{count}</p>
      <p className="text-gray-600 text-center font-medium">{title}</p>
    </div>
  );
}