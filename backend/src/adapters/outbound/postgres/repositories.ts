import { Pool } from 'pg';
import { BankEntry, ComplianceBalance, PoolMember, PoolWithMembers, Route, ShipCompliance } from '../../../core/domain/models';
import {
  BankEntriesRepository,
  BankingRepository,
  PoolsRepository,
  RoutesRepository,
} from '../../../core/ports/repositories';

type RouteRow = {
  id: number;
  route_id: string;
  // TODO: would these two be better as enums?
  vessel_type: string;
  fuel_type: string;
  year: number;
  ghg_intensity: number;
  fuel_consumption: number;
  distance: number;
  total_emissions: number;
  is_baseline: boolean;
};

type BankEntryRow = {
  id: number;
  ship_id: string;
  year: number;
  amount_gco2eq: number;
};

type PoolRow = {
  id: number;
  year: number;
  created_at: Date;
  ship_id: string | null;
  cb_before: number | null;
  cb_after: number | null;
};

export class PostgresRoutesRepository implements RoutesRepository {
  constructor(private readonly pool: Pool) {}

  async listRoutes(): Promise<Route[]> {
    const { rows } = await this.pool.query<RouteRow>(`SELECT * FROM routes ORDER BY id`);
    return rows.map((row) => ({
      id: row.id,
      routeId: row.route_id,
      vesselType: row.vessel_type,
      fuelType: row.fuel_type,
      year: row.year,
      ghgIntensity: row.ghg_intensity,
      fuelConsumption: row.fuel_consumption,
      distance: row.distance,
      totalEmissions: row.total_emissions,
      isBaseline: row.is_baseline
    }));
  }

  async setBaseline(routeId: string): Promise<undefined> {
    const client = await this.pool.connect();

    // Atomically change the baseline route
    await client.query('BEGIN');
    await client.query('UPDATE routes SET is_baseline = FALSE WHERE is_baseline');
    await client.query('UPDATE routes SET is_baseline = TRUE WHERE route_id = $1', [routeId]);
    await client.query('COMMIT');

    client.release();
  }
}

