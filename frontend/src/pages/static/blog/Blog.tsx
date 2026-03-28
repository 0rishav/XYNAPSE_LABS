import BlogArchive from "./BlogArchive";
import BlogFooterCTA from "./BlogFooterCTA";
import BlogHero from "./BlogHero";
import StaticBlog from "./StaticBlog";

const Blog = () => {
  return (
    <div>
      <BlogHero />
      <StaticBlog/>
      <BlogArchive/>
      <BlogFooterCTA/>
    </div>
  );
};

export default Blog;
