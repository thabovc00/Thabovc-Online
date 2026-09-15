// ExamMidterm.jsx
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
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-AUTO-1-1",
          },
          {
            name: "วิชาที่ 2",
            link: "https://forms.gle/PLACEHOLDER-AUTO-1-2",
          },
          {
            name: "วิชาที่ 3",
            link: "https://forms.gle/PLACEHOLDER-AUTO-1-3",
          },
        ],
      },
      {
        year: "ปวช.2",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-AUTO-2-1",
          },
          {
            name: "วิชาที่ 2",
            link: "https://forms.gle/PLACEHOLDER-AUTO-2-2",
          },
        ],
      },
      {
        year: "ปวช.3",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-AUTO-3-1",
          },
        ],
      },
      {
        year: "ปวส.1",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-AUTOHI-1-1",
          },
        ],
      },
      {
        year: "ปวส.2",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-AUTOHI-2-1",
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
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-ELEC-1-1",
          },
        ],
      },
      {
        year: "ปวส.1",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-ELECHI-1-1",
          },
        ],
      },
    ],
  },

  {
    branch: "ช่างอิเล็กทรอนิกส์",
    years: [
      {
        year: "ปวช.1",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-ELN-1-1",
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
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-ACC-1-1",
          },
        ],
      },
      {
        year: "ปวส.1",
        subjects: [
          {
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-ACCHI-1-1",
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
            name: "วิชาที่ 1",
            link: "https://forms.gle/PLACEHOLDER-COM-1-1",
          },
        ],
      },
    ],
  },
];

const ACCENT = "#3b82f6";
const EXAM_LABEL = "สอบกลางภาค";

export default function ExamMidterm() {
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
  navigate("/");
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

      {/* ── หัวข้อ ── */}
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
          📝 {EXAM_LABEL}
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

      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "20px 24px 100px",
        }}
      >
        {/* ── ขั้นที่ 1: เลือกสาขา ── */}
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

        {/* ── ขั้นที่ 2: เลือกระดับชั้น ── */}
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

        {/* ── ขั้นที่ 3: รายวิชา ── */}
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
                    "#f0f9ff";
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

