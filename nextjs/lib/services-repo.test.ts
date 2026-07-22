import { describe, expect, test } from 'bun:test';
import { services as staticServices } from '@/content/services';
import {
  getServices,
  mapDbService,
  SERVICE_SELECT,
  type ServicesDb,
} from './services-repo';

function fakeDb(result: { data: unknown[] | null; error: unknown | null }) {
  const calls: string[] = [];
  const db: ServicesDb = {
    from(table) {
      calls.push(`from:${table}`);
      return {
        select(columns) {
          calls.push(`select:${columns}`);
          return {
            order(column, options) {
              calls.push(`order:${column}:${String(options.ascending)}`);
              return Promise.resolve(result);
            },
          };
        },
      };
    },
  };
  return { db, calls };
}

describe('mapDbService', () => {
  test('pads the DB number and falls back to the Thai description', () => {
    expect(
      mapDbService({
        number: 3,
        title: 'AI Product',
        description: 'คำอธิบาย',
        description_en: null,
      }),
    ).toEqual({
      no: '03',
      title: 'AI Product',
      description: 'คำอธิบาย',
      descriptionEn: 'คำอธิบาย',
    });
  });

  test('uses zero when a service number is null', () => {
    expect(
      mapDbService({ number: null, title: 'Consult', description: null, description_en: null }),
    ).toEqual({ no: '00', title: 'Consult', description: '', descriptionEn: '' });
  });
});

describe('getServices', () => {
  test('uses the expected DB select/order and maps non-empty results', async () => {
    const { db, calls } = fakeDb({
      data: [{ number: 1, title: 'Landing Page', description: 'TH', description_en: 'EN' }],
      error: null,
    });
    await expect(getServices(db)).resolves.toEqual([
      { no: '01', title: 'Landing Page', description: 'TH', descriptionEn: 'EN' },
    ]);
    expect(SERVICE_SELECT).toBe('number,title,description,description_en');
    expect(calls).toEqual([
      'from:services',
      'select:number,title,description,description_en',
      'order:number:true',
    ]);
  });

  test('returns the static fallback for an empty result', async () => {
    const { db } = fakeDb({ data: [], error: null });
    await expect(getServices(db)).resolves.toEqual(staticServices);
  });
});
