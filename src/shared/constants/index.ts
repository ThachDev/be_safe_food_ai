export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

export const ProfileOptions = {
  diets: [
    'Bình thường',
    'Ăn chay',
    'Chay trường',
    'Thuần chay',
    'Giảm tinh bột',
    'Kiêng hoàn toàn tinh bột',
    'Khác'
  ],
  allergies: [
    'Trứng',
    'Sữa bò',
    'Lúa mì',
    'Hải sản',
    'Thịt bò',
    'Đậu nành',
    'Mè (Vừng)',
    'Đậu phộng (Lạc)',
    'Bột ngọt (Mì chính)',
    'Các loại hạt',
    'Khác'
  ],
  diseases: [
    'Tiểu đường',
    'Cao huyết áp',
    'Gút',
    'Bệnh thận',
    'Mỡ máu cao',
    'Bệnh tim mạch',
    'Đau dạ dày / Trào ngược',
    'Khác'
  ],
  healthGoals: [
    'Giữ dáng',
    'Giảm cân, giảm mỡ',
    'Tăng cân, tăng cơ',
    'Ăn uống lành mạnh',
    'Bảo vệ tim mạch',
    'Tốt cho tiêu hóa',
    'Cải thiện tiêu hóa',
    'Tăng sức đề kháng',
    'Kiểm soát lượng đường',
    'Ổn định đường huyết',
    'Khác'
  ]
};
