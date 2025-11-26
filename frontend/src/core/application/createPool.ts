import { PoolWithMembers } from '../domain/models';
import { DataApiPort } from '../ports/dataApi';

export class CreatePoolUseCase {
  constructor(private readonly api: DataApiPort) {}

  execute(year: number, shipIds: string[]): Promise<PoolWithMembers> {
    return this.api.createPool(year, shipIds);
  }
}


