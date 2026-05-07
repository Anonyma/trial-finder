/**
 * Mock database client for local development without Supabase.
 * Mirrors the Drizzle ORM API for drop-in compatibility.
 */

import { mockTrials, mockIngestionRuns, filterMockTrials } from "./mock-data";
import type { Trial, IngestionRun, NewTrial } from "./schema";

// Simple mock query builder that mimics Drizzle's API
class MockQueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private limitVal?: number;
  private offsetVal?: number;
  private orderByVal?: { column: string; direction: 'asc' | 'desc' };

  constructor(table: string) {
    this.table = table;
  }

  where(filter: any) {
    // Handle SQL condition strings (simplified)
    if (typeof filter === 'string') {
      // Parse simple equality conditions like "id = 'NCT123'"
      const match = filter.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
      if (match) {
        const [, col, val] = match;
        this.filters.push(item => item[col] === val);
      }
    } else if (typeof filter === 'object' && filter !== null) {
      // Handle Drizzle eq(), inArray(), etc.
      this.filters.push(item => {
        for (const [key, value] of Object.entries(filter)) {
          if (Array.isArray(value)) {
            if (!value.includes(item[key])) return false;
          } else if (typeof value === 'object' && value !== null) {
            // Handle SQL operator wrappers (simplified)
            const val = Object.values(value)[0];
            if (Array.isArray(val) && !val.includes(item[key])) return false;
            if (item[key] !== val) return false;
          } else {
            if (item[key] !== value) return false;
          }
        }
        return true;
      });
    }
    return this;
  }

  limit(n: number) {
    this.limitVal = n;
    return this;
  }

  offset(n: number) {
    this.offsetVal = n;
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc') {
    this.orderByVal = { column, direction };
    return this;
  }

  private getData(): any[] {
    let data: any[];
    switch (this.table) {
      case 'trials':
        data = [...mockTrials];
        break;
      case 'ingestion_runs':
        data = [...mockIngestionRuns];
        break;
      default:
        data = [];
    }

    // Apply filters
    for (const filter of this.filters) {
      data = data.filter(filter);
    }

    // Apply ordering
    if (this.orderByVal) {
      data.sort((a, b) => {
        const aVal = a[this.orderByVal!.column];
        const bVal = b[this.orderByVal!.column];
        if (aVal < bVal) return this.orderByVal!.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.orderByVal!.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply offset
    if (this.offsetVal) {
      data = data.slice(this.offsetVal);
    }

    // Apply limit
    if (this.limitVal) {
      data = data.slice(0, this.limitVal);
    }

    return data;
  }

  async execute(): Promise<any[]> {
    return this.getData();
  }

  // For .select() chaining
  select(columns?: any) {
    return {
      from: (table: any) => this,
      where: (filter: any) => this.where(filter),
      limit: (n: number) => this.limit(n),
      offset: (n: number) => this.offset(n),
      orderBy: (column: any, direction?: any) => {
        if (typeof column === 'function') {
          // Drizzle column reference
          const colName = column.name || 'id';
          this.orderByVal = { column: colName, direction: direction || 'asc' };
        } else if (typeof column === 'object') {
          // Handle desc() wrapper
          const entries = Object.entries(column);
          if (entries.length > 0) {
            const [key, val] = entries[0];
            this.orderByVal = { column: key, direction: val === 'desc' ? 'desc' : 'asc' };
          }
        }
        return this;
      },
      then: (resolve: any) => Promise.resolve(this.getData()).then(resolve),
    };
  }
}

// Mock insert builder
class MockInsertBuilder {
  private table: string;
  private valuesData: any[] = [];

  constructor(table: string) {
    this.table = table;
  }

  values(data: any | any[]) {
    this.valuesData = Array.isArray(data) ? data : [data];
    return this;
  }

  onConflictDoUpdate(_config: any) {
    // Mock upsert - just return the values
    return this;
  }

  returning() {
    const result = this.valuesData.map((v, i) => ({ ...v, id: v.id || i + 1 }));
    return {
      then: (resolve: any) => Promise.resolve(result).then(resolve),
    };
  }

  async execute() {
    return this.valuesData;
  }
}

// Mock update builder
class MockUpdateBuilder {
  private table: string;
  private setData: any = {};
  private whereFilters: Array<(item: any) => boolean> = [];

  constructor(table: string) {
    this.table = table;
  }

  set(data: any) {
    this.setData = data;
    return this;
  }

  where(filter: any) {
    if (typeof filter === 'function') {
      this.whereFilters.push(filter);
    } else if (typeof filter === 'object') {
      this.whereFilters.push(item => {
        for (const [key, value] of Object.entries(filter)) {
          if (item[key] !== value) return false;
        }
        return true;
      });
    }
    return this;
  }

  async execute() {
    return { rowCount: 1 };
  }
}

// Mock SQL builder
export const sql = (strings: TemplateStringsArray, ...values: any[]) => {
  const raw = strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
  return { raw };
};

// Mock database object matching Drizzle's API
export const mockDb = {
  query: {
    trials: {
      findFirst: async (opts: { where: any }): Promise<Trial | undefined> => {
        const { eq } = await import('drizzle-orm');
        const trial = mockTrials.find(t => t.id === opts.where.value);
        return trial;
      },
    },
  },

  select: (columns?: any) => ({
    from: (table: any) => {
      const tableName = table?.name || 'trials';
      return new MockQueryBuilder(tableName).select(columns).from(table);
    },
  }),

  insert: (table: any) => new MockInsertBuilder(table?.name || 'trials'),
  
  update: (table: any) => new MockUpdateBuilder(table?.name || 'trials'),

  // Direct query helpers
  queryTrials: filterMockTrials,
  
  queryTrialById: (id: string): Trial | undefined => {
    return mockTrials.find(t => t.id === id);
  },

  queryIngestionRuns: (): IngestionRun[] => {
    return [...mockIngestionRuns];
  },
};

// Helper to check if we should use mock mode
export function shouldUseMockDb(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DB === 'true' || 
         process.env.USE_MOCK_DB === 'true' ||
         !process.env.DATABASE_URL ||
         process.env.DATABASE_URL?.includes('dummy');
}
