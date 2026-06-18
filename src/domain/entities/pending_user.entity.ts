export class PendingUser {
  constructor(
    public id: number,
    public email: string,
    public displayName: string | null,
    public passwordHash: string,
    public otp: string,
    public expiresAt: Date
  ) {}
}
