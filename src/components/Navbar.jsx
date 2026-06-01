/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// ✅ นำเข้า SweetAlert2
import Swal from "sweetalert2";

const defaultNavItems = [
  { label: "หน้าแรก", path: "/HomePage" },
  { label: "รวมวิชาทั้งหมด", path: "/courses" },

  { label: "ติดต่อ", path: "/ContactPage" },
];

const majorTranslations = {
  "automotive": "สาขาช่างยนต์",
  "electrical": "สาขาช่างไฟฟ้า",
  "electronics": "สาขาช่างอิเล็กทรอนิกส์",
  "digital-business": "สาขาเทคโนโลยีธุรกิจดิจิทัล",
  "hospital-business": "สาขาธุรกิจสถานพยาบาล",
  "tourism": "สาขาการท่องเที่ยว",
  "hotel": "สาขาการโรงแรม",
  "marketing": "สาขาการตลาด",
  "accounting": "สาขาการบัญชี",
  "food-nutrition": "สาขาอาหารและโภชนาการ",
  "architecture": "สาขาสถาปัตยกรรม"
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [userData, setUserData] = useState({
    name: "",
    major: "",
    level: "",
    role: "student" // 🎭 เพิ่มคีย์ตรวจสถานะสิทธิ์
  });

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = localStorage.getItem('userRole') || 'student'; // ดึงบทบาทผู้ใช้

  // 🔄 เงื่อนไขเลือกรายการเมนู: แทรกหน้าประวัติสลับตามสิทธิ์นักเรียน หรือ คุณครู
  const navItems = [...defaultNavItems];
  if (isLoggedIn) {
    if (userRole === 'teacher') {
      navItems.splice(2, 0, { label: "หน้าจัดการของครู", path: "/teacher-profile" });
    } else {
      navItems.splice(2, 0, { label: "ข้อมูลส่วนตัว", path: "/profile" });
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      const firstName = localStorage.getItem("userFirstName") || "";  
      const lastName = localStorage.getItem("userLastName") || "";    
      const major = localStorage.getItem("userMajor");
      const level = localStorage.getItem("userLevel");
      const role = localStorage.getItem("userRole") || "student";

      // กรองการจัดเรียงข้อความ
      let displayMajor = "";
      if (role === "student") {
        displayMajor = majorTranslations[major] || major || "ไม่ระบุสาขา";
      } else {
        displayMajor = "คุณครูผู้สอน"; // หากเป็นสิทธิ์ครู ให้ขึ้นสถานะแทนชื่อสาขา
      }

      setUserData({
        name: lastName ? `${firstName} ${lastName}` : firstName,  // ถ้าครูเก็บชื่อเต็มไว้ที่ฟิลด์แรก จะได้ไม่ติดช่องว่างปลายแถว
        major: displayMajor,
        level: role === "student" ? (level || "") : "👨‍🏫", // ตัวบ่งชี้ไอคอนของฝั่งครู
        role: role
      });
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    setMobileOpen(false); 
    Swal.fire({
      title: "ออกจากระบบ?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", 
      cancelButtonColor: "#94a3b8",  
      confirmButtonText: "ใช่, ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      width: "360px", 
      padding: "1.5em",
      background: "#fff",
      backdrop: `rgba(0,0,0,0.4)` 
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "ออกจากระบบสำเร็จ!",
          showConfirmButton: false,
          timer: 1000,
          width: "320px",
        }).then(() => {
          localStorage.clear();
          sessionStorage.clear();
          navigate("/");
          window.location.reload();
        });
      }
    });
  };

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, background: "#fff",
        borderBottom: "1px solid #e2e8f0", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      }}>
        {/* ฝั่งซ้าย: โลโก้ และ เมนูทั่วไป */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            onClick={() => navigate("/HomePage")}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: "linear-gradient(135deg,#2563eb,#7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, color: "#fff", fontWeight: 700,
            }}>L</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>LearnHub</span>
          </div>

          <div className="lh-desktop-nav" style={{ display: "flex", gap: 2 }}>
            {navItems.map(item => (
              <button
                key={item.label}
                className={`lh-nav-link${location.pathname === item.path ? " active" : ""}`}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
              >{item.label}</button>
            ))}
          </div>
        </div>

        {/* ฝั่งขวา (Desktop) */}
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          
          {isLoggedIn && userData.name ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="lh-desktop-nav">
              <div style={{ textAlign: "right", lineHeight: "1.2" }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                  {userData.name}
                </div>
                <div style={{ fontSize: "11px", color: userData.role === "teacher" ? "#16a34a" : "#64748b", fontWeight: userData.role === "teacher" ? "600" : "normal" }}>
                  {userData.role === "teacher" ? `${userData.level} ${userData.major}` : `${userData.level} ${userData.major}`}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                style={{
                  padding: "6px 14px", fontSize: "13px", color: "#ef4444",
                  border: "1px solid #fee2e2", background: "#fef2f2",
                  borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s"
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="lh-desktop-nav">
              <button
                onClick={() => navigate("/login")} 
                style={{
                  padding: "8px 18px", fontSize: "13px", color: "#fff",
                  background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  border: "none", borderRadius: "8px", cursor: "pointer",
                  fontWeight: "600", boxShadow: "0 4px 10px rgba(37,99,235,0.2)", transition: "all 0.2s"
                }}
              >
                เข้าสู่ระบบ
              </button>
            </div>
          )}

          {/* ปุ่ม Hamburger สำหรับกดเปิดเมนูในมือถือ */}
          <button className="lh-hamburger" onClick={() => setMobileOpen(o => !o)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              {mobileOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>
      </nav>

      {/* ── แถบเมนูยืดหดสำหรับหน้าจอ Mobile ── */}
      {mobileOpen && (
        <div style={{
          position: "fixed", top: 64, left: 0, right: 0, zIndex: 99,
          background: "#fff", borderBottom: "1px solid #e2e8f0",
          padding: "12px 20px", display: "flex", flexDirection: "column", gap: 4,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}>
          {isLoggedIn && userData.name ? (
             <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", marginBottom: 5 }}>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{userData.name}</div>
                <div style={{ fontSize: "12px", color: userData.role === "teacher" ? "#16a34a" : "#64748b" }}>{userData.level} {userData.major}</div>
             </div>
          ) : (
            <button
              style={{ 
                textAlign: "center", color: "#fff", background: "linear-gradient(135deg,#2563eb,#1d4ed8)", 
                padding: "10px", borderRadius: "8px", fontWeight: "600", marginBottom: 10, fontSize: "14px", border: "none"
              }}
              onClick={() => { navigate("/login"); setMobileOpen(false); }}
            >
              🔐 เข้าสู่ระบบใช้งาน
            </button>
          )}

          {navItems.map(item => (
            <button
              key={item.label}
              className={`lh-nav-link${location.pathname === item.path ? " active" : ""}`}
              style={{ textAlign: "left" }}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
            >{item.label}</button>
          ))}

          {isLoggedIn && userData.name && (
            <button
              style={{ textAlign: "left", color: "#ef4444", marginTop: 10, borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}
              className="lh-nav-link"
              onClick={handleLogout}
            >
              🚪 ออกจากระบบ
            </button>
          )}
        </div>
      )}
    </>
  );
}