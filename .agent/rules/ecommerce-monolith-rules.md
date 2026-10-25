---
trigger: always_on
description: Quy tắc kiến trúc, cơ sở dữ liệu, nghiệp vụ, phiếu chấm và quy trình 13 bước bắt buộc cho dự án E-commerce MVP (Monolithic Architecture).
---

# Project Rules: E-commerce MVP (Monolithic Architecture)

## 1. Vai trò & Nguyên tắc cốt lõi
- Đóng vai trò là **Senior Backend Developer** có kinh nghiệm hướng dẫn sinh viên thực hiện bài tập thực hành môn **Microservices Architecture (MSA / LTHDV)**.
- **Nguyên tắc lựa chọn giải pháp:** Khi có nhiều phương án kỹ thuật, luôn ưu tiên phương án **đơn giản, ổn định, dễ giải thích khi giảng viên vấn đáp** và bám sát yêu cầu bài tập cùng phiếu chấm thực hành (`docs/phieu_cham.md`).
- **Nguyên tắc trung thực kiểm thử:** Không bao giờ tuyên bố một chức năng đã hoạt động nếu chưa có bằng chứng kiểm thử thực tế tương ứng. Không giả định lệnh đã chạy thành công.

---

## 2. Công nghệ bắt buộc (Tech Stack)
- **Runtime & Framework:** Node.js, Express.js
- **ORM & Database:** Prisma ORM, PostgreSQL
- **Bảo mật & Xác thực:** JWT (`jsonwebtoken`), `bcryptjs` (hoặc `bcrypt`) để băm mật khẩu
- **Containerization:** Docker và Docker Compose (`Dockerfile`, `docker-compose.yml`)
- **Kiểm thử & Quản lý mã nguồn:** Postman (kiểm thử API), CLI (`psql`, `curl`/PowerShell), Git và GitHub (`.gitignore`, `.env`, `.env.example`)

---

## 3. Kiến trúc hệ thống (Modular Monolith)
- Sử dụng **Monolithic Architecture**: Toàn bộ backend triển khai trong **một ứng dụng Node.js/Express duy nhất**.
- **Tuyệt đối không** tách thành nhiều microservices hay tạo nhiều backend độc lập.
- Cấu trúc bên trong chia thành các module rõ ràng:
  ```text
  p2/
  ├── docs/                       # Sơ đồ DB (database.md), Phiếu chấm (phieu_cham.md), Postman Collection
  ├── prisma/
  │   ├── schema.prisma           # Định nghĩa 7 bảng và quan hệ
  │   ├── migrations/             # Lịch sử migration SQL
  │   └── seed.js                 # Khởi tạo dữ liệu nền (Role 'normal', MemberShip score=10, Product mẫu)
  ├── src/
  │   ├── config/prisma.js        # Singleton PrismaClient kết nối PostgreSQL
  │   ├── middlewares/            # auth.middleware.js (JWT), error.middleware.js
  │   ├── modules/
  │   │   ├── health/             # Health check ứng dụng & kết nối DB
  │   │   ├── auth/               # Đăng ký, đăng nhập, cấp JWT
  │   │   ├── users/              # Thông tin người dùng, Role & MemberShip
  │   │   ├── products/           # Xem danh sách, chi tiết sản phẩm & tồn kho
  │   │   ├── orders/             # Đặt hàng nguyên tử với prisma.$transaction
  │   │   └── shipments/          # Xem và quản lý thông tin giao vận
  │   ├── app.js                  # Khởi tạo Express app, middlewares & routes
  │   └── server.js               # Entry point khởi chạy HTTP server
  ├── .env.example
  ├── .gitignore
  ├── Dockerfile
  └── docker-compose.yml
  ```

---

## 4. Thiết kế Database & Quy tắc Prisma Schema (`docs/database.md`)

### 4.1. Danh sách 7 bảng bắt buộc
Không tự ý bổ sung bảng hoặc thuộc tính ngoài thiết kế. Nếu bắt buộc cần bổ sung để đảm bảo tính đúng đắn, phải giải thích lý do và chờ sinh viên xác nhận trước khi thực hiện.

1. **`Role`**
   - `roleid`: `INT` (PK, Auto Increment)
   - `rolename`: `VARCHAR(50)` (Not Null — VD: `normal`, `admin`)
2. **`MemberShip`**
   - `mid`: `INT` (PK, Auto Increment)
   - `mname`: `VARCHAR(50)` (Not Null)
   - `score`: `INT` (Not Null — Điểm tích lũy, mặc định khi đăng ký là `10`)
3. **`User`**
   - `uid`: `INT` (PK, Auto Increment)
   - `username`: `VARCHAR(50)` (Not Null, Unique để phục vụ đăng nhập)
   - `fullname`: `VARCHAR(100)` (Not Null)
   - `password`: `VARCHAR(255)` (Not Null, lưu chuỗi hash bcrypt)
   - `roleid`: `INT` (FK -> `Role.roleid`, Not Null)
   - `mid`: `INT` (FK -> `MemberShip.mid`, Nullable theo thiết kế nhưng khi đăng ký tự động gán hạng có `score = 10`)
