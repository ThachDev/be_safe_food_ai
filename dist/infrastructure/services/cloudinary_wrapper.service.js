"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryWrapperService = void 0;
const tsyringe_1 = require("tsyringe");
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
let CloudinaryWrapperService = class CloudinaryWrapperService {
    async uploadImage(base64String, folder = 'scans') {
        if (!base64String)
            return null;
        let imageStr = base64String;
        if (!imageStr.startsWith('data:image')) {
            imageStr = `data:image/jpeg;base64,${base64String}`;
        }
        try {
            const result = await cloudinary_1.v2.uploader.upload(imageStr, {
                folder: folder,
                transformation: [
                    { width: 800, crop: "limit" },
                    { quality: "auto", fetch_format: "auto" }
                ]
            });
            return result.secure_url;
        }
        catch (error) {
            console.error('[CloudinaryService.uploadImage] Error:', error);
            return null;
        }
    }
};
exports.CloudinaryWrapperService = CloudinaryWrapperService;
exports.CloudinaryWrapperService = CloudinaryWrapperService = __decorate([
    (0, tsyringe_1.injectable)()
], CloudinaryWrapperService);
