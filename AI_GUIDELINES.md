# Hướng Dẫn Kỹ Thuật & Quy Chuẩn Phát Triển (AI_GUIDELINES)

Tài liệu này được thiết lập dành riêng cho các trợ lý lập trình AI khi tham gia đóng góp và phát triển trên mã nguồn hệ thống Backend của dự án **Be Safe Food AI**. Hãy tuân thủ tuyệt đối các quy tắc dưới đây nhằm bảo toàn kiến trúc và tính toàn vẹn của mã nguồn.

---

## 1. Công Nghệ & Môi Trường Hoạt Động

*   **Runtime Engine**: Node.js (Khuyên dùng v20 trở lên).
*   **Ngôn ngữ lập trình**: TypeScript 100% (Chế độ `strict: true`).
*   **Quy chuẩn Module**:
    *   Sử dụng cú pháp ES Modules (`import`/`export`) trong mã nguồn.
    *   Biên dịch (Transpile) sang CommonJS thông qua cấu hình `tsconfig.json` (`"module": "commonjs"`).
    *   Tránh sử dụng `require()` thủ công, luôn dùng `import`.
*   **Database & ORM**: MySQL kết hợp Sequelize (ORM).
*   **Dependency Injection**: Thư viện `tsyringe` + `reflect-metadata`.

---

## 2. Kiến Trúc Hệ Thống (Clean Architecture)

Hệ thống được thiết kế theo cấu trúc phân tầng Clean Architecture nghiêm ngặt. Quy tắc phụ thuộc bất di bất dịch: **Tầng bên ngoài được phép phụ thuộc (import) các tầng bên trong, tuyệt đối KHÔNG có chiều ngược lại.**

```
src/
├── domain/                    # TẦNG 1: Lõi nghiệp vụ (Domain Layer)
│   ├── entities/              # Các Domain Entities thuần túy đại diện cho dữ liệu
│   ├── errors/                # Lớp lỗi tùy chỉnh của nghiệp vụ (Domain Errors)
│   └── repositories/          # Interfaces định nghĩa các phương thức DB (Ví dụ: IUserRepository)
│   * Quy tắc*: Không phụ thuộc bất kỳ thư viện ngoài nào (ngoại trừ types) hoặc các tầng khác.
│
├── application/               # TẦNG 2: Nghiệp vụ ứng dụng (Application Layer)
│   ├── interfaces/            # Các interface dịch vụ thứ ba (IMailService, ICloudinaryService, ...)
│   └── use_cases/             # Các kịch bản nghiệp vụ riêng biệt (Mỗi kịch bản là một Class với execute())
│   * Quy tắc*: Chỉ phụ thuộc vào tầng `domain`. Giao tiếp với DB hoặc bên thứ ba qua Interface.
│
├── infrastructure/            # TẦNG 3: Hạ tầng & Adapter kỹ thuật (Infrastructure Layer)
│   ├── database/sequelize/    # Cấu hình DB, file Models (Sequelize), và scripts Migrations
│   ├── repositories/          # Implement thực tế các Interface khai báo ở domain/repositories
│   └── services/              # Implement thực tế các dịch vụ bên ngoài (Groq, Cloudinary, Nodemailer, ...)
│   * Quy tắc*: Được phép import tầng `domain` và `application`. Đảm bảo mapping Sequelize Model sang Domain Entity.
│
├── interfaces/                # TẦNG 4: Giao tiếp ngoài (Interfaces Layer)
│   └── web/
│       ├── controllers/       # Nhận requests, parse tham số, gọi UseCase, và trả HTTP Response
│       ├── middlewares/       # Xác thực (JWT/Firebase token), giới hạn request (rate limiter), phân quyền
│       └── routes/            # Định nghĩa các endpoints cụ thể cho từng tài nguyên
│   * Quy tắc*: Không viết logic nghiệp vụ hay truy vấn DB trực tiếp ở đây.
│
├── routes/
│   └── index.ts               # Điểm tập trung định tuyến (Mount các route con vào tiền tố /api/v1)
│
├── di/
│   └── container.ts           # Cấu hình và đăng ký Container Dependency Injection (tsyringe)
│
├── shared/                    # Các hằng số, mã lỗi, helpers dùng chung
│
└── app.ts & server.ts         # Khởi động ứng dụng, middleware cấu hình chung và kết nối Database
```

---

## 3. Quản Lý Dependencies & Dependency Injection (DI)

Dự án áp dụng `tsyringe` để quản lý các thành phần lỏng (loosely coupled components).

