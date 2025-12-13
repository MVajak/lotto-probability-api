export function createStubInstance<T>(overrides: Partial<T>): T {
  return overrides as T;
}

export function createStubInstances<T>(array: Partial<T>[]): T[] {
  return array.map(value => createStubInstance(value));
}
