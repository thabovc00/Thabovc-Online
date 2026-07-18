// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "./supabaseClient"; 
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js'; // ป้องกันปัญหา Vite หา Path ไม่เจอ

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const GRADE_LEVELS = ['ปวช. 1', 'ปวช. 2', 'ปวช. 3', 'ปวส. 1', 'ปวส. 2'];

// รายวิชาภาษาไทยทั้งหมด
const COLLEGE_SUBJECTS = [
  { id: 'ACC-01', name: 'การบัญชีธุรกิจซื้อขายสินค้า 1', department: 'การบัญชี' },
  { id: 'ACC-02', name: 'การบัญชีธุรกิจซื้อขายสินค้า 2', department: 'การบัญชี' },
  { id: 'ACC-03', name: 'การบัญชีเบื้องต้น', department: 'การบัญชี' },
  { id: 'ACC-04', name: 'การพิมพ์ดีดไทยดิจิทัล', department: 'การบัญชี' },
  { id: 'AUT-01', name: 'งานเครื่องมือกลเบื้องต้น', department: 'ช่างยนต์' },
  { id: 'AUT-02', name: 'งานบริการรถยนต์', department: 'ช่างยนต์' },
  { id: 'AUT-03', name: 'งานเครื่องล่างรถยนต์', department: 'ช่างยนต์' },
  { id: 'AUT-04', name: 'เชื้อเพลิงและวัสดุหล่อลื่น', department: 'ช่างยนต์' },
  { id: 'AUT-05', name: 'วัสดุศาสตร์อุตสาหกรรม', department: 'ช่างยนต์' },
  { id: 'AUT-06', name: 'กลศาสตร์เครื่องกล', department: 'ช่างยนต์' },
  { id: 'AUT-07', name: 'งานจักรยานยนต์', department: 'ช่างยนต์' },
  { id: 'AUT-08', name: 'ความปลอดภัยในการขับขี่จักรยานยนต์', department: 'ช่างยนต์' },
  { id: 'AUT-09', name: 'งานส่งกำลังรถยนต์', department: 'ช่างยนต์' },
  { id: 'AUT-10', name: 'งานเครื่องยนต์เล็ก', department: 'ช่างยนต์' },
  { id: 'AUT-11', name: 'งานเชื่อมและโลหะแผ่นเบื้องต้น', department: 'ช่างยนต์' },
  { id: 'DIG-01', name: 'การเขียนโปรแกรมประยุกต์', department: 'ธุรกิจดิจิทัล' },
  { id: 'DIG-02', name: 'การบำรุงรักษาคอมพิวเตอร์', department: 'ธุรกิจดิจิทัล' },
  { id: 'DIG-03', name: 'คณิตศาสตร์คอมพิวเตอร์', department: 'ธุรกิจดิจิทัล' },
  { id: 'DIG-04', name: 'ระบบเครือข่ายคอมพิวเตอร์', department: 'ธุรกิจดิจิทัล' },
  { id: 'DIG-05', name: 'ระบบปฏิบัติการคอมพิวเตอร์', department: 'ธุรกิจดิจิทัล' },
  { id: 'DIG-06', name: 'เทคโนโลยีดิจิทัลเพื่อการจัดการอาชีพ', department: 'ธุรกิจดิจิทัล' },
  { id: 'DIG-07', name: 'การพัฒนาแอปพลิเคชันบนอุปกรณ์เคลื่อนที่', department: 'ธุรกิจดิจิทัล' },
  { id: 'DIG-08', name: 'โปรแกรมนำเสนอข้อมูล', department: 'ธุรกิจดิจิทัล' },
  { id: 'DIG-09', name: 'โปรแกรมจัดพิมพ์รายงาน/ประมวลคำ', department: 'ธุรกิจดิจิทัล' },
  { id: 'ELE-01', name: 'เครื่องกำเนิดไฟฟ้ากระแสสลับ', department: 'ช่างไฟฟ้า' },
  { id: 'ELE-02', name: 'มอเตอร์ไฟฟ้ากระแสสลับ', department: 'ช่างไฟฟ้า' },
  { id: 'ELE-03', name: 'ไฟฟ้าและอิเล็กทรอนิกส์เบื้องต้น', department: 'ช่างไฟฟ้า' },
  { id: 'ELE-04', name: 'การติดตั้งไฟฟ้าในอาคาร', department: 'ช่างไฟฟ้า' },
  { id: 'ELE-05', name: 'วงจรไฟฟ้ากระแสตรง', department: 'ช่างไฟฟ้า' },
  { id: 'ELE-06', name: 'การจัดการพลังงานไฟฟ้า', department: 'ช่างไฟฟ้า' },
  { id: 'ELE-07', name: 'การออกแบบระบบแสงสว่าง', department: 'ช่างไฟฟ้า' },
  { id: 'ELE-08', name: 'อิเล็กทรอนิกส์กำลัง', department: 'ช่างไฟฟ้า' },
  { id: 'ELE-09', name: 'งานทำความเย็นและปรับอากาศ', department: 'ช่างไฟฟ้า' },
  { id: 'ENG-01', name: 'ภาษาอังกฤษเพื่อการสื่อสาร', department: 'หมวดภาษาอังกฤษ' },
  { id: 'ENG-02', name: 'ภาษาอังกฤษในงานอุตสาหกรรม', department: 'หมวดภาษาอังกฤษ' },
  { id: 'ENG-03', name: 'ภาษาอังกฤษอินเทอร์เน็ตและการสืบค้น', department: 'หมวดภาษาอังกฤษ' },
  { id: 'GEN-01', name: 'คณิตศาสตร์พื้นฐานอาชีพ', department: 'วิชาสามัญ' },
  { id: 'GEN-02', name: 'เขียนแบบเทคนิคเบื้องต้น', department: 'วิชาสามัญ' },
  { id: 'GEN-03', name: 'ภาษาไทยเพื่ออาชีพ', department: 'วิชาสามัญ' },
  { id: 'GEN-04', name: 'หน้าที่พลเมืองและศีลธรรม', department: 'วิชาสามัญ' },
  { id: 'GEN-05', name: 'กฎหมายแรงงาน', department: 'วิชาสามัญ' },
  { id: 'GEN-06', name: 'พลศึกษาเพื่อพัฒนาสุขภาพ', department: 'วิชาสามัญ' },
  { id: 'GEN-07', name: 'การพัฒนาเพื่อความยั่งยืน / สิ่งแวดล้อม', department: 'วิชาสามัญ' },
  { id: 'GEN-08', name: 'ภาษาไทยเพื่อการสื่อสาร', department: 'วิชาสามัญ' },
  { id: 'GEN-09', name: 'ประวัติศาสตร์ชาติไทย', department: 'วิชาสามัญ' },
  { id: 'GEN-10', name: 'วิทยาศาสตร์เพื่อพัฒนาทักษะชีวิต', department: 'วิชาสามัญ' },
  { id: 'HOS-01', name: 'กายวิภาคศาสตร์และสรีรวิทยา', department: 'ธุรกิจสถานพยาบาล' },
  { id: 'HOS-02', name: 'วิทยาศาสตร์ประยุกต์ในธุรกิจสุขภาพ', department: 'ธุรกิจสถานพยาบาล' },
  { id: 'HOS-03', name: 'คณิตศาสตร์ธุรกิจ', department: 'ธุรกิจสถานพยาบาล' },
  { id: 'HOS-04', name: 'การบริการปฐมพยาบาลเบื้องต้น', department: 'ธุรกิจสถานพยาบาล' },
  { id: 'HOS-05', name: 'สุขศึกษาและการเสื่อมสภาพตามวัย', department: 'ธุรกิจสถานพยาบาล' },
  { id: 'HOS-06', name: 'ความปลอดภัยด้านสุขภาพ', department: 'ธุรกิจสถานพยาบาล' },
  { id: 'HOS-07', name: 'ความปลอดภัยในงานบริการดูแลสุขภาพ', department: 'ธุรกิจสถานพยาบาล' },
  { id: 'HOS-08', name: 'เครื่องมือและอุปกรณ์ทางการแพทย์เบื้องต้น', department: 'ธุรกิจสถานพยาบาล' },
  { id: 'MKT-01', name: 'ธุรกิจเบื้องต้น', department: 'การตลาด' },
  { id: 'MKT-02', name: 'ศิลปะการขายและการตลาดเบื้องต้น', department: 'การตลาด' }
];

