export class User {
  constructor(
    public readonly id: number,
    public firebaseUid: string,
    public email: string,
    public displayName: string | null,
    public photoUrl: string | null,
    public isOnboarded: boolean,
    public dietType: string,
    public allergies: string[],
    public diseases: string[],
    public healthGoals: string[],
    public pushEnabled?: boolean,
    public emailEnabled?: boolean,
    public fcmToken?: string | null
  ) {}
}