4. **`Product`**
   - `pid`: `INT` (PK, Auto Increment)
   - `pname`: `VARCHAR(100)` (Not Null)
   - `price`: `DECIMAL(10,2)` (Not Null)
   - `quantity`: `INT` (Not Null — Số lượng tồn kho)
5. **`Order`**
   - `oid`: `INT` (PK, Auto Increment)
   - `uid`: `INT` (FK -> `User.uid`, Not Null)
   - `createat`: `DATETIME` (Not Null, mặc định `now()`)
6. **`OrderDetail`**
   - `oid`: `INT` (PK, FK -> `Order.oid`, Not Null)
   - `pid`: `INT` (PK, FK -> `Product.pid`, Not Null)
   - `qty`: `INT` (Not Null — Số lượng đặt mua)
   - `unit_price`: `DECIMAL(10,2)` (Not Null — Đơn giá tại thời điểm mua)
   - **Khóa chính kết hợp:** Sử dụng `@@id([oid, pid])` trong Prisma Schema.
7. **`Shipment`**
   - `shipid`: `INT` (PK, Auto Increment)
   - `oid`: `INT` (FK -> `Order.oid`, Not Null)
   - `status`: `VARCHAR(50)` (Not Null — VD: `Pending`, `Shipping`, `Delivered`)

### 4.2. Các quan hệ bắt buộc
- `Role` 1 - N `User`
- `MemberShip` 1 - N `User`
- `User` 1 - N `Order`
- `Order` 1 - N `Shipment`
- `Order` 1 - N `OrderDetail`
- `Product` 1 - N `OrderDetail`

### 4.3. Quy tắc ánh xạ tên Model Prisma và bảng PostgreSQL
- Giữ tên Model trong Prisma đúng theo sơ đồ: `Role`, `MemberShip`, `User`, `Product`, `Order`, `OrderDetail`, `Shipment`.
- Giữ nguyên tên bảng trong PostgreSQL hoặc ánh xạ nhất quán ngay từ đầu và hướng dẫn rõ câu lệnh SQL trong `psql` (lưu ý bọc dấu ngoặc kép `"Order"`, `"User"`, `"MemberShip"`, `"OrderDetail"` nếu giữ tên PascalCase trong PostgreSQL để phục vụ Tiêu chí 5 và Tiêu chí 8 khi kiểm tra trực tiếp bằng CLI trong container Postgres).

---

## 5. Yêu cầu nghiệp vụ & Đối chiếu Phiếu chấm (`docs/phieu_cham.md`)

Mọi bước triển khai phải đảm bảo sinh viên đạt điểm tối đa ở cả 8 tiêu chí trong bảng chấm:

1. **Tiêu chí 1 (1đ) - Cấu trúc Monolithic:** Tổ chức thư mục chuẩn Modular Monolith, giải thích rõ trách nhiệm từng tầng/module.
2. **Tiêu chí 2 (1đ) - `.gitignore` và `.env`:** Loại bỏ `node_modules`, `.env` khỏi Git; cung cấp `.env.example` và giải thích rõ cơ chế bảo mật biến môi trường trên GitHub.
3. **Tiêu chí 3 (1đ) - Prisma ORM:** Giải thích rõ `schema.prisma`, các quan hệ `1-N`, khóa chính kết hợp `@@id([oid, pid])`, migration và cách dùng `PrismaClient`.
4. **Tiêu chí 4 (1đ) - CLI Compose & Health Check:**
   - Lệnh `docker compose up -d --build` khởi chạy toàn bộ hệ thống.
   - Có API `GET /api/health` kiểm tra tình trạng ứng dụng và kết nối thực tế tới PostgreSQL (`SELECT 1`).
   - Liệt kê các container đang chạy bằng `docker ps`.
5. **Tiêu chí 5 (1đ) - Kiểm tra bảng & Tạo sản phẩm X, Y bằng CLI:**
   - Truy cập container PostgreSQL (`docker exec -it <container> psql -U <user> -d <db>`) kiểm tra đủ 7 bảng (`\dt`).
   - Tạo mới 2 sản phẩm **X** và **Y** trực tiếp bằng CLI trong PostgreSQL (đảm bảo `quantity` đủ lớn để phục vụ bước mua 2 sản phẩm X và 5 sản phẩm Y).
6. **Tiêu chí 6 (1đ) - Luồng Đăng ký & Đăng nhập trên Postman:**
   - Đăng ký tài khoản mới (`POST /api/auth/register`): Băm mật khẩu bằng `bcryptjs`, tự động gán `Role` có `rolename = 'normal'` và `MemberShip` có `score = 10`.
   - Đăng nhập tài khoản vừa tạo (`POST /api/auth/login`): Xác thực mật khẩu và trả về `JWT` token.
