'use client'

import React from 'react'

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  rightAction?: React.ReactNode
  large?: boolean
}
export function PageHeader({ title, subtitle, rightAction, large = true }: PageHeaderProps) {
  return (
    <div className="px-5 pt-14 pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className={large ? 'large-title' : 'title-2'} style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="footnote mt-1">{subtitle}</p>
          )}
        </div>
        {rightAction && <div className="flex-shrink-0 mt-2">{rightAction}</div>}
      </div>
    </div>
  )
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}
export function SearchBar({ value, onChange, placeholder = 'Cari...' }: SearchBarProps) {
  return (
    <div className="px-4 mb-3">
      <div className="ios-searchbar">
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm font-medium outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'var(--text-tertiary)' }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────────
interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onDismiss?: () => void
}
const ALERT_CONFIG = {
  success: { bg: 'rgba(52,199,89,0.12)',  border: 'rgba(52,199,89,0.3)',  icon: '✓', iconBg: 'var(--ios-green)' },
  error:   { bg: 'rgba(255,59,48,0.10)',  border: 'rgba(255,59,48,0.3)', icon: '✕', iconBg: 'var(--ios-red)' },
  warning: { bg: 'rgba(255,149,0,0.10)', border: 'rgba(255,149,0,0.3)', icon: '!', iconBg: 'var(--ios-orange)' },
  info:    { bg: 'rgba(0,122,255,0.10)',  border: 'rgba(0,122,255,0.3)', icon: 'i', iconBg: 'var(--ios-blue)' },
}
export function AlertBanner({ type, message, onDismiss }: AlertBannerProps) {
  const c = ALERT_CONFIG[type]
  return (
    <div
      className="mx-4 mb-3 flex items-center gap-3 px-3 py-3 rounded-xl border anim-slide-up"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ background: c.iconBg }}
      >
        {c.icon}
      </div>
      <p className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-xl leading-none flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>×</button>
      )}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  gradient: string
  icon?: React.ReactNode
}
export function StatCard({ label, value, sublabel, gradient, icon }: StatCardProps) {
  return (
    <div className={`stat-card ${gradient}`}>
      {icon && <div className="mb-3 opacity-80">{icon}</div>}
      <div className="text-white font-bold text-2xl leading-tight tracking-tight">{value}</div>
      <div className="text-white font-medium text-xs mt-1 opacity-85">{label}</div>
      {sublabel && <div className="text-white text-[10px] mt-0.5 opacity-60">{sublabel}</div>}
    </div>
  )
}

// ─── iOS Toggle ───────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}
export function IOSToggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`ios-toggle ${checked ? 'on' : ''}`}
        style={{ background: checked ? 'var(--ios-green)' : 'var(--separator-opaque)' }}
      >
        <div className="ios-toggle-thumb" />
      </button>
    </div>
  )
}

