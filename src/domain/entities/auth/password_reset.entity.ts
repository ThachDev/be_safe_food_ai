export class PasswordReset {
  constructor(
    public id: number,
    public email: string,
    public otp: string,
    public expiresAt: Date
  ) {}
}
