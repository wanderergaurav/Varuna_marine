import { ComplianceBalance } from '../domain/models';
import { BankingRepository } from '../ports/repositories';

export class GetComplianceBalanceService {
  constructor(
    private readonly bankingRepository: BankingRepository
  ) {}

  async execute(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    return this.bankingRepository.getComplianceBalance(shipId, year);
  }
}

