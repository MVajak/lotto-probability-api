export function extractIdsFromEntitiesSet<T>(key: keyof T, entities: T[]): Set<T[keyof T]> {
  return new Set(entities.map(entity => entity[key]));
}
export function extractIdsFromEntities<T>(key: keyof T, entities: T[]): T[keyof T][] {
  return Array.from(extractIdsFromEntitiesSet(key, entities));
}
