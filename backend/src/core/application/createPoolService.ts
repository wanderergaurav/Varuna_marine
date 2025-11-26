import { PoolWithMembers } from '../domain/models';
import { PoolsRepository } from '../ports/repositories';

export class CreatePoolService {
  constructor(
    private readonly poolsRepository: PoolsRepository
  ) {}

  execute(year: number, shipIds: string[]): Promise<PoolWithMembers> {
    return this.poolsRepository.createPool(year, shipIds);
  }
}


