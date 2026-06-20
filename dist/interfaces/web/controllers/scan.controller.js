"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanController = void 0;
const tsyringe_1 = require("tsyringe");
const analyze_scan_use_case_1 = require("../../../application/use_cases/scan/analyze_scan.use_case");
const scan_management_use_cases_1 = require("../../../application/use_cases/scan/scan_management.use_cases");
const constants_1 = require("../../../shared/constants");
let ScanController = class ScanController {
    analyzeScanUseCase;
    createScanUseCase;
    getScansUseCase;
    deleteScanUseCase;
    constructor(analyzeScanUseCase, createScanUseCase, getScansUseCase, deleteScanUseCase) {
        this.analyzeScanUseCase = analyzeScanUseCase;
        this.createScanUseCase = createScanUseCase;
        this.getScansUseCase = getScansUseCase;
        this.deleteScanUseCase = deleteScanUseCase;
    }
    analyzeScan = async (req, res, next) => {
        try {
            const { scanType, base64Image, additionalContext } = req.body;
            const firebaseUid = req.user.uid;
            if (!scanType || !base64Image) {
                return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    code: 'BAD_REQUEST',
                    message: 'scanType and base64Image are required'
                });
            }
            console.log(`[ScanController.analyzeScan] Running AI Vision check for mode: ${scanType}`);
            const result = await this.analyzeScanUseCase.execute(firebaseUid, scanType, base64Image, additionalContext);
            return res.status(constants_1.HttpStatus.OK).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            if (error.message === 'User not found' || error.name === 'UserNotFoundError') {
                return res.status(constants_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }
            if (error.message === 'Hình ảnh này dường như không phải là thực phẩm hoặc bao bì. Vui lòng chụp lại.') {
                return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
            }
            console.error('[ScanController.analyzeScan] Error:', error);
            next(error);
        }
    };
    createScan = async (req, res, next) => {
        try {
            const firebaseUid = req.user.uid;
            const scan = await this.createScanUseCase.execute(firebaseUid, req.body);
            return res.status(constants_1.HttpStatus.CREATED).json({
                success: true,
                data: scan
            });
        }
        catch (error) {
            if (error.message === 'User not found' || error.name === 'UserNotFoundError') {
                return res.status(constants_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }
            if (error.message === 'Missing required fields for scan history') {
                return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    code: 'BAD_REQUEST',
                    message: error.message
                });
            }
            console.error('[ScanController.createScan] Error:', error);
            next(error);
        }
    };
    getScans = async (req, res, next) => {
        try {
            const firebaseUid = req.user.uid;
            const scans = await this.getScansUseCase.execute(firebaseUid);
            return res.status(constants_1.HttpStatus.OK).json({
                success: true,
                data: scans
            });
        }
        catch (error) {
            if (error.message === 'User not found' || error.name === 'UserNotFoundError') {
                return res.status(constants_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }
            console.error('[ScanController.getScans] Error:', error);
            next(error);
        }
    };
    deleteScan = async (req, res, next) => {
        try {
            const firebaseUid = req.user.uid;
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(constants_1.HttpStatus.BAD_REQUEST).json({
                    success: false,
                    code: 'BAD_REQUEST',
                    message: 'Valid Scan ID is required'
                });
            }
            await this.deleteScanUseCase.execute(firebaseUid, id);
            return res.status(constants_1.HttpStatus.OK).json({
                success: true,
                message: 'Scan history entry deleted successfully'
            });
        }
        catch (error) {
            if (error.message === 'User not found' || error.name === 'UserNotFoundError') {
                return res.status(constants_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                });
            }
            if (error.message === 'SCAN_NOT_FOUND') {
                return res.status(constants_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    code: 'SCAN_NOT_FOUND',
                    message: 'Scan history item not found or does not belong to you'
                });
            }
            console.error('[ScanController.deleteScan] Error:', error);
            next(error);
        }
    };
};
exports.ScanController = ScanController;
exports.ScanController = ScanController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(analyze_scan_use_case_1.AnalyzeScanUseCase)),
    __param(1, (0, tsyringe_1.inject)(scan_management_use_cases_1.CreateScanUseCase)),
    __param(2, (0, tsyringe_1.inject)(scan_management_use_cases_1.GetScansUseCase)),
    __param(3, (0, tsyringe_1.inject)(scan_management_use_cases_1.DeleteScanUseCase)),
    __metadata("design:paramtypes", [analyze_scan_use_case_1.AnalyzeScanUseCase,
        scan_management_use_cases_1.CreateScanUseCase,
        scan_management_use_cases_1.GetScansUseCase,
        scan_management_use_cases_1.DeleteScanUseCase])
], ScanController);
