/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react"; 
import { useParams, Link, useNavigate } from "react-router-dom";
import { courses } from "./data/courses/index";
import Swal from 'sweetalert2';
import { supabase } from "./supabaseClient"; 

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = courses.find(c => c.id === courseId);

  const [isLoggedIn] = useState(
    localStorage.getItem('isLoggedIn') === 'true'
  );
  const [registeredCourses, setRegisteredCourses] = useState([]);
  
  // 🔐 ระบบจัดการสิทธิ์ฝั่งคุณครูและลิงก์ไดนามิก
  const [userRole] = useState(localStorage.getItem("userRole") || "student"); 
  const [currentUsername] = useState(localStorage.getItem("userName") || "");
  
  // 📝 โครงสร้างรองรับข้อมูล ลิงก์ และหัวข้อบทเรียน รวมถึงลิงก์ติดต่อครู
  const [dbLessons, setDbLessons] = useState({}); // เก็บ { lesson_index: { url, title } }
  const [editLessons, setEditLessons] = useState({}); // ใช้เก็บค่าชั่วคราวตอนครูกำลังแก้ไข
  const [isEditing, setIsEditing] = useState(false); 
  
  // 📱 สถานะสำหรับจัดการหน้าจอมือถือ (Responsive)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  // ตรวจสอบขนาดหน้าจอตลอดเวลา
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // 1. ดึงสถานะการลงทะเบียนของนักเรียน
    const fetchRegisteredCourses = async () => {
      if (isLoggedIn && currentUsername && userRole === "student") {
        try {
          const { data, error } = await supabase
            .from("enrollments")
            .select("course_id")
            .eq("username", currentUsername);

          if (error) throw error;
          if (data) {
            const courseIds = data.map((item) => item.course_id);
            setRegisteredCourses(courseIds);
            localStorage.setItem('registeredCourses', JSON.stringify(courseIds));
          }
        } catch (err) {
          console.error("Error fetching enrollments:", err.message);
        }
      }
    };

    // 2. ดึงข้อมูลลิงก์, หัวข้อบทเรียน และ ลิงก์ติดต่อครู (lesson_number: 99 คือลิงก์ติดต่อครู)
    const fetchDynamicLessons = async () => {
      try {
        const { data, error } = await supabase
          .from("course_links")
          .select("lesson_number, url, title") 
          .eq("course_id", courseId);

        if (error) throw error;
        if (data) {
          const lessonsMap = {};
          data.forEach(item => {
            lessonsMap[item.lesson_number] = {
              url: item.url || "",
              title: item.title || ""
            };
          });
          setDbLessons(lessonsMap);
          setEditLessons(lessonsMap); 
        }
      } catch (err) {
        console.error("Error fetching dynamic lessons:", err.message);
      }
    };

    fetchRegisteredCourses();
    fetchDynamicLessons();
  }, [isLoggedIn, courseId, currentUsername, userRole]);

  if (!course) return <div style={{ padding: 100, textAlign: 'center', fontSize: 20 }}>ไม่พบรายวิชาที่ท่านต้องการ</div>;

  const isRegistered = registeredCourses.includes(course.id);
  const isTeacherOfThisCourse = userRole === "teacher"; 

  // ดึงข้อมูลการติดต่อครูประจำวิชา (ดึงทั้ง Title และ URL จากบทเรียนที่ 99)
  const teacherContactTitle = dbLessons[99]?.title || "ติดต่อสอบถามคุณครู";
  const teacherContactLink = dbLessons[99]?.url || "";

  // ฟังก์ชันเปิดลิงก์ติดต่อครู
  const handleContactTeacher = () => {
    if (teacherContactLink) {
      window.open(teacherContactLink, '_blank');
    } else {
      Swal.fire({
        title: "ไม่พบข้อมูลการติดต่อ",
        text: "คุณครูประจำวิชายังไม่ได้แนบช่องทางการติดต่อไว้ในระบบครับ",
        icon: "info",
        confirmButtonColor: course.color
      });
    }
  };

  // ฟังก์ชันสมัครเรียน
  const handleRegister = () => {
    if (!isLoggedIn) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเข้าสู่ระบบก่อน',
        text: 'คุณต้องเข้าสู่ระบบก่อนทำการลงทะเบียนเรียนวิชานี้',
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'ไปหน้าล็อกอิน',
        showCancelButton: true,
        cancelButtonText: 'ยกเลิก'
      }).then((result) => {
        if (result.isConfirmed) navigate('/login');
      });
      return;
    }

    Swal.fire({
      icon: 'question',
      title: 'ยืนยันการลงทะเบียนเรียน?',
      text: `คุณต้องการลงทะเบียนเรียนในรายวิชา "${course.subject}" ใช่หรือไม่?`,
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันลงทะเบียน',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        Swal.showLoading();
        if (!currentUsername) {
          Swal.fire({ icon: 'error', title: 'ไม่พบข้อมูลผู้ใช้', text: 'กรุณาล็อกอินใหม่อีกครั้ง' });
          return;
        }

        const { error } = await supabase
          .from("enrollments")
          .insert([{ username: currentUsername, course_id: course.id }]);

        if (error) {
          if (error.code === "23505") {
            if (!registeredCourses.includes(course.id)) {
              const updatedReg = [...registeredCourses, course.id];
              setRegisteredCourses(updatedReg);
              localStorage.setItem('registeredCourses', JSON.stringify(updatedReg));
            }
            Swal.fire("ลงทะเบียนซ้ำ", "คุณเคยลงทะเบียนรายวิชานี้ในระบบไปแล้วครับ", "info");
            return;
          }
          throw error;
        }

        const updatedReg = [...registeredCourses, course.id];
        setRegisteredCourses(updatedReg);
        localStorage.setItem('registeredCourses', JSON.stringify(updatedReg));

        Swal.fire({ icon: 'success', title: 'ลงทะเบียนสำเร็จ!', text: 'ยินดีต้อนรับเข้าสู่บทเรียน ข้อมูลบันทึกลงคลาวด์เรียบร้อยแล้วครับ', timer: 2000, showConfirmButton: false });
      } catch (error) {
        Swal.fire("การเชื่อมต่อขัดข้อง", `ไม่สามารถจัดเก็บข้อมูลได้: ${error.message}`, "error");
      }
    });
  };

  // 🔥 ฟังก์ชันสำหรับคุณครู: กดบันทึกอัปเดตลง Supabase ทั้งหมด
  const handleSaveChanges = async () => {
    try {
      Swal.showLoading();
      
      // 1. ดึงข้อมูลบทเรียนปกติ
      const upsertData = course.lessons.map((lesson, index) => ({
        course_id: course.id,
        lesson_number: index,
        url: editLessons[index]?.url || "",
        title: editLessons[index]?.title || lesson.title 
      }));

      // 2. แนบชุดข้อมูลพิเศษสำหรับช่องทางการติดต่อครู (ใช้เลขอ้างอิงพิเศษ lesson_number = 99)
      upsertData.push({
        course_id: course.id,
        lesson_number: 99,
        url: editLessons[99]?.url || "",
        title: editLessons[99]?.title || "ติดต่อสอบถามคุณครู"
      });

      const { error } = await supabase
        .from("course_links")
        .upsert(upsertData, { onConflict: 'course_id,lesson_number' });

      if (error) throw error;

      setDbLessons(editLessons);
      setIsEditing(false);
      Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลสำเร็จ', text: 'ข้อมูลรายวิชาและลิงก์ติดต่อได้รับการอัปเดตแล้ว', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด", `ไม่สามารถบันทึกข้อมูลได้: ${err.message}`, "error");
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'Sarabun', sans-serif" }}>
      {/* Top Bar Navigation */}
      <nav style={{ background: "#fff", padding: isMobile ? "12px 16px" : "15px 30px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
        <Link to="/courses" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14, fontWeight: "600", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: "8px", background: "#f1f5f9" }}>
          <span>←</span> ย้อนกลับ
        </Link>
        <span style={{ color: "#cbd5e1" }}>/</span>
        <span style={{ color: "#1e293b", fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.subject}</span>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "16px" : "30px 20px" }}>
        
        {/* Header Section */}
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: "#1e293b", marginBottom: 8, lineHeight: 1.3 }}>{course.subject}</h1>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 6 : 10 }}>
            <span style={{ background: `${course.color}15`, color: course.color, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {course.category.toUpperCase()}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>• สอนโดย {course.teacher}</span>
          </div>
        </header>

        {/* Grid Layout สำหรับแสดงเนื้อหาหลักและ Sidebar */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column-reverse" : "row", gap: 30, alignItems: "start" }}>
          
          {/* Main Content */}
          <main style={{ flex: 1, width: "100%", minWidth: 0 }}>
            {/* กล่องตรวจสอบสิทธิ์และสถานะ */}
            {userRole === "student" && !isRegistered ? (
              <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 24, padding: isMobile ? "40px 20px" : "60px 40px", textAlign: "center", color: "#fff", boxShadow: "0 20px 50px rgba(0,0,0,0.15)", marginBottom: 30 }}>
                <span style={{ fontSize: isMobile ? 40 : 50, marginBottom: 15, display: "block" }}>🔒</span>
                <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 10 }}>คุณยังไม่ได้ลงทะเบียนวิชานี้</h2>
                <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 25, maxWidth: 450, margin: "0 auto 25px", lineHeight: 1.5 }}>กรุณากดปุ่มลงทะเบียนเรียนด้านล่าง เพื่อเข้าใช้งานลิงก์บทเรียนและช่องทางการเรียนสดทั้งหมด</p>
                <button onClick={handleRegister} style={{ width: isMobile ? "100%" : "auto", padding: "14px 40px", borderRadius: 14, background: course.color, color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: `0 10px 25px ${course.color}55` }}>➕ กดลงทะเบียนเรียนที่นี่</button>
              </div>
            ) : userRole === "student" && isRegistered ? (
              <div style={{ background: "#000", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.1)", marginBottom: 30, position: "relative", paddingBottom: "56.25%", height: 0, width: "100%" }}>
                <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} src={course.videoUrl} title="YouTube Course Video" allowFullScreen></iframe>
              </div>
            ) : userRole === "teacher" && isTeacherOfThisCourse ? (
              <div style={{ background: "#f0fdf4", border: "1px dashed #22c55e", borderRadius: 24, padding: isMobile ? "20px" : "25px 30px", marginBottom: 30, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 16, width: "100%" }}>
                <div>
                  <h3 style={{ margin: 0, color: "#166534", fontSize: 15 }}>สวัสดีครับอาจารย์ {course.teacher} 👋</h3>
                  <p style={{ margin: "4px 0 0 0", color: "#15803d", fontSize: 13, lineHeight: 1.4 }}>คุณสามารถอัปเดตข้อมูลรายละเอียด ลิงก์ห้องเรียน และช่องทางติดต่อส่วนตัวของอาจารย์ได้ผ่านโหมดแก้ไขครับ</p>
                </div>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} style={{ width: isMobile ? "100%" : "auto", background: "#22c55e", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>⚙️ เริ่มแก้ไขบทเรียน/ลิงก์</button>
                ) : (
                  <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto" }}>
                    <button onClick={handleSaveChanges} style={{ flex: 1, background: "#16a34a", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>💾 บันทึกข้อมูล</button>
                    <button onClick={() => { setIsEditing(false); setEditLessons(dbLessons); }} style={{ flex: 1, background: "#64748b", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>ยกเลิก</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 24, padding: "20px 24px", marginBottom: 30, width: "100%" }}>
                <h3 style={{ margin: 0, color: "#334155", fontSize: 14 }}>👨‍🏫 โหมดผู้เข้าชม (คุณครูในระบบ)</h3>
                <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>สิทธิ์การแก้ไขข้อมูลเฉพาะสำหรับอาจารย์ผู้รับผิดชอบรายวิชานี้เท่านั้น</p>
              </div>
            )}

            {/* 📝 ส่วนกรอกข้อมูล "ช่องทางติดต่อครู" แบบมีทั้งชื่อปุ่มและลิงก์แยกกัน (แสดงผลเฉพาะเมื่อเปิดโหมดแก้ไข) */}
            {isEditing && isTeacherOfThisCourse && (
              <div style={{ background: "#fff", padding: isMobile ? "20px" : "30px", borderRadius: 24, border: "2px solid #22c55e", marginBottom: 25 }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#166534", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>📇 ช่องทางการติดต่อคุณครู ประจําวิชา</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>ชื่อช่องทางติดต่อ (จะปรากฏบนตัวปุ่ม):</label>
                    <input 
                      type="text"
                      value={editLessons[99]?.title ?? teacherContactTitle}
                      placeholder="ตัวอย่างเช่น: ติดต่อครูผ่าน Line / ทักแชท Facebook ครู"
                      onChange={(e) => setEditLessons({
                        ...editLessons,
                        99: { ...(editLessons[99] || { url: teacherContactLink }), title: e.target.value }
                      })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>ลิงก์สำหรับช่องทางติดต่อ:</label>
                    <input 
                      type="text"
                      value={editLessons[99]?.url ?? teacherContactLink}
                      placeholder="ตัวอย่างเช่น: https://line.me/ti/p/... หรือลิงก์เพจ"
                      onChange={(e) => setEditLessons({
                        ...editLessons,
                        99: { ...(editLessons[99] || { title: teacherContactTitle }), url: e.target.value }
                      })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* รายละเอียดเนื้อหาบทเรียน */}
            <section style={{ background: "#fff", padding: isMobile ? "24px 16px" : "40px", borderRadius: 24, border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 4, height: 20, background: course.color, borderRadius: 4 }}></span>1. เนื้อหาบทเรียน</h2>
                <p style={{ color: "#475569", lineHeight: 1.7, fontSize: 15, textAlign: "justify" }}>{course.content}</p>
              </div>
              
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 4, height: 20, background: course.color, borderRadius: 4 }}></span>2. คำอธิบายวิชาอย่างย่อ</h2>
                <p style={{ color: "#475569", lineHeight: 1.7, fontSize: 15, textAlign: "justify" }}>{course.description}</p>
              </div>
              
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 4, height: 20, background: course.color, borderRadius: 4 }}></span>3. ประโยชน์ที่ได้รับ</h2>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                  {course.benefits && course.benefits.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", padding: "12px 14px", borderRadius: 12, fontSize: 13, color: "#334155" }}>
                      <span style={{ color: course.color, fontWeight: "bold" }}>✓</span> {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* โซนตารางรายชื่อลิงก์บทเรียนย่อย */}
              <div style={{ marginTop: 20, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '15px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 14, margin: 0, color: '#1e293b', fontWeight: 700 }}>ช่องทางเข้าเรียนแต่ละบทเรียน</h3>
                  <span style={{ fontSize: 11, color: course.color, fontWeight: 600 }}>
                    {userRole === "teacher" ? (isTeacherOfThisCourse ? "โหมดผู้ดูแลวิชา" : "โหมดอ่านอย่างเดียว") : isRegistered ? "คลิกเพื่อเปิดลิงก์เรียน" : "🔒 ล็อกอยู่"}
                  </span>
                </div>
                <div style={{ padding: '5px 0' }}>
                  {course.lessons && course.lessons.map((lesson, index) => {
                    const activeTitle = dbLessons[index]?.title || lesson.title;
                    const activeLink = dbLessons[index]?.url || "";
                    const canAccess = isRegistered || userRole === "teacher";

                    return (
                      <div 
                        key={index}
                        onClick={() => {
                          if (isEditing || userRole === "teacher") return; 
                          if (isRegistered) {
                            if (activeLink) {
                              window.open(activeLink, '_blank');
                            } else {
                              Swal.fire("ไม่พบลิงก์", "บทนี้คุณครูยังไม่ได้แนบลิงก์เข้าเรียนไว้ครับ", "warning");
                            }
                          } else {
                            handleRegister();
                          }
                        }} 
                        style={{ 
                          display: 'flex', alignItems: 'center', padding: isMobile ? '16px' : '14px 20px', 
                          borderBottom: index === course.lessons.length - 1 ? 'none' : '1px solid #f1f5f9',
                          cursor: (isEditing || userRole === "teacher") ? 'default' : 'pointer', transition: 'all 0.2s', 
                          opacity: canAccess ? 1 : 0.6
                        }}
                        onMouseEnter={(e) => { if(!isEditing && userRole !== "teacher") { e.currentTarget.style.background = '#f0f9ff'; } }}
                        onMouseLeave={(e) => { if(!isEditing && userRole !== "teacher") { e.currentTarget.style.background = 'transparent'; } }}
                      >
                        <span style={{ marginRight: 12, color: course.color, fontSize: 16 }}>
                          {userRole === "teacher" ? "📝" : isRegistered ? "▶" : "🔒"}
                        </span>
                        
                        <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                          {isEditing && isTeacherOfThisCourse ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>ชื่อบทเรียน (ลำดับที่ {index + 1}):</label>
                              <input 
                                type="text"
                                value={editLessons[index]?.title ?? activeTitle}
                                placeholder="พิมพ์ชื่อบทเรียนใหม่ที่นี่..."
                                onClick={(e) => e.stopPropagation()} 
                                onChange={(e) => setEditLessons({
                                  ...editLessons,
                                  [index]: { ...(editLessons[index] || { url: activeLink }), title: e.target.value }
                                })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 500 }}
                              />
                              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginTop: 4 }}>ลิงก์เข้าเรียนประจำบท:</label>
                              <input 
                                type="text"
                                value={editLessons[index]?.url ?? activeLink}
                                placeholder="วางลิงก์ Zoom / Meet / Video ที่นี่..."
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setEditLessons({
                                  ...editLessons,
                                  [index]: { ...(editLessons[index] || { title: activeTitle }), url: e.target.value }
                                })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                              />
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: 14, color: '#334155', fontWeight: 500, lineHeight: 1.4 }}>{activeTitle}</div>
                              <div style={{ fontSize: 11, color: activeLink ? '#16a34a' : '#94a3b8', marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {activeLink ? `🔗 ลิงก์แนบ: ${activeLink}` : "ยังไม่ได้แนบลิงก์สำหรับห้องเรียนนี้"}
                              </div>
                            </>
                          )}
                        </div>

                        {!isEditing && userRole === "student" && (
                          <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: '#64748b', whiteSpace: "nowrap" }}>
                            {isRegistered ? "เข้าเรียน" : "ลงทะเบียน"}
                          </div>
                        )}
                        {!isEditing && userRole === "teacher" && activeLink && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.open(activeLink, '_blank'); }}
                            style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: "nowrap" }}
                          >
                            ทดสอบลิงก์
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </main>

          {/* Sidebar ข้อมูลผู้สอน */}
          <aside style={{ width: isMobile ? "100%" : "350px", position: isMobile ? "static" : "sticky", top: 100, flexShrink: 0 }}>
            <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: isMobile ? "20px" : "30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              
              {/* 📸 ส่วนที่ 1: รูปภาพครูแบบกดดูรูปใหญ่ขยายได้ (Lightbox) */}
              {/* 📸 แก้ไขตรงจุดนี้ในไฟล์ CourseDetail.jsx */}
