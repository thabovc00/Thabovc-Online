/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react"; 
import { useParams, Link, useNavigate } from "react-router-dom";
import { courses } from "./data/courses/index";
import Swal from 'sweetalert2';
import { supabase } from "./supabaseClient"; // 🔥 🔥 นำเข้าตัวเชื่อมต่อ Supabase

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = courses.find(c => c.id === courseId);

  // eslint-disable-next-line no-unused-vars
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isLoggedIn') === 'true'
  );
  const [registeredCourses, setRegisteredCourses] = useState([]);

  // 🔄 ของใหม่: ดึงรายวิชาที่เด็กเคยลงทะเบียนไว้จากตาราง enrollments ใน Supabase เพื่อตรวจสอบสถานะปุ่มและล็อกวิดีโอ
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchRegisteredCourses = async () => {
      const currentUsername = localStorage.getItem("userName") || "";
      if (isLoggedIn && currentUsername) {
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
          console.error("Error fetching enrollments from Supabase:", err.message);
        }
      }
    };

    fetchRegisteredCourses();
  }, [isLoggedIn]);

  if (!course) return <div style={{ padding: 100, textAlign: 'center', fontSize: 20 }}>ไม่พบรายวิชาที่ท่านต้องการ</div>;

  const isRegistered = registeredCourses.includes(course.id);

  // 📝 ของใหม่: ฟังก์ชันลงทะเบียนเรียนในหน้าดีเทลผ่าน Supabase
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

        const currentUsername = localStorage.getItem("userName") || "";

        if (!currentUsername) {
          Swal.fire({
            icon: 'error',
            title: 'ไม่พบข้อมูลผู้ใช้',
            text: 'กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้ง',
            confirmButtonColor: '#2563eb'
          });
          return;
        }

        // 🔥 ยิงบันทึกข้อมูลแนวตั้งลงตาราง enrollments ของ Supabase ตรงๆ
        const { error } = await supabase
          .from("enrollments")
          .insert([
            { 
              username: currentUsername, 
              course_id: course.id 
            }
          ]);

        // 💡 เช็คกรณีถ้าเกิด Error จาก Unique Constraint (ถ้าคุณทำเผื่อไว้ว่าเด็กห้ามลงซ้ำบน Database)
        if (error) {
          if (error.code === "23505") { // รหัส Error ทั่วไปของ Postgres กรณีข้อมูลซ้ำ (Unique violation)
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

        // อัปเดตสถานะหน้าจอทันทีเมื่อสำเร็จ เพื่อปลดล็อก iframe วิดีโอทันที
        const updatedReg = [...registeredCourses, course.id];
        setRegisteredCourses(updatedReg);
        localStorage.setItem('registeredCourses', JSON.stringify(updatedReg));

        Swal.fire({
          icon: 'success',
          title: 'ลงทะเบียนสำเร็จ!',
          text: 'ยินดีต้อนรับเข้าสู่บทเรียน ข้อมูลบันทึกลงคลาวด์เรียบร้อยแล้วครับ',
          timer: 2000,
          showConfirmButton: false
        });

      } catch (error) {
        console.error("❌ Supabase Enrollment error:", error);
        Swal.fire("การเชื่อมต่อขัดข้อง", `ไม่สามารถจัดเก็บข้อมูลได้: ${error.message}`, "error");
      }
    });
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'Sarabun', sans-serif" }}>
      {/* Top Bar Navigation */}
      <nav style={{ background: "#fff", padding: "15px 30px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 15 }}>
        <Link to="/courses" style={{ color: "#64748b", textDecoration: "none", fontSize: 14 }}>ย้อนกลับ</Link>
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
            {isRegistered ? (
              <div style={{ 
                background: "#000", borderRadius: 24, overflow: "hidden", 
                boxShadow: "0 20px 50px rgba(0,0,0,0.1)", marginBottom: 30,
                position: "relative", paddingBottom: "56.25%", height: 0
              }}>
                <iframe 
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  src={course.videoUrl}
                  title="YouTube Course Video"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                borderRadius: 24, padding: "60px 40px", textAlign: "center", color: "#fff",
                boxShadow: "0 20px 50px rgba(0,0,0,0.15)", marginBottom: 30
              }}>
                <span style={{ fontSize: 50, marginBottom: 15, display: "block" }}>🔒</span>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>คุณยังไม่ได้ลงทะเบียนวิชานี้</h2>
                <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 25, maxWidth: 450, margin: "0 auto 25px" }}>
                  กรุณากดปุ่มลงทะเบียนเรียนด้านล่าง เพื่อเปิดเข้าชมวิดีโอแนะนำรายวิชาและเข้าสู่เนื้อหาบทเรียนทั้งหมด
                </p>
                <button 
                  onClick={handleRegister}
                  style={{ 
                    padding: "14px 40px", borderRadius: 14, background: course.color, 
                    color: "#fff", border: "none", fontWeight: 700, fontSize: 16, 
                    cursor: "pointer", boxShadow: `0 10px 25px ${course.color}55`, transition: "all 0.2s"
                  }}
                >
                  ➕ กดลงทะเบียนเรียนที่นี่
                </button>
              </div>
            )}

            {/* Content Details */}
            <section style={{ background: "#fff", padding: 40, borderRadius: 24, border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 4, height: 24, background: course.color, borderRadius: 4 }}></span>
                  1. เนื้อหาบทเรียน
                </h2>
                <p style={{ color: "#475569", lineHeight: 1.8, fontSize: 16 }}>{course.content}</p>
              </div>

              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 4, height: 24, background: course.color, borderRadius: 4 }}></span>
                  2. คำอธิบายวิชาอย่างย่อ
                </h2>
                <p style={{ color: "#475569", lineHeight: 1.8, fontSize: 16 }}>{course.description}</p>
              </div>

              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 15, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 4, height: 24, background: course.color, borderRadius: 4 }}></span>
                  3. ประโยชน์ที่ได้รับ
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                  {course.benefits && course.benefits.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", padding: "12px 16px", borderRadius: 12, fontSize: 14, color: "#334155" }}>
                      <span style={{ color: course.color, fontWeight: "bold" }}>✓</span> {b}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 16, margin: 0, color: '#1e293b', fontWeight: 700 }}>เนื้อหาบทเรียน</h3>
                  <span style={{ fontSize: 12, color: course.color, fontWeight: 600 }}>{isRegistered ? "คลิกเพื่อเข้าเรียน" : "🔒 ต้องลงทะเบียนก่อน"}</span>
                </div>
                <div style={{ padding: '5px 0' }}>
                  {course.lessons && course.lessons.map((lesson, index) => (
                    <div 
                      key={index}
                      onClick={() => {
                        if (isRegistered) {
                          window.open(lesson.link, '_blank');
                        } else {
                          handleRegister();
                        }
                      }} 
                      style={{ 
                        display: 'flex', alignItems: 'center', padding: '14px 20px', 
                        borderBottom: index === course.lessons.length - 1 ? 'none' : '1px solid #f1f5f9',
                        cursor: 'pointer', transition: 'all 0.2s', opacity: isRegistered ? 1 : 0.6
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.paddingLeft = '25px'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '20px'; }}
                    >
                      <span style={{ marginRight: 15, color: course.color, fontSize: 18 }}>{isRegistered ? "▶" : "🔒"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{lesson.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Video • {lesson.duration} นาที</div>
                      </div>
                      <div style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 8, fontSize: 11, color: '#64748b' }}>
                        {isRegistered ? "เข้าเรียน" : "ลงทะเบียนก่อน"}
                      </div>
                    </div>
                  ))}
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