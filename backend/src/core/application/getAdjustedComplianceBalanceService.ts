import { ComplianceBalance } from '../domain/models';
import { BankingRepository, BankEntriesRepository } from '../ports/repositories';

export class GetAdjustedComplianceBalanceService {
  constructor(
    private readonly bankingRepository: BankingRepository,
    private readonly bankEntriesRepository: BankEntriesRepository
  ) {}

  async execute(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    // Get the base compliance balance
    const baseCB = await this.bankingRepository.getComplianceBalance(shipId, year);
    if (!baseCB) {
      return undefined;
    }

    // Get total banked amount for this ship and year
    const bankEntries = await this.bankEntriesRepository.listEntriesByShip(shipId);
    const bankedAmount = bankEntries
      .filter(entry => entry.year === parseInt(year))
      .reduce((sum, entry) => sum + entry.amountGco2eq, 0);

    // Adjusted CB = base CB + banked amount
    return {
      balance: baseCB.balance + bankedAmount
    };
  }
}
