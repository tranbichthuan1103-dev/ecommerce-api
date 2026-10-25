# E-commerce MVP (Modular Monolithic Architecture)

Hệ thống thương mại điện tử MVP xây dựng theo kiến trúc **Modular Monolith** phục vụ bài tập thực hành môn Microservices Architecture (MSA).

## Công nghệ sử dụng
- **Runtime & Framework:** Node.js (ES Modules), Express.js
- **ORM & Database:** Prisma ORM, PostgreSQL
- **Authentication:** JWT (`jsonwebtoken`), `bcryptjs`
- **Containerization:** Docker & Docker Compose

## Cấu trúc thư mục
```text
p2/
├── docs/                       # Tài liệu thiết kế DB & Phiếu chấm thực hành
├── postman/                    # Postman Collection kiểm thử API
├── prisma/                     # Prisma Schema, Migrations & Seed
├── src/
│   ├── config/                 # Cấu hình biến môi trường & Prisma Client
│   ├── middlewares/            # Middleware xử lý lỗi, xác thực JWT
│   ├── modules/                # Các module nghiệp vụ (Modular Monolith)
│   │   ├── health/             # Kiểm tra tình trạng hệ thống (route, controller, service)
│   │   ├── auth/               # Đăng ký & Đăng nhập
│   │   ├── users/              # Quản lý thông tin người dùng
│   │   ├── products/           # Quản lý sản phẩm & tồn kho
│   │   ├── orders/             # Đặt hàng & xử lý transaction
│   │   └── shipments/          # Quản lý vận chuyển
│   ├── routes/                 # Router tổng hợp toàn bộ module
│   ├── utils/                  # Tiện ích dùng chung (AppError...)
│   ├── app.js                  # Khởi tạo và cấu hình Express application
│   └── server.js               # Entry point khởi chạy HTTP Server
├── tests/                      # Kịch bản kiểm thử
├── .env.example                # Mẫu biến môi trường
├── .gitignore                  # Cấu hình loại trừ file nhạy cảm khỏi Git
└── package.json
```

## Hướng dẫn chạy ứng dụng
1. Cài đặt thư viện:
   ```bash
   npm install
   ```
2. Chạy môi trường phát triển (tự động khởi động lại khi sửa code):
   ```bash
   npm run dev
   ```
3. Chạy môi trường thực thi chuẩn:
   ```bash
   npm start
   ```

