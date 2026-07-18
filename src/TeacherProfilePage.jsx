/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Swal from "sweetalert2";
import { supabase } from "./supabaseClient";

export default function TeacherProfilePage() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const [teacherInfo, setTeacherInfo] = useState({
    name: "คุณครู LearnHub", 
    initial: "T", 
    username: "",
    major: "ช่างยนต์",
    avatarUrl: ""
  });
  const [myTeachingCourses, setMyTeachingCourses] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบขนาดหน้าจอสำหรับการแสดงผลแบบ Mobile
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ฟังก์ชันลบข้อมูลเซสชันเพื่อออกจากระบบ
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "ออกจากระบบ?",
      text: "คุณต้องการออกจากระบบการทำงานใช่หรือไม่?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      localStorage.clear(); // เคลียร์ค่าทั้งหมดในเครื่อง
      await Swal.fire({
        title: "ออกจากระบบสำเร็จ",
        icon: "success",
        timer: 1200,
        showConfirmButton: false
      });
      navigate("/"); // ส่งกลับไปหน้าแรก/หน้าล็อกอิน
    }
  };

  // ฟังก์ชันแสดงป๊อปอัปดูรูปโปรไฟล์ขนาดใหญ่
  const handlePreviewAvatar = () => {
    if (!teacherInfo.avatarUrl) return;
    
    Swal.fire({
      imageUrl: teacherInfo.avatarUrl,
      imageAlt: "Teacher Profile Large",
      showConfirmButton: false,
      showCloseButton: true,
      background: "rgba(255, 255, 255, 0.95)",
      backdrop: `rgba(0,0,0,0.8)`,
      customClass: {
        image: "rounded-profile-preview"
      }
    });
  };

  // ดึงข้อมูลรายวิชาที่คุณครูรับผิดชอบ
  const fetchTeacherCourses = useCallback(async (username) => {
    if (!username) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("course_teachers")
        .select("*")
        .eq("username", username);

      if (error) throw error;

      if (data) {
        const formattedCourses = data.map((item) => {
          const rawId = item.course_id ? String(item.course_id) : "";
          let subjectCode = rawId;
          let subjectName = rawId;

          if (rawId.includes("-")) {
            const parts = rawId.split("-");
            subjectCode = parts.slice(0, 2).join("-");
            const rawName = parts.slice(2).join(" ");
            subjectName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : rawId;
          }

          return {
            id: rawId,
            subject: subjectName,
            subjectCode: subjectCode,
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
  }, []);

  // ดึงข้อมูลโปรไฟล์สดจากตาราง teachers
  useEffect(() => {
    if (!isLoggedIn) { 
      navigate("/"); 
      return; 
    }

    const fetchLiveTeacherProfile = async () => {
      try {
        const localUsername = localStorage.getItem("userName") || "";
        if (!localUsername) return;

        const { data: teacherData, error } = await supabase
          .from("teachers")
          .select("*")
          .eq("username", localUsername.trim())
          .maybeSingle();

        if (error) throw error;

        if (teacherData) {
          const fName = teacherData.first_name || "";
          const lName = teacherData.last_name || "";
          const fullName = `${fName} ${lName}`.trim();
          const rawAvatarUrl = teacherData.avatar_url || "";

          setTeacherInfo({
            name: fullName || "คุณครูผู้ดูแลระบบ",
            initial: fName ? fName.charAt(0) : "เ",
            username: localUsername.trim(),
            major: teacherData.category || "ช่างยนต์", 
            avatarUrl: rawAvatarUrl 
          });

          fetchTeacherCourses(localUsername.trim());
        }
      } catch (err) {
        console.error("Error fetching live profile:", err.message);
        setLoading(false);
      }
    };

    fetchLiveTeacherProfile();
  }, [isLoggedIn, navigate, fetchTeacherCourses]);

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

        await Swal.fire({
          title: "ลบสำเร็จ!",
          text: "ลบรายวิชาออกจากระบบเรียบร้อยแล้ว",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });

        fetchTeacherCourses(teacherInfo.username);
      } catch (err) {
        console.error("Error deleting course:", err.message);
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถลบวิชาได้",
          icon: "error"
        });
      }
    }
  };

  // เช็คเงื่อนไขว่าเป็น ID saywang01 หรือ อีเมลแอดมินกลาง ของวิทยาลัยหรือไม่
  const isAuthorizedManager = teacherInfo.username === "saywang01" || localStorage.getItem("userEmail") === "admin@thabovc.ac.th";

  return (
    <>
      {/* แทรก Style ย่อยสำหรับทำให้รูป Preview ใน SweetAlert กลมสวยงาม */}
      <style>{`
        .rounded-profile-preview {
          border-radius: 16px !important;
          max-height: 70vh !important;
          object-fit: contain !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important;
        }
      `}</style>

      <Navbar />
      <div style={{ display: "flex", gap: 28, maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px" : "36px 24px", flexDirection: isMobile ? "column" : "row", alignItems: "flex-start" }}>
        
        {/* Sidebar ครู */}
        <aside style={{ width: isMobile ? "100%" : 280, flexShrink: 0, background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", position: isMobile ? "static" : "sticky", top: 88 }}>
          
          {/* ส่วนการแสดงผลรูปภาพโปรไฟล์จริง */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            {teacherInfo.avatarUrl ? (
              <div 
                onClick={handlePreviewAvatar}
                title="คลิกเพื่อดูรูปใหญ่"
                style={{ position: "relative", width: 88, height: 88, cursor: "pointer", transition: "transform 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <img 
                  src={teacherInfo.avatarUrl} 
                  alt="Profile" 
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "3px solid #16a34a", display: "block" }} 
                />
                <div style={{ position: "absolute", bottom: 0, right: 0, background: "#16a34a", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, border: "2px solid #fff" }}>
                  🔍
                </div>
              </div>
            ) : (
              <div 
                style={{ 
                  width: 88, height: 88, borderRadius: "50%", 
                  background: "linear-gradient(135deg,#16a34a,#10b981)", 
                  color: "#fff", fontSize: 32, fontWeight: 700, 
                  display: "flex", alignItems: "center", justifyContent: "center" 
                }}
              >
                {teacherInfo.initial}
              </div>
            )}
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{teacherInfo.name}</h2>
          <span style={{ display: "inline-block", background: "#f0fdf4", color: "#16a34a", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, marginBottom: 20 }}>
            👨‍🏫 คุณครูผู้สอนในระบบ
          </span>
          <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "0 0 18px" }} />
          
          <div style={{ textAlign: "left", marginBottom: 14, background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, margin: "0 0 2px" }}>สาขา / แผนกวิชา</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 12px 0" }}>⚡ {teacherInfo.major}</p>

            <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, margin: "0 0 2px" }}>รายวิชาที่รับผิดชอบ</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#334155", margin: 0 }}>
              📚 {loading ? "กำลังโหลด..." : `${myTeachingCourses.length} วิชา`}
            </p>
          </div>

          {/* 🛠️ ปุ่มลิงก์ไปตารางเรียนหลัก: จะแสดงผลให้เห็นเฉพาะไอดี saywang01 หรือ admin เท่านั้น */}
          {isAuthorizedManager && (
            <button
              onClick={() => navigate("/schedule")} // สมมุติว่า Route หน้าตารางเรียนคุณตั้งชื่อว่า /schedule
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "10px",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.2)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#15803d";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#16a34a";
              }}
            >
              📅 จัดการตารางเรียนกลาง
            </button>
          )}

          {/* 🚪 ปุ่มออกจากระบบ */}
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "#fff",
              color: "#ef4444",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef2f2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
          >
            🚪 ออกจากระบบ
          </button>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>วิชาที่ฉันรับผิดชอบ</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>รายชื่อวิชาเรียนที่เปิดสอนในระบบของอาจารย์</p>
          </div>

          <div style={{ background: isMobile ? "transparent" : "#fff", borderRadius: 16, border: isMobile ? "none" : "1px solid #e2e8f0", overflow: "hidden" }}>
            {!isMobile && (
              <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "minmax(0,2fr) 120px 240px", gap: 12 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>ชื่อรายวิชา</span>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>รหัสวิชา</span>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textAlign: "right" }}>เครื่องมือจัดการ</span>
              </div>
            )}
            
            {loading ? (
              <p style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 14, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>กำลังโหลดข้อมูลรายวิชา...</p>
            ) : myTeachingCourses.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontSize: 14, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>ไม่พบวิชาที่ตรงกับชื่อผู้สอนท่านนี้ในฐานข้อมูล</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 0 }}>
                {myTeachingCourses.map((course, idx) => {
                  if (isMobile) {
                    return (
                      <div key={course.id} style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", borderRadius: 6 }}>
                            {course.subjectCode}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: "0 0 14px 0", lineHeight: 1.4 }}>
                          {course.subject}
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button onClick={() => navigate(`/course/${course.id}`)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            ⚙️ จัดการบทเรียน
                          </button>
                          <button onClick={() => handleDeleteCourse(course.id)} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            🗑️ ลบวิชา
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={course.id} style={{
                      display: "grid", gridTemplateColumns: "minmax(0,2fr) 120px 240px",
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
                        <button onClick={() => navigate(`/course/${course.id}`)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#16a34a", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                          ⚙️ จัดการบทเรียน
                        </button>
                        <button onClick={() => handleDeleteCourse(course.id)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                          🗑️ ลบวิชา
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

      </div>
    </>
  );
}