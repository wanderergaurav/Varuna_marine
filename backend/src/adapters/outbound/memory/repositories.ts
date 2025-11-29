import { BankEntry, ComplianceBalance, PoolMember, PoolWithMembers, Route, ShipCompliance } from '../../../core/domain/models';
import {
  BankEntriesRepository,
  BankingRepository,
  PoolsRepository,
  RoutesRepository,
} from '../../../core/ports/repositories';

// In-memory data storage
const routesData: Route[] = [
  {
    id: 1,
    routeId: 'R001',
    vesselType: 'Container',
    fuelType: 'HFO',
    year: 2024,
    ghgIntensity: 91.0,
    fuelConsumption: 5000,
    distance: 12000,
    totalEmissions: 4500,
    isBaseline: true
  },
  {
    id: 2,
    routeId: 'R002',
    vesselType: 'BulkCarrier',
    fuelType: 'LNG',
    year: 2024,
    ghgIntensity: 88.0,
    fuelConsumption: 4800,
    distance: 11500,
    totalEmissions: 4200,
    isBaseline: false
  },
  {
    id: 3,
    routeId: 'R003',
    vesselType: 'Tanker',
    fuelType: 'MGO',
    year: 2024,
    ghgIntensity: 93.5,
    fuelConsumption: 5100,
    distance: 12500,
    totalEmissions: 4700,
    isBaseline: false
  },
  {
    id: 4,
    routeId: 'R004',
    vesselType: 'RoRo',
    fuelType: 'HFO',
    year: 2025,
    ghgIntensity: 89.2,
    fuelConsumption: 4900,
    distance: 11800,
    totalEmissions: 4300,
    isBaseline: false
  },
  {
    id: 5,
    routeId: 'R005',
    vesselType: 'Container',
    fuelType: 'LNG',
    year: 2025,
    ghgIntensity: 90.5,
    fuelConsumption: 4950,
    distance: 11900,
    totalEmissions: 4400,
    isBaseline: false
  }
];

const shipComplianceData: Map<string, ShipCompliance> = new Map();
const bankEntriesData: BankEntry[] = [];
const poolsData: PoolWithMembers[] = [];
let nextBankEntryId = 1;
let nextPoolId = 1;
let nextComplianceId = 1;

export class MemoryRoutesRepository implements RoutesRepository {
  async listRoutes(): Promise<Route[]> {
    return Promise.resolve([...routesData]);
  }

  async setBaseline(routeId: string): Promise<undefined> {
    routesData.forEach(route => {
      route.isBaseline = route.routeId === routeId;
    });
    return Promise.resolve(undefined);
  }
}

export class MemoryBankingRepository implements BankingRepository {
  async getComplianceBalance(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    const key = `${shipId}-${year}`;
    const existing = shipComplianceData.get(key);
    
    if (existing) {
      return { balance: existing.cbGco2eq };
    }

    // Calculate CB
    const route = routesData.find(r => r.routeId === shipId && r.year === parseInt(year));
    if (!route) {
      return undefined;
    }

    const balance = (89.3368 - route.ghgIntensity) * route.fuelConsumption * 41_000;
    
    // Store it
    shipComplianceData.set(key, {
      id: nextComplianceId++,
      shipId,
      year: parseInt(year),
      cbGco2eq: balance
    });

    return { balance };
  }

  async bankSurplus(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    const compliance = await this.getComplianceBalance(shipId, year);
    if (!compliance || compliance.balance <= 0) {
      return compliance;
    }

    // Add to bank entries
    bankEntriesData.push({
      id: nextBankEntryId++,
      shipId,
      year: parseInt(year),
      amountGco2eq: compliance.balance
    });

    // Set CB to 0
    const key = `${shipId}-${year}`;
    const existing = shipComplianceData.get(key);
    if (existing) {
      existing.cbGco2eq = 0;
    }

    return { balance: 0 };
  }

