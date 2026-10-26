import React, { useEffect, useMemo, useState } from 'react'
import { ImagePlus, UploadCloud } from 'lucide-react'
import type { FormConfig, FormField, FormValues } from '../lib/app-context'
import { readImageFile } from '../lib/utils'
import { Button, Field, Input, Select, Textarea } from './ui'

export function DynamicForm({ config, onCancel, onSubmitDone }: { config: FormConfig; onCancel: () => void; onSubmitDone: () => void }) {
  const [values, setValues] = useState<FormValues>({})
  const [imageError, setImageError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const initial: FormValues = { ...(config.initial || {}) }
    config.fields.forEach((f) => {
      if (initial[f.name] === undefined && f.defaultValue !== undefined) initial[f.name] = f.defaultValue
      if (initial[f.name] === undefined && f.type === 'checkbox') initial[f.name] = false
    })
    setValues(initial)
    setImageError('')
  }, [config.key, config])

  const setValue = (name: string, value: string | number | boolean | undefined) => setValues((prev) => ({ ...prev, [name]: value }))

  const handleFile = async (field: FormField, file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      if (field.type === 'image') {
        const data = await readImageFile(file)
        setValue(field.name, data)
      } else {
        setValue(field.name, file.name)
      }
      setImageError('')
    } catch {
      setImageError('Could not read that file. Please try another one.')
    } finally {
      setBusy(false)
    }
  }

  const missing = useMemo(() => config.fields.filter((f) => f.required && (values[f.name] === undefined || values[f.name] === '' || values[f.name] === null)).map((f) => f.label), [config.fields, values])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (missing.length) return
    config.onSubmit(values)
    onSubmitDone()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {config.fields.map((field) => {
          const value = values[field.name]
          const common = {
            name: field.name,
            required: field.required,
            disabled: field.disabled,
            placeholder: field.placeholder,
            min: field.min,
            max: field.max,
            step: field.step,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
              const target = e.target as HTMLInputElement
              setValue(field.name, field.type === 'number' ? (target.value === '' ? '' : Number(target.value)) : target.value)
            },
          }
          if (field.type === 'checkbox') {
            return (
              <Field key={field.name} label={field.label} span={field.span} hint={field.hint}>
                <button type="button" onClick={() => setValue(field.name, !Boolean(value))} className="flex h-[42px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 hover:border-brand-300">
                  <span className="font-medium">{Boolean(value) ? 'Enabled' : 'Disabled'}</span>
                  <span className={`relative h-5 w-9 rounded-full transition ${value ? 'bg-brand-600' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? 'left-[18px]' : 'left-0.5'}`} />
                  </span>
                </button>
              </Field>
            )
          }
          if (field.type === 'image') {
            return (
              <Field key={field.name} label={field.label} span={field.span} hint={field.hint}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-brand-50/40 px-3 py-2.5 hover:bg-brand-50">
                  {typeof value === 'string' && value.startsWith('data:') ? <img src={value} alt="preview" className="h-12 w-12 rounded-xl object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-500"><ImagePlus className="h-5 w-5" /></span>}
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-brand-700">{value ? 'Change photo' : 'Choose a photo'}</span><span className="block truncate text-xs text-slate-400">{value ? 'Photo ready to save' : 'JPG, PNG or WEBP'}</span></span>
                  <input type="file" accept={field.accept || 'image/*'} className="hidden" onChange={(e) => handleFile(field, e.target.files?.[0])} />
                </label>
              </Field>
            )
          }
          if (field.type === 'file') {
            return (
              <Field key={field.name} label={field.label} span={field.span} hint={field.hint}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-brand-50/40 px-3 py-2.5 hover:bg-brand-50">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-500"><UploadCloud className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-700">{value ? String(value) : 'Choose a file'}</span>
                  <input type="file" accept={field.accept} className="hidden" onChange={(e) => handleFile(field, e.target.files?.[0])} />
                </label>
              </Field>
            )
          }
          if (field.type === 'select') {
            return (
              <Field key={field.name} label={field.label} required={field.required} span={field.span} hint={field.hint}>
                <Select {...common} value={String(value ?? '')}>
                  <option value="">Select {field.label.toLowerCase()}</option>
                  {(field.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </Field>
            )
          }
          if (field.type === 'textarea') {
            return (
              <Field key={field.name} label={field.label} required={field.required} span={field.span} hint={field.hint}>
                <Textarea {...common} value={String(value ?? '')} rows={field.rows || 3} />
              </Field>
            )
          }
          return (
            <Field key={field.name} label={field.label} required={field.required} span={field.span} hint={field.hint}>
              <Input
                {...common}
                type={field.type || 'text'}
                accept={field.accept}
                value={String(value ?? '')}
                onChange={(e) => setValue(field.name, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
              />
            </Field>
          )
        })}
      </div>
      {imageError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{imageError}</p> : null}
      {missing.length ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">Required: {missing.join(', ')}</p> : null}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-blue-50 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy || missing.length > 0}>{busy ? 'Processing…' : config.submitLabel || 'Save'}</Button>
      </div>
    </form>
  )
}