<img 
  src={course.avatar} 
  style={{ 
    width: 120, height: 155, borderRadius: 12, objectFit: "cover", 
    border: `1px solid #e2e8f0`, boxShadow: "0 10px 20px rgba(0,0,0,0.05)", 
    marginBottom: 16, cursor: "pointer", transition: "transform 0.2s" 
  }} 
  alt="Teacher"
  onClick={() => {
    Swal.fire({
      imageUrl: course.avatar,
      imageAlt: `รูปภาพอาจารย์ ${course.teacher}`,
      
      // 📐 เพิ่ม 2 บรรทัดนี้เข้าไปเพื่อควบคุมขนาดรูปตอน Pop-up ครับ
      imageWidth: 240,   // ปรับความกว้างตามใจชอบ (หน่วยเป็น Pixel)
      imageHeight: 310,  // ปรับความสูงให้สมส่วนกับรูปเดิมของคุณครู (120x155 อัตราส่วนเท่ากับ 240x310)
      
      title: `อาจารย์ ${course.teacher}`,
      confirmButtonColor: course.color,
      confirmButtonText: 'ปิดหน้าต่าง'
    });
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
/>
              
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: "0 0 4px 0" }}>{course.teacher}</h3>
              <p style={{ color: course.color, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>อาจารย์ประจำสาขาวิชา</p>
              <div style={{ background: "#f1f5f9", padding: "16px 20px", borderRadius: 16, fontSize: 13, color: "#64748b", lineHeight: 1.6, fontStyle: "italic", width: "100%" }}>
                "{course.teacherBio}"
              </div>
              
              {/* 📞 ส่วนที่ 2: ปุ่มติดต่อครูประจำวิชา (ดึงข้อความปุ่มและลิงก์ไดนามิกตามที่บันทึกไว้ในโมดอล) */}
              <button 
                onClick={handleContactTeacher}
                style={{ 
                  width: "100%", 
                  marginTop: 20, 
                  padding: "14px", 
                  borderRadius: 14, 
                  background: teacherContactLink ? course.color : "#cbd5e1", 
                  color: "#fff", 
                  border: "none", 
                  fontWeight: 700, 
                  fontSize: 14, 
                  cursor: "pointer", 
                  boxShadow: teacherContactLink ? `0 10px 20px ${course.color}33` : "none",
                  transition: "all 0.2s"
                }}
              >
                {teacherContactLink ? `📞 ${teacherContactTitle}` : "🚫 ยังไม่มีช่องทางติดต่อ"}
              </button>
            </div>
          </aside>

        </div>
      </div>
    </div>
  ); 
}