# Project 1: Sports Facility Booking System (ระบบจองสถานที่และสนามกีฬา)

รหัสนิสิต: **6730508321**

พัฒนาระบบ **Sports Facility Booking System** สำหรับค้นหา จัดการ และจองสนามกีฬา (สนามแบดมินตัน สนามเทนนิส สนามฟุตซอล ห้องออกกำลังกาย และสนามบาสเกตบอล) โดยแบ่งเป็น:
- **Backend (`backend/`)**: Node.js, Express 5, MongoDB (Mongoose), JWT Authentication & Role-Based Authorization, Swagger UI (`/api-docs`)
- **Frontend (`frontend/`)**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons

---

## 1. User Interface Flow Diagram

```mermaid
flowchart TD
    Visitor["ผู้เยี่ยมชม (Public / Guest)"] --> Home["หน้าแรก & รายการสนามกีฬา (/)"]
    Home --> SearchFilter["ค้นหา / กรองประเภทกีฬา / กรองราคา / เรียงลำดับ"]
    Home --> FacilityDetail["หน้ารายละเอียดสนาม & ตารางเวลาว่าง (/facilities/[id])"]
    
    Visitor --> AuthPage["หน้าเข้าสู่ระบบ / สมัครสมาชิก (/login, /register)"]
    AuthPage -->|"เข้าสู่ระบบด้วย Email & Password"| JWT["รับ JWT Token (เก็บแยกต่อ Tab ด้วย sessionStorage)"]

    JWT --> RoleCheck{"ตรวจสอบ Role"}

    RoleCheck -->|"Role: member"| MemberFlow["Member Workspace"]
    MemberFlow --> CreateBooking["จองสนามกีฬา (เลือกวัน + Visual Time-Slot Grid 0.5-2 ชม. + คำนวณราคาอัตโนมัติ)"]
    MemberFlow --> MyBookings["รายการจองของฉัน (/bookings)"]
    MyBookings --> EditOwnBooking["แก้ไขวัน/เวลา/สนาม (ตรวจสอบไม่ให้เวลาชนกัน)"]
    MyBookings --> DeleteOwnBooking["ยกเลิกการจอง (Delete)"]
    MyBookings --> BookingPass["ดูบัตรจอง Digital QR Booking Pass & Export CSV"]

    RoleCheck -->|"Role: admin"| AdminFlow["Admin Workspace (/admin)"]
    AdminFlow --> ManageFacilities["จัดการสนามกีฬา (Add / Edit / Soft-Delete Facility)"]
    AdminFlow --> ManageAllBookings["จัดการการจองของทุกคน (View / Edit / Delete Any Booking)"]
    AdminFlow --> Analytics["Admin Analytics Dashboard (รายได้รวม, ชั่วโมงการจอง, สนามยอดนิยม)"]
```

---

## 2. ความสามารถของระบบตามโจทย์ (Core Functionalities)

1. **User Management**:
   - รองรับผู้ใช้ 2 roles: `admin` และ `member`
   - ลงทะเบียนระบุ `name`, `email`, `tel`, `role`, และ `password`
   - Login / Logout ด้วย `email` และ `password` พร้อมรับ JWT Token (`Authorization: Bearer <token>`)
2. **Sports Facility Management**:
   - ผู้ใช้ทุกคนดูรายการและรายละเอียด Sports Facility ได้ (`name`, `sportType`, `location`, `capacity`, `hourlyRate`)
   - `admin` สามารถเพิ่ม (Add), แก้ไข (Update), ลบ (Delete), และดู (View) ข้อมูล Sports Facility
3. **Facility Booking Management**:
   - `member` สามารถสร้างการจองโดยระบุ `facility id`, `bookingDate`, `startTime`, และ `durationHours`
   - `member` สามารถดู แก้ไข และลบการจองของตนเอง
   - `admin` สามารถดู แก้ไข และลบการจองของ user คนใดก็ได้
4. **Conditions (เงื่อนไขการจอง)**:
   - วันที่จองต้องไม่เป็นวันก่อนหน้าวันปัจจุบัน
   - จองได้สูงสุดไม่เกิน **2 ชั่วโมง** ต่อ 1 การจอง (`0.5` - `2.0` ชั่วโมง)
   - `member` คนเดียวกันสร้างการจองที่มีเวลาซ้อนทับกันไม่ได้
   - `facility` เดียวกันถูกจองซ้อนเวลาโดยผู้ใช้มากกว่า 1 รายไม่ได้

---

## 3. Additional Functionalities (ฟีเจอร์เสริม)

- **Interactive Visual Time-Slot Availability Grid**: ตารางตรวจสอบช่วงเวลาว่างราย 30 นาที (`06:00` - `22:00`) แยกสีสถานะระหว่าง *ว่าง (Available)*, *คุณจองไว้แล้ว (Your Booking)*, *ชนคิวคุณในสนามอื่น (Member Conflict)*, และ *มีผู้อื่นจองแล้ว (Booked)*
- **Real-Time Price Calculator**: คำนวณค่าบริการอัตโนมัติ (`hourlyRate × durationHours`) ก่อนกดยืนยัน
- **Multi-Tab Independent Session (`sessionStorage`)**: สามารถเปิด 2 Tab ในเบราว์เซอร์เดียวกันเพื่อล็อกอิน `admin` และ `member` ควบคู่กันขณะสาธิตได้ทันที
- **Digital QR Booking Pass & Print Receipt**: บัตรผ่านเข้าสนามพร้อม QR Code และรหัสอ้างอิง สั่งพิมพ์หรือบันทึกเป็น PDF ได้
- **Export Bookings to CSV**: ส่งออกข้อมูลการจองเป็นไฟล์ `.csv`
- **Admin Analytics Dashboard**: สรุปยอดรายได้ประเมินรวม จำนวนชั่วโมงการจอง และกราฟสัดส่วนความนิยมของแต่ละสนาม
- **Bilingual UI (TH / EN)**: สลับภาษาไทย / อังกฤษ ได้ทันทีจากแถบเมนูด้านบน

---

## 4. วิธีติดตั้งและรันโปรแกรม (Setup & Run)

### 1) ตั้งค่าและรัน Backend (`http://localhost:5000`)
```bash
cd backend
npm install
# ตั้งค่า MONGO_URI ในไฟล์ backend/config/config.env
npm run seed       # สร้างข้อมูลตัวอย่าง (Users 3 บัญชี, Facilities 6 แห่ง, Bookings 5 รายการ)
npm run dev        # รัน Backend ที่ http://localhost:5000 (Swagger: http://localhost:5000/api-docs)
```

### 2) ตั้งค่าและรัน Frontend (`http://localhost:3000`)
```bash
cd frontend
npm install
npm run dev        # รัน Frontend ที่ http://localhost:3000
```

### บัญชีผู้ใช้งานตัวอย่าง (Seeded Accounts)
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@sportbooking.com` | `password123` |
| **Member 1** | `member1@sportbooking.com` | `password123` |
| **Member 2** | `member2@sportbooking.com` | `password123` |
