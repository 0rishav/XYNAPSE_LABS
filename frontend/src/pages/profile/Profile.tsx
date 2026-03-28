import { useEffect, useState } from "react";
import { User, Shield, Share2, Camera, Save, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import SecurityForm from "./SecurityForm";
import IdentityForm from "./IdentityForm";
import SocialForm from "./SocialForm";
import type { UserDetails } from "../../features/profile/types/user";
import { useAuthStore } from "../../store/useAuthStore";
import { userService } from "../../features/profile/services/userService";
import { useNotify } from "../../hooks/useNotify";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("identity");
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<UserDetails | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    gender: "" as "Male" | "Female" | "Other",
    city: "",
    country: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [socialData, setSocialData] = useState({
    linkedin: "",
    github: "",
    twitter: "",
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const { notify } = useNotify();

  const updateUserStore = useAuthStore((state) => state.updateUser);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      const userData = user as any;

      setFormData({
        name: userData.name || "",
        phone: userData.phone || "",
        gender: (userData.gender as "Male" | "Female" | "Other") || "Male",
        city: userData.city || "",
        country: userData.country || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && (user as any).socialMedia) {
      const social = (user as any).socialMedia;

      setSocialData({
        linkedin: social.linkedin || "",
        github: social.github || "",
        twitter: social.twitter || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchNodeDetails = async () => {
      setIsFetching(true);
      try {
        const response = await userService.getProfile();
        const userData = response.data.user;

        setProfile(userData);

        updateUserStore(userData);
      } catch (error: any) {
        console.error("DATA_SYNC_FAILED", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchNodeDetails();
  }, [updateUserStore]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setSocialData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      let response;

      // --- CASE 1: IDENTITY CORE ---
      if (activeTab === "identity") {
        const updatePayload = {
          ...formData,
          image: selectedFile,
        };
        response = await userService.updateProfile(updatePayload);

        if (response.success) {
          setPreviewUrl(null);
          setSelectedFile(null);
        }
      }

      // --- CASE 2: SOCIAL NODES ---
      else if (activeTab === "social") {
        response = await userService.updateSocialLinks(socialData);

        if (response.success) {
          const updatedSocialNodes = response.data.socialMedia;

          updateUserStore({
            ...user,
            socialMedia: updatedSocialNodes,
          } as any);
          notify(response.message, "SUCCESS");
        }
      } else if (activeTab === "security") {
        if (securityData.newPassword !== securityData.confirmNewPassword) {
          notify("PASSWORDS_DO_NOT_MATCH", "ERROR");
          setLoading(false);
          return;
        }

        response = await userService.updatePassword({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
          confirmNewPassword: securityData.confirmNewPassword,
        });

        if (response.success) {
          setSecurityData({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
          });

          notify(
            response.message || "SECURITY_PROTOCOL_SYNCHRONIZED",
            "SUCCESS",
          );
        }
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "SYNCHRONIZATION_FAILED";
      console.error(message);
      notify(message, "ERROR");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "identity", label: "Identity_Core", icon: <User size={18} /> },
    { id: "social", label: "Social_Nodes", icon: <Share2 size={18} /> },
    { id: "security", label: "Security_Protocol", icon: <Shield size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070a] p-4 md:p-8 text-slate-900 dark:text-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="relative group overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-8">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <User size={200} />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative group">
              <div className="h-32 w-32 rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[3px] shadow-2xl shadow-emerald-500/20 dark:shadow-emerald-500/10">
                <div className="h-full w-full rounded-[21px] bg-white dark:bg-[#0B1215] overflow-hidden">
                  <img
                    src={
                      profile?.image ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`
                    }
                    alt="profile_node"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </div>
              <button className="absolute -bottom-2 -right-2 p-3 bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-900 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer border-4 border-white dark:border-[#05070a]">
                <Camera size={18} />
              </button>
            </div>

            <div className="text-center md:text-left space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white leading-none">
                  {profile?.name?.replace(" ", "_") || "UNKNOWN_NODE"}
                </h1>

                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 ml-1">
                  <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">
                    {profile?.email || "NOT_FOUND@XYNAPSE.COM"}
                  </p>
                  <span className="hidden md:block text-slate-300 dark:text-slate-700">
                    |
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
                    CID: {profile?.referralCode || "XXXX-XXXX-XXXX"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {profile?.role || "USER"}
                </span>

                <span className="px-4 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                  Rank: {profile?.codingStats?.level || "ROOKIE"}
                </span>

                <span className="px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest font-mono">
                  XP: {profile?.codingStats?.points || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: NAVIGATION TABS --- */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer
                ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-emerald-500 text-slate-900 shadow-lg"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm"
            >
              {activeTab === "identity" && (
                <IdentityForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  setFormData={setFormData}
                  handleFileChange={handleFileChange}
                  previewUrl={previewUrl}
                />
              )}
              {activeTab === "social" && (
                <SocialForm
                  formData={socialData}
                  handleSocialInputChange={handleSocialInputChange}
                />
              )}
              {activeTab === "security" && (
                <SecurityForm
                  formData={securityData}
                  handleInputChange={handleSecurityInputChange}
                />
              )}

              {/* Global Save Button */}
              <div className="mt-8 pt-8 border-t dark:border-white/5 flex justify-end">
                <button
                  onClick={handleUpdate}
                  className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/10"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Synchronize_Changes
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
