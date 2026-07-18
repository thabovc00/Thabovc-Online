/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { courses } from "./data/courses";
import Navbar from "./components/Navbar";
import Swal from "sweetalert2";
import { supabase } from "./supabaseClient";

const majorTranslations = {
  "automotive": "ช่างยนต์",
  "electrical": "ช่างไฟฟ้า",
  "electronics": "ช่างอิเล็กทรอนิกส์",
  "digital-business": "เทคโนโลยีธุรกิจดิจิทัล",
  "hospital-business": "ธุรกิจสถานพยาบาล",
  "tourism": "การท่องเที่ยว",
  "hotel": "การโรงแรม",
  "marketing": "การตลาด",
  "accounting": "การบัญชี",
  "food-nutrition": "อาหารและโภชนาการ",
  "architecture": "สถาปัตยกรรม"
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const [studentInfo, setStudentInfo] = useState({
    name: "", major: "", level: "", initial: "S", username: "", rawMajor: ""
  });
  const [myCourses, setMyCourses]             = useState([]);
  const [isDeleting, setIsDeleting]           = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isDeletingAll, setIsDeletingAll]     = useState(false);
  const [isMobile, setIsMobile]               = useState(window.innerWidth <= 992);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/"); return; }
    const firstName = localStorage.getItem("userFirstName") || "";
    const lastName  = localStorage.getItem("userLastName")  || "";
    const major     = localStorage.getItem("userMajor")     || "";
    const level     = localStorage.getItem("userLevel")     || ""; // เช่น ปวช.1, ปวช.2, ปวช.3
    const username  = localStorage.getItem("userName")      || "";
    
    setStudentInfo({
      name:    firstName ? `${firstName} ${lastName}` : "นักศึกษา LearnHub",
      major:   majorTranslations[major] || major || "ทั่วไป",
      rawMajor: major, // เก็บค่าดิบไว้ใช้แปลเป็นภาษาไทยในชื่อไฟล์
      level, 
      initial: firstName ? firstName.charAt(0) : "S", 
      username
    });
    
    const fetch_ = async () => {
      if (!username) return;
      try {
        const { data, error } = await supabase.from("enrollments").select("course_id").eq("username", username);
        if (error) throw error;
        if (data) {
          const ids = data.map(d => d.course_id);
          setMyCourses(courses.filter(c => ids.includes(c.id)));
          localStorage.setItem("registeredCourses", JSON.stringify(ids));
        }
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        const saved = localStorage.getItem("registeredCourses");
        if (saved) setMyCourses(courses.filter(c => JSON.parse(saved).includes(c.id)));
      }
    };
    fetch_();
  }, [isLoggedIn]);

  // 📅 ฟังก์ชันสำหรับกดดูตารางเรียนแบบ Dynamic (อิงตามระดับชั้นและสาขา)
 // 📅 ฟังก์ชันสำหรับกดดูตารางเรียนแบบ Dynamic (รองรับ ปวช. 101-301 และ ปวส. 1001-1002)
  // 📅 ฟังก์ชันสำหรับกดดูตารางเรียนแบบ Dynamic (เวอร์ชันตัดเลขท้ายออก เพื่อให้คุณครูตั้งชื่อไฟล์ง่ายที่สุด)
  const handleViewSchedule = () => {
    const currentLevel = studentInfo.level || "ปวช.1"; 
    const currentMajorTh = studentInfo.major || "ทั่วไป"; 
    
    // 🔗 ระบบจะดึงชื่อสาขาตรง ๆ มาต่อท้าย เช่น /images/ตารางเรียนปวช.1/เทคโนโลยีธุรกิจดิจิทัล.png
    const scheduleImagePath = `/images/ตารางเรียน${currentLevel}/${currentMajorTh}.png`;

    Swal.fire({
      title: `📅 ตารางเรียนชั้น ${currentLevel}`,
      text: `สาขาวิชา${currentMajorTh}`,
      imageUrl: scheduleImagePath,
      imageAlt: `ตารางเรียน ${currentLevel} ${currentMajorTh}`,
      imageWidth: 550,
      imageHeight: 380,
      customClass: {
        image: 'object-contain rounded-lg border border-slate-200'
      },
      showCancelButton: true,
      confirmButtonColor: "#64748b", 
      cancelButtonColor: "#2563eb",  
      confirmButtonText: "❌ ปิดหน้าต่าง",
      cancelButtonText: "🔗 เปิดรูปภาพขนาดเต็ม",
      allowOutsideClick: true,
      allowEscapeKey: true
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        window.open(scheduleImagePath, '_blank');
      }
    });
  };

  const handleUnenroll = (course) => {
    Swal.fire({
      icon: "warning", title: "ยืนยันการลบวิชา?",
      html: `ต้องการลบ <b>${course.subject}</b> ออกจากการลงทะเบียนใช่หรือไม่?`,
      showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#64748b",
      confirmButtonText: "ยืนยันลบ", cancelButtonText: "ยกเลิก"
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setIsDeleting(course.id);
      try {
        const { error } = await supabase.from("enrollments").delete()
          .eq("username", studentInfo.username).eq("course_id", course.id);
        if (error) throw error;
        const updated = myCourses.filter(c => c.id !== course.id);
        setMyCourses(updated);
        setSelectedCourses(prev => prev.filter(id => id !== course.id));
        localStorage.setItem("registeredCourses", JSON.stringify(updated.map(c => c.id)));
        Swal.fire({ icon: "success", title: "ลบวิชาสำเร็จ", timer: 1500, showConfirmButton: false });
      } catch (err) {
        Swal.fire("ขัดข้อง", err.message, "error");
      } finally { setIsDeleting(null); }
    });
  };

  const handleUnenrollSelected = () => {
    if (!selectedCourses.length) return;
    const names = myCourses.filter(c => selectedCourses.includes(c.id)).map(c => `• ${c.subject}`).join("<br>");
    Swal.fire({
      icon: "warning", title: `ยืนยันการลบ ${selectedCourses.length} วิชา?`,
      html: `<div style="text-align:left;background:#fef2f2;padding:10px 14px;border-radius:8px;font-size:13px;color:#991b1b;line-height:1.8">${names}</div>`,
      showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#64748b",
      confirmButtonText: "ยืนยันลบทั้งหมด", cancelButtonText: "ยกเลิก"
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      setIsDeletingAll(true);
      try {
        const { error } = await supabase.from("enrollments").delete()
          .eq("username", studentInfo.username).in("course_id", selectedCourses);
        if (error) throw error;
        const updated = myCourses.filter(c => !selectedCourses.includes(c.id));
        setMyCourses(updated); setSelectedCourses([]);
        localStorage.setItem("registeredCourses", JSON.stringify(updated.map(c => c.id)));
        Swal.fire({ icon: "success", title: "ลบวิชาสำเร็จ", timer: 1500, showConfirmButton: false });
      } catch (err) {
        Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
      } finally { setIsDeletingAll(false); }
    });
  };

  const toggleSelectAll = () => {
    setSelectedCourses(selectedCourses.length === myCourses.length ? [] : myCourses.map(c => c.id));
  };

  // ── Mobile card ──
  const MobileCourseCard = ({ course, idx }) => {
    const selected = selectedCourses.includes(course.id);
    return (
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px",
        background: selected ? "#fef2f2" : idx % 2 === 0 ? "#fff" : "#fafafa",
        borderBottom: "1px solid #f1f5f9"
      }}>
        <input type="checkbox" checked={selected}
          onChange={(e) => setSelectedCourses(prev => e.target.checked ? [...prev, course.id] : prev.filter(id => id !== course.id))}
          style={{ width: 16, height: 16, marginTop: 3, cursor: "pointer", accentColor: "#ef4444", flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 4, height: 40, borderRadius: 4, background: course.color || "#2563eb", flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", lineHeight: 1.4 }}>
              {course.subject}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 12 }}>
            <span style={{ background: "#f1f5f9", color: "#64748b", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
              {course.subjectCode}
            </span>
            <span style={{ color: course.color || "#2563eb", fontSize: 12, fontWeight: 600 }}>
              {course.teacher}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, paddingLeft: 12 }}>
            <button onClick={() => navigate(`/course/${course.id}`)} style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid #bfdbfe",
              background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer"
            }}>เข้าเรียน</button>
            <button disabled={isDeleting === course.id} onClick={() => handleUnenroll(course)} style={{
              padding: "6px 14px", borderRadius: 8, border: "1px solid #fecaca",
              background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 600,
              cursor: isDeleting === course.id ? "not-allowed" : "pointer",
              opacity: isDeleting === course.id ? 0.5 : 1
            }}>
              {isDeleting === course.id ? "กำลังลบ..." : "ลบ"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Desktop row ──
  const DesktopCourseRow = ({ course, idx }) => {
    const selected = selectedCourses.includes(course.id);
    return (
      <div style={{
        display: "grid", gridTemplateColumns: "32px minmax(0,2fr) 110px minmax(0,1.4fr) 160px",
        gap: 12, alignItems: "center", padding: "14px 16px",
        background: selected ? "#fef2f2" : idx % 2 === 0 ? "#fff" : "#fafafa",
        borderBottom: "1px solid #f1f5f9", transition: "background 0.15s"
      }}>
        <input type="checkbox" checked={selected}
          onChange={(e) => setSelectedCourses(prev => e.target.checked ? [...prev, course.id] : prev.filter(id => id !== course.id))}
          style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#ef4444" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 4, minHeight: 20, borderRadius: 4, background: course.color || "#2563eb", alignSelf: "stretch", flexShrink: 0 }} />
          <span title={course.subject} style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {course.subject}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>{course.subjectCode}</span>
        <span title={course.teacher} style={{ fontSize: 13, color: course.color || "#2563eb", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {course.teacher}
        </span>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => navigate(`/course/${course.id}`)} style={{
            padding: "5px 12px", borderRadius: 8, border: "1px solid #bfdbfe",
            background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
          }}>เข้าเรียน</button>
          <button disabled={isDeleting === course.id} onClick={() => handleUnenroll(course)} style={{
            padding: "5px 12px", borderRadius: 8, border: "1px solid #fecaca",
            background: "#fff5f5", color: "#ef4444", fontSize: 12, fontWeight: 600,
            cursor: isDeleting === course.id ? "not-allowed" : "pointer",
            opacity: isDeleting === course.id ? 0.5 : 1, whiteSpace: "nowrap"
          }}>
            {isDeleting === course.id ? "กำลังลบ..." : "ลบ"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div style={{
        display: "flex", gap: 28, maxWidth: 1100, margin: "0 auto",
        padding: isMobile ? "16px" : "36px 24px",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "flex-start"
      }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: isMobile ? "100%" : 280, flexShrink: 0, background: "#fff", borderRadius: 20,
          border: "1px solid #e2e8f0", padding: "28px 20px", textAlign: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          position: isMobile ? "static" : "sticky", top: 88
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg,#2563eb,#7c3aed)",
            color: "#fff", fontSize: 32, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
          }}>{studentInfo.initial}</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{studentInfo.name}</h2>
          <span style={{ display: "inline-block", background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, marginBottom: 20 }}>
            🎓 นักศึกษาในระบบ
          </span>
          <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "0 0 18px" }} />
          {[
            { label: "ระดับชั้น", value: studentInfo.level || "ไม่ระบุ" },
            { label: "สาขาวิชา", value: studentInfo.major },
            { label: "วิชาที่ลงทะเบียน", value: `${myCourses.length} วิชา` }
          ].map(item => (
            <div key={item.label} style={{ textAlign: "left", marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#334155", margin: 0 }}>{item.value}</p>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, mt: 4, fontSize: 13, color: "#10b981", fontWeight: 600, marginBottom: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            ออนไลน์กำลังใช้งาน
          </div>

          {/* 📅 ปุ่มกดดูตารางเรียนแบบ Dynamic เพิ่มใหม่ตามบรีฟ */}
          <button 
            onClick={handleViewSchedule}
            style={{
              width: "100%",
              padding: "11px 16px",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.1s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            📅 ดูตารางเรียนของฉัน
          </button>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>วิชาเรียนของฉัน</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>ลงทะเบียนแล้วทั้งหมด {myCourses.length} วิชา</p>
          </div>

          {myCourses.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px dashed #cbd5e1", padding: "60px 20px", textAlign: "center" }}>
              <span style={{ fontSize: 44, display: "block", marginBottom: 14 }}>📚</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 8 }}>ยังไม่มีวิชาที่ลงทะเบียน</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 18 }}>เข้าไปเลือกวิชาที่ต้องการเรียนได้เลยครับ</p>
              <button onClick={() => navigate("/courses")} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "9px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                🔍 ไปเลือกวิชาเรียน
              </button>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>

              {/* Header */}
              <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>

                {/* ปุ่มลบที่เลือก */}
                {selectedCourses.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>เลือกแล้ว {selectedCourses.length} วิชา</span>
                    <button onClick={handleUnenrollSelected} disabled={isDeletingAll} style={{
                      padding: "5px 14px", borderRadius: 8, border: "none",
                      background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700,
                      cursor: isDeletingAll ? "not-allowed" : "pointer", opacity: isDeletingAll ? 0.5 : 1
                    }}>
                      {isDeletingAll ? "กำลังลบ..." : `🗑️ ลบที่เลือก (${selectedCourses.length})`}
                    </button>
                    <button onClick={() => setSelectedCourses([])} style={{
                      padding: "5px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
                      background: "#fff", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer"
                    }}>ยกเลิกการเลือก</button>
                  </div>
                )}

                {/* เลือกทั้งหมด */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox"
                    checked={selectedCourses.length === myCourses.length && myCourses.length > 0}
                    onChange={toggleSelectAll}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#ef4444" }}
                  />
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    {isMobile ? "เลือกทั้งหมด" : "เลือกทั้งหมด / ชื่อวิชา"}
                  </span>
                  {!isMobile && (
                    <>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", width: 110 }}>รหัสวิชา</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", width: 160 }}>ผู้สอน</span>
                      <span style={{ width: 160 }} />
                    </>
                  )}
                </div>
              </div>

              {/* รายการวิชา */}
              {myCourses.map((course, idx) =>
                isMobile
                  ? <MobileCourseCard key={course.id} course={course} idx={idx} />
                  : <DesktopCourseRow key={course.id} course={course} idx={idx} />
              )}

            </div>
          )}
        </main>
      </div>
    </>
  );
}