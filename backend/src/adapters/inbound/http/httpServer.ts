import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { ApplyBankedSurplusService } from '../../../core/application/applyBankedSurplusService';
import { BankSurplusService } from '../../../core/application/bankSurplusService';
import { ComparisonService } from '../../../core/application/comparisonService';
import { CreatePoolService } from '../../../core/application/createPoolService';
import { GetComplianceBalanceService } from '../../../core/application/getComplianceBalanceService';
import { GetAdjustedComplianceBalanceService } from '../../../core/application/getAdjustedComplianceBalanceService';
import { ListBankEntriesService } from '../../../core/application/listBankEntriesService';
import { ListBankHistoryService } from '../../../core/application/listBankHistoryService';
import { ListComplianceService } from '../../../core/application/listComplianceService';
import { ListPoolsService } from '../../../core/application/listPoolsService';
import { ListRoutesService } from '../../../core/application/listRoutesService';
import { SetBaselineService } from '../../../core/application/setBaselineService';

export interface HttpServerDependencies {
  listRoutesService: ListRoutesService;
  setBaselineService: SetBaselineService;
  comparisonService: ComparisonService;
  getComplianceBalanceService: GetComplianceBalanceService;
  getAdjustedComplianceBalanceService: GetAdjustedComplianceBalanceService;
  listBankEntriesService: ListBankEntriesService;
  bankSurplusService: BankSurplusService;
  applyBankedSurplusService: ApplyBankedSurplusService;
  listBankHistoryService: ListBankHistoryService;
  listPoolsService: ListPoolsService;
  createPoolService: CreatePoolService;
  listComplianceService: ListComplianceService;
}

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

const wrap =
  (handler: AsyncHandler) => (req: Request, res: Response, next: NextFunction) =>
    handler(req, res, next).catch(next);

export const buildHttpServer = ({
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
}: HttpServerDependencies) => {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json());

  app.get(
    '/routes',
    wrap(async (_req, res) => {
      const routes = await listRoutesService.execute();
      res.json(routes);
    })
  );

  app.post(
    '/routes/:routeId/baseline',
    wrap(async (req, res) => {
      await setBaselineService.execute(req.params.routeId);
      res.sendStatus(200);
    })
  );

  app.get(
    '/routes/comparison',
    wrap(async (_req, res) => {
      const routes = await comparisonService.execute();
      res.json(routes);
    })
  );

  app.get(
    '/compliance/cb',
    wrap(async (req, res) => {
      if (typeof req.query.shipId == 'string' && typeof req.query.year == 'string') {
        const compliance = await getComplianceBalanceService.execute(
          req.query.shipId,
          req.query.year
        );
        res.json(compliance);
      } else
        res.sendStatus(400);
    })
  );

  app.get(
    '/compliance',
    wrap(async (_req, res) => {
      const compliance = await listComplianceService.execute();
      res.json(compliance);
    })
  );

  app.get(
    '/compliance/adjusted-cb',
    wrap(async (req, res) => {
      if (typeof req.query.shipId == 'string' && typeof req.query.year == 'string') {
        const adjustedCB = await getAdjustedComplianceBalanceService.execute(
          req.query.shipId,
          req.query.year
        );
        res.json(adjustedCB);
      } else
        res.sendStatus(400);
    })
  );

  app.get(
    '/banking',
    wrap(async (_req, res) => {
      const entries = await listBankEntriesService.execute();
      res.json(entries);
    })
  );

  app.post(
    '/banking/bank',
    wrap(async (req, res) => {
      const { shipId, year } = req.body ?? {};
      if (typeof shipId !== 'string' || typeof year !== 'string') {
        res.sendStatus(400);
        return;
      }

      const result = await bankSurplusService.execute(shipId, year);
      if (!result) {
        res.sendStatus(404);
        return;
      }

      res.json(result);
    })
  );

  app.post(
    '/banking/apply',
    wrap(async (req, res) => {
      const { shipId, year } = req.body ?? {};
      if (typeof shipId !== 'string' || typeof year !== 'string') {
        res.sendStatus(400);
        return;
      }

      const result = await applyBankedSurplusService.execute(shipId, year);
      if (!result) {
        res.sendStatus(404);
        return;
      }

      res.json(result);
    })
  );

  app.get(
    '/banking/history',
    wrap(async (req, res) => {
      if (typeof req.query.shipId !== 'string') {
        res.sendStatus(400);
        return;
      }

      const entries = await listBankHistoryService.execute(req.query.shipId);
      res.json(entries);
    })
  );

  app.get(
    '/pools',
    wrap(async (_req, res) => {
      const pools = await listPoolsService.execute();
      res.json(pools);
    })
  );

  app.post(
    '/pools',
    wrap(async (req, res) => {
      const { year, shipIds } = req.body ?? {};
      if (
        typeof year !== 'number' ||
        !Array.isArray(shipIds) ||
        shipIds.length === 0 ||
        shipIds.some((id) => typeof id !== 'string')
      ) {
        res.sendStatus(400);
        return;
      }

      const pool = await createPoolService.execute(year, shipIds);
      res.json(pool);
    })
  );

  app.use(
    (
      err: Error,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      // eslint-disable-next-line no-console
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  );

  return app;
};

