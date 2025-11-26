export interface Route {
  id: number;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface Comparison {
  routeId: string;
  ghgIntensity: number;
  percentDiff: number;
  compliant: boolean;
};

export interface ShipCompliance {
  id: number;
  shipId: string;
  year: number;
  cbGco2eq: number;
}

export interface ComplianceBalance {
  balance: number;
}

export interface BankEntry {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

export interface Pool {
  id: number;
  year: number;
  createdAt: Date;
}

export interface PoolMember {
  poolId: number;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolWithMembers extends Pool {
  members: PoolMember[];
}

