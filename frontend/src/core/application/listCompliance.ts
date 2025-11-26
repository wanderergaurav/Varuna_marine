import { ShipCompliance } from '../domain/models';
import { DataApiPort } from '../ports/dataApi';

export class ListComplianceUseCase {
  constructor(private readonly api: DataApiPort) {}

  execute(): Promise<ShipCompliance[]> {
    return this.api.getCompliance();
  }
}


