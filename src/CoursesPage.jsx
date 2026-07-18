import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import { courses, categories, levels } from "./data/courses"; 
import Navbar from "./components/Navbar";
import Swal from "sweetalert2"; 
import { supabase } from "./supabaseClient"; 

export default function CoursesPage() {
  const navigate = useNavigate(); 
  
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userLevel = localStorage.getItem('userLevel') || ""; 
  const username = localStorage.getItem('userName') || ""; 
  const userRole = localStorage.getItem('userRole') || "student"; 

  const [activeCategory, setActiveCategory] = useState("all");
  const [activeLevel, setActiveLevel] = useState(isLoggedIn && userRole !== "teacher" ? userLevel : "all"); 
  const [hoveredId, setHoveredId] = useState(null);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [registeredCourses, setRegisteredCourses] = useState([]); 
  const [teacherCourses, setTeacherCourses] = useState([]); 
  const [isSubmitting, setIsSubmitting] = useState(null); 

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!isLoggedIn || !username) return;

      try {
        if (userRole === "teacher") {
          const { data, error } = await supabase
            .from("course_teachers")
            .select("course_id")
            .eq("username", username);

          if (error) throw error;
          if (data) {
            const courseIds = data.map((item) => item.course_id);
            setTeacherCourses(courseIds);
          }
        } else {
          const { data, error } = await supabase
            .from("enrollments")
            .select("course_id")
            .eq("username", username);

          if (error) throw error;
          if (data) {
            const courseIds = data.map((item) => item.course_id);
            setRegisteredCourses(courseIds);
            localStorage.setItem('registeredCourses', JSON.stringify(courseIds));
          }
        }
      } catch (err) {
        console.error("Error fetching user data from Supabase:", err.message);
      }
    };

    fetchUserCourses();
  }, [isLoggedIn, username, userRole]);

  const handleQuickRegister = async (e, course) => {
    e.stopPropagation(); 

    if (!isLoggedIn) {
      Swal.fire("กรุณาเข้าสู่ระบบ", "โปรดเข้าสู่ระบบก่อนทำการลงทะเบียนเรียนครับ", "warning");
      return;
    }

    Swal.fire({
  icon: "question",
  // highlight-start
  title: '<span style="font-size: 24px;">ยืนยันการลงทะเบียนเรียน?</span>', // ปรับขนาดตามต้องการ เช่น 20px, 24px
  // highlight-end
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
        const { error } = await supabase
  .from("enrollments")
  .insert([{ 
    username: username,
    course_id: course.id,
    full_name: localStorage.getItem('userFirstName') + ' ' + localStorage.getItem('userLastName'), // จุดนี้
  }]);

        if (error) throw error;

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

  const handleTeacherRegister = async (e, course) => {
    e.stopPropagation();

   Swal.fire({
  icon: "question",
  // highlight-start
  title: '<span style="font-size: 24px;">ยืนยันการลงทะเบียนเรียน?</span>', // ปรับขนาดตามต้องการ เช่น 20px, 24px
  // highlight-end
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
        const { error } = await supabase
          .from("course_teachers") 
          .insert([{
            username: username,
            course_id: course.id,
            teacher_name: localStorage.getItem('userFirstName') + ' ' + localStorage.getItem('userLastName')
          }]);

        if (error) throw error;

        setTeacherCourses([...teacherCourses, course.id]);

        Swal.fire({
          icon: "success",
          title: "ลงทะเบียนสอนสำเร็จ!",
          text: "คุณได้รับสิทธิ์ในการจัดการห้องเรียนวิชานี้แล้ว",
          timer: 2000,
          showConfirmButton: false
        });

      } catch (err) {
        Swal.fire("เกิดข้อผิดพลาด", `ไม่สามารถลงทะเบียนสอนได้: ${err.message}`, "error");
      } finally {
        setIsSubmitting(null);
      }
    });
  };

  const allowedCourses = courses.filter((c) => {
    if (!isLoggedIn || userRole === "teacher") return true; 
    const matchLevel = !c.level || 
                       c.level === "all" || 
                       c.level === userLevel || 
                       (Array.isArray(c.level) && c.level.includes(userLevel));
    return matchLevel; 
  });

  const visibleCategories = categories;

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
        padding: "50px 16px", textAlign: "center", color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -70, left: -30, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        
        <div style={{ position: "relative", zIndex: 2, maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: 10, letterSpacing: 2, opacity: 0.8, marginBottom: 8, textTransform: "uppercase" }}>Online Learning Center</p>
          <h1 style={{ fontSize: "clamp(22px, 4.5vw, 34px)", fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>
            เรียนรู้ทุกวิชา <span style={{ color: "#bfdbfe" }}>กับครูอาจารย์</span>
          </h1>
          <p style={{ fontSize: "clamp(12px, 1.8vw, 14px)", opacity: 0.9, marginBottom: 20 }}>เลือกเรียนได้ตามความสนใจ เรียนได้ทุกที่ ทุกเวลา</p>

          <div style={{ maxWidth: 500, margin: "0 auto", position: "relative" }}>
            <input 
              type="text"
              placeholder="ค้นหาชื่อวิชา, รหัสวิชา หรือชื่อผู้สอน..."
              value={search}
              onChange={(e) => {
  setSearch(e.target.value);
  setCurrentPage(1); // รีเซ็ตหน้าตรงนี้เลย
}}
              style={{ width: "100%", padding: "12px 16px", paddingLeft: "42px", borderRadius: "12px", border: "none", fontSize: "14px", outline: "none", color: "#1e293b", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.5 }}>🔍</span>
            {search && (
              <button onClick={() => {
  setSearch("");
  setCurrentPage(1); // รีเซ็ตหน้าตรงนี้เลย
}} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "#e2e8f0", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", color: "#64748b", fontSize: 10, fontWeight: "bold" }}>✕</button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .lh-layout { 
          display: flex; 
          gap: 28px; 
          padding: 32px; 
          align-items: flex-start;
          max-width: 1400px;
          margin: 0 auto;
          box-sizing: border-box;
          width: 100%;
        }
        
        .lh-grid { 
          display: grid; 
          grid-template-columns: repeat(3, minmax(0, 1fr)); 
          gap: 24px; 
          width: 100%;
        }

        .lh-cat-btn { display: flex; width: 100%; padding: 12px 20px; border: none; background: none; cursor: pointer; align-items: center; gap: 12px; transition: 0.2s; font-family: inherit; border-radius: 12px; color: #475569; }
        .lh-cat-btn:hover { background: #f8fafc; }
        .lh-cat-btn.active { background: #eff6ff; color: #2563eb; font-weight: 600; }
        
        .lh-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; transition: 0.3s; cursor: pointer; height: 100%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .lh-card:hover { transform: translateY(-5px); box-shadow: 0 12px 25px rgba(0,0,0,0.08); }

        .lh-level-container { display: flex; gap: 8px; margin-bottom: 20px; width: 100%; position: relative; }

        /* ซ่อนตัวแจ้งเตือนการเลื่อนเมื่ออยู่บนจอคอมพิวเตอร์ */
        .lh-scroll-hint { display: none; }
        .lh-scroll-wrapper { width: 100%; position: relative; }

        @media (max-width: 1024px) {
          .lh-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 768px) {
          .lh-layout { flex-direction: column !important; padding: 16px !important; gap: 16px !important; }
          .lh-sidebar { width: 100% !important; position: static !important; order: -1 !important; padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; margin-bottom: 0px; }
          .lh-grid { grid-template-columns: 1fr !important; gap: 16px; }
          
          /* แสดงข้อความแจ้งเตือนให้เลื่อนซ้ายขวา (เฉพาะมือถือ) */
          .lh-scroll-hint { 
            display: flex !important; 
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-size: 11px; 
            color: #3b82f6; 
            background: #eff6ff;
            padding: 5px 12px;
            border-radius: 6px;
            margin-bottom: 8px; 
            font-weight: 600;
            animation: pulseHint 2s infinite ease-in-out;
          }

          @keyframes pulseHint {
            0% { opacity: 0.7; }
            50% { opacity: 1; transform: scale(1.01); }
            100% { opacity: 0.7; }
          }

          /* สร้างโครงสไลด์แบบครอบเพื่อให้ทำ Gradient Fade ตรงขอบได้ */
          .lh-scroll-wrapper {
            position: relative;
            width: 100%;
          }
          .lh-scroll-wrapper::after {
            content: "";
            position: absolute;
            top: 0; right: 0; bottom: 0;
            width: 30px;
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(248,250,252,0.9) 100%);
            pointer-events: none;
            z-index: 5;
          }

          /* แถบคัดกรองหลักสไลด์แนวนอน */
          .lh-sidebar-inner {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            white-space: nowrap !important;
            gap: 8px !important;
            padding: 4px 24px 4px 2px !important;
            -webkit-overflow-scrolling: touch;
            width: 100%;
            box-sizing: border-box;
          }
          .lh-sidebar-inner::-webkit-scrollbar { display: none; }
          .lh-cat-btn { width: auto !important; padding: 8px 14px !important; border: 1px solid #e2e8f0 !important; background: #fff !important; border-radius: 100px !important; gap: 6px !important; flex-shrink: 0 !important; }
          .lh-cat-btn.active { border-color: #2563eb !important; background: #eff6ff !important; }
          .lh-sidebar-title { display: none !important; }

          /* แถบระดับชั้นสไลด์แนวนอน */
          .lh-level-container {
            overflow-x: auto !important;
            white-space: nowrap !important;
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 8px !important;
            padding: 4px 24px 4px 2px !important;
            -webkit-overflow-scrolling: touch;
            box-sizing: border-box;
          }
          .lh-level-container::-webkit-scrollbar { display: none; }
          .lh-level-btn { padding: 8px 14px !important; flex-shrink: 0 !important; border-radius: 100px !important; }
        }
      `}</style>

      {/* ── Body ── */}
      <div className="lh-layout">

        {/* Sidebar */}
        <aside className="lh-sidebar" style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 8px rgba(0,0,0,0.03)", padding: "16px 8px", position: "sticky", top: 90 }}>
          <p className="lh-sidebar-title" style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 1.8, textTransform: "uppercase", padding: "0 12px", marginBottom: 12 }}>หมวดหมู่</p>
          
          {/* ข้อความแจ้งเตือนให้สไลด์สำหรับโมบาย (หมวดหมู่) */}
          <div className="lh-scroll-hint"><span>↔</span> เลื่อนสไลด์ซ้าย-ขวา เพื่อดูหมวดหมู่เพิ่มเติม <span>↔</span></div>
          
          <div className="lh-scroll-wrapper">
            <div className="lh-sidebar-inner" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {visibleCategories.map(cat => {
                const count = allowedCourses.filter(c => cat.id === "all" || c.category === cat.id).length;
                const isActive = activeCategory === cat.id;
                
                return (
  <button key={cat.id} className={`lh-cat-btn${isActive ? " active" : ""}`} onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}>
    <span style={{ fontSize: 15 }}>{cat.icon}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{cat.label}</span>
                    <span style={{ background: isActive ? "#2563eb" : "#f1f5f9", color: isActive ? "#fff" : "#64748b", borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: "center" }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Course area */}
        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          
          {/* ข้อความแจ้งเตือนให้สไลด์สำหรับโมบาย (ระดับชั้น) */}
          <div className="lh-scroll-hint"><span>↔</span> เลื่อนสไลด์เพื่อเปลี่ยนระดับชั้นเรียน <span>↔</span></div>
          
          <div className="lh-scroll-wrapper" style={{ marginBottom: 20 }}>
            <div className="lh-level-container" style={{ margin: 0 }}>
              {levels
  .filter(lvl => !isLoggedIn || userRole === "teacher" || lvl.id === "all" || lvl.id === userLevel || lvl.label === userLevel)
  .map((lvl) => (
  <button
    key={lvl.id}
    className="lh-level-btn"
    onClick={() => { setActiveLevel(lvl.id); setCurrentPage(1); }}
    style={{
                    padding: "8px 18px", borderRadius: "100px", border: "1px solid",
                    borderColor: activeLevel === lvl.id ? "#2563eb" : "#e2e8f0",
                    background: activeLevel === lvl.id ? "#2563eb" : "#fff",
                    color: activeLevel === lvl.id ? "#fff" : "#64748b",
                    fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
          
          <p style={{ color: "#64748b", fontSize: 12, marginBottom: 14, paddingLeft: 2 }}>
            พบ <strong style={{ color: "#1e293b" }}>{filtered.length}</strong> รายวิชา
            {search && <span style={{ color: "#2563eb" }}> · "{search}"</span>}
          </p>

          <div className="lh-grid">
            {currentItems.map(course => {
              const hovered = hoveredId === course.id;
              const isTeacherAssigned = teacherCourses.includes(course.id);
              const isStudentRegistered = registeredCourses.includes(course.id);

              return (
                <div 
                  key={course.id} 
                  className="lh-card" 
                  onMouseEnter={() => setHoveredId(course.id)} 
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleCourseAction(course.id)}
                >
                  <div style={{ height: 4, background: `linear-gradient(90deg,${course.color},${course.color}88)` }} />

                  <div style={{ padding: "18px 14px 14px", textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px" }}>{course.subjectCode}</div>
                    <div style={{ minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: "#1e293b", wordBreak: "break-word" }}>{course.subject}</h3>
                    </div>
                    <p style={{ fontSize: 12, color: course.color, fontWeight: 600, margin: 0 }}>{course.teacher}</p>
                  </div>
                  
                  <div style={{ width: "100%", height: 140, overflow: "hidden", background: "#f8fafc" }}>
                    <img src={course.image} alt={course.subject} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s", transform: hovered ? "scale(1.06)" : "scale(1)" }} />
                  </div>

                  <div style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, flex: 1, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                      {course.description}
                    </p>
                    
                    <div style={{ display: "flex", gap: 6, width: "100%", marginTop: "auto" }}>
                      {userRole === "teacher" ? (
                        isTeacherAssigned ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCourseAction(course.id); }} 
                            style={{ 
                              width: "100%", padding: "9px", borderRadius: 10, border: "none", 
                              background: hovered ? course.color : `${course.color}18`, 
                              color: hovered ? "#fff" : course.color, 
                              fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" 
                            }}
                          >
                            จัดการห้องเรียน →
                          </button>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 4, width: "100%" }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCourseAction(course.id); }} 
                              style={{ 
                                padding: "8px 2px", borderRadius: 10, border: "1px solid #cbd5e1", 
                                background: "#fff", color: "#475569", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                                whiteSpace: "nowrap"
                              }}
                            >
                              🔍 รายละเอียด
                            </button>
                            <button 
                              disabled={isSubmitting === course.id}
                              onClick={(e) => handleTeacherRegister(e, course)} 
                              style={{ 
                                padding: "8px 2px", borderRadius: 10, border: "none", 
                                background: "#2563eb", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer",
                                opacity: isSubmitting === course.id ? 0.6 : 1, transition: "all 0.2s",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {isSubmitting === course.id ? "บันทึก..." : "👨‍🏫 สอนวิชานี้"}
                            </button>
                          </div>
                        )
                      ) : (
                        isStudentRegistered ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCourseAction(course.id); }} 
                            style={{ 
                              width: "100%", padding: "9px", borderRadius: 10, border: "none", 
                              background: hovered ? course.color : `${course.color}18`, 
                              color: hovered ? "#fff" : course.color, 
                              fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" 
                            }}
                          >
                            เข้าสู่ห้องเรียน →
                          </button>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 4, width: "100%" }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleCourseAction(course.id); }} 
                              style={{ 
                                padding: "8px 2px", borderRadius: 10, border: "1px solid #cbd5e1", 
                                background: "#fff", color: "#475569", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                                whiteSpace: "nowrap"
                              }}
                            >
                              🔍 รายละเอียด
                            </button>
                            <button 
                              disabled={isSubmitting === course.id}
                              onClick={(e) => handleQuickRegister(e, course)} 
                              style={{ 
                                padding: "8px 2px", borderRadius: 10, border: "none", 
                                background: "#10b981", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer",
                                opacity: isSubmitting === course.id ? 0.6 : 1, transition: "all 0.2s",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {isSubmitting === course.id ? "บันทึก..." : "📝 ลงทะเบียน"}
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 40, width: "100%" }}>
              <button 
                onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                disabled={currentPage === 1} 
                style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e2e8f0", background: currentPage === 1 ? "#f8fafc" : "#fff", color: currentPage === 1 ? "#94a3b8" : "#1e293b", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ◀
              </button>
              
              {(() => {
                const pageNumbers = [];
                const maxVisible = 4; 
                
                let startPage = Math.max(1, currentPage - 1);
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                if (startPage > 1) {
                  pageNumbers.push(
                    <button key={1} onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#1e293b", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>1</button>
                  );
                  if (startPage > 2) {
                    pageNumbers.push(<span key="ellipsis-start" style={{ color: "#94a3b8", padding: "0 2px", fontSize: 12 }}>...</span>);
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  const isCurrent = currentPage === i;
                  pageNumbers.push(
                    <button 
                      key={i} 
                      onClick={() => { setCurrentPage(i); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                      style={{ 
                        width: 34, height: 34, borderRadius: 8, 
                        border: isCurrent ? "none" : "1px solid #e2e8f0", 
                        background: isCurrent ? "#2563eb" : "#fff", 
                        color: isCurrent ? "#fff" : "#1e293b", 
                        cursor: "pointer", fontSize: 13, fontWeight: 600, 
                        display: "flex", alignItems: "center", justifyContent: "center" 
                      }}
                    >
                      {i}
                    </button>
                  );
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pageNumbers.push(<span key="ellipsis-end" style={{ color: "#94a3b8", padding: "0 2px", fontSize: 12 }}>...</span>);
                  }
                  pageNumbers.push(
                    <button key={totalPages} onClick={() => { setCurrentPage(totalPages); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#1e293b", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{totalPages}</button>
                  );
                }

                return pageNumbers;
              })()}

              <button 
                onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                disabled={currentPage === totalPages} 
                style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e2e8f0", background: currentPage === totalPages ? "#f8fafc" : "#fff", color: currentPage === totalPages ? "#94a3b8" : "#1e293b", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>

      <footer style={{ background: "#1e293b", color: "#94a3b8", textAlign: "center", padding: "16px", fontSize: 12, marginTop: 40 }}>
        © 2026 LearnHub — ระบบจัดการเรียนรู้ออนไลน์
      </footer>
    </>
  ); 
}