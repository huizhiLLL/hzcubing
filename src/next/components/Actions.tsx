import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton, type SkeletonKind } from './Skeleton'
import { Button, type ButtonProps } from './ui/button'

export function IconButton({ label, children, className, ...props }: ButtonProps & { label: string; children: ReactNode }) {
  return <Button variant="ghost" size="icon" className={`icon-action ${className ?? ''}`} title={label} aria-label={label} {...props}>
    <span className="icon-glyph" aria-hidden="true">{children}</span>
  </Button>
}

export function ActionLink({ label, to, children }: { label: string; to: string; children: ReactNode }) {
  return <IconButton label={label} render={<Link to={to} />}>{children}</IconButton>
}

export function Pagination({ page, more, loading, onPage, showPage }: {
  page: number; more: boolean; loading?: boolean; onPage: (page: number) => void; showPage?: boolean
}) {
  if (page <= 1 && !more && !showPage) return null
  return <div className="actions pagination" role="group" aria-label="翻页">
    <IconButton label="上一页" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}><ChevronLeft /></IconButton>
    {showPage && <span className="pagination-page" aria-live="polite">第 {page} 页</span>}
    <IconButton label="下一页" disabled={!more || loading} onClick={() => onPage(page + 1)}><ChevronRight /></IconButton>
  </div>
}

export function ResourceNotice({ loading, error, empty, skeleton }: {
  loading?: boolean; error?: string; empty?: string; skeleton?: SkeletonKind
}) {
  if (loading) return <Skeleton kind={skeleton} />
  if (error) return <p className="notice error" role="alert">{error}</p>
  return empty ? <p className="notice">{empty}</p> : null
}
