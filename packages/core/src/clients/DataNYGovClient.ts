import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios from 'axios';

import type {Cash4LifeDrawDto, MegaMillionsDrawDto, PowerballDrawDto} from '../models/USLotto';
import type {LoggerService} from '../services/logger/loggerService';

export const DATA_NY_GOV_BASE_URL = 'https://data.ny.gov/resource';

export const US_LOTTERY_RESOURCE_IDS = {
  POWERBALL: 'd6yy-54nr',
  MEGA_MILLIONS: '5xaw-6ayf',
  CASH4LIFE: 'kwxv-fwze',
} as const;

export interface DataNYGovQueryOptions {
  $limit?: number;
  $offset?: number;
  $order?: string;
  $where?: string;
}

@injectable({scope: BindingScope.SINGLETON})
export class DataNYGovClient {
  constructor(
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
  ) {}

  /**
   * Generic method to fetch any dataset from data.ny.gov
   * @param resourceId - The dataset resource ID
   * @param options - Query options ($limit, $offset, $order, $where)
   */
  async fetchDataset<T>(resourceId: string, options?: DataNYGovQueryOptions): Promise<T[]> {
    const url = `${DATA_NY_GOV_BASE_URL}/${resourceId}.json`;
    const params = this.buildQueryParams(options);

    try {
      const response = await axios.get<T[]>(url, {params});
      return response.data;
    } catch (error) {
      this.loggerService.logError({
        message: `Failed to fetch data from data.ny.gov: ${resourceId}`,
        errorConstructor: HttpErrors.BadRequest,
      });
    }
  }

  /**
   * Fetch Powerball draws
   * @param dateFrom - Optional start date filter
   * @param dateTo - Optional end date filter
   */
  async fetchPowerballDraws(dateFrom?: Date, dateTo?: Date): Promise<PowerballDrawDto[]> {
    const where = this.buildDateWhereClause(dateFrom, dateTo);
    return this.fetchDataset<PowerballDrawDto>(US_LOTTERY_RESOURCE_IDS.POWERBALL, {
      $where: where,
      $order: 'draw_date DESC',
      $limit: 10000,
    });
  }

  /**
   * Fetch Mega Millions draws
   * @param dateFrom - Optional start date filter
   * @param dateTo - Optional end date filter
   */
  async fetchMegaMillionsDraws(dateFrom?: Date, dateTo?: Date): Promise<MegaMillionsDrawDto[]> {
    const where = this.buildDateWhereClause(dateFrom, dateTo);
    return this.fetchDataset<MegaMillionsDrawDto>(US_LOTTERY_RESOURCE_IDS.MEGA_MILLIONS, {
      $where: where,
      $order: 'draw_date DESC',
      $limit: 10000,
    });
  }

  /**
   * Fetch Cash4Life draws
   * @param dateFrom - Optional start date filter
   * @param dateTo - Optional end date filter
   */
  async fetchCash4LifeDraws(dateFrom?: Date, dateTo?: Date): Promise<Cash4LifeDrawDto[]> {
    const where = this.buildDateWhereClause(dateFrom, dateTo);
    return this.fetchDataset<Cash4LifeDrawDto>(US_LOTTERY_RESOURCE_IDS.CASH4LIFE, {
      $where: where,
      $order: 'draw_date DESC',
      $limit: 10000,
    });
  }

  /**
   * Build query params from options
   */
  private buildQueryParams(options?: DataNYGovQueryOptions): Record<string, string> {
    const params: Record<string, string> = {};
    if (options?.$limit) params.$limit = options.$limit.toString();
    if (options?.$offset) params.$offset = options.$offset.toString();
    if (options?.$order) params.$order = options.$order;
    if (options?.$where) params.$where = options.$where;
    return params;
  }

  /**
   * Build SoQL WHERE clause for date filtering
   * @param dateFrom - Start date
   * @param dateTo - End date
   */
  private buildDateWhereClause(dateFrom?: Date, dateTo?: Date): string | undefined {
    const clauses: string[] = [];

    if (dateFrom) {
      clauses.push(`draw_date >= '${dateFrom.toISOString().split('T')[0]}'`);
    }
    if (dateTo) {
      clauses.push(`draw_date <= '${dateTo.toISOString().split('T')[0]}'`);
    }

    return clauses.length > 0 ? clauses.join(' AND ') : undefined;
  }
}
