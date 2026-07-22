import 'server-only';
import { publicDb } from '@/lib/public-db';
import { services as staticServices, type Service } from '@/content/services';

export interface DbServiceRow {
  number: number | null;
  title: string;
  description: string | null;
  description_en: string | null;
}

export interface ServicesDb {
  from(table: 'services'): {
    select(columns: string): {
      order(column: 'number', options: { ascending: boolean }): Promise<{
        data: unknown[] | null;
        error: unknown | null;
      }>;
    };
  };
}

export const SERVICE_SELECT = 'number,title,description,description_en';

export function mapDbService(row: DbServiceRow): Service {
  const description = row.description ?? '';
  return {
    no: String(row.number ?? 0).padStart(2, '0'),
    title: row.title,
    description,
    descriptionEn: row.description_en ?? description,
  };
}

export async function getServices(
  db: ServicesDb = publicDb() as unknown as ServicesDb,
): Promise<Service[]> {
  try {
    const { data, error } = await db.from('services').select(SERVICE_SELECT).order('number', {
      ascending: true,
    });
    if (error || !data || data.length === 0) return staticServices;
    return (data as DbServiceRow[]).map(mapDbService);
  } catch {
    return staticServices;
  }
}
