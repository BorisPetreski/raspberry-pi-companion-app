import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useDevice } from '@/device-context'
import { ActionButton, Panel } from '@/components/ui'
import { colors, radii, spacing } from '@/theme'

export default function PairScreen() {
  const router = useRouter()
  const { pair, error } = useDevice()
  const [host, setHost] = useState('raspberrypi.local')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await pair(host, code)
      router.replace('/(tabs)')
    } catch {
      // The context exposes a user-facing error.
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="hardware-chip" size={42} color={colors.teal} />
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>Pair your Raspberry Pi</Text>
          <Text style={styles.detail}>Use the hostname and six-digit code printed by the Pi agent.</Text>
        </View>

        <Panel>
          <View style={styles.field}>
            <Text style={styles.label}>Hostname or IP address</Text>
            <TextInput
              value={host}
              onChangeText={setHost}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="raspberrypi.local"
              placeholderTextColor="#87918F"
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Pairing code</Text>
            <TextInput
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              placeholder="000000"
              placeholderTextColor="#87918F"
              maxLength={6}
              style={[styles.input, styles.codeInput]}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <ActionButton
            label="Pair device"
            icon="link"
            loading={loading}
            disabled={!host.trim() || code.length !== 6}
            onPress={() => void submit()}
          />
        </Panel>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center'
  },
  heading: { alignItems: 'center', gap: spacing.sm },
  title: { color: colors.ink, fontSize: 26, lineHeight: 32, fontWeight: '800', textAlign: 'center' },
  detail: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 420 },
  field: { gap: 7 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    color: colors.ink,
    fontSize: 16
  },
  codeInput: { fontSize: 22, fontWeight: '700', letterSpacing: 6, textAlign: 'center' },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 }
})
