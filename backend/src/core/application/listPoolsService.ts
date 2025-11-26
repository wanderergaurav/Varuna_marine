import { PoolWithMembers } from '../domain/models';
import { PoolsRepository } from '../ports/repositories';

export class ListPoolsService {
  constructor(
    private readonly poolsRepository: PoolsRepository
  ) {}

  execute(): Promise<PoolWithMembers[]> {
    return this.poolsRepository.listPools();
  }
}


