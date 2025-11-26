import { Comparison } from '../domain/models';
import { DataApiPort } from '../ports/dataApi';

export class ComparisonUseCase {
  constructor(private readonly api: DataApiPort) {}

  execute(): Promise<Comparison[]> {
    return this.api.getComparison();
  }
}

