import { Route } from '../domain/models';
import { DataApiPort } from '../ports/dataApi';

export class ListRoutesUseCase {
  constructor(private readonly api: DataApiPort) {}

  execute(): Promise<Route[]> {
    return this.api.getRoutes();
  }
}

