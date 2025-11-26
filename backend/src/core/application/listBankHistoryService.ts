import { BankEntry } from '../domain/models';
import { BankEntriesRepository } from '../ports/repositories';

export class ListBankHistoryService {
  constructor(
    private readonly bankEntriesRepository: BankEntriesRepository
  ) {}

  execute(shipId: string): Promise<BankEntry[]> {
    return this.bankEntriesRepository.listEntriesByShip(shipId);
  }
}


