import { buildHttpServer } from '../../adapters/inbound/http/httpServer';
import {
  MemoryBankEntriesRepository,
  MemoryBankingRepository,
  MemoryPoolsRepository,
  MemoryRoutesRepository,
} from '../../adapters/outbound/memory/repositories';
import { ApplyBankedSurplusService } from '../../core/application/applyBankedSurplusService';
import { BankSurplusService } from '../../core/application/bankSurplusService';
import { ComparisonService } from '../../core/application/comparisonService';
import { CreatePoolService } from '../../core/application/createPoolService';
import { GetComplianceBalanceService } from '../../core/application/getComplianceBalanceService';
import { GetAdjustedComplianceBalanceService } from '../../core/application/getAdjustedComplianceBalanceService';
import { ListBankEntriesService } from '../../core/application/listBankEntriesService';
import { ListBankHistoryService } from '../../core/application/listBankHistoryService';
import { ListComplianceService } from '../../core/application/listComplianceService';
import { ListPoolsService } from '../../core/application/listPoolsService';
import { ListRoutesService } from '../../core/application/listRoutesService';
import { SetBaselineService } from '../../core/application/setBaselineService';
import { serverConfig } from '../../shared/config';

export const startServer = async () => {
  // Use in-memory repositories instead of PostgreSQL
  const routesRepository = new MemoryRoutesRepository();
  const bankingRepository = new MemoryBankingRepository();
  const bankEntriesRepository = new MemoryBankEntriesRepository();
  const poolsRepository = new MemoryPoolsRepository();

  const listRoutesService = new ListRoutesService(routesRepository);

  const setBaselineService = new SetBaselineService(routesRepository);

  const comparisonService = new ComparisonService(routesRepository);

  const getComplianceBalanceService = new GetComplianceBalanceService(
    bankingRepository
  );

  const getAdjustedComplianceBalanceService = new GetAdjustedComplianceBalanceService(
    bankingRepository,
    bankEntriesRepository
  );

  const listComplianceService = new ListComplianceService(
    bankingRepository
  );

  const bankSurplusService = new BankSurplusService(
    bankingRepository
  );

  const applyBankedSurplusService = new ApplyBankedSurplusService(
    bankingRepository
  );

  const listBankEntriesService = new ListBankEntriesService(
    bankEntriesRepository
  );

  const listBankHistoryService = new ListBankHistoryService(
    bankEntriesRepository
  );

  const listPoolsService = new ListPoolsService(
    poolsRepository
  );

  const createPoolService = new CreatePoolService(
    poolsRepository
  );

  const app = buildHttpServer({
    listRoutesService,
    setBaselineService,
    comparisonService,
    getComplianceBalanceService,
    getAdjustedComplianceBalanceService,
    listBankEntriesService,
    bankSurplusService,
    applyBankedSurplusService,
    listBankHistoryService,
    listPoolsService,
    createPoolService,
    listComplianceService
  });

  return new Promise<void>((resolve, reject) => {
    app
      .listen(serverConfig.port, serverConfig.host, () => {
        // eslint-disable-next-line no-console
        console.log(
          `HTTP server listening on http://${serverConfig.host}:${serverConfig.port}`
        );
        console.log('Using in-memory data storage (no database required)');
        resolve();
      })
      .on('error', reject);
  });
};
