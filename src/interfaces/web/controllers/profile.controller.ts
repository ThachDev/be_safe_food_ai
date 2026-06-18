import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GetProfileOptionsUseCase } from '../../../application/use_cases/profile/get_profile_options.use_case';
import { HttpStatus } from '../../../shared/constants';

@injectable()
export class ProfileController {
  constructor(
    @inject(GetProfileOptionsUseCase) private getProfileOptionsUseCase: GetProfileOptionsUseCase
  ) {}

  getOptions = async (req: Request, res: Response) => {
    try {
      const options = this.getProfileOptionsUseCase.execute();
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Profile options retrieved successfully',
        data: options
      });
    } catch (error: any) {
      console.error('[Profile Controller] Error getting options:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve profile options',
        error: error.message
      });
    }
  };
}
