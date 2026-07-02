
import { IUserRepository } from '../../../domain/repositories/i_user.repository';


export class GetUsersUseCase {
  constructor(private userRepository: IUserRepository) {}
  
  async execute() {
    return await this.userRepository.findAll();
  }
}


export class GetUserByIdUseCase {
  constructor(private userRepository: IUserRepository) {}
  
  async execute(id: number) {
    return await this.userRepository.findById(id);
  }
}


export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}
  
  async execute(data: any) {
    return await this.userRepository.create(data);
  }
}


export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}
  
  async execute(id: number, data: any) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('User not found');
    await this.userRepository.update(id, data);
    return await this.userRepository.findById(id);
  }
}

