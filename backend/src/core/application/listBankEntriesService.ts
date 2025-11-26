import { BankEntry } from '../domain/models';
import { BankEntriesRepository } from '../ports/repositories';

export class ListBankEntriesService {
  constructor(
    private readonly bankEntriesRepository: BankEntriesRepository
  ) {}

  async execute(): Promise<BankEntry[]> {
    return this.bankEntriesRepository.listEntries();
  }
}

