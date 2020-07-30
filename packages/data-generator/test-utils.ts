export function assertTruthy<T>(some: T | undefined): asserts some {
  expect(some).toBeTruthy();
}
