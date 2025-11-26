import { RoutesRepository } from '../ports/repositories';

export class SetBaselineService {
  constructor(
    private readonly routesRepository: RoutesRepository
  ) {}

  async execute(routeId: string): Promise<undefined> {
    this.routesRepository.setBaseline(routeId);
  }
}

