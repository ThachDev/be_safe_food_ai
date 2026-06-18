# AI_GUIDELINES cho Dự án Safe Food AI (Backend)

Chào AI tương lai, khi bạn đọc tài liệu này, bạn đang làm việc trên hệ thống backend của dự án **Safe Food AI**. Hãy đọc kỹ và tuân thủ tuyệt đối các quy tắc dưới đây để không phá vỡ cấu trúc và tính toàn vẹn của mã nguồn.

## 1. Công nghệ sử dụng
- **Runtime**: Node.js
- **Ngôn ngữ**: TypeScript 100% (Strict mode). KHÔNG DÙNG `require()`, chỉ dùng `import`/`export` ES Modules.
- **Framework**: Express.js
- **Database**: MySQL thông qua ORM `Sequelize`.
- **Dependency Injection (DI)**: Sử dụng thư viện `tsyringe`.

## 2. Kiến trúc Hệ thống (Clean Architecture)
Hệ thống được thiết kế theo chuẩn Clean Architecture gồm 4 tầng, với quy tắc phụ thuộc: Tầng bên ngoài chỉ được phép phụ thuộc (import) các tầng bên trong, tuyệt đối không có chiều ngược lại.

**Cấu trúc thư mục `src/`:**
1. **`domain/` (Tầng trong cùng)**
   - Chứa các `entities` (Cấu trúc dữ liệu lõi).
   - Chứa các `repositories` (chỉ là Interfaces, ví dụ: `IUserRepository.ts`).
   - *Luật*: Không được import bất cứ library ngoài nào (ngoại trừ types) và không import tầng khác.

2. **`application/` (Tầng nghiệp vụ)**
   - Chứa các `interfaces` (ví dụ: `IMailService`, `IGenerativeAiService`).
   - Chứa các `use_cases` (Mỗi use case là một class chứa 1 hàm `execute` duy nhất, thực thi một logic kinh doanh).
   - *Luật*: Chỉ phụ thuộc vào `domain/`. Gọi DB hay APIs qua interfaces.

3. **`infrastructure/` (Tầng hạ tầng & Dữ liệu)**
   - `database/sequelize/`: Chứa file kết nối DB, file `migrate.ts`, và các Model (Class extends `Model` của Sequelize).
   - `repositories/`: Triển khai thực tế các Interface của `domain/repositories` (ví dụ: `SequelizeUserRepository.ts`). Trách nhiệm của file này là mapping giữa Sequelize Model (DB) và Domain Entity (Logic).
   - `services/`: Triển khai các dịch vụ ngoài (Firebase, Nodemailer, Cloudinary, Groq AI).
   - `external/`: Các file khởi tạo SDK (như `firebase.ts`).
   - *Luật*: Được phép import `application/` và `domain/`.

4. **`interfaces/` (Tầng Giao tiếp - Web)**
   - `web/controllers/`: Các Express Controllers. Trách nhiệm chỉ là parse `req`, truyền vào `UseCase` thích hợp và trả về `res`. KHÔNG VIẾT LOGIC TRONG NÀY.
   - `web/routes/`: Khai báo API endpoints và mapping với Controllers.
   - `web/middlewares/`: Express middlewares (Auth, Validation...).

5. **`shared/` (Tầng dùng chung)**
   - Chứa `constants/`, `utils/`, `types/` dùng chung cho toàn dự án.

## 3. Quản lý Dependencies (DI)
- Mọi `UseCase`, `Controller`, `Repository`, `Service` đều phải là một class gắn decorator `@injectable()`.
- Các dependencies phải được truyền qua `constructor` bằng `@inject(TênToken/Class)`.
- Tất cả các Interface (ví dụ: `IUserRepository`) phải được đăng ký (register) với Implementation cụ thể (ví dụ: `SequelizeUserRepository`) tại file trung tâm `src/di/container.ts`.

## 4. Quy tắc Code (Coding Standards)
1. **Controller & Router**:
   - Khi tạo API mới, hãy tạo UseCase trước, sau đó tiêm (inject) UseCase đó vào Controller.
   - Trong route, phải resolve controller qua DI: `const userController = container.resolve(UserController)`.
2. **Database & Mapping**:
   - Sequelize Model chỉ tồn tại ở tầng `infrastructure/`. Tuyệt đối không trả về `Model` cho các tầng bên trên. Hãy chuyển nó thành Domain Entity trước khi trả về.
3. **Response Format**:
   - Toàn bộ HTTP Responses phải trả về chuẩn JSON chung: 
     ```json
     { "success": true/false, "message": "...", "data": {}, "code": "..." }
     ```
4. **TypeScript**:
   - Khai báo type rõ ràng. Tránh dùng `any` ở mức tối đa.

## 5. Quy trình thêm tính năng mới
1. Bổ sung Entities/Interfaces vào `domain/` nếu cần.
2. Viết Interfaces cho external services vào `application/interfaces/` nếu cần.
3. Tạo Use Case trong `application/use_cases/`.
4. Nếu liên đới DB/Third-party, cập nhật/viết thêm ở `infrastructure/`.
5. Đăng ký dependencies ở `src/di/container.ts`.
6. Tạo hàm trong Controller tại `interfaces/web/controllers/`.
7. Khai báo endpoint tại `interfaces/web/routes/` và export ra `routes/index.ts`.

TUÂN THỦ CÁC QUY TẮC NÀY ĐỂ GIỮ CHO SAFE FOOD AI LUÔN LÀ MỘT HỆ THỐNG ENTERPRISE!
