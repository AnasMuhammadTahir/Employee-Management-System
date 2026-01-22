import { useEffect, useState, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  MapPin,
  CreditCard,
  Edit,
  Save,
  X,
  Camera,
  AlertCircle,
  CheckCircle,
  Shield,
  Lock,
  Download
} from "lucide-react";

export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({});
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      // Fetch employee details with department
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select(`
          *,
          departments (name, code),
          managers:employees!manager_id (name, email)
        `)
        .eq("user_id", user.id)
        .single();

      if (empError) throw empError;
      if (!empData) {
        setError("Employee profile not found");
        return;
      }

      setEmployee(empData);
      setForm({
        phone: empData.phone || "",
        address: empData.address || "",
        emergency_contact: empData.emergency_contact || "",
        bank_account: empData.bank_account || "",
        bank_name: empData.bank_name || "",
        linkedin_url: empData.linkedin_url || "",
        github_url: empData.github_url || ""
      });
      setAvatarUrl(empData.avatar_url || "");

    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, WebP)");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const fileExt = file.name.split('.').pop();
      const fileName = `${employee.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Remove old avatar if exists
      if (employee.avatar_url) {
        const oldPath = employee.avatar_url.split('/').pop();
        await supabase.storage
          .from('employee-avatars')
          .remove([`avatars/${oldPath}`]);
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('employee-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('employee-avatars')
        .getPublicUrl(filePath);

      // Update employee record
      const { error: updateError } = await supabase
        .from("employees")
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", employee.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setEmployee(prev => ({ ...prev, avatar_url: publicUrl }));
      setSuccess("Profile picture updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);

    } catch (error) {
      setError("Failed to upload avatar: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("employees")
        .update({
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
          emergency_contact: form.emergency_contact?.trim() || null,
          bank_account: form.bank_account?.trim() || null,
          bank_name: form.bank_name?.trim() || null,
          linkedin_url: form.linkedin_url?.trim() || null,
          github_url: form.github_url?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", employee.id);

      if (updateError) throw updateError;

      // Update local state
      setEmployee(prev => ({
        ...prev,
        ...form
      }));

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);

    } catch (error) {
      setError("Failed to update profile: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  function calculateTenure(hireDate) {
    if (!hireDate) return '—';
    
    const hire = new Date(hireDate);
    const now = new Date();
    
    let years = now.getFullYear() - hire.getFullYear();
    let months = now.getMonth() - hire.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
  }

  function formatEmployeeId(id) {
    if (!id) return '—';
    return id.substring(0, 8).toUpperCase();
  }

  function maskBankAccount(account) {
    if (!account) return '—';
    if (account.length <= 4) return '••••';
    return '••••' + account.slice(-4);
  }

  async function handleDownloadProfile() {
    try {
      // Create a simple text representation of the profile
      const profileText = `
