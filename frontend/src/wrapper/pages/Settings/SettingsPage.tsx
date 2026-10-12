import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Users,
  CreditCard,
  Plug,
  SlidersHorizontal,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";

import Sidebar from "../../Layout/Sidebar";
import TopNavigation from "../../Layout/TopNavigation";

type SettingsTab =
  | "Company Profile"
  | "Users & Roles"
  | "Billing"
  | "Integrations"
  | "Preferences";

type CompanyProfile = {
  companyName: string;
  email: string;
  phone: string;
  gstin: string;
  address: string;
};

const STORAGE_KEY = "cashguard-company-profile";
const LOGO_STORAGE_KEY = "cashguard-company-logo";

const defaultProfile: CompanyProfile = {
  companyName: "",
  email: "",
  phone: "",
  gstin: "",
  address: "",
};

const tabs: {
  label: SettingsTab;
  icon: typeof Building2;
}[] = [
  { label: "Company Profile", icon: Building2 },
  { label: "Users & Roles", icon: Users },
  { label: "Billing", icon: CreditCard },
  { label: "Integrations", icon: Plug },
  { label: "Preferences", icon: SlidersHorizontal },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>("Company Profile");

  const [profile, setProfile] =
    useState<CompanyProfile>(defaultProfile);

  const [logo, setLogo] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEY);
      const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);

      if (savedProfile) {
        const parsedProfile = JSON.parse(
          savedProfile
        ) as Partial<CompanyProfile>;

        setProfile({
          ...defaultProfile,
          ...parsedProfile,
        });
      }

      if (savedLogo) {
        setLogo(savedLogo);
      }
    } catch (error) {
      console.error("Unable to load saved settings:", error);
    }
  }, []);

  const updateField = (
    field: keyof CompanyProfile,
    value: string
  ) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const showMessage = (
    text: string,
    type: "success" | "error"
  ) => {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  const handleSaveProfile = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!profile.companyName.trim()) {
      showMessage("Please enter your company name.", "error");
      return;
    }

    if (
      profile.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
    ) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(profile)
      );

      showMessage(
        "Company profile saved successfully.",
        "success"
      );
    } catch (error) {
      console.error("Unable to save company profile:", error);

      showMessage(
        "Unable to save settings. Browser storage may be full.",
        "error"
      );
    }
  };

  const handleLogoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      showMessage("Upload a PNG or JPG image.", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage("The logo must be 2 MB or smaller.", "error");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        showMessage("Unable to read the selected image.", "error");
        return;
      }

      try {
        localStorage.setItem(
          LOGO_STORAGE_KEY,
          reader.result
        );

        setLogo(reader.result);

        showMessage("Company logo saved.", "success");
      } catch (error) {
        console.error("Unable to save logo:", error);

        showMessage(
          "Unable to save the logo. Browser storage may be full.",
          "error"
        );
      }
    };

    reader.onerror = () => {
      showMessage("Unable to read the selected image.", "error");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-slate-900">
      <Sidebar />

      <main className="ml-0 min-h-screen md:ml-[270px]">
        {/* Shared search, notifications and profile avatar */}
        <TopNavigation />

        <div className="space-y-6 p-5 md:p-8">
          {/* Page heading */}
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Settings
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your company profile and preferences.
            </p>
          </header>

          {/* Feedback message */}
          {message && (
            <div
              role="status"
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}

              {message}
            </div>
          )}

          {/* Settings navigation tabs */}
          <nav
            aria-label="Settings sections"
            className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-[#ebedf5] p-1.5"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.label;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.label)}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Company Profile */}
          {activeTab === "Company Profile" && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              {/* Company details form */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    Company Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Maintain the business details used in your workspace.
                  </p>
                </div>

                <form
                  onSubmit={handleSaveProfile}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-600">
                        Company Name
                      </span>

                      <input
                        type="text"
                        value={profile.companyName}
                        onChange={(event) =>
                          updateField(
                            "companyName",
                            event.target.value
                          )
                        }
                        placeholder="Your Company Pvt Ltd"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-[#fafbfe] px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-600">
                        Email
                      </span>

                      <input
                        type="email"
                        value={profile.email}
                        onChange={(event) =>
                          updateField(
                            "email",
                            event.target.value
                          )
                        }
                        placeholder="contact@yourcompany.com"
                        className="w-full rounded-xl border border-slate-200 bg-[#fafbfe] px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-600">
                        Phone
                      </span>

                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(event) =>
                          updateField(
                            "phone",
                            event.target.value
                          )
                        }
                        placeholder="+91 9876543210"
                        className="w-full rounded-xl border border-slate-200 bg-[#fafbfe] px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-600">
                        GSTIN
                      </span>

                      <input
                        type="text"
                        value={profile.gstin}
                        onChange={(event) =>
                          updateField(
                            "gstin",
                            event.target.value.toUpperCase()
                          )
                        }
                        placeholder="Enter your GSTIN"
                        maxLength={15}
                        className="w-full rounded-xl border border-slate-200 bg-[#fafbfe] px-4 py-3 text-sm uppercase outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600">
                      Address
                    </span>

                    <textarea
                      value={profile.address}
                      onChange={(event) =>
                        updateField(
                          "address",
                          event.target.value
                        )
                      }
                      placeholder="Enter your business address"
                      rows={3}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-[#fafbfe] px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </label>

                  <div className="border-t border-slate-100 pt-5">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <Save size={17} />
                      Update Profile
                    </button>
                  </div>
                </form>
              </section>

              {/* Company logo upload */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                <h2 className="text-lg font-bold text-slate-900">
                  Company Logo
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload your company branding.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 flex min-h-[230px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#fafbfe] p-6 text-center transition hover:border-violet-400 hover:bg-violet-50/50"
                >
                  {logo ? (
                    <>
                      <img
                        src={logo}
                        alt="Company logo preview"
                        className="max-h-32 max-w-full object-contain"
                      />

                      <span className="mt-5 text-sm font-semibold text-violet-700">
                        Change Logo
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                        <Upload size={23} />
                      </span>

                      <span className="mt-4 text-sm font-semibold text-slate-700">
                        Upload Logo
                      </span>

                      <span className="mt-2 text-xs text-slate-400">
                        PNG or JPG up to 2 MB
                      </span>
                    </>
                  )}
                </button>

                <p className="mt-4 text-xs leading-5 text-slate-400">
                  Your logo is saved in this browser. To share it across
                  users or devices, connect the upload to your backend
                  storage.
                </p>
              </section>
            </div>
          )}

          {/* Users and Roles */}
          {activeTab === "Users & Roles" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Users size={23} />
              </div>

              <h2 className="mt-4 text-lg font-bold">
                Users & Roles
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage team members and their access to CashGuard AI.
                Your application already defines user roles, but this
                section needs to be connected to the backend user
                management APIs before it can list or change real users.
              </p>
            </section>
          )}

          {/* Billing */}
          {activeTab === "Billing" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CreditCard size={23} />
              </div>

              <h2 className="mt-4 text-lg font-bold">
                Billing & Subscription
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Subscription information, invoices, and payment methods
                will appear here when a billing provider and billing
                APIs are configured.
              </p>
            </section>
          )}

          {/* Integrations */}
          {activeTab === "Integrations" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Plug size={23} />
              </div>

              <h2 className="mt-4 text-lg font-bold">
                Integrations
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Configure external services and connected applications.
                Integration status and connection controls need to be
                connected to the corresponding backend services.
              </p>
            </section>
          )}

          {/* Preferences */}
          {activeTab === "Preferences" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                <SlidersHorizontal size={23} />
              </div>

              <h2 className="mt-4 text-lg font-bold">
                Preferences
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Notification preferences, regional formatting, and
                application settings can be configured here.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}