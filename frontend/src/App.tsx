import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import ContextNavBar from "./components/layout/navbar/ContentNavbar";
import GlobalTopBar from "./components/layout/navbar/GlobalTopBar";
import Docs from "./pages/static/docs/Docs";
import NotFound from "./pages/not-found/NotFound";
import Blog from "./pages/static/blog/Blog";
import Signup from "./pages/auth/signup/Signup";
import Login from "./pages/auth/login/Login";
import Profile from "./pages/profile/Profile";
import ForgotPassword from "./pages/auth/forgot-password/ForgotPassword";
import Landing from "./pages/landing/Landing";
import AllCoursesPage from "./pages/courses/AllCoursesPage";
import CourseDetailPage from "./pages/courses/CourseDetailPage";
import LearningPage from "./pages/courses/LearningPage";

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-[#0f1214]">
        <GlobalTopBar />
        <ContextNavBar />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/docs" element={<Docs />} />
            <Route path="/blog" element={<Blog />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/profile" element={<Profile />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/courses/:slug" element={<AllCoursesPage />} />

            <Route
              path="/learning/:chapterSlug/:contentSlug"
              element={<LearningPage />}
            />

            <Route
              path="/courses/:categorySlug/:courseSlug"
              element={<CourseDetailPage />}
            />

            {/* 404 Page (Optional) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
