import { api } from "./client";

interface Paged<T> {
  data?: T[];
  pagination?: { totalPages?: number };
}

/** Recorre todas las páginas de una lista paginada del backend (100 por página) */
export async function fetchAllPages<T>(path: string) {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await api<Paged<T>>("admin", path, {
      query: { page, limit: 100 },
    });
    items.push(...(response.data ?? []));
    totalPages = response.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);
  return items;
}

/** Lista simple con la forma `{ data: [...] }` */
export const fetchList = async <T>(path: string) =>
  (await api<{ data?: T[] }>("admin", path)).data ?? [];
