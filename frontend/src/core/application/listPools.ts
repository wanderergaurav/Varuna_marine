import { PoolWithMembers } from '../domain/models';
import { DataApiPort } from '../ports/dataApi';

export class ListPoolsUseCase {
  constructor(private readonly api: DataApiPort) {}

  execute(): Promise<PoolWithMembers[]> {
    return this.api.getPools();
  }
}


