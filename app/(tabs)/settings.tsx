import { Alert, StyleSheet, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useDevice } from '@/device-context'
import { ActionButton, InfoRow, PageHeader, Panel, Screen, SectionTitle } from '@/components/ui'
import { colors } from '@/theme'

export default function SettingsScreen() {
  const router = useRouter()
  const { device, status, forget } = useDevice()

  const confirmForget = () => {
    Alert.alert(
      'Unpair this Pi?',
      'The device will rotate its pairing code and this app will remove the stored token.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unpair', style: 'destructive', onPress: () => void forget() }
      ]
    )
  }

  return (
    <Screen>
      <PageHeader title="Settings" detail="Local connection and project information." />

      <Panel>
        <SectionTitle>Connection</SectionTitle>
        {device ? (
          <>
            <InfoRow icon="link" label="Endpoint" value={device.baseUrl} />
            <InfoRow icon="finger-print" label="Device ID" value={device.id} />
            <InfoRow icon="time" label="Last update" value={status ? new Date(status.updatedAt).toLocaleTimeString() : 'Unavailable'} />
            <ActionButton label="Unpair device" icon="unlink" variant="danger" onPress={confirmForget} />
          </>
        ) : (
          <ActionButton label="Pair a Pi" icon="link" onPress={() => router.push('/pair')} />
        )}
      </Panel>

      <Panel>
        <SectionTitle>Privacy</SectionTitle>
        <Text style={styles.body}>The app stores one local endpoint and device token. The starter does not include analytics, accounts, or a cloud backend.</Text>
      </Panel>

      <Panel tone="amber">
        <SectionTitle>Network boundary</SectionTitle>
        <Text style={styles.body}>This starter uses HTTP on a trusted local network. Do not expose port 8787 to the public internet.</Text>
      </Panel>

      <Text style={styles.version}>Pi Companion Starter 0.1.0</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  version: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 }
})