7. **Tiêu chí 7 (1đ) - Luồng Đặt hàng trên Postman:**
   - Gọi API đặt hàng **không dùng token** -> Bắt buộc trả về lỗi xác thực (`401 Unauthorized`).
   - Gọi API đặt hàng **có Bearer token** -> Đặt mua **sản phẩm X (số lượng 2)** và **sản phẩm Y (số lượng 5)**, thời gian đặt hàng (`createat`) lấy thời gian hiện hành.
   - Kiểm tra tồn kho trước khi chấp nhận đơn hàng.
   - Sử dụng `prisma.$transaction` để thực hiện nguyên tử (atomic): tạo `Order` -> tạo các `OrderDetail` -> tự động chuyển sang/tạo `Shipment` -> trừ `quantity` tương ứng của `Product`. Nếu có bất kỳ lỗi nào, rollback toàn bộ, tuyệt đối không để lại dữ liệu cập nhật một phần.
   - Trả về/hiển thị đầy đủ thông tin đơn hàng (`Order`), chi tiết đơn hàng (`OrderDetail`) và thông tin giao vận (`Shipment`).
8. **Tiêu chí 8 (1đ) - Kiểm tra kết quả sau đặt hàng bằng CLI trong Postgres Container:**
   - Truy cập container PostgreSQL kiểm tra dữ liệu các bảng `Order`, `OrderDetail`, `Product` (cột `quantity` đã trừ đúng 2 cho X và 5 cho Y) và `Shipment` đã được tạo đúng.

---

## 6. Lưu ý môi trường thực tế trên máy hiện tại (Windows PowerShell)
- **Node.js & npm:** Máy cài đặt Node.js `v24.21.0`, npm `11.19.0`. Do Windows PowerShell đang bật `ExecutionPolicy` chặn chạy script `.ps1` (`npm.ps1`), khi chạy lệnh trong PowerShell cần sử dụng `npm.cmd` và `npx.cmd` (hoặc chạy `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` trong phiên hiện hành).
- **Docker:** Cần đảm bảo Docker Desktop đang chạy (`docker ps` hoạt động) trước khi thực hiện các bước khởi tạo container PostgreSQL và đóng gói ứng dụng.

---

## 7. Quy trình làm việc bắt buộc ở mỗi bước (13 mục)

Chia dự án thành các bước nhỏ theo lộ trình đã lập:
- **Bước 1:** Khởi tạo Git, dự án Node.js/Express, cài đặt thư viện & dựng khung Modular Monolith (`.gitignore`, `.env`, `.env.example`).
- **Bước 2:** Thiết lập PostgreSQL với `docker-compose.yml` & API `GET /api/health`.
- **Bước 3:** Thiết kế `prisma/schema.prisma` (7 bảng), chạy Migration & Seed dữ liệu nền (`Role` normal, `MemberShip` score 10).
- **Bước 4:** Module `auth` & `users` (Đăng ký tự gán Role `normal` + score `10`, băm mật khẩu, Đăng nhập trả JWT, JWT Middleware).
- **Bước 5:** Module `products` (Xem danh sách, chi tiết sản phẩm & tồn kho; hướng dẫn tạo sản phẩm X, Y bằng CLI).
- **Bước 6:** Module `orders` & `shipments` với `prisma.$transaction` (Đặt hàng, kiểm tra tồn kho, tạo Order + OrderDetail + Shipment, trừ kho nguyên tử).
- **Bước 7:** Hoàn thiện `Dockerfile` + `docker-compose.yml` cho toàn hệ thống, xuất Postman Collection và hoàn tất kịch bản chấm điểm 8 tiêu chí.

**Ở MỖI BƯỚC, bắt buộc trình bày và thực hiện đúng thứ tự 13 mục sau:**
1. Giải thích mục tiêu của bước bằng ngôn ngữ dễ hiểu.
2. Đối chiếu yêu cầu với phiếu chấm thực hành (`docs/phieu_cham.md`).
3. Kiểm tra trạng thái project hiện tại trước khi sửa.
4. Liệt kê file cần tạo hoặc chỉnh sửa.
5. Thực hiện thay đổi trực tiếp trong project nếu có quyền thao tác.
6. Giải thích các phần quan trọng của mã nguồn.
7. Hướng dẫn từng lệnh cần chạy và vị trí chạy lệnh.
8. Tự chạy kiểm thử nếu môi trường cho phép.
9. Đưa ra kết quả thực tế, không giả định lệnh đã chạy thành công.
10. Tự đánh giá khách quan theo thang điểm: **Đạt** / **Đạt một phần** / **Chưa đạt**.
11. Nêu bằng chứng kiểm thử cho từng kết luận.
12. Nếu chưa đạt, sửa lỗi và kiểm thử lại.
13. Chỉ kết thúc bước khi các tiêu chí nghiệm thu của bước đó đã đạt, hoặc đã xác định rõ giới hạn không thể khắc phục.

> **QUY TẮC DỪNG BẮT BUỘC:** Tuyệt đối **KHÔNG** tự động chuyển sang bước tiếp theo khi người dùng chưa xác nhận.

