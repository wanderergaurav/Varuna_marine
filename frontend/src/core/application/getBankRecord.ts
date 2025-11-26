import { BankRecord } from '../domain/models';
import { DataApiPort } from '../ports/dataApi';

export class GetBankRecordUseCase {
  constructor(private readonly api: DataApiPort) {}

  execute(shipId: string, year: string): Promise<BankRecord | undefined> {
    return this.api.getBankRecord(shipId, year);
  }
}