export default function ScheduleTable() {
  const navigate = useNavigate();

  // States ข้อมูลหลัก
  const [teachers, setTeachers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [subjects] = useState(COLLEGE_SUBJECTS); 
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // States คัดกรองหน้าตาราง (Filter สำหรับคนดู)
  const [filterMode, setFilterMode] = useState('GRADE'); // 'GRADE' หรือ 'TEACHER'
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ปวช. 1');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('ALL');

  // Search วิชา
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    day: 'Monday',
    startHour: 1,
    duration: 1,
    teacherId: '',
    gradeLevel: 'ปวช. 1',
    subjectId: '', 
    room: ''
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // 1. ดึงรายชื่อครูทั้งหมดมาใช้ใน Select Box
        const { data: teachersData, error: tError } = await supabase
          .from('teachers')
          .select('username, first_name, last_name, category');
        if (tError) throw tError;

        if (teachersData) {
          setTeachers(teachersData.map(t => ({
            id: t.username,
            name: `ครู${t.first_name} ${t.last_name}`,
            category: t.category
          })));
        }

        // 2. ดึงข้อมูลตารางสอนทั้งหมดจากฐานข้อมูลกลาง
        const { data: scheduleData, error: sError } = await supabase
          .from('schedules')
          .select('*');
        if (sError) throw sError;
        if (scheduleData) setSchedules(scheduleData);

      } catch (error) {
        setErrorMessage('❌ โหลดข้อมูลล้มเหลว: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredSubjects = subjects.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sub.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🛡️ ตรวจสอบเงื่อนไขห้ามชนซ้อน ทั้งฝั่งครู และฝั่งนักเรียน (ชั้นปี)
  const checkScheduleConflict = (teacherId, gradeLevel, day, startHour, duration) => {
    const endHour = startHour + duration - 1;

    for (let slot of schedules) {
      if (slot.day === day) {
        const slotStart = slot.start_hour;
        const slotEnd = slot.start_hour + slot.duration - 1;
        const isTimeOverlap = (startHour <= slotEnd && endHour >= slotStart);

        if (isTimeOverlap) {
          // เงื่อนไขที่ 1: ครูคนนี้มีสอนวิชาอื่นอยู่แล้วในชั่วโมงนี้
          if (slot.teacher_id === teacherId) {
            return `❌ ครูท่านนี้มีตารางสอนอื่นซ้อนในช่วงเวลานี้แล้ว!`;
          }
          // เงื่อนไขที่ 2: เด็กชั้นปีนี้ กำลังเรียนวิชาอื่นอยู่แล้วในชั่วโมงนี้
          if (slot.grade_level === gradeLevel) {
            return `❌ ชั้นปี ${gradeLevel} มีเรียนวิชาอื่นในช่วงเวลานี้แล้ว!`;
          }
        }
      }
    }
    return null;
  };

  // 📥 บันทึกข้อมูลเข้าฐานข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const start = parseInt(formData.startHour);
    const dur = parseInt(formData.duration);

    if (!formData.teacherId || !formData.subjectId || !formData.room) {
      setErrorMessage('❌ กรุณากรอกข้อมูลและเลือกครู/วิชาให้ครบถ้วน');
      return;
    }

    // เรียกฟังก์ชันตรวจสอบตารางชน
    const conflictMessage = checkScheduleConflict(formData.teacherId, formData.gradeLevel, formData.day, start, dur);
    if (conflictMessage) {
      setErrorMessage(conflictMessage);
      return;
    }

    try {
      const payload = {
  day: formData.day,
  start_hour: start,
  duration: dur,
  teacher_id: formData.teacherId,
  grade_level: formData.gradeLevel,
  subject_id: formData.subjectId,
  room: formData.room
};
const { data, error } = await supabase.from('schedules').insert([payload]).select();
      if (error) throw error;

      if (data) {
        setSchedules([...schedules, data[0]]);
        setFormData({ ...formData, duration: 1, room: '', subjectId: '' });
        setSearchQuery('');
        alert('📥 บันทึกตารางเรียนลงฐานข้อมูลสำเร็จ!');
      }
    } catch (err) {
      setErrorMessage('❌ ผิดพลาด: ' + err.message);
    }
  };

  // 🧹 ลบข้อมูลตารางเรียน
  const handleDelete = async (id) => {
    if (window.confirm('ต้องการลบข้อมูลตารางนี้ออกจากฐานข้อมูลใช่หรือไม่?')) {
      try {
        const { error } = await supabase.from('schedules').delete().eq('id', id);
        if (error) throw error;
        setSchedules(schedules.filter(item => item.id !== id));
      } catch (err) {
        alert('ลบไม่สำเร็จ: ' + err.message);
      }
    }
  };

  // 📄 ฟังก์ชันพิมพ์ PDF ออกมาทางเครื่องพิมพ์หรือเซฟไฟล์
  const handleExportPDF = () => {
    const element = document.getElementById('timetable-pdf-area');
    const opt = {
      margin:       0.3,
      filename:     `ตารางเรียน_ระบบจัดการกลาง.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (isLoading) {
    return <div className="p-8 text-center font-bold">🔄 กำลังซิงค์ข้อมูลระบบตารางจาก Supabase...</div>;
  }

  return (
    <div className="w-full p-4">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-xl border gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher-profile')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-xl transition duration-150"
          >
            ⬅️ กลับไปหน้าโปรไฟล์
          </button>
          <h1 className="text-xl font-bold text-gray-800">🏫 ระบบจัดตารางเรียนและตารางสอนรวม (ชื่อวิชาภาษาไทย)</h1>
        </div>
        <button onClick={handleExportPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs">
          📄 ส่งออกเป็นไฟล์ PDF
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* แผงฟอร์มกรอกข้อมูล */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border h-fit space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-1">⚙️ ลงทะเบียนคาบเรียน</h2>
          
          {errorMessage && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold border border-red-200">{errorMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">วันเรียน/สอน</label>
              <select className="w-full border rounded-xl p-2 bg-gray-50 text-sm" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})}>
                <option value="Monday">วันจันทร์</option>
                <option value="Tuesday">วันอังคาร</option>
                <option value="Wednesday">วันพุธ</option>
                <option value="Thursday">วันพฤหัสบดี</option>
                <option value="Friday">วันศุกร์</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">เริ่มคาบ</label>
                <select className="w-full border rounded-xl p-2 bg-gray-50 text-sm" value={formData.startHour} onChange={e => setFormData({...formData, startHour: parseInt(e.target.value)})}>
                  {HOURS.map(h => <option key={h} value={h}>คาบที่ {h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">ชั่วโมงเรียน</label>
                <input type="number" min="1" max="5" className="w-full border rounded-xl p-2 bg-gray-50 text-sm" value={formData.duration} onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ระบุชั้นปีนักเรียน (ตารางเรียน)</label>
              <select className="w-full border rounded-xl p-2 bg-gray-50 text-sm font-semibold text-blue-800" value={formData.gradeLevel} onChange={e => setFormData({...formData, gradeLevel: e.target.value})}>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ครูผู้สอน (ตารางสอน)</label>
              <select className="w-full border rounded-xl p-2 bg-gray-50 text-sm" value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} required>
                <option value="">-- เลือกครูผู้สอน --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.category || 'ทั่วไป'})</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-gray-500 mb-1">ค้นหารายวิชา (ภาษาไทย)</label>
              <input type="text" placeholder="🔍 พิมพ์ชื่อวิชา..." value={searchQuery} onFocus={() => setIsDropdownOpen(true)} onChange={e => setSearchQuery(e.target.value)} className="w-full border rounded-xl p-2 bg-gray-50 text-sm" />
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto text-xs">
                  {filteredSubjects.map(sub => (
                    <div key={sub.id} onClick={() => { setFormData({ ...formData, subjectId: sub.id }); setSearchQuery(sub.name); setIsDropdownOpen(false); }} className="p-2 hover:bg-blue-50 cursor-pointer border-b">
                      <span className="font-bold text-gray-900">{sub.name}</span>
                      <span className="block text-gray-400">รหัส: {sub.id} | แผนก: {sub.department}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ห้องเรียน</label>
              <input type="text" placeholder="เช่น ห้องคอม 302" className="w-full border rounded-xl p-2 bg-gray-50 text-sm" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} required />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition">
              📥 เพิ่มและบันทึกลงฐานข้อมูล
            </button>
          </form>
        </div>

        {/* แผงแสดงผลตารางฝั่งขวา */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border xl:col-span-3">
          
          {/* แผงควบคุมสลับโหมดการดูตารางเรียน/ตารางสอน */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 mb-4">
            <div className="flex gap-2">
              <button onClick={() => { setFilterMode('GRADE'); }} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${filterMode === 'GRADE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                🎓 ดูตามตารางเรียน (ชั้นปี)
              </button>
              <button onClick={() => { setFilterMode('TEACHER'); }} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${filterMode === 'TEACHER' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                👤 ดูตามตารางสอน (ครู)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">ตัวกรองส่องตาราง:</span>
              {filterMode === 'GRADE' ? (
                <select value={selectedGradeFilter} onChange={e => setSelectedGradeFilter(e.target.value)} className="border rounded-lg p-1 text-xs font-bold bg-blue-50 text-blue-800">
                  {GRADE_LEVELS.map(g => <option key={g} value={g}>ตารางเรียนชั้นปี: {g}</option>)}
                </select>
              ) : (
                <select value={selectedTeacherFilter} onChange={e => setSelectedTeacherFilter(e.target.value)} className="border rounded-lg p-1 text-xs font-bold bg-purple-50 text-purple-800">
                  <option value="ALL">-- อาจารย์ทุกคน (ตารางรวม) --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* พื้นที่ Render ตารางพิมพ์ออก PDF */}
          <div id="timetable-pdf-area" className="bg-white p-2 overflow-x-auto">
            <div className="text-center mb-4">
              <h2 className="text-base font-bold text-gray-800">
                {filterMode === 'GRADE' ? `📅 แผนผังตารางเรียน ระดับชั้นปี ${selectedGradeFilter}` : `📅 แผนผังตารางสอนบุคลากรครู`}
              </h2>
              <p className="text-[11px] text-gray-400">วิทยาลัยเทคโนโลยีวิชาชีพท่าบ่อ</p>
            </div>

            <div className="min-w-[850px]">
              <div className="grid grid-cols-11 bg-gray-100 p-2 text-center font-bold text-xs rounded-xl mb-2 border">
                <div>วัน / เวลา</div>
                {HOURS.map(h => (
                  <div key={h} className="border-l text-[11px] text-gray-600">
                    คาบ {h} <span className="block text-[9px] font-normal text-gray-400">({h+7}:30)</span>
                  </div>
                ))}
              </div>

              {DAYS.map(day => (
                <div key={day} className="grid grid-cols-11 border-b min-h-[85px] items-center py-1">
                  <div className="font-bold text-center text-xs text-gray-700">
                    {day === 'Monday' && 'จันทร์'}
                    {day === 'Tuesday' && 'อังคาร'}
                    {day === 'Wednesday' && 'พุธ'}
                    {day === 'Thursday' && 'พฤหัสบดี'}
                    {day === 'Friday' && 'ศุกร์'}
                  </div>

                  <div className="col-span-10 grid grid-cols-10 h-full relative">
                    {schedules
                      .filter(slot => {
                        if (slot.day !== day) return false;
                        if (filterMode === 'GRADE') {
                          return slot.grade_level === selectedGradeFilter;
                        } else {
                          return selectedTeacherFilter === 'ALL' || slot.teacher_id === selectedTeacherFilter;
                        }
                      })
                      .map(slot => {
                        const subject = subjects.find(s => s.id === slot.subject_id);
                        const teacher = teachers.find(t => t.id === slot.teacher_id);
                        
                        return (
                          <div
                            key={slot.id}
                            style={{ gridColumn: `${slot.start_hour} / span ${slot.duration}` }}
                            className="border m-0.5 p-2 rounded-xl text-[11px] flex flex-col justify-between bg-blue-50/80 border-blue-200 text-blue-900 group relative shadow-2xs"
                          >
                            <div>
                              <p className="font-bold text-gray-900 overflow-hidden leading-tight whitespace-nowrap">{subject ? subject.name : 'ไม่พบวิชา'}</p>
                              <p className="text-gray-600 font-medium mt-1 overflow-hidden whitespace-nowrap">👤 {teacher ? teacher.name : slot.teacher_id}</p>
                              <p className="text-gray-500 font-semibold overflow-hidden whitespace-nowrap">📍 ห้อง {slot.room} | 🎓 {slot.grade_level}</p>
                            </div>
                            <button type="button" onClick={() => handleDelete(slot.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}