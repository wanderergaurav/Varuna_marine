import { apiConfig } from '@shared/config';
import { BankEntry, BankRecord, Comparison, PoolWithMembers, Route, ShipCompliance } from '@core/domain/models';
import { DataApiPort } from '@core/ports/dataApi';

const httpGet = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${apiConfig.baseUrl}${path}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Request to ${path} failed with status ${response.status} (${body})`
    );
  }

  return (await response.json()) as T;
};

const httpPost = async <T = undefined>(path: string, body?: unknown): Promise<T> => {
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Request to ${path} failed with status ${response.status} (${body})`
    );
  }

  if (response.status === 204)
    return undefined as T;

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json'))
    return (await response.json()) as T;

  return undefined as T;
};


export const createDataApi = (): DataApiPort => ({
  getRoutes: () => httpGet<Route[]>('/routes'),
  setBaseline: id => httpPost(`/routes/${id}/baseline`),
  getComparison: () => httpGet<Comparison[]>('/routes/comparison'),
  getCompliance: () => httpGet<ShipCompliance[]>('/compliance'),
  getBankRecord: (shipId, year) => httpGet<BankRecord | undefined>(`/compliance/cb?shipId=${shipId}&year=${year}`),
  getAdjustedCB: (shipId, year) => httpGet<BankRecord | undefined>(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`),
  bankSurplus: (shipId, year) => httpPost<BankRecord | undefined>('/banking/bank', { shipId, year }),
  applyBankedSurplus: (shipId, year) => httpPost<BankRecord | undefined>('/banking/apply', { shipId, year }),
  getBankHistory: (shipId) => httpGet<BankEntry[]>(`/banking/history?shipId=${encodeURIComponent(shipId)}`),
  getPools: () => httpGet<PoolWithMembers[]>('/pools'),
  createPool: (year, shipIds) => httpPost<PoolWithMembers>('/pools', { year, shipIds })
});

