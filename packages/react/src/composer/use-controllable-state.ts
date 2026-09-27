import { useCallback, useRef, useState } from 'react'

type SetState<T> = (next: T | ((previous: T) => T)) => void

/** State that is controlled when `value` is defined, internal otherwise. */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void
): [T, SetState<T>, { readonly current: T }] {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  const latestRef = useRef(current)
  latestRef.current = current
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const isControlledRef = useRef(isControlled)
  isControlledRef.current = isControlled

  const setValue = useCallback<SetState<T>>((next) => {
    const resolved =
      typeof next === 'function'
        ? (next as (previous: T) => T)(latestRef.current)
        : next
    if (Object.is(resolved, latestRef.current)) return
    latestRef.current = resolved
    if (!isControlledRef.current) setInternal(resolved)
    onChangeRef.current?.(resolved)
  }, [])

  return [current, setValue, latestRef]
}
