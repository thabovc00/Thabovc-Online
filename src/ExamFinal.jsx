// ExamFinal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";

// ── ข้อมูลตัวอย่าง (แก้ชื่อวิชา/ลิงก์ Google Form เองภายหลัง) ──
const EXAM_DATA = [
  {
    branch: "ช่างยนต์",
    years: [
      {
        year: "ปวช.1",
        subjects: [
          {
            name: "ภาษาอังกฤษเพื่อการสื่อสาร",
            link: "https://forms.gle/MoCgN99Ry1QXhu3EA",
          },
          {
            name: "วิชาที่ 2",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-1-2",
          },
          {
            name: "วิชาที่ 3",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-1-3",
          },
        ],
      },
      {
        year: "ปวช.2",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-1",
          },
          {
            name: "วิชาที่ 2",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-2",
          },
        ],
      },
      {
        year: "ปวช.3",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-3-1",
          },
        ],
      },
      {
        year: "ปวส.1",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTOHI-1-1",
          },
        ],
      },
      {
        year: "ปวส.2",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTOHI-2-1",
          },
        ],
      },
    ],
  },

  {
    branch: "ช่างไฟฟ้ากำลัง",
    years: [
      {
        year: "ปวช.1",
        subjects: [
         {
            name: "ภาษาอังกฤษเพื่อการสื่อสาร",
            link: "https://forms.gle/MoCgN99Ry1QXhu3EA",
          },
        ],
      },
      {
        year: "ปวช.2",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-1",
          },
          {
            name: "วิชาที่ 2",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-2",
          },
        ],
      },
      {
        year: "ปวช.3",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-1",
          },
          {
            name: "วิชาที่ 2",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-2",
          },
        ],
      },
      {
        year: "ปวส.1",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-ELECHI-1-1",
          },
        ],
      },
    ],
  },

  {
    branch: "การจัดการธุรกิจสถานพยาบาล",
    years: [
      {
        year: "ปวช.1",
        subjects: [
         {
            name: "ภาษาอังกฤษเพื่อการสื่อสาร",
            link: "https://forms.gle/MoCgN99Ry1QXhu3EA",
          },
        ],
      },
       {
        year: "ปวช.2",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-ELN-1-1",
          },
        ],
      },
      
    ],
  },

  {
    branch: "การบัญชี",
    years: [
      {
        year: "ปวช.1",
        subjects: [
          {
            name: "ภาษาอังกฤษเพื่อการสื่อสาร",
            link: "https://forms.gle/MoCgN99Ry1QXhu3EA",
          },
           {
            name: "พิมพ์ไทยดิจิทัล",
            link: "https://forms.gle/jHb88ZVtaQWLZJzB9",
          },
        ],
      },
      {
        year: "ปวช.2",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-1",
          },
          {
            name: "วิชาที่ 2",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-2",
          },
        ],
      },
      {
        year: "ปวช.3",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-1",
          },
          {
            name: "วิชาที่ 2",
            link: "https://forms.gle/PLACEHOLDER-FIN-AUTO-2-2",
          },
        ],
      },
      {
        year: "ปวส.1",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-FIN-ACCHI-1-1",
          },
        ],
      },
    ],
  },

  {
    branch: "เทคโนโลยีธุรกิจดิจิทัล",
    years: [
      {
        year: "ปวช.1",
        subjects: [
          {
            name: "ภาษาอังกฤษเพื่อการสื่อสาร",
            link: "https://forms.gle/MoCgN99Ry1QXhu3EA",
          },
          {
            name: "โปรแกรมประมวลผลคำ",
            link: "https://forms.gle/tPXL2X9awUTKM6kp7",
          },
          {
            name: "คอมพิวเตอร์และการบำรุงรักษา",
            link: "https://forms.gle/kBxAyGYZH6c75hM26",
          },
          {
            name: "ระบบปฏิบัติการ",
            link: "https://forms.gle/BTMjdfKtErEDLtTN8",
          },
          {
            name: "การพัฒนาอย่างยั่งยืน",
            link: "https://forms.gle/vENC9ieVApdLpvra6",
          },
          {
            name: "ธุรกิจเบื้องต้น",
            link: "https://forms.gle/P7rRPnYJMhgiWTJt8",
          },
          {
            name: "สุขภาพความปลอดภัยและสิ่งแวดล้อม",
            link: "https://forms.gle/cGGfg8GJhd1HjQ4KA",
          },
        ],
      },
      {
        year: "ปวช.2",
        subjects: [
          {
            name: "การเขียนโปรแกรมเชิงวัตถุ",
            link: "https://docs.google.com/forms/d/e/1FAIpQLScW__otH3zR_L82h_YqFrdZd_My803T7dWsWj-IaIqchzi27w/viewform",
          },
          {
            name: "วิชาที่ 2",
            link: "https://forms.gle/PLACEHOLDER-FIN-ACCHI-1-1",
          },
        ],
      },
    ],
  },
];

