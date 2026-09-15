import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function HomePage() {
  const navigate = useNavigate();

  // สไตล์สำหรับขั้นตอน (Steps)
  const stepCardStyle = {
    background: "#ffffff",
    padding: "32px",
    borderRadius: "28px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.02)",
    border: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  };

  // สไตล์สำหรับปุ่มสอบ (Exam CTA)
  const examButtonStyle = {
    flex: "1 1 220px",
    maxWidth: "280px",
    background: "#ffffff",
    border: "2px solid #e2e8f0",
    borderRadius: "24px",
    padding: "28px 24px",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.25s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px"
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", color: "#334155", fontFamily: "'Sarabun', sans-serif" }}>
      <Navbar />

      {/* ── Hero Section ── */}
      <section style={{ 
        padding: "100px 24px 60px", 
        textAlign: "center",
        background: "radial-gradient(circle at top, #f0f9ff 0%, #f8fafc 100%)"
      }}>
        <h1 style={{ 
    fontSize: "clamp(28px, 5vw, 42px)", // ขนาดตัวอักษร
    fontWeight: "800", // ความหนา
    color: "#0f172a", // สีดำบรรทัดแรก
    marginBottom: "20px", // ระยะห่างด้านล่าง
    lineHeight: "1.3" // ✅ เพิ่มบรรทัดนี้เพื่อให้ระยะห่างบรรทัดสวยงาม
  }}>
          ห้องเรียนออนไลน์ <br/>
          <span style={{ color: "#3b82f6" }}>วิทยาลัยเทคโนโลยีวิชาชีพท่าบ่อ</span>
        </h1>
        <p style={{ fontSize: "18px", color: "#64748b", maxWidth: "600px", margin: "0 auto", lineHeight: "1.7" }}>
          ศูนย์รวมความรู้ออนไลน์ที่เข้าถึงง่ายที่สุด <br/>
          เรียนรู้ได้ทันทีทุกที่ทุกเวลา ไม่ต้องมีบัญชีผู้ใช้
        </p>
      </section>

      {/* ── ส่วนลิงก์สอบกลางภาค / ปลายภาค ── */}
      {/* ── ส่วนการสอบกลางภาค / ปลายภาค ── */}
<section style={{ padding: "10px 24px 50px" }}>
  <div
    style={{
      maxWidth: "900px",
      margin: "0 auto",
      background:
        "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      borderRadius: "32px",
      padding: "48px 32px",
      textAlign: "center",
      boxShadow: "0 20px 45px rgba(15, 23, 42, 0.18)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* แสงตกแต่งด้านบน */}
    <div
      style={{
        position: "absolute",
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        background: "rgba(59, 130, 246, 0.15)",
        top: "-80px",
        right: "-50px",
      }}
    />

    <div
      style={{
        position: "absolute",
        width: "140px",
        height: "140px",
        borderRadius: "50%",
        background: "rgba(245, 158, 11, 0.10)",
        bottom: "-70px",
        left: "-40px",
      }}
    />

    {/* หัวข้อ */}
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "#ffffff",
        color: "#0f172a",
        padding: "8px 20px",
        borderRadius: "100px",
        fontSize: "14px",
        fontWeight: "800",
        marginBottom: "18px",
      }}
    >
      📝 ระบบการสอบออนไลน์
    </div>

    <h2
      style={{
        color: "#ffffff",
        fontSize: "clamp(24px, 4vw, 30px)",
        fontWeight: "800",
        marginBottom: "10px",
      }}
    >
      เข้าสู่การสอบ
    </h2>

    <p
      style={{
        color: "#cbd5e1",
        fontSize: "15px",
        lineHeight: "1.7",
        marginBottom: "8px",
      }}
    >
      กรุณาเลือกรอบสอบที่ต้องการทำข้อสอบ
    </p>

    {/* ข้อความแนะนำให้คลิก */}
    <div
      style={{
        display: "inline-block",
        marginBottom: "30px",
        padding: "8px 18px",
        borderRadius: "100px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fbbf24",
        fontSize: "14px",
        fontWeight: "700",
      }}
    >
      👆 คลิกที่ปุ่มด้านล่างเพื่อเข้าสู่การสอบ
    </div>

    {/* ปุ่มสอบ */}
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "20px",
      }}
    >
      {/* ── สอบกลางภาค ── */}
      <button
        onClick={() => navigate("/exam-midterm")}
        style={{
          ...examButtonStyle,
          border: "3px solid #3b82f6",
          boxShadow: "0 10px 25px rgba(59, 130, 246, 0.15)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#60a5fa";
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow =
            "0 18px 35px rgba(59, 130, 246, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#3b82f6";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 10px 25px rgba(59, 130, 246, 0.15)";
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "#eff6ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "34px",
          }}
        >
          📝
        </div>

        <div
          style={{
            fontSize: "20px",
            fontWeight: "800",
            color: "#0f172a",
          }}
        >
          สอบกลางภาค
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          Midterm Examination
        </div>

        <div
          style={{
            marginTop: "4px",
            padding: "8px 18px",
            borderRadius: "100px",
            background: "#3b82f6",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          คลิกเพื่อเข้าสอบ →
        </div>
      </button>

      {/* ── สอบปลายภาค ── */}
      <button
        onClick={() => navigate("/exam-final")}
        style={{
          ...examButtonStyle,
          border: "3px solid #f59e0b",
          boxShadow: "0 10px 25px rgba(245, 158, 11, 0.15)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#fbbf24";
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow =
            "0 18px 35px rgba(245, 158, 11, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#f59e0b";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 10px 25px rgba(245, 158, 11, 0.15)";
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "#fffbeb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "34px",
          }}
        >
          📄
        </div>

        <div
          style={{
            fontSize: "20px",
            fontWeight: "800",
            color: "#0f172a",
          }}
        >
          สอบปลายภาค
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          Final Examination
        </div>

        <div
          style={{
            marginTop: "4px",
            padding: "8px 18px",
            borderRadius: "100px",
            background: "#f59e0b",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "700",
          }}
        >
          คลิกเพื่อเข้าสอบ →
        </div>
      </button>
    </div>

    {/* ข้อความด้านล่าง */}
    <p
      style={{
        marginTop: "28px",
        marginBottom: 0,
        color: "#94a3b8",
        fontSize: "13px",
      }}
    >
      💡 เลือกประเภทการสอบ แล้วเลือกสาขาวิชาและระดับชั้นของคุณ
    </p>
  </div>
</section>

      {/* ── ปุ่มเข้าเรียนหลัก (Primary CTA) ── */}
      <section style={{ padding: "0 24px 60px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/courses")}
          style={{
            background: "#3b82f6", color: "#fff",
            border: "none", padding: "20px 56px",
            borderRadius: "100px", fontSize: "18px", fontWeight: "700",
            cursor: "pointer", boxShadow: "0 15px 30px rgba(59, 130, 246, 0.25)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 20px 35px rgba(59, 130, 246, 0.35)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 15px 30px rgba(59, 130, 246, 0.25)";
          }}
        >
          เริ่มเข้าสู่บทเรียนตอนนี้ →
        </button>
      </section>

      {/* ── ส่วนแนะนำการใช้งาน ── */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 100px" }}>
        <h2 style={{ textAlign: "center", fontSize: "22px", fontWeight: "700", marginBottom: "40px", color: "#1e293b" }}>
          แนะนำวิธีการใช้งานเบื้องต้น
        </h2>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "24px" 
        }}>
          
          {/* ข้อ 1 */}
          <div style={stepCardStyle}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ fontSize: "19px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>1. เลือกรายวิชา</h3>
            <p style={{ fontSize: "15px", color: "#64748b", lineHeight: "1.6", marginBottom: "20px" }}>
              กดปุ่มเข้าเรียนเพื่อดูรายการวิชาทั้งหมดที่มีในระบบ แบ่งตามระดับชั้นและสาขาวิชา
            </p>
            <button 
              onClick={() => navigate("/courses")}
              style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: "700", cursor: "pointer", padding: 0 }}
            >
              ดูรายวิชาทั้งหมด
            </button>
          </div>

          {/* ข้อ 2 */}
          <div style={stepCardStyle}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>📖</div>
            <h3 style={{ fontSize: "19px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>2. ศึกษาด้วยตนเอง</h3>
            <p style={{ fontSize: "15px", color: "#64748b", lineHeight: "1.6", marginBottom: "20px" }}>
              เลือกบทเรียนที่ต้องการศึกษา ดาวน์โหลดใบงาน หรือดูวิดีโอประกอบการสอนได้ทันที
            </p>
          </div>

          {/* ข้อ 3 */}
          <div style={stepCardStyle}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>💬</div>
            <h3 style={{ fontSize: "19px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>3. ปรึกษาผู้สอน</h3>
            <p style={{ fontSize: "15px", color: "#64748b", lineHeight: "1.6", marginBottom: "20px" }}>
              หากมีข้อสงสัย สามารถติดต่ออาจารย์ผู้สอนผ่านช่องทางที่ระบุไว้ในท้ายบทเรียนนั้นๆ
            </p>
          </div>

        </div>

        {/* ── Banner แนะนำระดับชั้น ── */}
        <div style={{ 
          marginTop: "60px", padding: "40px", background: "#fff", 
          borderRadius: "32px", border: "1px solid #f1f5f9", textAlign: "center" 
        }}>
          <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px" }}>ระดับชั้นที่เปิดให้เข้าศึกษาออนไลน์</h3>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
            {["ปวช. 1-3", "ปวส. 1-2",].map((tag, i) => (
              <span key={i} style={{ padding: "8px 24px", background: "#f1f5f9", borderRadius: "100px", fontSize: "14px", fontWeight: "600" }}>
                {tag}
              </span>
            ))}
          </div>
          <p style={{ marginTop: "32px", fontSize: "14px", color: "#94a3b8" }}>
            * ไม่พบวิชาที่เรียน? ติดต่อห้องวิชาการเพื่อแจ้งปัญหาการใช้งาน
          </p>
        </div>
      </main>

      <footer style={{ 
        padding: "40px 24px", textAlign: "center", borderTop: "1px solid #edf2f7", 
        color: "#94a3b8", fontSize: "14px" 
      }}>
        © 2026 Thabo Tech Online Learning <br/>
        วิทยาลัยเทคโนโลยีวิชาชีพท่าบ่อ
      </footer>
    </div>
  );
}