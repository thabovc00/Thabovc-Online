/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { supabase } from '../supabaseClient'; 

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_MS = LOCKOUT_MINUTES * 60 * 1000;
const RL_KEY = 'rl_login';

function getRateLimit() {
  try {
    const raw = sessionStorage.getItem(RL_KEY);
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: null };
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}
function setRateLimit(data) { sessionStorage.setItem(RL_KEY, JSON.stringify(data)); }
function resetRateLimit()    { sessionStorage.removeItem(RL_KEY); }

const Login = () => {
  // 🎭 แบ่งประเภทผู้ใช้งานระหว่าง 'student' หรือ 'teacher'
  const [loginMode, setLoginMode] = useState('student'); 
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const tick = () => {
      const rl = getRateLimit();
      if (rl.lockedUntil) {
        const remaining = Math.ceil((rl.lockedUntil - Date.now()) / 1000);
        if (remaining <= 0) { resetRateLimit(); setLockRemaining(0); }
        else setLockRemaining(remaining);
      } else {
        setLockRemaining(0);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // 📝 ล้างค่าสิทธิ์และข้อมูลเก่าทันทีที่ผู้ใช้สลับแท็บ
  const handleModeChange = (mode) => {
    setLoginMode(mode);
    setUsername('');
    setPassword('');
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    if (loginMode === 'student') {
      // ถ้านักเรียน: บังคับเป็นตัวเลขเลขบัตร ไม่เกิน 13 หลัก
      if (/^\d*$/.test(val) && val.length <= 13) setUsername(val);
    } else {
      // ถ้าเป็นครู: พิมพ์ตัวอักษรภาษาอังกฤษ ตัวเลข หรือรหัสทั่วไปได้ตามใจชอบ
      setUsername(val);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const rl = getRateLimit();
    // eslint-disable-next-line react-hooks/purity
    if (rl.lockedUntil && Date.now() < rl.lockedUntil) {
      // eslint-disable-next-line react-hooks/purity
      const mins = Math.ceil((rl.lockedUntil - Date.now()) / 60000);
      Swal.fire({ icon: 'error', title: 'บัญชีถูกล็อกชั่วคราว', text: `กรุณารอ ${mins} นาทีแล้วลองใหม่`, confirmButtonColor: '#ef4444', width: '350px' });
      return;
    }

    // ตรวจสอบความยาวเลขบัตรเฉพาะฝั่งนักเรียน
    if (loginMode === 'student' && username.length !== 13) {
      Swal.fire({ icon: 'warning', title: 'เลขบัตรประชาชนไม่ถูกต้อง', text: 'กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก', confirmButtonColor: '#4A90E2', width: '350px' });
      return;
    }

    setIsLoading(true);
    Swal.fire({
      title: 'กำลังตรวจสอบข้อมูล...',
      allowOutsideClick: false, 
      showConfirmButton: false,
      padding: '2em', 
      width: 'auto', 
      backdrop: 'rgba(0,0,0,0.4)',
      didOpen: () => { Swal.showLoading(); },
    });

    try {
      const cleanUsername = username.trim();

      if (loginMode === 'student') {
        // ==========================================
        // 🧑‍🎓 ฝั่งนักเรียน: ดึงข้อมูลจากตาราง students
        // ==========================================
        const { data: userData, error: userError } = await supabase
          .from('students')                                             
          .select('username, first_name, last_name, phone, category, level, password') 
          .eq('username', cleanUsername)
          .eq('password', password)
          .maybeSingle();

        if (userError) throw userError;

        if (userData) {
          resetRateLimit();

          localStorage.setItem('userName',      userData.username   || '');
          localStorage.setItem('userFirstName', userData.first_name || ''); 
          localStorage.setItem('userLastName',  userData.last_name  || ''); 
          localStorage.setItem('userPhone',     userData.phone      || '');
          localStorage.setItem('userMajor',     userData.category   || '');
          localStorage.setItem('userLevel',     userData.level      || '');
          localStorage.setItem('role',          'student'); 
          localStorage.setItem('userRole',      'student'); 
          localStorage.setItem('isLoggedIn',    'true');
          sessionStorage.setItem('isLoggedIn',  'true');

          const fetchEnrollmentsPromise = supabase
            .from('enrollments')
            .select('course_id')
            .eq('username', userData.username)
            .then(({ data: enrollData, error: enrollError }) => {
              if (!enrollError && enrollData) {
                const courseIds = enrollData.map(item => item.course_id);
                localStorage.setItem('registeredCourses', JSON.stringify(courseIds));
              } else {
                localStorage.setItem('registeredCourses', JSON.stringify([]));
              }
            })
            .catch(err => {
              console.warn('getEnrollments failed:', err);
              localStorage.setItem('registeredCourses', JSON.stringify([]));
            });

          Swal.fire({
            icon: 'success',
            title: 'เข้าสู่ระบบสำเร็จ!',
            html: `ยินดีต้อนรับคุณนักเรียน <b>${userData.first_name}</b>`,
            showConfirmButton: false,
            timer: 450, 
            timerProgressBar: true,
            backdrop: 'rgba(0,0,0,0.4)',
          }).then(async () => {
            await Promise.race([
              fetchEnrollmentsPromise,
              new Promise(resolve => setTimeout(resolve, 400))
            ]);
            navigate('/courses', { replace: true });
          });

        } else {
          handleLoginFailed();
        }

      } else {
        // ==========================================
        // 👨‍🏫 ฝั่งคุณครู: ดึงข้อมูลจากตาราง teachers
        // ==========================================
        // ทำการแปลง Username เป็นตัวพิมพ์เล็กเพื่อให้มีความแม่นยำสูงแบบ Case-insensitive
        const teacherUsernameClean = cleanUsername.toLowerCase();

        // ดึงข้อมูลฟิลด์ที่รองรับทั้งโครงสร้างฐานข้อมูลแบบเก่าและแบบใหม่ป้องกันการพัง
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*') 
          .eq('username', teacherUsernameClean)
          .eq('password', password)
          .maybeSingle();

        if (teacherError) throw teacherError;

        if (teacherData) {
          resetRateLimit();

          // คำนวณหาระบบการเก็บชื่อ (เผื่อโครงสร้างเก่าเก็บเป็น name โครงสร้างใหม่เก็บเป็น first_name/last_name)
          const fName = teacherData.first_name || teacherData.name || '';
          const lName = teacherData.last_name || '';
          const teacherFullName = `${fName} ${lName}`.trim();

          localStorage.setItem('userName',      teacherData.username || '');
          localStorage.setItem('userFirstName', fName); 
          localStorage.setItem('userLastName',  lName); 
          localStorage.setItem('userMajor',     teacherData.category || ''); 
          localStorage.setItem('role',          'teacher'); // 🔑 เคลียร์สิทธิ์ความปลอดภัยหลักป้องกันหน้าจอเตะออก
          localStorage.setItem('userRole',      'teacher'); 
          localStorage.setItem('isLoggedIn',    'true');
          sessionStorage.setItem('isLoggedIn',  'true');

          // ลบสิทธิ์ของเด็กออกเพื่อป้องกันหน้าเว็บสับสนโครงสร้าง UI
          localStorage.removeItem('userPhone');
          localStorage.removeItem('userLevel');
          localStorage.removeItem('registeredCourses');

          Swal.fire({
            icon: 'success',
            title: 'เข้าสู่ระบบผู้ดูแลสำเร็จ!',
            html: `สวัสดีครับคุณครู <b>${teacherFullName || 'ผู้ดูแลระบบ'}</b>`,
            showConfirmButton: false,
            timer: 700,
            timerProgressBar: true,
            backdrop: 'rgba(0,0,0,0.4)',
          }).then(() => {
            navigate('/teacher-profile', { replace: true });
          });

        } else {
          handleLoginFailed();
        }
      }
    } catch (error) {
      console.error("⚡ Connection Error:", error.message);
      Swal.fire({ icon: 'warning', title: 'การเชื่อมต่อมีปัญหา', text: `ไม่สามารถติดต่อฐานข้อมูลได้ (${error.message})`, confirmButtonColor: '#f59e0b', backdrop: 'rgba(0,0,0,0.4)' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginFailed = () => {
    const current = getRateLimit();
    const newAttempts = (current.attempts || 0) + 1;
    const remaining = MAX_ATTEMPTS - newAttempts;

    if (newAttempts >= MAX_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_MS;
      setRateLimit({ attempts: newAttempts, lockedUntil });
      Swal.fire({ icon: 'error', title: 'บัญชีถูกล็อกชั่วคราว', text: `พยายามผิดพลาดเกิน ${MAX_ATTEMPTS} ครั้ง กรุณารอ ${LOCKOUT_MINUTES} นาที`, confirmButtonColor: '#ef4444', backdrop: 'rgba(0,0,0,0.4)' });
    } else {
      setRateLimit({ attempts: newAttempts, lockedUntil: null });
      Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', html: `ข้อมูลชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง<br><small style="color:#94a3b8">เหลืออีก ${remaining} ครั้งก่อนบัญชีจะถูกล็อก</small>`, confirmButtonColor: '#ef4444', confirmButtonText: 'ลองใหม่อีกครั้ง', backdrop: 'rgba(0,0,0,0.4)' });
    }
  };

  const lineUrl  = 'https://line.me/ti/p/~LINE_ID_HERE';
  const isLocked = lockRemaining > 0;
  const lockMins = Math.floor(lockRemaining / 60);
  const lockSecs = lockRemaining % 60;

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.header}>
          <div style={styles.logoBox}>
            <img src="/images/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' }} />
          </div>
          <h2 style={styles.title}>วิทยาลัยเทคโนโลยีวิชาชีพท่าบ่อ</h2>
          <p style={styles.subtitle}>ระบบจัดการเรียนรู้ออนไลน์</p>
        </div>

        <div style={styles.tabContainer}>
          <button 
            type="button" 
            onClick={() => handleModeChange('student')} 
            style={{...styles.tabButton, ...(loginMode === 'student' ? styles.activeTab : {})}}
          >
            👨‍🎓 นักเรียน/นักศึกษา
          </button>
          <button 
            type="button" 
            onClick={() => handleModeChange('teacher')} 
            style={{...styles.tabButton, ...(loginMode === 'teacher' ? styles.activeTab : {})}}
          >
            👨‍🏫 คุณครูผู้สอน
          </button>
        </div>

        {isLocked && (
          <div style={styles.lockBanner}>
            <span style={{ fontSize: '16px' }}>🔒</span>
            <span>บัญชีถูกล็อกชั่วคราว — รออีก <b>{lockMins > 0 ? `${lockMins} นาที ` : ''}{lockSecs} วินาที</b></span>
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              {loginMode === 'student' ? 'เลขบัตรประชาชน' : 'รหัสชื่อผู้ใช้ของคุณครู (Username)'}
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>{loginMode === 'student' ? '🪪' : '👤'}</span>
              <input 
                type="text"
                inputMode={loginMode === 'student' ? 'numeric' : 'text'} 
                placeholder={loginMode === 'student' ? 'กรอกเลข 13 หลัก' : 'กรอกชื่อผู้ใช้ครู'} 
                style={styles.input} 
                value={username} 
                onChange={handleUsernameChange} 
                disabled={isLocked} 
                required 
              />
            </div>
            {loginMode === 'student' && (
              <div style={{ fontSize: '11px', marginTop: '5px', color: username.length === 13 ? '#16a34a' : '#94a3b8' }}>
                {username.length}/13 หลัก {username.length === 13 ? '✓ ครบแล้ว' : ''}
              </div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>รหัสผ่าน</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input type="password" placeholder="กรอกรหัสผ่าน" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLocked} required />
            </div>
          </div>

          <button type="submit" style={{ ...styles.loginBtn, opacity: (isLoading || isLocked) ? 0.5 : 1, cursor: (isLoading || isLocked) ? 'not-allowed' : 'pointer' }} disabled={isLoading || isLocked}>
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : isLocked ? 'บัญชีถูกล็อกชั่วคราว' : `เข้าสู่ระบบแผนก${loginMode === 'student' ? 'นักเรียน' : 'คุณครู'}`}
          </button>

          {loginMode === 'student' && (
            <>
              <div style={styles.divider}><span>หรือ</span></div>
              <button type="button" onClick={() => navigate('/register')} style={styles.regBtn} disabled={isLoading}>
                สมัครสมาชิกใหม่
              </button>
            </>
          )}
        </form>

        <div style={styles.noteBox}>
          <p style={styles.noteTitle}>🔑 ลืมรหัสผ่านหรือพบปัญหาใช้งาน?</p>
          <p style={styles.noteText}>ติดต่อครูแอดมินผู้จัดการระบบได้โดยตรงครับ</p>
          <button type="button" onClick={() => window.open(lineUrl, '_blank')} style={styles.lineBtn}>
            <span style={{ fontSize: '16px' }}>💬</span> ติดต่อผ่าน LINE
          </button>
        </div>

      </div>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '20px' }}>
        © 2026 LearnHub · วิทยาลัยเทคโนโลยีวิชาชีพท่าบ่อ
      </p>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #7c3aed 100%)', fontFamily: "'Kanit', sans-serif" },
  card:      { background: '#fff', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '420px', overflow: 'hidden' },
  header:    { background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', padding: '32px 40px 24px', textAlign: 'center' },
  logoBox:   { width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' },
  title:     { margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff' },
  subtitle:  { margin: '4px 0 0', fontSize: '13px', opacity: 0.8, color: '#bfdbfe' },
  tabContainer: { display: 'flex', background: '#f1f5f9', padding: '6px', margin: '20px 32px 0 32px', borderRadius: '12px' },
  tabButton: { flex: 1, padding: '10px', border: 'none', background: 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Kanit', sans-serif" },
  activeTab: { background: '#fff', color: '#2563eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  lockBanner:{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '10px 20px', fontSize: '13px', color: '#991b1b' },
  form:      { display: 'flex', flexDirection: 'column', padding: '20px 32px 20px' },
  inputGroup:{ marginBottom: '18px' },
  label:     { display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: '600', color: '#374151' },
  inputWrapper: { display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc' },
  inputIcon: { padding: '12px', fontSize: '16px', background: '#f1f5f9', borderRight: '1px solid #e2e8f0' },
  input:     { flex: 1, padding: '12px', border: 'none', outline: 'none', fontSize: '15px', background: 'transparent', fontFamily: "'Kanit', sans-serif", color: '#1e293b' },
  loginBtn:  { background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', padding: '13px', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', fontFamily: "'Kanit', sans-serif", marginTop: '4px' },
  divider:   { textAlign: 'center', margin: '16px 0', color: '#cbd5e1', fontSize: '12px' },
  regBtn:    { background: '#fff', color: '#2563eb', padding: '11px', border: '1.5px solid #2563eb', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: "'Kanit', sans-serif" },
  noteBox:   { margin: '0 32px 28px', padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', textAlign: 'center' },
  noteTitle: { margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#92400e' },
  noteText:  { margin: '0 0 10px', fontSize: '12px', color: '#78716c' },
  lineBtn:   { display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#06c755', color: '#fff', padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer', fontFamily: "'Kanit', sans-serif" },
};

export default Login;