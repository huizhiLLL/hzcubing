export type SkeletonKind = 'page' | 'table' | 'directory' | 'players' | 'form'

const shape = {
  page: [2, 1, 1, 1],
  table: [3, 3, 3, 3, 3, 3, 3],
  directory: [2, 2, 2, 2],
  players: [2],
  form: [1, 1, 1, 1],
} as const

export function Skeleton({ kind = 'page', count }: { kind?: SkeletonKind; count?: number }) {
  const rows = shape[kind]
  const items = count ? Array.from({ length: count }, (_, index) => rows[index % rows.length]) : rows
  return <div className="skeleton" data-kind={kind} role="status" aria-label="正在读取内容">
    {items.map((columns, row) => <div className="skeleton-row" key={row} aria-hidden="true">
      {Array.from({ length: columns }, (_, column) => <span key={column} />)}
    </div>)}
  </div>
}
