import { Comparison } from '../domain/models';
import { RoutesRepository } from '../ports/repositories';

export class ComparisonService {
  constructor(
    private readonly routesRepository: RoutesRepository
  ) {}

  async execute(): Promise<Comparison[]> {
    const routes = await this.routesRepository.listRoutes();

    // Get the baseline route.
    // There should always be one, hence the `!`
    const baseline = routes.find(route => route.isBaseline)!.ghgIntensity;

    return routes.map(route => ({
      routeId: route.routeId,
      ghgIntensity: route.ghgIntensity,
      percentDiff: (route.ghgIntensity / baseline - 1) * 100,
      compliant: route.ghgIntensity < 89.3368
    }));
  }
}