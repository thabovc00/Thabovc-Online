// src/CoursesPage.jsx
import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import { courses, categories, levels } from "./data/courses"; 
import Navbar from "./components/Navbar";
import Swal from "sweetalert2"; // สำหรับใช้แสดง Alert ตอนกดลงทะเบียนด่วน
import { supabase } from "./supabaseClient"; // 🔥 นำเข้าตัวเชื่อมต่อ Supabase ของเรา

export default function CoursesPage() {
  const navigate = useNavigate(); 
  
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userLevel = localStorage.getItem('userLevel') || ""; 
  const username = localStorage.getItem('userName') || ""; 

  const [activeCategory, setActiveCategory] = useState("all");
  const [activeLevel, setActiveLevel] = useState(isLoggedIn ? userLevel : "all"); 
  const [hoveredId, setHoveredId] = useState(null);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(null); // เก็บ ID วิชาที่กำลังกดลงทะเบียนแบบด่วน

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [activeCategory, activeLevel, search]);

  // 🔄 ของใหม่: ดึงรายวิชาที่เด็กคนนี้เคยลงทะเบียนไว้จากตาราง enrollments ใน Supabase
  useEffect(() => {
    const fetchRegisteredCourses = async () => {
      if (isLoggedIn && username) {
        try {
          const { data, error } = await supabase
            .from("enrollments")
            .select("course_id")
            .eq("username", username); // เช็คเฉพาะแถวที่เป็นของเด็กคนนี้

          if (error) throw error;

          if (data) {
            // แปลงรูปแบบจากข้อมูล [{course_id: "health-safety"}] ให้เป็นรูปแบบ Array สั้นๆ ["health-safety"]
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
  }, [isLoggedIn, username]);

  // 📝 ของใหม่: ฟังก์ชันสำหรับการลงทะเบียนเรียนด่วนลง Supabase
  const handleQuickRegister = async (e, course) => {
    e.stopPropagation(); // หยุดการกระจาย Event ไม่ให้ทะลุไปโดนคลิกของการ์ด

    if (!isLoggedIn) {
      Swal.fire("กรุณาเข้าสู่ระบบ", "โปรดเข้าสู่ระบบก่อนทำการลงทะเบียนเรียนครับ", "warning");
      return;
    }

    Swal.fire({
      icon: "question",
      title: "ยืนยันการลงทะเบียน?",
      html: `คุณต้องการลงทะเบียนเรียนในรายวิชา<br><b>${course.subject}</b> ใช่หรือไม่?`,
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ยืนยันลงทะเบียน",
      cancelButtonText: "ยกเลิก"
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      setIsSubmitting(course.id);
      try {
        // 🔥 ยิงบันทึกข้อมูลลงตาราง enrollments ของ Supabase โดยตรง (บันทึกแบบแนวตั้ง)
        const { error } = await supabase
          .from("enrollments")
          .insert([{ 
  username: username,
  course_id: course.id,
  student_id: localStorage.getItem('userFirstName') + ' ' + localStorage.getItem('userLastName'),
}]);

        if (error) throw error;

        // ถ้าบันทึกสำเร็จ -> อัปเดตสถานะที่หน้าจอและใน LocalStorage ทันที
        const updatedReg = [...registeredCourses, course.id];
        setRegisteredCourses(updatedReg);
        localStorage.setItem('registeredCourses', JSON.stringify(updatedReg));
        
        Swal.fire({ 
          icon: "success", 
          title: "ลงทะเบียนสำเร็จ!", 
          text: "ระบบบันทึกรายวิชาเรียนของคุณเรียบร้อยแล้ว", 
          timer: 2000, 
          showConfirmButton: false 
        });

      } catch (err) {
        Swal.fire("เกิดข้อผิดพลาด", `ไม่สามารถลงทะเบียนได้: ${err.message}`, "error");
      } finally {
        setIsSubmitting(null);
      }
    });
  };

  const allowedCourses = courses.filter((c) => {
    if (!isLoggedIn) return true; 
    const matchLevel = !c.level || 
                       c.level === "all" || 
                       c.level === userLevel || 
                       (Array.isArray(c.level) && c.level.includes(userLevel));
    return matchLevel; 
  });

  const allowedCategoryIds = new Set(allowedCourses.map(c => c.category));
  allowedCategoryIds.add("all"); 
  
  const visibleCategories = categories.filter(cat => allowedCategoryIds.has(cat.id));

  const filtered = allowedCourses.filter((c) => {
    const matchCat = activeCategory === "all" || c.category === activeCategory;
    const matchLevelFilter = activeLevel === "all" || 
                             c.level === activeLevel || 
                             (Array.isArray(c.level) && c.level.includes(activeLevel));
                             
    const matchSearch = (c.subject || "").toLowerCase().includes(search.toLowerCase()) || 
                        (c.teacher || "").toLowerCase().includes(search.toLowerCase()) ||
                        (c.subjectCode || "").toLowerCase().includes(search.toLowerCase());
                        
    return matchCat && matchLevelFilter && matchSearch;
  });

  const handleCourseAction = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <div className="lh-hero" style={{
        background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 55%,#7c3aed 100%)",
        padding: "80px 20px", textAlign: "center", color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -70, left: -30, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        
        <div style={{ position: "relative", zIndex: 2, maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: 3, opacity: 0.8, marginBottom: 10, textTransform: "uppercase" }}>Online Learning Center</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 700, lineHeight: 1.2, marginBottom: 15 }}>
            เรียนรู้ทุกวิชา <span style={{ color: "#bfdbfe" }}>กับครูอาจารย์</span>
          </h1>
          <p style={{ fontSize: "clamp(14px, 2vw, 16px)", opacity: 0.9, marginBottom: 30 }}>เลือกเรียนได้ตามความสนใจ เรียนได้ทุกที่ ทุกเวลา</p>

          <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }}>
            <input 
              type="text"
              placeholder="ค้นหาชื่อวิชา, รหัสวิชา หรือชื่อผู้สอน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "16px 25px", paddingLeft: "50px", borderRadius: "16px", border: "none", fontSize: "16px", outline: "none", color: "#1e293b", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" }}
            />
            <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 20, opacity: 0.5 }}>🔍</span>
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: 15, top: "50%", transform: "translateY(-50%)", background: "#e2e8f0", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", color: "#64748b", fontSize: 12, fontWeight: "bold" }}>✕</button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .lh-layout { flex-direction: column !important; padding: 16px !important; }
          .lh-sidebar { width: 100% !important; position: static !important; order: -1 !important; margin-bottom: 20px !important; }
          .lh-grid { grid-template-columns: 1fr !important; }
        }
        .lh-cat-btn { display: flex; width: 100%; padding: 10px 20px; border: none; background: none; cursor: pointer; align-items: center; gap: 10px; transition: 0.2s; font-family: inherit; }
        .lh-cat-btn.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
        .lh-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; transition: 0.3s; cursor: pointer; }
        .lh-card:hover { transform: translateY(-5px); box-shadow: 0 12px 20px rgba(0,0,0,0.08); }
      `}</style>

      {/* ── Body ── */}
      <div className="lh-layout" style={{ display: "flex", gap: 24, padding: "28px 32px", alignItems: "flex-start" }}>

        {/* Sidebar */}
        <aside className="lh-sidebar" style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", padding: "16px 0", position: "sticky", top: 80 }}>
          <p className="lh-sidebar-title" style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 1.8, textTransform: "uppercase", padding: "0 20px", marginBottom: 10 }}>หมวดหมู่</p>
          
          {visibleCategories.map(cat => {
            const count = allowedCourses.filter(c => cat.id === "all" || c.category === cat.id).length;
            const isActive = activeCategory === cat.id;
            
            return (
              <button key={cat.id} className={`lh-cat-btn${isActive ? " active" : ""}`} onClick={() => setActiveCategory(cat.id)}>
                <span style={{ fontSize: 15 }}>{cat.icon}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{cat.label}</span>
                <span style={{ background: isActive ? "#2563eb" : "#f1f5f9", color: isActive ? "#fff" : "#94a3b8", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: "center" }}>{count}</span>
              </button>
            );
          })}
        </aside>

        {/* Course area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "25px", flexWrap: "wrap" }}>
            {levels
              .filter(lvl => !isLoggedIn || lvl.id === "all" || lvl.id === userLevel || lvl.label === userLevel)
              .map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setActiveLevel(lvl.id)}
                style={{
                  padding: "8px 18px", borderRadius: "100px", border: "1px solid",
                  borderColor: activeLevel === lvl.id ? "#2563eb" : "#e2e8f0",
                  background: activeLevel === lvl.id ? "#2563eb" : "#fff",
                  color: activeLevel === lvl.id ? "#fff" : "#64748b",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s"
                }}
              >
                {lvl.label}
              </button>
            ))}
          </div>
          
          <p style={{ color: "#64748b", fontSize: 13, marginBottom: 18 }}>
            พบ <strong style={{ color: "#1e293b" }}>{filtered.length}</strong> รายวิชา
            {search && <span style={{ color: "#2563eb" }}> · "{search}"</span>}
          </p>

          <div className="lh-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {currentItems.map(course => {
              const hovered = hoveredId === course.id;
              const isRegistered = registeredCourses.includes(course.id);

              return (
                <div 
                  key={course.id} 
                  className="lh-card" 
                  onMouseEnter={() => setHoveredId(course.id)} 
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleCourseAction(course.id)}
                >
                  <div style={{ height: 5, background: `linear-gradient(90deg,${course.color},${course.color}88)` }} />

                  <div style={{ padding: "20px 16px 15px", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 6, letterSpacing: "0.5px" }}>{course.subjectCode}</div>
                      <div style={{ minHeight: "60px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{course.subject}</h3>
                      </div>
                      <p style={{ fontSize: 13, color: course.color, fontWeight: 600 }}>{course.teacher}</p>
                    </div>
                  </div>
                  
                  <div style={{ width: "100%", height: 160, overflow: "hidden", background: "#eee" }}>
                    <img src={course.image} alt={course.subject} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s", transform: hovered ? "scale(1.1)" : "scale(1)" }} />
                  </div>

                  <div style={{ padding: "12px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, flex: 1 }}>{course.description}</p>
                    
                    {/* ── ส่วนจัดการปุ่มควบคุมด้านล่างการ์ด ── */}
                    <div style={{ display: "flex", gap: 8, width: "100%" }}>
                      {isRegistered ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCourseAction(course.id); }} 
                          style={{ 
                            width: "100%", padding: "9px", borderRadius: 10, border: "none", 
                            background: hovered ? course.color : `${course.color}18`, 
                            color: hovered ? "#fff" : course.color, 
                            fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" 
                          }}
                        >
                          เข้าสู่ห้องเรียน →
                        </button>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, width: "100%" }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCourseAction(course.id); }} 
                            onMouseEnter={(e) => {
                              e.target.style.background = "#f1f5f9";
                              e.target.style.borderColor = "#94a3b8";
                              e.target.style.color = "#1e293b";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "#fff";
                              e.target.style.borderColor = "#cbd5e1";
                              e.target.style.color = "#64748b";
                            }}
                            style={{ 
                              width: "100%",
                              padding: "8px 4px", 
                              borderRadius: 10, 
                              border: "1px solid #cbd5e1", 
                              background: "#fff", 
                              color: "#64748b", 
                              fontSize: "12px", 
                              fontWeight: 600, 
                              cursor: "pointer", 
                              whiteSpace: "nowrap", 
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 2
                            }}
                          >
                            🔍 รายละเอียด
                          </button>
                          
                          <button 
                            disabled={isSubmitting === course.id}
                            onClick={(e) => handleQuickRegister(e, course)} 
                            onMouseEnter={(e) => {
                              if (isSubmitting !== course.id) {
                                e.target.style.background = "#059669";
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow = "0 4px 6px rgba(16,185,129,0.3)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isSubmitting !== course.id) {
                                e.target.style.background = "#10b981";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 2px 4px rgba(16,185,129,0.2)";
                              }
                            }}
                            style={{ 
                              width: "100%",
                              padding: "8px 4px", 
                              borderRadius: 10, 
                              border: "none", 
                              background: "#10b981", 
                              color: "#fff", 
                              fontSize: "12px", 
                              fontWeight: 700, 
                              cursor: "pointer", 
                              whiteSpace: "nowrap", 
                              boxShadow: "0 2px 4px rgba(16,185,129,0.2)", 
                              opacity: isSubmitting === course.id ? 0.6 : 1, 
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 2
                            }}
                          >
                            {isSubmitting === course.id ? "กำลังบันทึก..." : "📝 ลงทะเบียน"}
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
              <button onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={currentPage === 1} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: currentPage === 1 ? "#f8fafc" : "#fff", color: currentPage === 1 ? "#94a3b8" : "#1e293b", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>ก่อนหน้า</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ width: 36, height: 36, borderRadius: 8, border: currentPage === i + 1 ? "none" : "1px solid #e2e8f0", background: currentPage === i + 1 ? "#2563eb" : "#fff", color: currentPage === i + 1 ? "#fff" : "#1e293b", cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</button>
              ))}
              <button onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={currentPage === totalPages} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: currentPage === totalPages ? "#f8fafc" : "#fff", color: currentPage === totalPages ? "#94a3b8" : "#1e293b", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}>ถัดไป</button>
            </div>
          )}
        </div>
      </div>

      <footer style={{ background: "#1e293b", color: "#94a3b8", textAlign: "center", padding: "20px 32px", fontSize: 13, marginTop: 40 }}>
        © 2026 LearnHub — ระบบจัดการเรียนรู้ออนไลน์
      </footer>
    </>
  );
}