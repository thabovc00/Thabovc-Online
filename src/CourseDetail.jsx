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
  
  // 📝 เปลี่ยนโครงสร้างมารองรับทั้งข้อมูล ลิงก์ และ หัวข้อบทเรียน (Title)
  const [dbLessons, setDbLessons] = useState({}); // เก็บ { lesson_index: { url, title } } จาก Supabase
  const [editLessons, setEditLessons] = useState({}); // ใช้เก็บค่าชั่วคราวตอนครูกำลังพิมพ์แก้ไข (ทั้งสองฟิลด์)
  const [isEditing, setIsEditing] = useState(false); // เปิด-ปิด โหมดแก้ไขสำหรับครู

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

    // 2. ดึงข้อมูลลิงก์และหัวข้อบทเรียนที่อัปเดตล่าสุดจากคลาวด์
    const fetchDynamicLessons = async () => {
      try {
        // ดึงฟิลด์ title เพิ่มเติมมาจากตาราง course_links
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
              title: item.title || "" // รองรับกรณีที่ใน DB ยังเป็นค่าว่างเปล่า
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

  // 🔥 ฟังก์ชันสำหรับคุณครู: กดบันทึกอัปเดตทั้งลิงก์และหัวข้อบทเรียนลง Supabase
  const handleSaveChanges = async () => {
    try {
      Swal.showLoading();
      
      const upsertData = course.lessons.map((lesson, index) => ({
        course_id: course.id,
        lesson_number: index,
        url: editLessons[index]?.url || "",
        // ถ้าคุณครูแก้ไขให้ใช้ค่าใหม่ ถ้าไม่ได้แก้หรือเป็นค่าว่างให้ใช้ค่า Default จากไฟล์ Static (lesson.title)
        title: editLessons[index]?.title || lesson.title 
      }));

      const { error } = await supabase
        .from("course_links")
        .upsert(upsertData, { onConflict: 'course_id,lesson_number' });

      if (error) throw error;

      setDbLessons(editLessons);
      setIsEditing(false);
      Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลสำเร็จ', text: 'บทเรียนและลิงก์ห้องเรียนถูกอัปเดตเรียบร้อยแล้ว', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire("เกิดข้อผิดพลาด", `ไม่สามารถบันทึกข้อมูลได้: ${err.message}`, "error");
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'Sarabun', sans-serif" }}>
      {/* Top Bar Navigation */}
      <nav style={{ background: "#fff", padding: "15px 30px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 15 }}>
        <Link to="/courses" style={{ color: "#2563eb", textDecoration: "none", fontSize: 15, fontWeight: "600", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: "8px", background: "#f1f5f9" }}>
          <span>←</span> ย้อนกลับ
        </Link>
        <span style={{ color: "#cbd5e1" }}>/</span>
        <span style={{ color: "#1e293b", fontWeight: 600, fontSize: 14 }}>{course.subject}</span>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 20px" }}>
        
        {/* Header Section */}
        <header style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>{course.subject}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: `${course.color}15`, color: course.color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {course.category.toUpperCase()}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>• สอนโดย {course.teacher}</span>
          </div>
        </header>

        <div className="course-grid" style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 30, alignItems: "start" }}>
          
          {/* Main Content (Left) */}
          <main>
            {/* 🔄 กล่องแสดงผลตามบทบาทและสิทธิ์การเข้าถึง */}
            {userRole === "student" && !isRegistered ? (
              <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 24, padding: "60px 40px", textAlign: "center", color: "#fff", boxShadow: "0 20px 50px rgba(0,0,0,0.15)", marginBottom: 30 }}>
                <span style={{ fontSize: 50, marginBottom: 15, display: "block" }}>🔒</span>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>คุณยังไม่ได้ลงทะเบียนวิชานี้</h2>
                <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 25, maxWidth: 450, margin: "0 auto 25px" }}>กรุณากดปุ่มลงทะเบียนเรียนด้านล่าง เพื่อเข้าใช้งานลิงก์บทเรียนและช่องทางการเรียนสดทั้งหมด</p>
                <button onClick={handleRegister} style={{ padding: "14px 40px", borderRadius: 14, background: course.color, color: "#fff", border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: `0 10px 25px ${course.color}55` }}>➕ กดลงทะเบียนเรียนที่นี่</button>
              </div>
            ) : userRole === "student" && isRegistered ? (
              <div style={{ background: "#000", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.1)", marginBottom: 30, position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} src={course.videoUrl} title="YouTube Course Video" allowFullScreen></iframe>
              </div>
            ) : userRole === "teacher" && isTeacherOfThisCourse ? (
              <div style={{ background: "#f0fdf4", border: "1px dashed #22c55e", borderRadius: 24, padding: "25px 30px", marginBottom: 30, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, color: "#166534", fontSize: 16 }}>สวัสดีครับอาจารย์ {course.teacher} 👋</h3>
                  <p style={{ margin: "4px 0 0 0", color: "#15803d", fontSize: 13 }}>คุณล็อกอินอยู่ในฐานะผู้ดูแลวิชานี้ สามารถอัปเดตหัวข้อบทเรียนและลิงก์ห้องเรียนสดได้ทันที</p>
                </div>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} style={{ background: "#22c55e", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>⚙️ เริ่มแก้ไขบทเรียน/ลิงก์</button>
                ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleSaveChanges} style={{ background: "#16a34a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>💾 บันทึกข้อมูล</button>
                    <button onClick={() => { setIsEditing(false); setEditLessons(dbLessons); }} style={{ background: "#64748b", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 24, padding: "20px 30px", marginBottom: 30 }}>
                <h3 style={{ margin: 0, color: "#334155", fontSize: 15 }}>👨‍🏫 โหมดผู้เข้าชม (คุณครูในระบบ)</h3>
                <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: 13 }}>คุณสามารถเข้าชมลิงก์การเรียนการสอนของวิชานี้ได้ตามปกติ (สิทธิ์การแก้ไขเฉพาะอาจารย์ประจำวิชาเท่านั้น)</p>
              </div>
            )}

            {/* Content Details */}
            <section style={{ background: "#fff", padding: 40, borderRadius: 24, border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 4, height: 24, background: course.color, borderRadius: 4 }}></span>1. เนื้อหาบทเรียน</h2>
                <p style={{ color: "#475569", lineHeight: 1.8, fontSize: 16 }}>{course.content}</p>
              </div>
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 4, height: 24, background: course.color, borderRadius: 4 }}></span>2. คำอธิบายวิชาอย่างย่อ</h2>
                <p style={{ color: "#475569", lineHeight: 1.8, fontSize: 16 }}>{course.description}</p>
              </div>
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 4, height: 24, background: course.color, borderRadius: 4 }}></span>3. ประโยชน์ที่ได้รับ</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                  {course.benefits && course.benefits.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", padding: "12px 16px", borderRadius: 12, fontSize: 14, color: "#334155" }}>
                      <span style={{ color: course.color, fontWeight: "bold" }}>✓</span> {b}
                    </div>
                  ))}
                </div>
              </div>

              {/* 📝 โซนรายชื่อบทเรียน */}
              <div style={{ marginTop: 20, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 16, margin: 0, color: '#1e293b', fontWeight: 700 }}>ช่องทางเข้าเรียนแต่ละบทเรียน</h3>
                  <span style={{ fontSize: 12, color: course.color, fontWeight: 600 }}>
                    {userRole === "teacher" ? (isTeacherOfThisCourse ? "โหมดผู้ดูแลวิชา" : "โหมดอ่านอย่างเดียว") : isRegistered ? "คลิกเพื่อเปิดลิงก์เรียน" : "🔒 ล็อกอยู่"}
                  </span>
                </div>
                <div style={{ padding: '5px 0' }}>
                  {course.lessons && course.lessons.map((lesson, index) => {
                    // ดึงข้อมูลเวอร์ชันล่าสุดจากฐานข้อมูล (ถ้าไม่มีให้ Fallback ไปใช้หัวข้อดั้งเดิมจากไฟล์ด่วน)
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
                          display: 'flex', alignItems: 'center', padding: '14px 20px', 
                          borderBottom: index === course.lessons.length - 1 ? 'none' : '1px solid #f1f5f9',
                          cursor: (isEditing || userRole === "teacher") ? 'default' : 'pointer', transition: 'all 0.2s', 
                          opacity: canAccess ? 1 : 0.6
                        }}
                        onMouseEnter={(e) => { if(!isEditing && userRole !== "teacher") { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.paddingLeft = '25px'; } }}
                        onMouseLeave={(e) => { if(!isEditing && userRole !== "teacher") { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '20px'; } }}
                      >
                        <span style={{ marginRight: 15, color: course.color, fontSize: 18 }}>
                          {userRole === "teacher" ? "📝" : isRegistered ? "▶" : "🔒"}
                        </span>
                        
                        <div style={{ flex: 1, marginRight: 15 }}>
                          {/* ⚙️ สลับการแสดงหัวข้อบทเรียนเป็น Input ฟิลด์เมื่ออยู่ในโหมดแก้ไข */}
                          {isEditing && isTeacherOfThisCourse ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {/* ช่องแก้ไขชื่อบทเรียน */}
                              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>ชื่อบทเรียน (ลำดับที่ {index + 1}):</label>
                              <input 
                                type="text"
                                value={editLessons[index]?.title ?? activeTitle}
                                placeholder="พิมพ์ชื่อบทเรียนใหม่ที่นี่..."
                                onChange={(e) => setEditLessons({
                                  ...editLessons,
                                  [index]: { ...(editLessons[index] || { url: activeLink }), title: e.target.value }
                                })}
                                style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 500 }}
                              />
                              {/* ช่องแก้ไข Link */}
                              <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginTop: 4 }}>ลิงก์เข้าเรียนประจำบท:</label>
                              <input 
                                type="text"
                                value={editLessons[index]?.url ?? activeLink}
                                placeholder="วางลิงก์ Zoom / Meet / Video ที่นี่..."
                                onChange={(e) => setEditLessons({
                                  ...editLessons,
                                  [index]: { ...(editLessons[index] || { title: activeTitle }), url: e.target.value }
                                })}
                                style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                              />
                            </div>
                          ) : (
                            <>
                              {/* โหมดแสดงผลปกติ (Read-only) */}
                              <div style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{activeTitle}</div>
                              <div style={{ fontSize: 11, color: activeLink ? '#16a34a' : '#94a3b8', marginTop: 2 }}>
                                {activeLink ? `🔗 ลิงก์แนบ: ${activeLink.substring(0, 60)}${activeLink.length > 60 ? '...' : ''}` : "ยังไม่ได้แนบลิงก์สำหรับห้องเรียนนี้"}
                              </div>
                            </>
                          )}
                        </div>

                        {userRole === "student" && (
                          <div style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 8, fontSize: 11, color: '#64748b' }}>
                            {isRegistered ? "เข้าเรียน" : "ลงทะเบียนก่อน"}
                          </div>
                        )}
                        {userRole === "teacher" && activeLink && !isEditing && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.open(activeLink, '_blank'); }}
                            style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
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

          {/* Sidebar (Right) */}
          <aside style={{ position: "sticky", top: 100 }}>
            <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: 30, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src={course.avatar} style={{ width: 140, height: 180, borderRadius: 12, objectFit: "cover", border: `1px solid #e2e8f0`, boxShadow: "0 10px 20px rgba(0,0,0,0.05)", marginBottom: 20 }} alt="Teacher" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 5px 0" }}>{course.teacher}</h3>
              <p style={{ color: course.color, fontSize: 13, fontWeight: 600, marginBottom: 20 }}>อาจารย์ประจำสาขาวิชา</p>
              <div style={{ background: "#f1f5f9", padding: 20, borderRadius: 16, fontSize: 13, color: "#64748b", lineHeight: 1.6, fontStyle: "italic" }}>
                "{course.teacherBio}"
              </div>
              <button style={{ width: "100%", marginTop: 25, padding: "14px", borderRadius: 14, background: course.color, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 10px 20px ${course.color}33` }}>
                ติดต่อสอบถามคุณครู
              </button>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}