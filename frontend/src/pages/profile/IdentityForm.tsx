import {
  FaGenderless,
  FaGlobe,
  FaMapMarkerAlt,
  FaMars,
  FaPhone,
  FaUser,
  FaVenus,
} from "react-icons/fa";
import InputField from "../../components/ui/InputField";
import type { UserDetails } from "../../features/profile/types/user";

interface IdentityFormProps {
  formData: Partial<UserDetails>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  setFormData: (data: any) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;
}

const IdentityForm = ({
  formData,
  handleInputChange,
  setFormData,
  handleFileChange,
  previewUrl,
}: IdentityFormProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Hidden File Input for Image Update */}
    <input
      type="file"
      id="profile-upload"
      className="hidden"
      onChange={handleFileChange}
      accept="image/*"
    />

    <InputField
      label="Full_Name"
      name="name"
      value={formData.name}
      onChange={handleInputChange}
      placeholder="FULL_NAME"
      icon={<FaUser size={16} />}
    />

    <InputField
      label="Contact_Node"
      name="phone"
      value={formData.phone}
      onChange={handleInputChange}
      placeholder="+91 XXXXX XXXXX"
      icon={<FaPhone size={16} />}
    />

    {/* --- GENDER SELECTION --- */}
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">
        Gender_Protocol
      </label>
      <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
        {["Male", "Female", "Other"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFormData({ ...formData, gender: g })}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all cursor-pointer
              ${
                formData.gender === g
                  ? "bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20"
                  : "text-slate-500 hover:bg-white dark:hover:bg-white/10"
              }`}
          >
            {g === "Male" && <FaMars size={14} />}
            {g === "Female" && <FaVenus size={14} />}
            {g === "Other" && <FaGenderless size={14} />}
            {g}
          </button>
        ))}
      </div>
    </div>

    <InputField
      label="Operation_City"
      name="city"
      value={formData.city}
      onChange={handleInputChange}
      placeholder="DELHI"
      icon={<FaMapMarkerAlt size={16} />}
    />

    <InputField
      label="Country_Zone"
      name="country"
      value={formData.country}
      onChange={handleInputChange}
      placeholder="INDIA"
      icon={<FaGlobe size={16} />}
    />
    {/* Image Selection Trigger */}
    <div className="md:col-span-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
        Profile_Neural_Link (Image_Preview)
      </label>

      <label
        htmlFor="profile-upload"
        className="relative flex items-center justify-center w-full min-h-[120px] bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl cursor-pointer hover:border-emerald-500/50 transition-all group overflow-hidden"
      >
        {previewUrl || formData.image ? (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={previewUrl || formData.image}
              alt="preview"
              className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                Click_To_Change_Node
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform border border-emerald-500/20">
              <FaUser size={20} />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500">
                Upload_Identity_Image
              </p>
              <p className="text-[8px] font-bold text-slate-500/60 mt-1 uppercase">
                Recommended: Square_Ratio (PNG/JPG)
              </p>
            </div>
          </div>
        )}
      </label>
    </div>
  </div>
);

export default IdentityForm;
