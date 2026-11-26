import { useId, useLayoutEffect, useRef } from 'react'
import { categories, type EventInfo } from '../api'
import { Select, SelectGroup, SelectGroupLabel, SelectItem, SelectPopup, SelectTrigger, SelectValue } from './ui/select'

type ProjectSelectProps = {
  events: EventInfo[]
  value: string
  onValueChange: (value: string) => void
  name?: string
  required?: boolean
  compact?: boolean
}

function ProjectLabel({ name, iconId }: { name: string; iconId?: string | null }) {
  return <span className="project-option-label">
    {iconId && <span className={`cubing-icon ${iconId === 'fto' ? 'unofficial-fto' : `event-${iconId}`}`} aria-hidden="true" />}
    <span>{name}</span>
  </span>
}

export function ProjectSelect({ events, value, onValueChange, name, required, compact = false }: ProjectSelectProps) {
  const id = useId()
  const fieldRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const field = fieldRef.current
    const label = labelRef.current
    if (!compact || !field || !label) return

    const syncWidth = () => field.style.setProperty('--project-label-width', `${Math.ceil(label.getBoundingClientRect().width)}px`)
    syncWidth()
    const observer = new ResizeObserver(syncWidth)
    observer.observe(label)
    return () => observer.disconnect()
  }, [compact])
  const groups = Object.entries(categories).map(([category, label]) => ({
    label,
    options: events.filter(event => event.category === category).map(event => ({
      value: event.code, label: event.name, iconId: category === 'official' ? event.iconId : null,
    })),
  }))
  const items = groups.flatMap(group => group.options)
  const current = items.find(item => item.value === value)
  const currentMissing = value && !current
  if (currentMissing) items.push({ value, label: value, iconId: null })

  const selectedLabel = current ? <ProjectLabel name={current.label} iconId={current.iconId} /> : value || undefined

  return <div className={compact ? 'project-select-field project-select-compact' : 'project-select-field'} ref={fieldRef}>
    <label htmlFor={id}>项目</label>
    <Select items={items} value={value} name={name} required={required} onValueChange={next => {
      if (next !== null) onValueChange(next)
    }}>
      <SelectTrigger id={id} className="w-full min-w-0 text-start enabled:cursor-pointer">
        <SelectValue placeholder="选择项目">{compact
          ? <span className="project-select-content" ref={labelRef} title={current?.label || value || undefined}>
              <span className="project-select-current" key={value}>{selectedLabel || '选择项目'}</span>
            </span>
          : selectedLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false} className="project-select-list">
        {groups.map(({ label, options }) => options.length > 0 && <SelectGroup key={label} className="project-option-group">
          <SelectGroupLabel>{label}</SelectGroupLabel>
          {options.map(item => <SelectItem key={item.value} value={item.value} label={item.label}>
            <ProjectLabel name={item.label} iconId={item.iconId} />
          </SelectItem>)}
        </SelectGroup>)}
        {currentMissing && <SelectItem value={value}>{value}</SelectItem>}
      </SelectPopup>
    </Select>
  </div>
}
