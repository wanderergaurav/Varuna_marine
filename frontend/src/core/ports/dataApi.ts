import { BankEntry, BankRecord, Comparison, PoolWithMembers, Route, ShipCompliance } from '../domain/models';

export interface DataApiPort {
  getRoutes(): Promise<Route[]>;
  setBaseline(id: string): Promise<undefined>;
  getComparison(): Promise<Comparison[]>;
  getCompliance(): Promise<ShipCompliance[]>;
  getBankRecord(shipId: string, year: string): Promise<BankRecord | undefined>;
  bankSurplus(shipId: string, year: string): Promise<BankRecord | undefined>;
  applyBankedSurplus(shipId: string, year: string): Promise<BankRecord | undefined>;
  getBankHistory(shipId: string): Promise<BankEntry[]>;
  getPools(): Promise<PoolWithMembers[]>;
  createPool(year: number, shipIds: string[]): Promise<PoolWithMembers>;
}

