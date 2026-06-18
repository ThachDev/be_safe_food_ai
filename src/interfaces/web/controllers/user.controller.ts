import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { 
  GetUsersUseCase, 
  GetUserByIdUseCase, 
  CreateUserUseCase, 
  UpdateUserUseCase 
} from '../../../application/use_cases/user/user_management.use_cases';
import { HttpStatus, ErrorCodes } from '../../../shared/constants';

@injectable()
export class UserController {
  constructor(
    @inject(GetUsersUseCase) private getUsersUseCase: GetUsersUseCase,
    @inject(GetUserByIdUseCase) private getUserByIdUseCase: GetUserByIdUseCase,
    @inject(CreateUserUseCase) private createUserUseCase: CreateUserUseCase,
    @inject(UpdateUserUseCase) private updateUserUseCase: UpdateUserUseCase
  ) {}

  getUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.getUsersUseCase.execute();
      return res.status(HttpStatus.OK).json({
        success: true,
        data: users
      });
    } catch (error: any) {
      console.error('[UserController getUsers Error]:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ErrorCodes.DATABASE_ERROR,
        message: 'An error occurred while retrieving users.',
        error: error.message
      });
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const user = await this.getUserByIdUseCase.execute(id);
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'User not found'
        });
      }
      return res.status(HttpStatus.OK).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      console.error('[UserController getUserById Error]:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ErrorCodes.DATABASE_ERROR,
        message: 'An error occurred while retrieving the user.',
        error: error.message
      });
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const user = await this.createUserUseCase.execute(req.body);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      console.error('[UserController createUser Error]:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'An error occurred while creating the user.',
        error: error.message
      });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      const user = await this.updateUserUseCase.execute(id, req.body);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      console.error('[UserController updateUser Error]:', error);
      if (error.message === 'User not found') {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'User not found'
        });
      }
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'An error occurred while updating the user.',
        error: error.message
      });
    }
  };
}
