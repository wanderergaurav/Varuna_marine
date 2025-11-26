import { ComplianceBalance } from '../domain/models';
import { BankingRepository } from '../ports/repositories';

export class BankSurplusService {
  constructor(
    private readonly bankingRepository: BankingRepository
  ) {}

  execute(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    return this.bankingRepository.bankSurplus(shipId, year);
  }
}