### Quy tắc Đăng ký và Tiêm Dependency:
1.  Mọi `UseCase`, `Controller`, `Repository`, và `Service` đều phải đánh dấu bằng decorator `@injectable()`.
2.  Đăng ký các interface với implementation thực tế tại [container.ts](file:///Users/ancq/ThienThach/Code/be_safe_food_ai/src/di/container.ts):
    ```typescript
    container.register('IUserRepository', { useClass: SequelizeUserRepository });
    ```
3.  Khi tiêm Interface vào constructor (ví dụ trong UseCase):
    ```typescript
    import { injectable, inject } from 'tsyringe';
    import { IUserRepository } from '../../../domain/repositories/i_user.repository';

    @injectable()
    export class GetUsersUseCase {
      constructor(
        @inject('IUserRepository') private userRepository: IUserRepository
      ) {}

      async execute() {
        return await this.userRepository.findAll();
      }
    }
    ```
4.  Khi tiêm một Class cụ thể vào constructor (ví dụ UseCase vào Controller), sử dụng trực tiếp Class đó làm token:
    ```typescript
    @injectable()
    export class UserController {
      constructor(
        @inject(GetUsersUseCase) private getUsersUseCase: GetUsersUseCase
      ) {}
      // ...
    }
    ```

---

## 4. Các Quy Chuẩn Lập Trình Bắt Buộc (Coding Standards)

### A. Quy định về Controller & Router
*   Trong các file định nghĩa Route, bắt buộc phải phân giải (resolve) Controller từ DI Container để đảm bảo các thành phần được tiêm đầy đủ:
    ```typescript
    // Sai: const userController = new UserController();
    // Đúng:
    const userController = container.resolve(UserController);
    router.get('/', userController.getUsers);
    ```
*   Controller **KHÔNG ĐƯỢC PHÉP** chứa logic nghiệp vụ, tính toán công thức, hoặc gọi trực tiếp đến DB. Nhiệm vụ duy nhất của nó là nhận req, gọi `UseCase.execute()`, bắt lỗi và trả response.

### B. Quy định Database & Entity Mapping
*   Sequelize Models chỉ được tồn tại ở tầng `infrastructure/database/sequelize/models/`.
*   **Cấm tuyệt đối** trả Sequelize Model instance lên tầng `application` hoặc `interfaces` (Controller/Route).
*   Tại file implementation Repository (ví dụ: `SequelizeUserRepository`), thực hiện mapping kết quả từ Sequelize Model sang Domain Entity tương ứng trước khi trả dữ liệu về:
    ```typescript
    // Mapper mẫu trong Repository
    private mapToUserEntity(record: any): User {
      return new User(
        record.id,
        record.email,
        record.displayName
        // ...
      );
    }
    ```

### C. Định dạng Response chuẩn hóa (Uniform HTTP Response)
Toàn bộ API responses trả về Client phải tuân thủ cấu trúc đồng nhất:
*   **Khi thành công**:
    ```json
    {
      "success": true,
      "data": { ... }
    }
    ```
*   **Khi thất bại (Validation, Auth, System Error)**:
    ```json
    {
      "success": false,
      "code": "INTERNAL_SERVER_ERROR",
      "message": "Chi tiết thông điệp lỗi cho người dùng.",
      "error": "Lỗi kỹ thuật thô (chỉ hiện khi NODE_ENV là development)"
    }
    ```

---

## 5. Quy Trình Thêm Tính Năng Mới (Step-by-Step Developer Workflow)

Khi triển khai thêm tính năng mới, hãy thực hiện theo đúng thứ tự luồng dưới đây để giữ hệ thống sạch và chuẩn hóa:

1.  **Domain Definition**: Thêm mới/bổ sung Entities và cấu trúc Repository Interface tại `src/domain/`.
2.  **External Service Signatures**: Khai báo các interface tích hợp ngoại vi tại `src/application/interfaces/` nếu cần dùng các dịch vụ như AI, Mail, Push Notification, API ngoài.
3.  **Core Use Case**: Viết kịch bản nghiệp vụ chuyên biệt tại `src/application/use_cases/`.
4.  **Technical Implementation**:
    *   Thiết lập Sequelize Models mới và thực hiện điều chỉnh cấu trúc bảng bằng SQL/Sequelize trong file [migrate.ts](file:///Users/ancq/ThienThach/Code/be_safe_food_ai/src/infrastructure/database/sequelize/migrate.ts).
    *   Viết code triển khai Interface Repository thực tế tại `src/infrastructure/repositories/`.
    *   Hiện thực hóa các adapter dịch vụ ngoại vi tại `src/infrastructure/services/`.
5.  **DI Registry**: Đăng ký các Interface/Class mới vào `src/di/container.ts`.
6.  **Web Controller**: Tạo Controller thu thập request, truyền vào UseCase và trả Response dưới thư mục `src/interfaces/web/controllers/`.
7.  **Web Routing**: Định nghĩa routing tương ứng trong `src/interfaces/web/routes/` và mount route này vào router chính [src/routes/index.ts](file:///Users/ancq/ThienThach/Code/be_safe_food_ai/src/routes/index.ts).

---

> [!IMPORTANT]
> TUÂN THỦ CÁC QUY TẮC TRÊN GIÚP HỆ THỐNG "BE SAFE FOOD AI" LUÔN ĐẠT HIỆU NĂNG CAO, BẢO MẬT VÀ DỄ DÀNG MỞ RỘNG!
