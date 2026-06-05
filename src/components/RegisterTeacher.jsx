/* eslint-disable react-hooks/purity */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from "/src/supabaseClient";

// ============================================================
// [SECURITY] Register rate limiting — ป้องกัน spam สมัครซ้ำ
// ============================================================
const REG_MAX = 3;
const REG_LOCK_MS = 30 * 60 * 1000; // lock 30 นาที
const REG_RL_KEY = 'rl_register_teacher';

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

const RegisterTeacher = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    category: 'ช่างยนต์',
  });
  const [avatarFile, setAvatarFile] = useState(null); // เก็บไฟล์รูปภาพ
  const [isLoading, setIsLoading] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);

  function checkStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-zA-Z]/.test(pw) && /\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  }

  const strengthLabel = ['', 'อ่อน', 'ปานกลาง', 'แข็งแกร่ง'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#16a34a'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'username') {
      if (!/^[a-zA-Z0-9_]*$/.test(value) || value.length > 20) return; // รองรับภาษาอังกฤษและตัวเลขไม่เกิน 20 ตัว
    }
    if (name === 'firstName' || name === 'lastName') {
      if (value !== '' && !/^[ก-๙\s]+$/.test(value)) return;
    }
    if (name === 'password') {
      setPwStrength(checkStrength(value));
    }
    setFormData({ ...formData, [name]: value });
  };

  // ดักจับการเลือกไฟล์ภาพ
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire({ icon: 'warning', title: 'ไฟล์ไม่ถูกต้อง', text: 'กรุณาเลือกไฟล์ที่เป็นรูปภาพเท่านั้น', confirmButtonColor: '#1a73e8', width: '350px' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // จำกัดขนาด 2MB
        Swal.fire({ icon: 'warning', title: 'ไฟล์มีขนาดใหญ่เกินไป', text: 'กรุณาเลือกรูปภาพขนาดไม่เกิน 2MB', confirmButtonColor: '#1a73e8', width: '350px' });
        return;
      }
      setAvatarFile(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const rl = getRegRL();

    if (rl.lockedUntil && Date.now() < rl.lockedUntil) {
      const mins = Math.ceil((rl.lockedUntil - Date.now()) / 60000);
      Swal.fire({ icon: 'error', title: 'ถูกล็อกชั่วคราว', text: `พยายามสมัครสมาชิกบ่อยเกินไป กรุณารอ ${mins} นาที`, confirmButtonColor: '#ef4444', width: '350px' });
      return;
    }

    if (formData.username.trim().length < 4) {
      Swal.fire({ icon: 'warning', title: 'รหัสสมาชิกสั้นเกินไป', text: 'กรุณากรอกรหัสสมาชิกอย่างน้อย 4 ตัวอักษร', confirmButtonColor: '#1a73e8', width: '350px' });
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
    if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      Swal.fire({ icon: 'warning', title: 'รหัสผ่านไม่ถูกต้อง', html: 'รหัสผ่านต้องมี<b>อย่างน้อย 8 ตัวอักษร</b><br>และต้องมี<b>ตัวอังกฤษ</b>และ<b>ตัวเลข</b>ผสมกัน', confirmButtonColor: '#1a73e8', width: '350px' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({ icon: 'warning', title: 'รหัสผ่านไม่ตรงกัน', text: 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน', confirmButtonColor: '#1a73e8', width: '350px' });
      return;
    }
    if (!avatarFile) {
      Swal.fire({ icon: 'warning', title: 'ยังไม่ได้แนบรูปถ่าย', text: 'กรุณาอัปโหลดรูปภาพโปรไฟล์ของคุณครูด้วยครับ', confirmButtonColor: '#1a73e8', width: '350px' });
      return;
    }

    setIsLoading(true);
    Swal.fire({
      title: 'กำลังบันทึกข้อมูลและอัปโหลดรูปภาพ...',
      allowOutsideClick: false,
      showConfirmButton: false,
      padding: '2em',
      width: 'auto',
      backdrop: 'rgba(0,0,0,0.4)',
      didOpen: () => { Swal.showLoading(); },
    });

    try {
      const cleanUsername = sanitize(formData.username).toLowerCase();

      // 1. ตรวจสอบ Username ซ้ำในตารางครู
      const { data: existingUser, error: checkError } = await supabase
        .from('teachers')
        .select('username')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        handleFailedAttempt('duplicate');
        return;
      }

      // 2. อัปโหลดรูปภาพไปที่ Supabase Storage (Bucket: avatars)
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${cleanUsername}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);

      if (uploadError) throw uploadError;

      // ดึง Public URL ของรูปภาพออกมา
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. บันทึกข้อมูลลงตารางครู (teachers)
      const { error: insertError } = await supabase
        .from('teachers')
        .insert([{
          username: cleanUsername,
          password: formData.password,
          first_name: sanitize(formData.firstName),
          last_name: sanitize(formData.lastName),
          category: sanitize(formData.category),
          avatar_url: publicUrl
        }]);

      if (insertError) throw insertError;

      // 4. 🔑 ปรับการบันทึกสถานะลงทะเบียนเพื่อผูกสิทธิ์ครูโดยเฉพาะ (แก้บั๊กเด้งกลับไปหน้านักเรียน)
      localStorage.setItem('userName',      cleanUsername); // เปลี่ยนคีย์เป็นตัว N ใหญ่ตามหน้า Teacher Profile
      localStorage.setItem('userFirstName', sanitize(formData.firstName));
      localStorage.setItem('userLastName',  sanitize(formData.lastName));
      localStorage.setItem('userMajor',     sanitize(formData.category));
      localStorage.setItem('userAvatar',    publicUrl);
      localStorage.setItem('isLoggedIn',    'true');
      
      // ฝัง Role ป้องกัน Navbar หรือหน้ารวมตีความสิทธิ์สับสน
      localStorage.setItem('role',          'teacher'); 
      localStorage.setItem('userRole',      'teacher'); 
      sessionStorage.setItem('isLoggedIn',  'true');

      resetRegRL();
      Swal.fire({
        icon: 'success',
        title: 'สมัครสมาชิกครูสำเร็จ!',
        text: 'กำลังพาเข้าสู่ระบบจัดการ...',
        timer: 1000,
        timerProgressBar: true,
        showConfirmButton: false,
        width: '350px',
      }).then(() => {
        // วิ่งตรงเข้าไปที่หน้าหลักจัดการคอร์สของคุณครูทันที
        navigate('/teacher-profile'); 
      });

    } catch (error) {
      console.error('Register error:', error);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error?.message || 'ระบบขัดข้อง กรุณาลองใหม่', confirmButtonColor: '#d33', width: '350px' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailedAttempt = (type) => {
    const current = getRegRL();
    const newAttempts = (current.attempts || 0) + 1;
    if (newAttempts >= REG_MAX) {
      setRegRL({ attempts: newAttempts, lockedUntil: Date.now() + REG_LOCK_MS });
    } else {
      setRegRL({ attempts: newAttempts, lockedUntil: null });
    }
    const safeMessages = {
      'duplicate': 'รหัสสมาชิกนี้มีในระบบแล้ว',
    };
    const displayMsg = safeMessages[type] || 'ไม่สามารถสมัครได้ กรุณาตรวจสอบข้อมูล';
    Swal.fire({ icon: 'error', title: 'สมัครไม่สำเร็จ', text: displayMsg, confirmButtonColor: '#d33', width: '350px' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>สมัครสมาชิก (สำหรับครู)</h2>
        <form onSubmit={handleRegister} style={styles.form}>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>ชื่อจริง <span style={styles.note}>*ภาษาไทย</span></label>
              <input name="firstName" type="text" placeholder="ชื่อ" style={styles.input} value={formData.firstName} onChange={handleChange} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>นามสกุล <span style={styles.note}>*ภาษาไทย</span></label>
              <input name="lastName" type="text" placeholder="นามสกุล" style={styles.input} value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>รหัสสมาชิก / Username</label>
            <input name="username" type="text" placeholder="ภาษาอังกฤษหรือตัวเลข" style={styles.input} value={formData.username} onChange={handleChange} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>อัปโหลดรูปถ่ายโปรไฟล์ <span style={styles.note}>*ไม่เกิน 2MB</span></label>
            <input type="file" accept="image/*" onChange={handleFileChange} style={styles.fileInput} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>สาขาวิชาที่สังกัด</label>
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

          <div style={styles.inputGroup}>
            <label style={styles.label}>รหัสผ่าน <span style={styles.note}>*อังกฤษ+ตัวเลข ขั้นต่ำ 8 ตัว</span></label>
            <input name="password" type="password" placeholder="Password" style={styles.input} value={formData.password} onChange={handleChange} required />
            {formData.password.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: pwStrength >= i ? strengthColor[pwStrength] : '#e2e8f0', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: strengthColor[pwStrength] }}>ความแข็งแกร่ง: {strengthLabel[pwStrength]}</div>
              </div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>ยืนยันรหัสผ่าน</label>
            <input name="confirmPassword" type="password" placeholder="Confirm Password" style={{ ...styles.input, borderColor: formData.confirmPassword.length > 0 ? (formData.password === formData.confirmPassword ? '#16a34a' : '#ef4444') : '#ccc' }} value={formData.confirmPassword} onChange={handleChange} required />
            {formData.confirmPassword.length > 0 && (
              <div style={{ fontSize: '11px', marginTop: '3px', color: formData.password === formData.confirmPassword ? '#16a34a' : '#ef4444' }}>
                {formData.password === formData.confirmPassword ? '✓ รหัสผ่านตรงกัน' : '✗ รหัสผ่านไม่ตรงกัน'}
              </div>
            )}
          </div>

          <button type="submit" style={{ ...styles.regBtn, background: isLoading ? '#9ca3af' : '#1a73e8', cursor: isLoading ? 'not-allowed' : 'pointer' }} disabled={isLoading}>
            {isLoading ? 'กำลังบันทึกข้อมูล...' : 'ยืนยันการสมัครสมาชิกครู'}
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
  title: { textAlign: 'center', color: '#1a73e8', marginBottom: '20px', fontSize: '22px', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column' },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' },
  note: { color: '#ef4444', fontSize: '11px', fontWeight: 'normal' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', fontFamily: "'Kanit', sans-serif" },
  fileInput: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: "'Kanit', sans-serif", background: '#fafafa' },
  select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', outline: 'none', fontFamily: "'Kanit', sans-serif" },
  regBtn: { color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', marginTop: '10px', transition: '0.3s', fontFamily: "'Kanit', sans-serif" },
  backBtn: { background: 'none', color: '#666', padding: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', marginTop: '5px', fontFamily: "'Kanit', sans-serif" },
};

export default RegisterTeacher;