// ─── Input Field ──────────────────────────────────────────────────────────────
interface InputFieldProps {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  required?: boolean
  hint?: string
  min?: string
  max?: string
}
export function InputField({
  label, value, onChange, placeholder, type = 'text',
  disabled, required, hint, min, max
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-semibold px-0.5" style={{ color: 'var(--text-secondary)' }}>
          {label}{required && <span className="ml-1" style={{ color: 'var(--ios-red)' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        className="ios-input"
      />
      {hint && <p className="text-xs px-0.5" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>}
    </div>
  )
}

// ─── Select Field ─────────────────────────────────────────────────────────────
interface SelectFieldProps {
  label?: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  required?: boolean
  placeholder?: string
}
export function SelectField({ label, value, onChange, children, required, placeholder }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-semibold px-0.5" style={{ color: 'var(--text-secondary)' }}>
          {label}{required && <span className="ml-1" style={{ color: 'var(--ios-red)' }}>*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className="ios-select"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── Primary Button ───────────────────────────────────────────────────────────
interface BtnProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  className?: string
}
const BTN_VARIANT = {
  primary:   'ios-btn-primary',
  secondary: 'ios-btn-ghost',
  danger:    'ios-btn-red',
  ghost:     '',
}
const BTN_SIZE = {
  sm: 'ios-btn-sm',
  md: 'ios-btn-md',
  lg: 'ios-btn-lg',
}
export function Btn({ children, onClick, type = 'button', disabled, loading, variant = 'primary', size = 'md', fullWidth, className = '' }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`ios-btn ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${fullWidth ? 'ios-btn-full' : ''} ${className}`}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : children}
    </button>
  )
}

// ─── Section List ─────────────────────────────────────────────────────────────
interface ListSectionProps {
  title?: string
  footer?: string
  children: React.ReactNode
  className?: string
}
export function ListSection({ title, footer, children, className = '' }: ListSectionProps) {
  return (
    <div className={`mb-2 ${className}`}>
      {title && <div className="section-header">{title}</div>}
      <div className="ios-card mx-4">{children}</div>
      {footer && <p className="footnote px-5 mt-2">{footer}</p>}
    </div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────
interface ListRowProps {
  icon?: React.ReactNode
  iconGradient?: string
  iconColor?: string
  title: string
  subtitle?: string
  value?: React.ReactNode
  chevron?: boolean
  onClick?: () => void
  destructive?: boolean
  badge?: string
}
export function ListRow({
  icon, iconGradient, iconColor, title, subtitle, value, chevron, onClick, destructive, badge
}: ListRowProps) {
  return (
    <div
      className={`ios-row ${onClick ? 'pressable' : ''}`}
      onClick={onClick}
    >
      {icon && (
        <div
          className="icon-bubble"
          style={{ background: iconGradient || iconColor || 'var(--ios-blue)' }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div
          className="headline truncate"
          style={{ color: destructive ? 'var(--ios-red)' : 'var(--text-primary)', fontWeight: 500, fontSize: '15px' }}
        >
          {title}
        </div>
        {subtitle && <div className="caption mt-0.5">{subtitle}</div>}
      </div>
      {badge && (
        <span className="ios-badge text-white text-[10px] ml-2 flex-shrink-0" style={{ background: 'var(--ios-red)' }}>
          {badge}
        </span>
      )}
      {value && (
        <div className="footnote ml-2 flex-shrink-0 text-right">{value}</div>
      )}
      {chevron && (
        <svg className="chevron ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'
const BADGE_STYLE: Record<BadgeColor, { bg: string; color: string }> = {
  blue:   { bg: 'rgba(0,122,255,0.12)',   color: 'var(--ios-blue)' },
  green:  { bg: 'rgba(52,199,89,0.12)',   color: 'var(--ios-green)' },
  orange: { bg: 'rgba(255,149,0,0.12)',   color: 'var(--ios-orange)' },
  red:    { bg: 'rgba(255,59,48,0.12)',   color: 'var(--ios-red)' },
  purple: { bg: 'rgba(175,82,222,0.12)',  color: 'var(--ios-purple)' },
  gray:   { bg: 'var(--fill-tertiary)',   color: 'var(--text-tertiary)' },
}
export function Badge({ label, color = 'blue' }: { label: string; color?: BadgeColor }) {
  const s = BADGE_STYLE[color]
  return (
    <span className="ios-badge" style={{ background: s.bg, color: s.color }}>
      {label}
    </span>
  )
}

// ─── Skeleton List ────────────────────────────────────────────────────────────
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="ios-card mx-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ios-row">
          <div className="ios-skeleton w-9 h-9 rounded-lg mr-3 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="ios-skeleton h-4 rounded" style={{ width: `${55 + (i % 3) * 15}%` }} />
            <div className="ios-skeleton h-3 rounded" style={{ width: `${30 + (i % 2) * 20}%` }} />
          </div>
          <div className="ios-skeleton h-5 rounded-full w-14 ml-3" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
}
export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center anim-fade-in">
      {icon && <div className="opacity-20 mb-4">{icon}</div>}
      <p className="headline mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      {subtitle && <p className="footnote mt-1">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ─── Pill Filter ──────────────────────────────────────────────────────────────
interface PillOption<T> { value: T; label: string; color?: string }
interface PillFilterProps<T> {
  options: PillOption<T>[]
  value: T
  onChange: (v: T) => void
}
export function PillFilter<T extends string>({ options, value, onChange }: PillFilterProps<T>) {
  return (
    <div className="flex gap-2 px-4 mb-3 overflow-x-auto no-scrollbar">
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: active ? (opt.color || 'var(--ios-blue)') : 'var(--fill-tertiary)',
              color: active ? 'white' : 'var(--text-secondary)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
  icon?: React.ReactNode
}
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Konfirmasi', confirmVariant = 'danger', icon }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8 sm:items-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-xs rounded-2xl overflow-hidden anim-scale-in" style={{ background: 'var(--bg-card)' }}>
        <div className="p-6 text-center">
          {icon && <div className="flex justify-center mb-4">{icon}</div>}
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{message}</p>
        </div>
        <div className="ios-divider" />
        <div className="flex">
          <button onClick={onClose} className="flex-1 py-4 text-[17px] font-medium" style={{ color: 'var(--ios-blue)' }}>Batal</button>
          <div className="ios-divider" style={{ width: '0.5px', height: 'auto' }} />
          <button
            onClick={() => { onConfirm(); }}
            className="flex-1 py-4 text-[17px] font-semibold"
            style={{ color: confirmVariant === 'danger' ? 'var(--ios-red)' : 'var(--ios-blue)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div
        className="w-full rounded-t-3xl pt-3 pb-8 max-h-[90dvh] overflow-y-auto anim-slide-up"
        style={{ background: 'var(--bg-card)', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="ios-sheet-handle" />
        {title && <h3 className="title-2 px-5 mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  )
}
