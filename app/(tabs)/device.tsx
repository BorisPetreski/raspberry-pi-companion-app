import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useDevice } from '@/device-context'
import {
  ActionButton,
  InfoRow,
  PageHeader,
  Panel,
  Screen,
  SectionTitle,
  StatusBadge,
  VolumeSlider
} from '@/components/ui'
import { colors, spacing } from '@/theme'

export default function DeviceScreen() {
  const router = useRouter()
  const { device, status, phase, error, setVolume, identify } = useDevice()
  const [volume, setLocalVolume] = useState(status?.volume ?? 50)
  const [identifying, setIdentifying] = useState(false)

  useEffect(() => {
    if (status) setLocalVolume(status.volume)
  }, [status])

  if (!device) {
    return (
      <Screen>
        <PageHeader title="Device" detail="Pair a Raspberry Pi to unlock local controls." />
        <Panel tone="teal">
          <SectionTitle>No paired device</SectionTitle>
          <ActionButton label="Pair a Pi" icon="link" onPress={() => router.push('/pair')} />
        </Panel>
      </Screen>
    )
  }

  const online = phase === 'online'

  const handleIdentify = async () => {
    setIdentifying(true)
    try {
      await identify()
    } finally {
      setIdentifying(false)
    }
  }

  return (
    <Screen>
      <PageHeader eyebrow="Device controls" title={status?.name ?? device.name} />

      <Panel tone={online ? 'teal' : 'coral'}>
        <View style={styles.statusLine}>
          <SectionTitle>Connection</SectionTitle>
          <StatusBadge online={online} label={online ? 'Online' : 'Offline'} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <InfoRow icon="wifi" label="Address" value={status?.ipAddress ?? device.baseUrl} />
        <InfoRow icon="server" label="Hostname" value={status?.hostname ?? 'Unavailable'} />
        <InfoRow icon="code-slash" label="Agent" value={status?.agentVersion ?? 'Unavailable'} />
      </Panel>

      <Panel>
        <View style={styles.volumeHeader}>
          <View style={styles.titleWithIcon}>
            <Ionicons name="volume-high" size={21} color={colors.teal} />
            <SectionTitle>Volume</SectionTitle>
          </View>
          <Text style={styles.volumeValue}>{volume}%</Text>
        </View>
        <VolumeSlider
          value={volume}
          onChange={setLocalVolume}
          onCommit={(next) => void setVolume(next)}
          disabled={!online}
        />
        {status && !status.volumeApplied ? (
          <Text style={styles.note}>The value is saved, but no compatible ALSA mixer control was found.</Text>
        ) : null}
      </Panel>

      <Panel tone="amber">
        <View style={styles.titleWithIcon}>
          <Ionicons name="locate" size={21} color={colors.amber} />
          <SectionTitle>Find this Pi</SectionTitle>
        </View>
        <Text style={styles.note}>Triggers the local identify signal for ten seconds.</Text>
        <ActionButton
          label="Identify device"
          icon="flash"
          variant="secondary"
          disabled={!online}
          loading={identifying}
          onPress={() => void handleIdentify()}
        />
      </Panel>
    </Screen>
  )
}

const styles = StyleSheet.create({
  statusLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  volumeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  volumeValue: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  note: { color: colors.muted, fontSize: 14, lineHeight: 20 }
})

