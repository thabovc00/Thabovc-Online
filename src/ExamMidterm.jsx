/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { supabase } from "./supabaseClient";
import Swal from "sweetalert2";

// โครงสร้างสาขาและชั้นปีของวิทยาลัย
const BRANCH_STRUCTURE = [
  { branch: "ช่างยนต์", years: ["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"] },
  { branch: "ช่างไฟฟ้ากำลัง", years: ["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1"] },
  { branch: "การจัดการธุรกิจสถานพยาบาล", years: ["ปวช.1", "ปวช.2"] },
  { branch: "การบัญชี", years: ["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1"] },
  { branch: "เทคโนโลยีธุรกิจดิจิทัล", years: ["ปวช.1", "ปวช.2"] },
];

const PRIMARY_COLOR = "#0284c7"; // สีฟ้ากลางภาค

export default function ExamMidterm() {
  const navigate = useNavigate();

  // Navigation Steps
  const [step, setStep] = useState(1);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  // Exam Data State
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State (สำหรับครูเพิ่ม/แก้ไขรายวิชา)
  const [subjectName, setSubjectName] = useState("");
  const [examLink, setExamLink] = useState("");
  const [editingId, setEditingId] = useState(null);

  // ตรวจสอบสิทธิ์ผู้ใช้
  const userRole = localStorage.getItem("userRole") || "student";
  const isTeacher = userRole === "teacher";

  // ดึงข้อมูลรายวิชาสอบกลางภาคจาก Supabase
  const fetchExams = async () => {
    if (!selectedBranch || !selectedYear) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("exam_midterm")
        .select("*")
        .eq("branch", selectedBranch)
        .eq("year", selectedYear)
        .order("id", { ascending: true });

      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error("Error fetching exams:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 3) {
      fetchExams();
    }
  }, [step, selectedBranch, selectedYear]);

  // บันทึก / อัปเดต รายวิชาสอบ (เฉพาะครู)
  const handleSaveSubject = async (e) => {
    e.preventDefault();

    let cleanLink = examLink.trim();
    const cleanSubject = subjectName.trim();

    if (!cleanSubject || !cleanLink) {
      Swal.fire("กรอกข้อมูลไม่ครบ", "กรุณาระบุทั้งชื่อวิชาและลิงก์ข้อสอบ", "warning");
      return;
    }

    if (!cleanLink.startsWith("http://") && !cleanLink.startsWith("https://")) {
      cleanLink = "https://" + cleanLink;
    }

    try {
      Swal.showLoading();

      if (editingId) {
        // กรณีแก้ไขวิชาเดิม
        const { error } = await supabase
          .from("exam_midterm")
          .update({
            subject_name: cleanSubject,
            link: cleanLink,
          })
          .eq("id", editingId);

        if (error) throw error;
        Swal.fire({ icon: "success", title: "แก้ไขข้อสอบเรียบร้อย", timer: 1500, showConfirmButton: false });
      } else {
        // เช็กก่อนว่ามีวิชานี้ใน สาขา + ชั้นปี นี้แล้วหรือยัง
        const { data: existing, error: checkError } = await supabase
          .from("exam_midterm")
          .select("id")
          .eq("branch", selectedBranch)
          .eq("year", selectedYear)
          .eq("subject_name", cleanSubject)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          const { error: updateError } = await supabase
            .from("exam_midterm")
            .update({ link: cleanLink })
            .eq("id", existing.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("exam_midterm")
            .insert([
              {
                branch: selectedBranch,
                year: selectedYear,
                subject_name: cleanSubject,
                link: cleanLink,
              },
            ]);

          if (insertError) throw insertError;
        }

        Swal.fire({ icon: "success", title: "บันทึกข้อสอบเรียบร้อย", timer: 1500, showConfirmButton: false });
      }

      setSubjectName("");
      setExamLink("");
      setEditingId(null);
      fetchExams();
    } catch (err) {
      console.error("Save exam error:", err);
      Swal.fire("เกิดข้อผิดพลาดในการบันทึก", err.message || "ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  };

  // เตรียมข้อมูลขึ้นฟอร์มเพื่อแก้ไข
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setSubjectName(item.subject_name);
    setExamLink(item.link);
  };

  // ยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setEditingId(null);
    setSubjectName("");
    setExamLink("");
  };

  // ลบรายวิชาสอบ
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "ต้องการลบวิชาสอบนี้ใช่หรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบวิชาสอบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from("exam_midterm").delete().eq("id", id);
        if (error) throw error;

        Swal.fire({ icon: "success", title: "ลบวิชาสอบแล้ว", timer: 1200, showConfirmButton: false });
        fetchExams();
      } catch (err) {
        Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
      }
    }
  };

  // การย้อนกลับ
  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setSelectedYear(null);
      handleCancelEdit();
    } else if (step === 2) {
      setStep(1);
      setSelectedBranch(null);
    } else {
      navigate("/");
    }
  };

  return (
      <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Sarabun', sans-serif" }}>
        <Navbar />
  
        {/* Header */}
        <section style={{ padding: "40px 24px 10px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#0f172a", color: "#fff", padding: "6px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>
            📝 ระบบสอบปลายภาค {isTeacher && "• (โหมดอาจารย์ผู้สอน)"}
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px" }}>
            {step === 1 && "เลือกสาขาวิชา"}
            {step === 2 && `ระดับชั้น — ${selectedBranch}`}
            {step === 3 && `รายการข้อสอบ — ${selectedBranch} (${selectedYear})`}
          </h1>
          <button onClick={handleBack} style={{ background: "none", border: "none", color: PRIMARY_COLOR, fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
            ← ย้อนกลับ
          </button>
        </section>
  
        {/* Main Content */}
        <main style={{ maxWidth: "800px", margin: "0 auto", padding: "20px 24px 80px" }}>
          {/* STEP 1: เลือกสาขา */}
          {step === 1 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {BRANCH_STRUCTURE.map((b) => (
                <button
                  key={b.branch}
                  onClick={() => { setSelectedBranch(b.branch); setStep(2); }}
                  style={{
                    background: "#fff",
                    border: "2px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "24px 16px",
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#0f172a",
                    cursor: "pointer",
                  }}
                >
                  {b.branch}
                </button>
              ))}
            </div>
          )}
  
          {/* STEP 2: เลือกระดับชั้น */}
          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
              {BRANCH_STRUCTURE.find((b) => b.branch === selectedBranch)?.years.map((y) => (
                <button
                  key={y}
                  onClick={() => { setSelectedYear(y); setStep(3); }}
                  style={{
                    background: "#fff",
                    border: "2px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "20px 16px",
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#0f172a",
                    cursor: "pointer",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
  
          {/* STEP 3: จัดการ / แสดงข้อสอบ */}
          {step === 3 && (
            <div>
              {/* ฟอร์มเพิ่ม/แก้ไขข้อสอบ (แสดงเฉพาะบัญชีครู) */}
              {isTeacher && (
                <form
                  onSubmit={handleSaveSubject}
                  style={{
                    background: editingId ? "#fffbeb" : "#f0fdf4",
                    border: `2px dashed ${editingId ? "#f59e0b" : "#22c55e"}`,
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ fontWeight: "700", fontSize: "15px", color: editingId ? "#b45309" : "#15803d", marginBottom: "12px" }}>
                    {editingId ? "✏️ แก้ไขลิงก์ข้อสอบ" : "➕ เพิ่มรายวิชาและลิงก์ข้อสอบใหม่"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <input
                      type="text"
                      placeholder="ชื่อรายวิชา (เช่น วิชาการงานอาชีพ)"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                    />
                    <input
                      type="url"
                      placeholder="ลิงก์ข้อสอบ ([https://forms.google.com/](https://forms.google.com/)...)"
                      value={examLink}
                      onChange={(e) => setExamLink(e.target.value)}
                      style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: editingId ? "#f59e0b" : "#16a34a",
                          color: "#fff",
                          border: "none",
                          borderRadius: "10px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        {editingId ? "บันทึกการแก้ไข" : "บันทึกวิชาสอบ"}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          style={{ padding: "10px 16px", background: "#64748b", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}
                        >
                          ยกเลิก
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              )}
  
              {/* รายการวิชาสอบ */}
              {loading ? (
                <div style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>กำลังโหลดข้อมูลข้อสอบ...</div>
              ) : exams.length === 0 ? (
                <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>ยังไม่มีรายการข้อสอบในระดับชั้นนี้</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {exams.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>{item.subject_name}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          🔗 {item.link}
                        </div>
                      </div>
  
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "#fffbeb",
                            color: PRIMARY_COLOR,
                            padding: "8px 16px",
                            borderRadius: "10px",
                            textDecoration: "none",
                            fontWeight: "700",
                            fontSize: "14px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          เข้าสอบ →
                        </a>
  
                        {/* ปุ่มจัดการวิชา (เฉพาะครู) */}
                        {isTeacher && (
                          <>
                            <button
                              onClick={() => handleEditClick(item)}
                              style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "8px 12px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
                            >
                              ✏️ แก้ไข
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              style={{ background: "#fef2f2", color: "#ef4444", border: "none", padding: "8px 12px", borderRadius: "10px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    );
  }