export class PostgresBankingRepository
  implements BankingRepository
{
  constructor(private readonly pool: Pool) {}

  async getComplianceBalance(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      // Check for an existing entry in ship_compliance
      const { rows: rows1 } = await client.query<{ cb_gco2eq: number }>(
        `SELECT cb_gco2eq FROM ship_compliance WHERE ship_id = $1 AND year = $2`,
        [shipId, year]
      );

      // There should only ever be 0 or 1 results from this
      if (rows1.length == 1)
        return { balance: rows1[0].cb_gco2eq }


      // If there's no existing entry, calculate one now

      // I'm assuming here that routeId and shipId are equal. I'm not sure if this is true,
      // but I can't see any other way to correlate the two
      const { rows: rows2 } = await client.query<{ ghg_intensity: number; fuel_consumption: number }>(
        `SELECT ghg_intensity, fuel_consumption FROM routes WHERE route_id = $1 AND year = $2`,
        [shipId, year]
      );

      // There should only ever be 0 or 1 results from this
      if (rows2.length != 1)
        return;

      // This formula is described in the specification document
      const balance = (89.3368 - rows2[0].ghg_intensity) * rows2[0].fuel_consumption * 41_000;

      await client.query(
        `INSERT INTO ship_compliance (ship_id, year, cb_gco2eq) VALUES ($1, $2, $3)`,
        [shipId, year, balance]
      );

      return { balance }
    } finally {
      await client.query('COMMIT');
      client.release();
    }
  }

  async bankSurplus(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    const compliance = await this.getComplianceBalance(shipId, year);
    if (!compliance)
      return;
    if (compliance.balance <= 0)
      return compliance;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO bank_entries (ship_id, year, amount_gco2eq)
        VALUES ($1, $2, $3)`,
        [shipId, year, compliance.balance]
      );
      await client.query(
        `UPDATE ship_compliance
        SET cb_gco2eq = 0
        WHERE ship_id = $1 AND year = $2`,
        [shipId, year]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return { balance: 0 };
  }

  async applyBankedSurplus(shipId: string, year: string): Promise<ComplianceBalance | undefined> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ total: string }>(
        `SELECT COALESCE(SUM(amount_gco2eq), 0) AS total
        FROM bank_entries
        WHERE ship_id = $1 AND year = $2`,
        [shipId, year]
      );

      const total = Number(rows[0]?.total ?? 0);
      if (total <= 0) {
        await client.query('ROLLBACK');
        return this.getComplianceBalance(shipId, year);
      }

      const { rowCount } = await client.query(
        `UPDATE ship_compliance
        SET cb_gco2eq = cb_gco2eq + $3
        WHERE ship_id = $1 AND year = $2`,
        [shipId, year, total]
      );

      if (!rowCount) {
        await client.query(
          `INSERT INTO ship_compliance (ship_id, year, cb_gco2eq)
          VALUES ($1, $2, $3)`,
          [shipId, year, total]
        );
      }

      await client.query(
        `DELETE FROM bank_entries
        WHERE ship_id = $1 AND year = $2`,
        [shipId, year]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return this.getComplianceBalance(shipId, year);
  }

  async listCompliance(): Promise<ShipCompliance[]> {
    const { rows } = await this.pool.query<{ id: number; ship_id: string; year: number; cb_gco2eq: number }>(
      `SELECT id, ship_id, year, cb_gco2eq
      FROM ship_compliance
      ORDER BY year DESC, ship_id ASC`
    );

    return rows.map((row) => ({
      id: row.id,
      shipId: row.ship_id,
      year: row.year,
      cbGco2eq: row.cb_gco2eq
    }));
  }
}

export class PostgresBankEntriesRepository
  implements BankEntriesRepository
{
  constructor(private readonly pool: Pool) {}

  async listEntries(): Promise<BankEntry[]> {
    const query = `
      SELECT id, ship_id, year, amount_gco2eq
      FROM bank_entries
    `;
    const { rows } = await this.pool.query<BankEntryRow>(query);
    return rows.map((row) => ({
      id: row.id,
      shipId: row.ship_id,
      year: row.year,
      amountGco2eq: row.amount_gco2eq
    }));
  }

  async listEntriesByShip(shipId: string): Promise<BankEntry[]> {
    const query = `
      SELECT id, ship_id, year, amount_gco2eq
      FROM bank_entries
      WHERE ship_id = $1
      ORDER BY year DESC, id DESC
    `;
    const { rows } = await this.pool.query<BankEntryRow>(query, [shipId]);
    return rows.map((row) => ({
      id: row.id,
      shipId: row.ship_id,
      year: row.year,
      amountGco2eq: row.amount_gco2eq
    }));
  }
}

export class PostgresPoolsRepository
  implements PoolsRepository
{
  constructor(private readonly pool: Pool) {}

  async listPools(): Promise<PoolWithMembers[]> {
    const query = `
      SELECT
        p.id,
        p.year,
        p.created_at,
        pm.ship_id,
        pm.cb_before,
        pm.cb_after
      FROM pools p
      LEFT JOIN pool_members pm ON pm.pool_id = p.id
      ORDER BY p.created_at DESC, pm.ship_id ASC
    `;
    const { rows } = await this.pool.query<PoolRow>(query);

    const pools = new Map<number, PoolWithMembers>();
    for (const row of rows) {
      let pool = pools.get(row.id);
      if (!pool) {
        pool = {
          id: row.id,
          year: row.year,
          createdAt: row.created_at,
          members: []
        };
        pools.set(row.id, pool);
      }

      if (row.ship_id) {
        pool.members.push({
          poolId: row.id,
          shipId: row.ship_id,
          cbBefore: row.cb_before ?? 0,
          cbAfter: row.cb_after ?? 0
        });
      }
    }

    return Array.from(pools.values());
  }

  async createPool(year: number, shipIds: string[]): Promise<PoolWithMembers> {
    if (!shipIds.length)
      throw new Error('Cannot create a pool without ships');

    const uniqueShipIds = [...new Set(shipIds)];
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const { rows } = await client.query<{ id: number; year: number; created_at: Date }>(
        `INSERT INTO pools (year, created_at) VALUES ($1, NOW())
        RETURNING id, year, created_at`,
        [year]
      );
      const poolRow = rows[0];
      const members: PoolMember[] = [];

      for (const shipId of uniqueShipIds) {
        const { rows: complianceRows } = await client.query<{ cb_gco2eq: number }>(
          `SELECT cb_gco2eq FROM ship_compliance WHERE ship_id = $1 AND year = $2`,
          [shipId, year]
        );

        if (!complianceRows.length) {
          throw new Error(`No compliance record for ship ${shipId} in ${year}`);
        }

        const cbBefore = complianceRows[0].cb_gco2eq;

        await client.query(
          `INSERT INTO pool_members (pool_id, ship_id, cb_before, cb_after)
          VALUES ($1, $2, $3, $4)`,
          [poolRow.id, shipId, cbBefore, cbBefore]
        );

        members.push({
          poolId: poolRow.id,
          shipId,
          cbBefore,
          cbAfter: cbBefore
        });
      }

      await client.query('COMMIT');

      return {
        id: poolRow.id,
        year: poolRow.year,
        createdAt: poolRow.created_at,
        members
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

