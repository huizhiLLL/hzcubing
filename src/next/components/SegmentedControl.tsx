import type { CSSProperties } from 'react'
import { Button } from './ui/button'

type SegmentedControlProps<Value extends string> = {
  label: string
  options: readonly { value: Value; label: string }[]
  value: Value
  onValueChange: (value: Value) => void
}

export function SegmentedControl<Value extends string>({ label, options, value, onValueChange }: SegmentedControlProps<Value>) {
  const selectedIndex = options.findIndex(option => option.value === value)
  const style = { '--segment-count': options.length, '--segment-index': selectedIndex } as CSSProperties

  return <div className="segments" role="group" aria-label={label} style={style}>
    {selectedIndex >= 0 && <span aria-hidden="true" className="segment-indicator" />}
    {options.map(option => <Button key={option.value} variant="ghost" aria-pressed={option.value === value}
      onClick={() => onValueChange(option.value)}>{option.label}</Button>)}
  </div>
}
