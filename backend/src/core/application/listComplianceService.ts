import { ShipCompliance } from '../domain/models';
import { BankingRepository } from '../ports/repositories';

export class ListComplianceService {
  constructor(
    private readonly bankingRepository: BankingRepository
  ) {}

  execute(): Promise<ShipCompliance[]> {
    return this.bankingRepository.listCompliance();
  }
}


