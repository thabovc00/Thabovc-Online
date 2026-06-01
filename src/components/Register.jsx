/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from "/src/supabaseClient"; // 👈 แก้ไขคำสะกดผิดเรียบร้อย

// ============================================================
// [SECURITY] Register rate limiting — ป้องกัน spam สมัครซ้ำ
// ============================================================
const REG_MAX = 3;           // สมัครผิดพลาดได้สูงสุด 3 ครั้ง
const REG_LOCK_MS = 30 * 60 * 1000; // lock 30 นาที
const REG_RL_KEY = 'rl_register';

function getRegRL() {
  try {
    const raw = sessionStorage.getItem(REG_RL_KEY);
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: null };
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}
function setRegRL(data) { sessionStorage.setItem(REG_RL_KEY, JSON.stringify(data)); }
function resetRegRL() { sessionStorage.removeItem(REG_RL_KEY); }

// ============================================================
// [SECURITY] Sanitize — ตัด HTML injection ออกจาก string
// ============================================================
function sanitize(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// ============================================================

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    level: 'ปวช.1',
    category: 'ช่างยนต์',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pwStrength, setPwStrength] = useState(0); // 0-3

  // ============================================================
  // [SECURITY] ตรวจความแข็งแกร่งรหัสผ่าน
  // ============================================================
  function checkStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-zA-Z]/.test(pw) && /\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++; // มีอักขระพิเศษ
    return score;
  }

  const strengthLabel = ['', 'อ่อน', 'ปานกลาง', 'แข็งแกร่ง'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#16a34a'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'username') {
      if (!/^\d*$/.test(value) || value.length > 13) return;
    }
    if (name === 'phone') {
      if (!/^\d*$/.test(value) || value.length > 10) return;
    }
    if (name === 'firstName' || name === 'lastName') {
      if (value !== '' && !/^[ก-๙\s]+$/.test(value)) return;
    }
    if (name === 'password') {
      setPwStrength(checkStrength(value));
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const rl = getRegRL();
    // eslint-disable-next-line react-hooks/purity
    if (rl.lockedUntil && Date.now() < rl.lockedUntil) {
      // eslint-disable-next-line react-hooks/purity
      const mins = Math.ceil((rl.lockedUntil - Date.now()) / 60000);
      Swal.fire({ icon: 'error', title: 'ถูกล็อกชั่วคราว', text: `พยายามสมัครสมาชิกบ่อยเกินไป กรุณารอ ${mins} นาที`, confirmButtonColor: '#ef4444', width: '350px' });
      return;
    }

    if (formData.username.length !== 13) {
      Swal.fire({ icon: 'warning', title: 'เลขบัตรประชาชนไม่ถูกต้อง', text: 'กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก', confirmButtonColor: '#1a73e8', width: '350px' });
      return;
    }
    if (formData.phone.length !== 10) {
      Swal.fire({ icon: 'warning', title: 'เบอร์โทรศัพท์ไม่ถูกต้อง', text: 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก', confirmButtonColor: '#1a73e8', width: '350px' });
      return;
    }
    if (formData.firstName.trim().length < 2) {
      Swal.fire({ icon: 'warning', title: 'ชื่อไม่ถูกต้อง', text: 'กรุณากรอกชื่อจริงให้ถูกต้อง', confirmButtonColor: '#1a73e8', width: '350px' });
      return;
    }
    if (formData.lastName.trim().length < 2) {
      Swal.fire({ icon: 'warning', title: 'นามสกุลไม่ถูกต้อง', text: 'กรุณากรอกนามสกุลให้ถูกต้อง', confirmButtonColor: '#1a73e8', width: '350px' });
      return;
    }
    const passwordValid = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(formData.password);
    if (!passwordValid) {
      Swal.fire({ icon: 'warning', title: 'รหัสผ่านไม่ถูกต้อง', html: 'รหัสผ่านต้องมี<b>อย่างน้อย 8 ตัวอักษร</b><br>และต้องมี<b>ตัวอังกฤษ</b>และ<b>ตัวเลข</b>ผสมกัน', confirmButtonColor: '#1a73e8', width: '350px' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'รหัสผ่านไม่ตรงกัน', text: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน', confirmButtonColor: '#1a73e8', width: '350px' });
      return;
    }

    setIsLoading(true);
    Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      allowOutsideClick: false,
      showConfirmButton: false,
      padding: '2em',
      width: 'auto',
      backdrop: 'rgba(0,0,0,0.4)',
      didOpen: () => { Swal.showLoading(); },
    });

    try {
      const cleanUsername = sanitize(formData.username);

      // ✅ เพิ่ม handle checkError
      const { data: existingUser, error: checkError } = await supabase
        .from('students')
        .select('username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (checkError) throw checkError; // ← เพิ่มบรรทัดนี้

      if (existingUser) {
        handleFailedAttempt('duplicate');
        return;
      }

      const { error: insertError } = await supabase
        .from('students')
        .insert([{
          username: cleanUsername,
          first_name: sanitize(formData.firstName),
          last_name: sanitize(formData.lastName),
          phone: sanitize(formData.phone),
          password: formData.password,
          level: sanitize(formData.level),
          category: sanitize(formData.category),
        }]);

       if (insertError) throw insertError;

      // ✅ Auto-login หลังสมัครสำเร็จ
      localStorage.setItem('userName',      cleanUsername);
      localStorage.setItem('userFirstName', sanitize(formData.firstName));
      localStorage.setItem('userLastName',  sanitize(formData.lastName));
      localStorage.setItem('userPhone',     sanitize(formData.phone));
      localStorage.setItem('userMajor',     sanitize(formData.category));
      localStorage.setItem('userLevel',     sanitize(formData.level));
      localStorage.setItem('isLoggedIn',    'true');
      localStorage.setItem('registeredCourses', JSON.stringify([]));
      sessionStorage.setItem('isLoggedIn',  'true');

      resetRegRL();
      Swal.fire({
        icon: 'success',
        title: 'สมัครสมาชิกสำเร็จ!',
        text: 'กำลังพาเข้าสู่ระบบ...',
        timer: 800,
        timerProgressBar: true,
        showConfirmButton: false,
        width: '350px',
        padding: '1.5em',
        backdrop: 'rgba(0,0,0,0.4)',
      }).then(() => navigate('/courses'));

    } catch (error) {
      console.error('Register error:', error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่',
        confirmButtonColor: '#d33',
        width: '350px',
      });
    } finally {
      setIsLoading(false);
    }
  }; // ← ปิด handleRegister ที่นี่

  // ✅ handleFailedAttempt อยู่นอก handleRegister ถูกต้อง
  const handleFailedAttempt = (type) => {
    const current = getRegRL();
    const newAttempts = (current.attempts || 0) + 1;
    if (newAttempts >= REG_MAX) {
      setRegRL({ attempts: newAttempts, lockedUntil: Date.now() + REG_LOCK_MS });
    } else {
      setRegRL({ attempts: newAttempts, lockedUntil: null });
    }
    const safeMessages = {
      'duplicate': 'เลขบัตรประชาชนนี้มีในระบบแล้ว',
      'server_error': 'การเชื่อมต่อระบบขัดข้อง กรุณาลองใหม่อีกครั้ง',
    };
    const displayMsg = safeMessages[type] || 'ไม่สามารถสมัครสมาชิกได้ กรุณาตรวจสอบข้อมูล';
    Swal.fire({ icon: 'error', title: 'สมัครไม่สำเร็จ', text: displayMsg, confirmButtonColor: '#d33', width: '350px' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>สมัครสมาชิกใหม่</h2>
        <form onSubmit={handleRegister} style={styles.form}>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>ชื่อจริง <span style={styles.note}>*ภาษาไทยเท่านั้น</span></label>
              <input name="firstName" type="text" placeholder="ชื่อ" style={styles.input} value={formData.firstName} onChange={handleChange} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>นามสกุล <span style={styles.note}>*ภาษาไทยเท่านั้น</span></label>
              <input name="lastName" type="text" placeholder="นามสกุล" style={styles.input} value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>เลขบัตรประชาชน <span style={styles.note}>*13 หลักเท่านั้น</span></label>
            <input name="username" type="text" inputMode="numeric" placeholder="x-xxxx-xxxxx-xx-x" style={{ ...styles.input, letterSpacing: '2px' }} value={formData.username} onChange={handleChange} required />
            <div style={{ fontSize: '11px', color: formData.username.length === 13 ? '#16a34a' : '#94a3b8', marginTop: '4px' }}>
              {formData.username.length}/13 หลัก {formData.username.length === 13 && '✓'}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>เบอร์โทรศัพท์ <span style={styles.note}>*10 หลักเท่านั้น</span></label>
            <input name="phone" type="text" inputMode="numeric" placeholder="08xxxxxxxx" style={styles.input} value={formData.phone} onChange={handleChange} required />
            <div style={{ fontSize: '11px', color: formData.phone.length === 10 ? '#16a34a' : '#94a3b8', marginTop: '4px' }}>
              {formData.phone.length}/10 หลัก {formData.phone.length === 10 && '✓'}
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>รหัสผ่าน <span style={styles.note}>*ตัวอังกฤษ+ตัวเลข ขั้นต่ำ 8 ตัว</span></label>
            <input name="password" type="password" placeholder="Password" style={styles.input} value={formData.password} onChange={handleChange} required />
            
            {formData.password.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: pwStrength >= i ? strengthColor[pwStrength] : '#e2e8f0',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: strengthColor[pwStrength] }}>
                  ความแข็งแกร่ง: {strengthLabel[pwStrength]}
                </div>
              </div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>ยืนยันรหัสผ่าน</label>
            <input name="confirmPassword" type="password" placeholder="Confirm Password" style={{
              ...styles.input,
              borderColor: formData.confirmPassword.length > 0
                ? (formData.password === formData.confirmPassword ? '#16a34a' : '#ef4444')
                : '#ccc',
            }} value={formData.confirmPassword} onChange={handleChange} required />
            {formData.confirmPassword.length > 0 && (
              <div style={{ fontSize: '11px', marginTop: '3px', color: formData.password === formData.confirmPassword ? '#16a34a' : '#ef4444' }}>
                {formData.password === formData.confirmPassword ? '✓ รหัสผ่านตรงกัน' : '✗ รหัสผ่านไม่ตรงกัน'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>ชั้นปี</label>
              <select name="level" onChange={handleChange} value={formData.level} style={styles.select}>
                <option value="ปวช.1">ปวช.1</option>
                <option value="ปวช.2">ปวช.2</option>
                <option value="ปวช.3">ปวช.3</option>
                <option value="ปวส.1">ปวส.1</option>
                <option value="ปวส.2">ปวส.2</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label style={styles.label}>สาขาวิชา</label>
              <select name="category" style={styles.select} onChange={handleChange} value={formData.category}>
                <option value="ช่างยนต์">สาขาช่างยนต์</option>
                <option value="ช่างไฟฟ้า">สาขาช่างไฟฟ้า</option>
                <option value="ช่างอิเล็กทรอนิกส์">สาขาช่างอิเล็กทรอนิกส์</option>
                <option value="เทคโนโลยีธุรกิจดิจิทัล">สาขาเทคโนโลยีธุรกิจดิจิทัล</option>
                <option value="ธุรกิจสถานพยาบาล">สาขาธุรกิจสถานพยาบาล</option>
                <option value="การท่องเที่ยว">สาขาการท่องเที่ยว</option>
                <option value="การโรงแรม">สาขาการโรงแรม</option>
                <option value="การตลาด">สาขาการตลาด</option>
                <option value="บัญชี">สาขาบัญชี</option>
                <option value="อาหารและโภชนาการ">สาขาอาหารและโภชนาการ</option>
                <option value="สถาปัตยกรรม">สาขาสถาปัตยกรรม</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            style={{ ...styles.regBtn, background: isLoading ? '#9ca3af' : '#1a73e8', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            disabled={isLoading}
          >
            {isLoading ? 'กำลังประมวลผล...' : 'ยืนยันการสมัคร'}
          </button>

          <button type="button" onClick={() => navigate('/')} style={styles.backBtn} disabled={isLoading}>ยกเลิก</button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Kanit', sans-serif" },
  card: { background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' },
  title: { textAlign: 'center', color: '#1a73e8', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column' },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' },
  note: { color: '#ef4444', fontSize: '11px', fontWeight: 'normal' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', fontFamily: "'Kanit', sans-serif" },
  select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', outline: 'none', fontFamily: "'Kanit', sans-serif" },
  regBtn: { color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', marginTop: '10px', transition: '0.3s', fontFamily: "'Kanit', sans-serif" },
  backBtn: { background: 'none', color: '#666', padding: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', marginTop: '5px', fontFamily: "'Kanit', sans-serif" },
};

export default Register;