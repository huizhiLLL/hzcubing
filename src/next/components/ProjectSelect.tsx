import { useId } from 'react'
import { categories, type EventInfo } from '../api'
import { Select, SelectGroup, SelectGroupLabel, SelectItem, SelectPopup, SelectTrigger, SelectValue } from './ui/select'

type ProjectSelectProps = {
  events: EventInfo[]
  value: string
  onValueChange: (value: string) => void
  name?: string
  required?: boolean
}

export function ProjectSelect({ events, value, onValueChange, name, required }: ProjectSelectProps) {
  const id = useId()
  const groups = Object.entries(categories).map(([category, label]) => ({
    label,
    options: events.filter(event => event.category === category).map(event => ({ value: event.code, label: event.name })),
  }))
  const items = groups.flatMap(group => group.options)
  const currentMissing = value && !items.some(item => item.value === value)
  if (currentMissing) items.push({ value, label: value })

  return <div className="project-select-field">
    <label htmlFor={id}>项目</label>
    <Select items={items} value={value} name={name} required={required} onValueChange={next => {
      if (next !== null) onValueChange(next)
    }}>
      <SelectTrigger id={id} className="w-full min-w-0 text-start">
        <SelectValue placeholder="选择项目" />
      </SelectTrigger>
      <SelectPopup alignItemWithTrigger={false} className="max-h-[min(20rem,var(--available-height))]">
        {groups.map(({ label, options }) => options.length > 0 && <SelectGroup key={label}>
          <SelectGroupLabel>{label}</SelectGroupLabel>
          {options.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
        </SelectGroup>)}
        {currentMissing && <SelectItem value={value}>{value}</SelectItem>}
      </SelectPopup>
    </Select>
  </div>
}
