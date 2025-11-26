import { Route } from '../domain/models';
import { RoutesRepository } from '../ports/repositories';

export class ListRoutesService {
  constructor(private readonly routesRepository: RoutesRepository) {}

  async execute(): Promise<Route[]> {
    return this.routesRepository.listRoutes();
  }
}

