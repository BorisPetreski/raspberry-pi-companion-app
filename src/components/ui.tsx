import type { ComponentProps, ReactNode } from 'react'
import { useState } from 'react'
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radii, spacing } from '../theme'

type IconName = ComponentProps<typeof Ionicons>['name']

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

export function PageHeader({ eyebrow, title, detail }: {
  eyebrow?: string
  title: string
  detail?: string
}) {
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  )
}

export function Panel({ children, tone = 'default' }: {
  children: ReactNode
  tone?: 'default' | 'teal' | 'amber' | 'coral'
}) {
  return <View style={[styles.panel, toneStyles[tone]]}>{children}</View>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

export function ActionButton({
  label,
  icon,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary'
}: {
  label: string
  icon: IconName
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const palette = buttonPalettes[variant]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.border },
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled
      ]}
    >
      {loading
        ? <ActivityIndicator color={palette.foreground} />
        : <Ionicons name={icon} size={20} color={palette.foreground} />}
      <Text style={[styles.buttonLabel, { color: palette.foreground }]}>{label}</Text>
    </Pressable>
  )
}

export function StatusBadge({ online, label }: { online: boolean; label: string }) {
  return (
    <View style={[styles.badge, online ? styles.badgeOnline : styles.badgeOffline]}>
      <View style={[styles.badgeDot, { backgroundColor: online ? colors.teal : colors.coral }]} />
      <Text style={[styles.badgeLabel, { color: online ? colors.teal : colors.coral }]}>{label}</Text>
    </View>
  )
}

export function InfoRow({ icon, label, value }: {
  icon: IconName
  label: string
  value: string
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.teal} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  )
}

export function VolumeSlider({
  value,
  onChange,
  onCommit,
  disabled = false
}: {
  value: number
  onChange: (value: number) => void
  onCommit: (value: number) => void
  disabled?: boolean
}) {
  const [trackWidth, setTrackWidth] = useState(1)

  const valueFromEvent = (event: GestureResponderEvent) => {
    const next = Math.round(Math.max(0, Math.min(1, event.nativeEvent.locationX / trackWidth)) * 100)
    onChange(next)
    return next
  }

  const adjust = (delta: number) => {
    const next = Math.max(0, Math.min(100, value + delta))
    onChange(next)
    onCommit(next)
  }

  return (
    <View style={[styles.sliderWrap, disabled && styles.sliderDisabled]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease volume"
        onPress={() => adjust(-5)}
        disabled={disabled}
        style={styles.iconButton}
      >
        <Ionicons name="volume-low" size={21} color={colors.ink} />
      </Pressable>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Device volume"
        accessibilityValue={{ min: 0, max: 100, now: value, text: `${value} percent` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => adjust(event.nativeEvent.actionName === 'increment' ? 5 : -5)}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={valueFromEvent}
        onResponderMove={valueFromEvent}
        onResponderRelease={(event) => onCommit(valueFromEvent(event))}
        style={styles.slider}
      >
        <View style={styles.sliderTrack} />
        <View style={[styles.sliderFill, { width: `${value}%` }]} />
        <View style={[styles.sliderThumb, { left: `${value}%` }]} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase volume"
        onPress={() => adjust(5)}
        disabled={disabled}
        style={styles.iconButton}
      >
        <Ionicons name="volume-high" size={21} color={colors.ink} />
      </Pressable>
    </View>
  )
}

const toneStyles = StyleSheet.create({
  default: { backgroundColor: colors.surface },
  teal: { backgroundColor: colors.tealSoft, borderColor: '#B7DDD7' },
  amber: { backgroundColor: colors.amberSoft, borderColor: '#E9D59D' },
  coral: { backgroundColor: colors.coralSoft, borderColor: '#EDC8BF' }
})

const buttonPalettes = {
  primary: { background: colors.teal, foreground: '#FFFFFF', border: colors.teal },
  secondary: { background: colors.surface, foreground: colors.ink, border: colors.line },
  danger: { background: colors.surface, foreground: colors.danger, border: '#E6BABA' }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 40, gap: spacing.md },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 16, lineHeight: 23, maxWidth: 620 },
  panel: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  },
  sectionTitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm
  },
  buttonPressed: { opacity: 0.78 },
  buttonDisabled: { opacity: 0.45 },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
  badge: {
    minHeight: 30,
    alignSelf: 'flex-start',
    borderRadius: radii.md,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  badgeOnline: { backgroundColor: colors.tealSoft },
  badgeOffline: { backgroundColor: colors.coralSoft },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeLabel: { fontSize: 13, fontWeight: '700' },
  infoRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoLabel: { color: colors.muted, fontSize: 14, flex: 1 },
  infoValue: { color: colors.ink, fontSize: 14, fontWeight: '600', flex: 1.4, textAlign: 'right' },
  metric: { flex: 1, minWidth: 90, gap: 2 },
  metricValue: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  metricLabel: { color: colors.muted, fontSize: 12 },
  sliderWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sliderDisabled: { opacity: 0.45 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface
  },
  slider: { flex: 1, height: 42, justifyContent: 'center' },
  sliderTrack: { height: 6, borderRadius: 3, backgroundColor: colors.line },
  sliderFill: { position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: colors.teal },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.teal
  }
})
