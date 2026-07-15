/**
 * Order items (projects) by the AI display-rank map (slug → ai_rank), lowest first;
 * items with no rank keep their original relative order and go last. Pure + stable so
 * the ranking (B5) drives Featured / Selected-work / /projects order while the static
 * catalog stays the content source.
 */
export function orderByRank<T extends { slug: string }>(
  items: T[],
  rankBySlug: Map<string, number>,
): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ra = rankBySlug.get(a.item.slug) ?? Infinity;
      const rb = rankBySlug.get(b.item.slug) ?? Infinity;
      if (ra !== rb) return ra - rb;
      return a.index - b.index; // stable
    })
    .map(({ item }) => item);
}