Employee Profile
================
Name: ${employee.name}
Employee ID: ${formatEmployeeId(employee.id)}
Email: ${employee.email}
Department: ${employee.departments?.name}
Position: ${employee.position}
Employment Type: ${employee.employment_type}
Hire Date: ${employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '—'}
Phone: ${employee.phone || '—'}
Address: ${employee.address || '—'}
      `.trim();

      const blob = new Blob([profileText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile_${employee.name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess("Profile downloaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to download profile");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchProfile}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleDownloadProfile}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Download profile as text file"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setForm({
                    phone: employee.phone || "",
                    address: employee.address || "",
                    emergency_contact: employee.emergency_contact || "",
                    bank_account: employee.bank_account || "",
                    bank_name: employee.bank_name || "",
                    linkedin_url: employee.linkedin_url || "",
                    github_url: employee.github_url || ""
                  });
                  setError("");
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Success!</p>
              <p className="text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={employee.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('svg').style.display = 'block';
                    }}
                  />
                ) : null}
                <User className={`w-16 h-16 text-gray-400 ${avatarUrl ? 'hidden' : 'block'}`} />
              </div>
              
              <label className="absolute bottom-0 right-0 cursor-pointer transform transition-transform hover:scale-105">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 shadow-md">
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-full transition-all duration-200"></div>
            </div>
            
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
              <p className="text-gray-600 mt-1">{employee.position}</p>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{employee.departments?.name}</span>
                  {employee.departments?.code && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {employee.departments.code}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-gray-300">•</div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="capitalize text-gray-700">
                    {employee.employment_type?.replace(/_/g, ' ') || 'Full Time'}
                  </span>
                </div>
              </div>
              
              {employee.managers && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Manager: </span>
                  {employee.managers.name}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h2>
              
              <div className="space-y-4">
                <ReadOnlyField label="Full Name" value={employee.name} icon={<User />} />
                <ReadOnlyField label="Email" value={employee.email} icon={<Mail />} />
                <ReadOnlyField 
                  label="Date of Birth" 
                  value={employee.dob ? new Date(employee.dob).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '—'} 
                  icon={<Calendar />} 
                />
                <ReadOnlyField 
                  label="Employee ID" 
                  value={formatEmployeeId(employee.id)} 
                  icon={<Briefcase />} 
                />
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Employment Details
              </h2>
              
              <div className="space-y-4">
                <ReadOnlyField 
                  label="Department" 
                  value={employee.departments?.name || '—'} 
                  icon={<Building />} 
                />
                <ReadOnlyField label="Position" value={employee.position || '—'} icon={<Briefcase />} />
                <ReadOnlyField 
                  label="Employment Type" 
                  value={employee.employment_type ? 
                    employee.employment_type.replace(/_/g, ' ').toUpperCase() : '—'} 
                  icon={<User />} 
                />
                <ReadOnlyField 
                  label="Hire Date" 
                  value={employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '—'} 
                  icon={<Calendar />} 
                />
                <ReadOnlyField 
                  label="Tenure" 
                  value={calculateTenure(employee.hire_date)} 
                  icon={<Calendar />} 
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Social Links</h2>
              
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <EditableField
                      label="LinkedIn Profile"
                      name="linkedin_url"
                      value={form.linkedin_url}
                      onChange={(e) => setForm({...form, linkedin_url: e.target.value})}
                      icon={<User />}
                      placeholder="https://linkedin.com/in/username"
                    />
                    <EditableField
                      label="GitHub Profile"
                      name="github_url"
                      value={form.github_url}
                      onChange={(e) => setForm({...form, github_url: e.target.value})}
                      icon={<User />}
                      placeholder="https://github.com/username"
                    />
                  </>
                ) : (
                  <>
                    {employee.linkedin_url && (
                      <a 
                        href={employee.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <div className="w-5 h-5">in</div>
                        <span>LinkedIn Profile</span>
                      </a>
                    )}
                    {employee.github_url && (
                      <a 
                        href={employee.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-800 hover:text-black hover:underline"
                      >
                        <div className="w-5 h-5">gh</div>
                        <span>GitHub Profile</span>
                      </a>
                    )}
                    {!employee.linkedin_url && !employee.github_url && (
                      <p className="text-gray-500 italic">No social links added</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </h2>
              
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <EditableField
                      label="Phone Number"
                      name="phone"
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      icon={<Phone />}
                      placeholder="+1 (555) 123-4567"
                      type="tel"
                    />
                    <EditableField
                      label="Address"
                      name="address"
                      value={form.address}
                      onChange={(e) => setForm({...form, address: e.target.value})}
                      icon={<MapPin />}
                      placeholder="123 Main St, City, State, ZIP"
                      isTextarea={true}
                    />
                    <EditableField
                      label="Emergency Contact"
                      name="emergency_contact"
                      value={form.emergency_contact}
                      onChange={(e) => setForm({...form, emergency_contact: e.target.value})}
                      icon={<Phone />}
                      placeholder="Emergency contact number"
                      type="tel"
                    />
                  </>
                ) : (
                  <>
                    <ReadOnlyField label="Phone Number" value={employee.phone || '—'} icon={<Phone />} />
                    <ReadOnlyField label="Address" value={employee.address || '—'} icon={<MapPin />} />
                    <ReadOnlyField 
                      label="Emergency Contact" 
                      value={employee.emergency_contact || '—'} 
                      icon={<Phone />} 
                    />
                  </>
                )}
              </div>
            </div>

            {/* Bank Information */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bank Information
                </h2>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowBankDetails(!showBankDetails)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showBankDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <EditableField
                      label="Bank Name"
                      name="bank_name"
                      value={form.bank_name}
                      onChange={(e) => setForm({...form, bank_name: e.target.value})}
                      icon={<CreditCard />}
                      placeholder="Enter bank name"
                    />
                    <EditableField
                      label="Account Number"
                      name="bank_account"
                      value={form.bank_account}
                      onChange={(e) => setForm({...form, bank_account: e.target.value})}
                      icon={<CreditCard />}
                      placeholder="Enter account number"
                      type="text"
                    />
                  </>
                ) : (
                  <>
                    <ReadOnlyField 
                      label="Bank Name" 
                      value={employee.bank_name || '—'} 
                      icon={<CreditCard />} 
                    />
                    <ReadOnlyField 
                      label="Account Number" 
                      value={
                        showBankDetails 
                          ? employee.bank_account || '—'
                          : maskBankAccount(employee.bank_account)
                      } 
                      icon={<CreditCard />} 
                    />
                  </>
                )}
              </div>
            </div>

            {/* Account Security */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Account Security
              </h2>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => alert("Change password feature coming soon!")}
                  className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="font-medium">Change Password</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Update your login password
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => alert("Two-factor authentication feature coming soon!")}
                  className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="font-medium">Two-Factor Authentication</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Add an extra layer of security
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function ReadOnlyField({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-1 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="font-medium break-words text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function EditableField({ label, name, value, onChange, icon, placeholder, isTextarea = false, type = "text" }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-3 flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <label className="block text-sm text-gray-500 mb-1">{label}</label>
        {isTextarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        )}
      </div>
    </div>
  );
}