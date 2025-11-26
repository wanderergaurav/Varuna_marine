import { GetComplianceBalanceService } from '../getComplianceBalanceService';
import { BankingRepository } from '../../ports/repositories';
import { ComplianceBalance } from '../../domain/models';

describe('GetComplianceBalanceService', () => {
  let mockBankingRepository: jest.Mocked<BankingRepository>;
  let service: GetComplianceBalanceService;

  beforeEach(() => {
    mockBankingRepository = {
      getComplianceBalance: jest.fn(),
      bankSurplus: jest.fn(),
      applyBankedSurplus: jest.fn(),
      listCompliance: jest.fn()
    };
    service = new GetComplianceBalanceService(mockBankingRepository);
  });

  it('should return compliance balance for valid ship and year', async () => {
    const expectedBalance: ComplianceBalance = { balance: 1000000 };
    mockBankingRepository.getComplianceBalance.mockResolvedValue(expectedBalance);

    const result = await service.execute('R001', '2024');

    expect(result).toEqual(expectedBalance);
    expect(mockBankingRepository.getComplianceBalance).toHaveBeenCalledWith('R001', '2024');
  });

  it('should return undefined if no compliance record exists', async () => {
    mockBankingRepository.getComplianceBalance.mockResolvedValue(undefined);

    const result = await service.execute('R999', '2024');

    expect(result).toBeUndefined();
  });

  it('should handle negative compliance balance (deficit)', async () => {
    const deficitBalance: ComplianceBalance = { balance: -500000 };
    mockBankingRepository.getComplianceBalance.mockResolvedValue(deficitBalance);

    const result = await service.execute('R003', '2024');

    expect(result?.balance).toBeLessThan(0);
  });
});
