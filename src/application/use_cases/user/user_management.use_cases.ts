import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/i_user.repository';

@injectable()
export class GetUsersUseCase {
  constructor(@inject('IUserRepository') private userRepository: IUserRepository) {}
  
  async execute() {
    return await this.userRepository.findAll();
  }
}

@injectable()
export class GetUserByIdUseCase {
  constructor(@inject('IUserRepository') private userRepository: IUserRepository) {}
  
  async execute(id: number) {
    return await this.userRepository.findById(id);
  }
}

@injectable()
export class CreateUserUseCase {
  constructor(@inject('IUserRepository') private userRepository: IUserRepository) {}
  
  async execute(data: any) {
    return await this.userRepository.create(data);
  }
}

@injectable()
export class UpdateUserUseCase {
  constructor(@inject('IUserRepository') private userRepository: IUserRepository) {}
  
  async execute(id: number, data: any) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('User not found');
    await this.userRepository.update(id, data);
    return await this.userRepository.findById(id);
  }
}

