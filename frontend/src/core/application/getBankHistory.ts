import { BankEntry } from '../domain/models';
import { DataApiPort } from '../ports/dataApi';

export class GetBankHistoryUseCase {
  constructor(private readonly api: DataApiPort) {}

  execute(shipId: string): Promise<BankEntry[]> {
    return this.api.getBankHistory(shipId);
  }
}


