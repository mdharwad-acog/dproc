import { createLogger } from '../utils/logger.js';
import type { UniversalBundle } from '../bundles/types.js';
import type { SearchPlan, SearchFilter } from './types.js';

const log = createLogger('core:search:executor');

export class QueryExecutor {
  static execute(bundle: UniversalBundle, plan: SearchPlan): Record<string, any>[] {
    log.debug('Executing search plan: %d filters', plan.filters.length);

    let results = [...bundle.records];
    const startCount = results.length;

    for (const filter of plan.filters) {
      const beforeFilter = results.length;
      results = this.applyFilter(results, filter);
      log.debug('After filter %s %s %s: %d → %d records', 
        filter.field, 
        filter.operator, 
        filter.value, 
        beforeFilter,
        results.length
      );
    }

    if (plan.sortBy) {
      results = this.sortResults(results, plan.sortBy, plan.sortOrder);
      log.debug('Sorted by %s %s', plan.sortBy, plan.sortOrder);
    }

    if (plan.limit && plan.limit > 0) {
      results = results.slice(0, plan.limit);
    }

    log.info('Query executed: %d → %d records (filtered %d)', 
      startCount, 
      results.length, 
      startCount - results.length
    );

    return results;
  }

  private static applyFilter(
    records: Record<string, any>[],
    filter: SearchFilter
  ): Record<string, any>[] {
    return records.filter(record => {
      const fieldValue = record[filter.field];
      const filterValue = filter.value;

      // Handle null/undefined
      if (fieldValue === null || fieldValue === undefined) {
        return filter.operator === '!=';
      }

      switch (filter.operator) {
        case '=':
          return this.compareEqual(fieldValue, filterValue);
        
        case '!=':
          return !this.compareEqual(fieldValue, filterValue);
        
        case '>':
          return this.toNumber(fieldValue) > this.toNumber(filterValue);
        
        case '<':
          return this.toNumber(fieldValue) < this.toNumber(filterValue);
        
        case '>=':
          return this.toNumber(fieldValue) >= this.toNumber(filterValue);
        
        case '<=':
          return this.toNumber(fieldValue) <= this.toNumber(filterValue);
        
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
        
        case 'startsWith':
          return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
        
        case 'endsWith':
          return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
        
        default:
          log.warn('Unknown operator: %s', filter.operator);
          return true;
      }
    });
  }

  private static compareEqual(value1: any, value2: any): boolean {
    // Strict equality first
    if (value1 === value2) {
      return true;
    }

    // Convert both to strings and compare (case-insensitive)
    const str1 = String(value1).trim().toLowerCase();
    const str2 = String(value2).trim().toLowerCase();
    
    if (str1 === str2) {
      return true;
    }

    // Try numeric comparison for number-like strings
    const num1 = Number(value1);
    const num2 = Number(value2);
    if (!isNaN(num1) && !isNaN(num2) && num1 === num2) {
      return true;
    }

    // Try boolean comparison
    const bool1 = this.toBoolean(value1);
    const bool2 = this.toBoolean(value2);
    if (bool1 !== null && bool2 !== null && bool1 === bool2) {
      return true;
    }

    return false;
  }

  private static toBoolean(value: any): boolean | null {
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase().trim();
    if (str === 'true' || str === '1') return true;
    if (str === 'false' || str === '0') return false;
    return null;
  }

  private static toNumber(value: any): number {
    if (typeof value === 'number') return value;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  private static sortResults(
    records: Record<string, any>[],
    sortBy: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Record<string, any>[] {
    return records.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
}