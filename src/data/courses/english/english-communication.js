// src/data/courses/english-communication.js

export const englishCommunicationData = {
  id: "20000-1201-ภาษาอังกฤษเพื่อการสื่อสาร", // ID สำหรับใช้ทำลิงก์ URL
  subjectCode: "20000-1201", 
  teacher: "ครูกมลวรรณ", 
  subject: "ภาษาอังกฤษเพื่อการสื่อสาร",
  category: "english", // หมวดวิชาสามัญ
  level: "ปวช.1", // ระดับชั้น ปวช.1
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // วิดีโอแนะนำรายวิชา
  targetMajors: ["all"], // ใส่ดัก
  contentTitle: "English for Effective Communication",
  content: "วิชานี้เน้นการพัฒนาทักษะการฟัง พูด อ่าน และเขียนภาษาอังกฤษพื้นฐาน เพื่อให้ผู้เรียนมีความมั่นใจในการสื่อสารในชีวิตประจำวันและการทำงานเบื้องต้น เน้นการโต้ตอบที่ถูกต้องตามสถานการณ์และวัฒนธรรมของเจ้าของภาษาครับ",
  
  description: "เสริมสร้างทักษะภาษาอังกฤษที่จำเป็น เพื่อการสื่อสารอย่างมั่นใจในยุคดิจิทัลและโลกแห่งการทำงาน",
  benefits: [
    "สามารถสื่อสารภาษาอังกฤษเบื้องต้นในสถานการณ์ต่างๆ ได้อย่างถูกต้อง",
    "พัฒนาทักษะการฟังและสำเนียงการออกเสียง (Pronunciation) ให้ชัดเจนขึ้น",
    "เพิ่มพูนคลังคำศัพท์ที่จำเป็นสำหรับการทำงานและชีวิตประจำวัน"
  ],
  teacherBio: "อาจารย์ารสอนภาษาอังกฤษเพื่อการสื่อสาร มีเทคนิคการสอนที่เน้นความสนุกสนานและฝึกให้นักเรียนกล้าพูดภาษาอังกฤษในสถานการณ์จริง",
  // คุณสามารถเปลี่ยนเป็น path รูปในเครื่องได้ เช่น avatar: "/images/avatars/kamolwan.jpg"
  avatar: "/images/no.png",  
  color: "#0284c7", // ใช้สีฟ้าสดใสสำหรับวิชาภาษาอังกฤษ
  image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800", // รูปประกอบเกี่ยวกับภาษาอังกฤษ

  // รายการบทเรียนภาษาอังกฤษ
  lessons: [
    { title: "Unit 1: Greeting and Introductions", duration: "10:00", link: "https://youtu.be/..." },
    { title: "Unit 2: Personal Information and Family", duration: "12:30", link: "https://youtu.be/..." },
    { title: "Unit 3: Describing People and Places", duration: "15:45", link: "https://youtu.be/..." },
    { title: "Unit 4: Daily Routine and Free Time Activities", duration: "18:20", link: "https://youtu.be/..." },
    { title: "Unit 5: Food, Drinks and Ordering at a Restaurant", duration: "14:10", link: "https://youtu.be/..." },
    { title: "Unit 6: Shopping and Asking for Prices", duration: "11:50", link: "https://youtu.be/..." },
    { title: "Unit 7: Asking for and Giving Directions", duration: "13:40", link: "https://youtu.be/..." },
    { title: "Unit 8: Making Appointments and Telephone English", duration: "16:15", link: "https://youtu.be/..." },
    { title: "Unit 9: English in Workplace Context", duration: "20:00", link: "https://youtu.be/..." },
    { title: "Unit 10: Travel and Transportation", duration: "14:30", link: "https://youtu.be/..." },
    { title: "Conclusion: Final Project and Self-Evaluation", duration: "08:50", link: "https://youtu.be/..." },
  ]
};