import { ComplianceBalance } from '../domain/models';
import { BankingRepository } from '../ports/repositories';

export class ApplyBankedSurplusService {
  constructor(
    private readonly bankingRepository: BankingRepository
  ) {}

  execute(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    return this.bankingRepository.applyBankedSurplus(shipId, year);
  }
}


