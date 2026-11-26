export type SkeletonKind = 'page' | 'table' | 'directory' | 'players' | 'form' | 'summary'

const shape = {
  page: [2, 1, 1, 1],
  table: [3, 3, 3, 3, 3, 3, 3],
  directory: [2, 2, 2, 2],
  players: Array.from({ length: 12 }, () => 2),
  form: [1, 1, 1, 1],
  summary: [1, 1],
} as const

export function Skeleton({ kind = 'page' }: { kind?: SkeletonKind }) {
  return <div className="skeleton" data-kind={kind} role="status" aria-label="正在读取内容">
    {shape[kind].map((columns, row) => <div className="skeleton-row" key={row} aria-hidden="true">
      {Array.from({ length: columns }, (_, column) => <span key={column} />)}
    </div>)}
  </div>
}
