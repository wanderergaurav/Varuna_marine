export type Route = {
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
};

export type Comparison = {
  routeId: string;
  ghgIntensity: number;
  percentDiff: number;
  compliant: boolean;
};

export type ShipCompliance = {
  id: number;
  shipId: string;
  year: number;
  cbGco2eq: number;
};

export type BankEntry = {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
};

export type BankRecord = {
  balance: number;
};

export type Pool = {
  id: number;
  year: number;
  createdAt: string;
};

export type PoolMember = {
  poolId: number;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
};

export type PoolWithMembers = Pool & {
  members: PoolMember[];
};