const ACCENT = "#f59e0b";
const EXAM_LABEL = "สอบปลายภาค";

export default function ExamFinal() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const branchData = EXAM_DATA.find(
    (b) => b.branch === selectedBranch
  );

  const yearData = branchData?.years.find(
    (y) => y.year === selectedYear
  );

  const cardBtnStyle = {
    background: "#ffffff",
    border: "2px solid #e2e8f0",
    borderRadius: "20px",
    padding: "24px 20px",
    cursor: "pointer",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    transition: "all 0.2s ease",
  };

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
    setSelectedYear(null);
    setStep(2);
  };

  const handleYearClick = (year) => {
    setSelectedYear(year);
    setStep(3);
  };

  const goBack = () => {
    if (step === 3) {
      setStep(2);
      setSelectedYear(null);
    } else if (step === 2) {
      setStep(1);
      setSelectedBranch(null);
      setSelectedYear(null);
    } else {
      navigate("/");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        color: "#334155",
        fontFamily: "'Sarabun', sans-serif",
      }}
    >
      <Navbar />

      {/* Header */}
      <section
        style={{
          padding: "60px 24px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "#0f172a",
            color: "#fff",
            padding: "8px 24px",
            borderRadius: "100px",
            fontSize: "14px",
            fontWeight: "700",
            marginBottom: "16px",
          }}
        >
          📄 {EXAM_LABEL}
        </div>

        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          {step === 1 && "เลือกสาขาวิชาของคุณ"}
          {step === 2 &&
            `เลือกระดับชั้น — ${selectedBranch}`}
          {step === 3 &&
            `รายวิชาสอบ — ${selectedBranch} ${selectedYear}`}
        </h1>

        <p
          style={{
            color: "#64748b",
            fontSize: "15px",
          }}
        >
          {step === 1 &&
            "กรุณาเลือกสาขาที่คุณกำลังศึกษาอยู่"}

          {step === 2 &&
            "กรุณาเลือกระดับชั้นปีที่กำลังศึกษา"}

          {step === 3 &&
            "กดที่วิชาเพื่อเข้าทำข้อสอบ"}
        </p>

        <button
          onClick={goBack}
          style={{
            marginTop: "20px",
            background: "none",
            border: "none",
            color: ACCENT,
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          ← ย้อนกลับ
        </button>
      </section>

      {/* Content */}
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px 24px 100px",
        }}
      >
        {/* STEP 1 : เลือกสาขา */}
        {step === 1 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {EXAM_DATA.map((b) => (
              <button
                key={b.branch}
                onClick={() =>
                  handleBranchClick(b.branch)
                }
                style={cardBtnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    ACCENT;
                  e.currentTarget.style.transform =
                    "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "#e2e8f0";
                  e.currentTarget.style.transform =
                    "translateY(0)";
                }}
              >
                {b.branch}
              </button>
            ))}
          </div>
        )}

        {/* STEP 2 : เลือกระดับชั้น */}
        {step === 2 && branchData && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "16px",
            }}
          >
            {branchData.years.map((y) => (
              <button
                key={y.year}
                onClick={() =>
                  handleYearClick(y.year)
                }
                style={cardBtnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    ACCENT;
                  e.currentTarget.style.transform =
                    "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "#e2e8f0";
                  e.currentTarget.style.transform =
                    "translateY(0)";
                }}
              >
                {y.year}
              </button>
            ))}
          </div>
        )}

        {/* STEP 3 : รายวิชา */}
        {step === 3 && yearData && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {yearData.subjects.map((s, i) => (
              <a
                key={i}
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#ffffff",
                  border: "2px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "20px 24px",
                  textDecoration: "none",
                  color: "#0f172a",
                  fontWeight: "700",
                  fontSize: "16px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    ACCENT;
                  e.currentTarget.style.background =
                    "#fffbeb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "#e2e8f0";
                  e.currentTarget.style.background =
                    "#ffffff";
                }}
              >
                <span>{s.name}</span>

                <span
                  style={{
                    color: ACCENT,
                    whiteSpace: "nowrap",
                  }}
                >
                  เข้าสอบ →
                </span>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}