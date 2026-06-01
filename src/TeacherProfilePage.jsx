/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Swal from "sweetalert2";
import { supabase } from "./supabaseClient";

export default function TeacherProfilePage() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const [teacherInfo, setTeacherInfo] = useState({
    name: "", initial: "T", username: ""
  });
  const [myTeachingCourses, setMyTeachingCourses] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ฟังก์ชันสำหรับดึงข้อมูลวิชา (แยกออกมาเพื่อให้เรียกใช้ซ้ำได้หลังจากลบข้อมูล)
  const fetchTeacherCourses = async (username) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("course_teachers")
        .select("*")
        .eq("username", username);

      if (error) throw error;

      if (data) {
        const formattedCourses = data.map((item) => {
          const parts = item.course_id.split("-");
          const subjectCode = parts.slice(0, 2).join("-");
          const rawName = parts.slice(2).join(" ");
          const subjectName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

          return {
            id: item.course_id,
            subject: subjectName || item.course_id,
            subjectCode: subjectCode || "",
            color: "#16a34a"
          };
        });
        setMyTeachingCourses(formattedCourses);
      }
    } catch (err) {
      console.error("Error fetching courses:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate("/"); return; }

    const firstName = localStorage.getItem("userFirstName") || "";
    const lastName  = localStorage.getItem("userLastName")  || "";
    const username  = localStorage.getItem("userName")      || "";
    const fullName  = `${firstName} ${lastName}`;

    setTeacherInfo({
      name: firstName ? fullName : "คุณครู LearnHub",
      initial: firstName ? firstName.charAt(0) : "T",
      username
    });

    if (username) {
      fetchTeacherCourses(username);
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, navigate]);

  // ── ฟังก์ชันลบรายวิชาออกจาก Supabase ──
  const handleDeleteCourse = async (courseId) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบวิชา?",
      text: `คุณต้องการลบรายวิชา ${courseId} ออกจากการดูแลใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ใช่, ลบออกเลย",
      cancelButtonText: "ยกเลิก"
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from("course_teachers")
          .delete()
          .eq("username", teacherInfo.username)
          .eq("course_id", courseId);

        if (error) throw error;

        // แจ้งเตือนเมื่อลบสำเร็จ
        await Swal.fire({
          title: "ลบสำเร็จ!",
          text: "ลบรายวิชาออกจากระบบเรียบร้อยแล้ว",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });

        // โหลดข้อมูลในหน้าจอใหม่
        fetchTeacherCourses(teacherInfo.username);

      } catch (err) {
        console.error("Error deleting course:", err.message);
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถลบวิชาได้ กรุณาตรวจสอบสิทธิ์ RLS ในฐานข้อมูล",
          icon: "error"
        });
      }
    }
  };

  // ── Desktop Row พร้อมปุ่ม จัดการ และ ปุ่มลบ ──
  const DesktopCourseRow = ({ course, idx }) => (
    <div style={{
      display: "grid", gridTemplateColumns: "minmax(0,2fr) 120px 240px", // ขยายความกว้างปุ่มเป็น 240px
      gap: 12, alignItems: "center", padding: "14px 16px",
      background: idx % 2 === 0 ? "#fff" : "#fafafa",
      borderBottom: "1px solid #f1f5f9"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ width: 4, minHeight: 20, borderRadius: 4, background: course.color || "#16a34a", alignSelf: "stretch", flexShrink: 0 }} />
        <span title={course.subject} style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {course.subject}
        </span>
      </div>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>{course.subjectCode}</span>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {/* ปุ่มจัดการบทเรียน */}
        <button onClick={() => navigate(`/course/${course.id}`)} style={{
          padding: "5px 12px", borderRadius: 8, border: "1px solid #bbf7d0",
          background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
        }}>
          ⚙️ จัดการบทเรียน
        </button>
        {/* ปุ่มลบรายวิชา */}
        <button onClick={() => handleDeleteCourse(course.id)} style={{
          padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca",
          background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
        }}>
          🗑️ ลบวิชา
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", gap: 28, maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px" : "36px 24px", flexDirection: isMobile ? "column" : "row", alignItems: "flex-start" }}>
        
        {/* Sidebar ครู */}
        <aside style={{ width: isMobile ? "100%" : 280, flexShrink: 0, background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", position: isMobile ? "static" : "sticky", top: 88 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#10b981)", color: "#fff", fontSize: 32, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>{teacherInfo.initial}</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{teacherInfo.name}</h2>
          <span style={{ display: "inline-block", background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, marginBottom: 20 }}>
            👨‍🏫 คุณครูผู้สอนในระบบ
          </span>
          <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "0 0 18px" }} />
          <div style={{ textAlign: "left", marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, margin: "0 0 2px" }}>รายวิชาที่รับผิดชอบ</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#334155", margin: 0 }}>
              {loading ? "กำลังโหลด..." : `${myTeachingCourses.length} วิชา`}
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>วิชาที่ฉันรับผิดชอบ</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>รายชื่อวิชาเรียนที่เปิดสอนในระบบของอาจารย์</p>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>ชื่อรายวิชา</span>
              {!isMobile && <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginRight: 270 }}>รหัสวิชา</span>}
            </div>
            
            {loading ? (
              <p style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 14 }}>กำลังโหลดข้อมูลรายวิชา...</p>
            ) : myTeachingCourses.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 14 }}>ไม่พบวิชาที่ตรงกับชื่อผู้สอนท่านนี้ในฐานข้อมูล</p>
            ) : (
              myTeachingCourses.map((course, idx) => (
                <DesktopCourseRow key={course.id} course={course} idx={idx} />
              ))
            )}
          </div>
        </main>

      </div>
    </>
  );
}