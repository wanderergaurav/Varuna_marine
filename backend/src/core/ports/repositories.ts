import { BankEntry, ComplianceBalance, PoolWithMembers, Route, ShipCompliance } from '../domain/models';

export interface RoutesRepository {
  listRoutes(): Promise<Route[]>;
  setBaseline(routeId: string): Promise<undefined>;
}

export interface BankingRepository {
  getComplianceBalance(shipId: string, year: string): Promise<ComplianceBalance | undefined>;
  bankSurplus(shipId: string, year: string): Promise<ComplianceBalance | undefined>;
  applyBankedSurplus(shipId: string, year: string): Promise<ComplianceBalance | undefined>;
  listCompliance(): Promise<ShipCompliance[]>;
}

export interface BankEntriesRepository {
  listEntries(): Promise<BankEntry[]>;
  listEntriesByShip(shipId: string): Promise<BankEntry[]>;
}

export interface PoolsRepository {
  listPools(): Promise<PoolWithMembers[]>;
  createPool(year: number, shipIds: string[]): Promise<PoolWithMembers>;
}

