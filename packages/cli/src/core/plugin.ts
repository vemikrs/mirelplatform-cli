export function discoverPlugins(): string[] {
  // NOTE: 簡略実装。実際には npm や package.json を調べる。
  const candidates: string[] = [
    '@vemijp/mirel-promarker',
  ];
  return candidates;
}
