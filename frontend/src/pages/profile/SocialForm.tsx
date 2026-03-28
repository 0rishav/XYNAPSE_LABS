import { FaXTwitter } from "react-icons/fa6";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import InputField from "../../components/ui/InputField";

interface SocialFormProps {
  formData: {
    linkedin: string;
    github: string;
    twitter: string;
  };
  handleSocialInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const SocialForm = ({ formData, handleSocialInputChange }: SocialFormProps) => (
  <div className="space-y-6">
    <InputField
      label="Github_Repository"
      name="github" 
      value={formData.github}
      onChange={handleSocialInputChange} 
      placeholder="https://github.com/username"
      icon={<FaGithub size={20} className="text-slate-900 dark:text-white" />}
    />

    <InputField
      label="LinkedIn_Network"
      name="linkedin"
      value={formData.linkedin}
      onChange={handleSocialInputChange}
      placeholder="https://linkedin.com/in/username"
      icon={<FaLinkedinIn size={20} className="text-[#0077B5]" />}
    />

    <InputField
      label="X_Terminal"
      name="twitter"
      value={formData.twitter}
      onChange={handleSocialInputChange}
      placeholder="https://twitter.com/username"
      icon={<FaXTwitter size={20} className="text-slate-900 dark:text-white" />}
    />
  </div>
);

export default SocialForm;