import { injectable } from 'tsyringe';
import { ProfileOptions } from '../../../shared/constants';

@injectable()
export class GetProfileOptionsUseCase {
  execute() {
    return ProfileOptions;
  }
}
