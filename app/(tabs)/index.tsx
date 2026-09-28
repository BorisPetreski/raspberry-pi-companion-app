import { Image, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useDevice } from '@/device-context'
import {
  ActionButton,
  Metric,
  PageHeader,
  Panel,
  Screen,
  SectionTitle,
  StatusBadge
} from '@/components/ui'
import { colors, radii, spacing } from '@/theme'

function uptimeLabel(seconds?: number) {
  if (seconds == null) return '—'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`
  return `${Math.floor(seconds / 86400)} d`
}

export default function HomeScreen() {
  const router = useRouter()
  const { device, status, phase, error, refresh } = useDevice()
  const online = phase === 'online'

  return (
    <Screen>
      <PageHeader
        eyebrow="Local companion"
        title={device ? `Hello, ${device.name}` : 'Your Raspberry Pi, nearby'}
        detail={device
          ? 'Local status and controls are ready when your phone and Pi share a network.'
          : 'Pair once with the code shown by the Pi agent.'}
      />

      <View style={styles.hero}>
        <Image
          source={require('../../assets/device-illustration.png')}
          style={styles.heroImage}
          resizeMode="contain"
          accessibilityLabel="Abstract Raspberry Pi companion device"
        />
      </View>

      {!device ? (
        <Panel tone="teal">
          <View style={styles.panelHeading}>
            <Ionicons name="link" size={22} color={colors.teal} />
            <SectionTitle>No Pi paired</SectionTitle>
          </View>
          <Text style={styles.body}>Start the agent on your Pi, then enter its local hostname and pairing code.</Text>
          <ActionButton label="Pair a Pi" icon="add-circle" onPress={() => router.push('/pair')} />
        </Panel>
      ) : (
        <>
          <Panel tone={online ? 'teal' : 'coral'}>
            <View style={styles.statusTop}>
              <View style={styles.panelHeading}>
                <Ionicons name="hardware-chip" size={22} color={online ? colors.teal : colors.coral} />
                <SectionTitle>{status?.name ?? device.name}</SectionTitle>
              </View>
              <StatusBadge online={online} label={online ? 'Online' : phase === 'connecting' ? 'Connecting' : 'Offline'} />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.metrics}>
              <Metric value={`${status?.volume ?? '—'}${status ? '%' : ''}`} label="Volume" />
              <Metric value={uptimeLabel(status?.uptimeSeconds)} label="Uptime" />
              <Metric value={status?.cpuTemperatureC == null ? '—' : `${status.cpuTemperatureC.toFixed(0)}°`} label="CPU" />
            </View>
            <ActionButton
              label={online ? 'Refresh status' : 'Try again'}
              icon="refresh"
              variant="secondary"
              onPress={() => void refresh()}
              loading={phase === 'connecting'}
            />
          </Panel>

          <Panel>
            <View style={styles.panelHeading}>
              <Ionicons name="pulse" size={22} color={colors.amber} />
              <SectionTitle>Current activity</SectionTitle>
            </View>
            <Text style={styles.activity}>{status?.activity === 'identifying' ? 'Identifying itself' : online ? 'Idle and ready' : 'Unavailable'}</Text>
            <Text style={styles.caption}>{status?.hostname ?? device.baseUrl}</Text>
          </Panel>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: {
    height: 210,
    borderRadius: radii.md,
    backgroundColor: '#E8EEEC',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroImage: { width: '100%', height: '100%' },
  panelHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  statusTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  metrics: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  activity: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  caption: { color: colors.muted, fontSize: 13 }
})
