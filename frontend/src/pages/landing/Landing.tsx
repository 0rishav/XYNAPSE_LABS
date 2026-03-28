import CategorySection from "./CategorySection";
import FeaturedCourses from "./FeaturedCourses";
import FeatureSection from "./FeatureSection";
import FinalCTA from "./FinalCTA";
import HeroSection from "./HeroSection";
import StatsSection from "./StatsSection";
import TerminalSection from "./TerminalSection";

const Landing = () => {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <CategorySection />
      <FeaturedCourses />
      <FeatureSection />
      <TerminalSection />
      <FinalCTA />
    </div>
  );
};

export default Landing;
