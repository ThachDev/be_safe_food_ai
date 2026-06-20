"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    id;
    firebaseUid;
    email;
    displayName;
    photoUrl;
    isOnboarded;
    dietType;
    allergies;
    diseases;
    healthGoals;
    pushEnabled;
    emailEnabled;
    fcmToken;
    constructor(id, firebaseUid, email, displayName, photoUrl, isOnboarded, dietType, allergies, diseases, healthGoals, pushEnabled, emailEnabled, fcmToken) {
        this.id = id;
        this.firebaseUid = firebaseUid;
        this.email = email;
        this.displayName = displayName;
        this.photoUrl = photoUrl;
        this.isOnboarded = isOnboarded;
        this.dietType = dietType;
        this.allergies = allergies;
        this.diseases = diseases;
        this.healthGoals = healthGoals;
        this.pushEnabled = pushEnabled;
        this.emailEnabled = emailEnabled;
        this.fcmToken = fcmToken;
    }
}
exports.User = User;
