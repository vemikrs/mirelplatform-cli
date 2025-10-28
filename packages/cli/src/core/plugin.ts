export function discoverPlugins(): string[] {
  // NOTE: 簡略実装。実際には npm や package.json を調べる。
  const candidates: string[] = [
    '@vemi/mirel-promarker',
  ];
  return candidates;
}
