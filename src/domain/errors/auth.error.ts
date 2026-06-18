export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}

export class UserNotFoundError extends AuthError {
  constructor() {
    super('Người dùng không tồn tại.');
    this.name = 'UserNotFoundError';
  }
}

export class InvalidOtpError extends AuthError {
  constructor() {
    super('Mã OTP không chính xác hoặc đã hết hạn.');
    this.name = 'InvalidOtpError';
  }
}

export class EmailAlreadyExistsError extends AuthError {
  constructor() {
    super('Email này đã được sử dụng.');
    this.name = 'EmailAlreadyExistsError';
  }
}
