import { BrowserRouter, Routes, Route } from "react-router-dom";
import CoursesPage from "./CoursesPage";
import CourseDetail from "./CourseDetail";
import HomePage from "./HomePage";
import ContactPage from "./ContactPage";
import AnnouncementPage from "./AnnouncementPage";

// Import โซน Components
import Login from "./components/Login"; 
import Register from "./components/Register"; 
import ProfilePage from "./ProfilePage";
import TeacherProfilePage from "./TeacherProfilePage"; // เพิ่มการนำเข้า TeacherProfilePage

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ บังคับให้หน้าแรกสุด (/) เป็นหน้าคอร์สเรียนตามที่ต้องการ */}
        <Route path="/" element={<CoursesPage />} /> 
        
        {/* เส้นทางอื่นๆ สำหรับเข้าหน้า Login และ Register */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* หน้าหลักและเมนูต่างๆ */}
        <Route path="/HomePage" element={<HomePage />} /> 
        <Route path="/courses" element={<CoursesPage />} /> {/* มีไว้สำหรับเวลาพิมพ์ /courses ตรงๆ */}
        <Route path="/course/:courseId" element={<CourseDetail />} />
        <Route path="/ContactPage" element={<ContactPage />} />
        <Route path="/AnnouncementPage" element={<AnnouncementPage />} />
        <Route path="/teacher-profile" element={<TeacherProfilePage />} />
        {/* หน้าข้อมูลส่วนตัว */}
        <Route path="/profile" element={<ProfilePage />} /> 
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;