  async applyBankedSurplus(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    const yearNum = parseInt(year);
    const total = bankEntriesData
      .filter(e => e.shipId === shipId && e.year === yearNum)
      .reduce((sum, e) => sum + e.amountGco2eq, 0);

    if (total <= 0) {
      return this.getComplianceBalance(shipId, year);
    }

    // Update CB
    const key = `${shipId}-${year}`;
    let existing = shipComplianceData.get(key);
    
    if (!existing) {
      existing = {
        id: nextComplianceId++,
        shipId,
        year: yearNum,
        cbGco2eq: total
      };
      shipComplianceData.set(key, existing);
    } else {
      existing.cbGco2eq += total;
    }

    // Remove bank entries
    const indicesToRemove = bankEntriesData
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.shipId === shipId && e.year === yearNum)
      .map(({ i }) => i);
    
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      bankEntriesData.splice(indicesToRemove[i], 1);
    }

    return { balance: existing.cbGco2eq };
  }

  async listCompliance(): Promise<ShipCompliance[]> {
    return Promise.resolve(Array.from(shipComplianceData.values()));
  }
}

export class MemoryBankEntriesRepository implements BankEntriesRepository {
  async listEntries(): Promise<BankEntry[]> {
    return Promise.resolve([...bankEntriesData]);
  }

  async listEntriesByShip(shipId: string): Promise<BankEntry[]> {
    return Promise.resolve(bankEntriesData.filter(e => e.shipId === shipId));
  }
}

export class MemoryPoolsRepository implements PoolsRepository {
  async listPools(): Promise<PoolWithMembers[]> {
    return Promise.resolve([...poolsData]);
  }

  async createPool(year: number, shipIds: string[]): Promise<PoolWithMembers> {
    if (!shipIds.length) {
      throw new Error('Cannot create a pool without ships');
    }

    const uniqueShipIds = [...new Set(shipIds)];
    const members: { shipId: string; cbBefore: number; cbAfter: number }[] = [];

    // Fetch compliance balances
    const bankingRepo = new MemoryBankingRepository();
    for (const shipId of uniqueShipIds) {
      const compliance = await bankingRepo.getComplianceBalance(shipId, year.toString());
      if (!compliance) {
        throw new Error(`No compliance record for ship ${shipId} in ${year}`);
      }

      members.push({
        shipId,
        cbBefore: compliance.balance,
        cbAfter: compliance.balance
      });
    }

    // Validate
    const totalCB = members.reduce((sum, m) => sum + m.cbBefore, 0);
    if (totalCB < 0) {
      throw new Error(`Pool validation failed: Sum of CB (${totalCB.toFixed(2)}) must be >= 0`);
    }

    // Greedy allocation
    members.sort((a, b) => b.cbBefore - a.cbBefore);

    for (let i = 0; i < members.length; i++) {
      if (members[i].cbAfter <= 0) continue;

      for (let j = members.length - 1; j > i; j--) {
        if (members[j].cbAfter >= 0) break;

        const deficit = -members[j].cbAfter;
        const surplus = members[i].cbAfter;
        const transfer = Math.min(deficit, surplus);

        members[i].cbAfter -= transfer;
        members[j].cbAfter += transfer;

        if (members[i].cbAfter <= 0) break;
      }
    }

    // Validate rules
    for (const member of members) {
      if (member.cbBefore < 0 && member.cbAfter < member.cbBefore) {
        throw new Error(`Deficit ship ${member.shipId} would exit worse`);
      }
      if (member.cbBefore > 0 && member.cbAfter < 0) {
        throw new Error(`Surplus ship ${member.shipId} cannot exit negative`);
      }
    }

    // Create pool
    const poolId = nextPoolId++;
    const pool: PoolWithMembers = {
      id: poolId,
      year,
      createdAt: new Date(),
      members: members.map(m => ({
        poolId: poolId,
        ...m
      }))
    };

    poolsData.push(pool);
    return pool;
  }
}
