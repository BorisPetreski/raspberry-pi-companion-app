const { version } = require('./package.json')

module.exports = {
  expo: {
    name: 'Pi Companion',
    slug: 'pi-companion-starter',
    scheme: 'picompanion',
    version,
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#F4F7F6'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'dev.personal.picompanion',
      infoPlist: {
        NSLocalNetworkUsageDescription: 'Pi Companion connects to your Raspberry Pi on the local network.',
        NSBonjourServices: ['_http._tcp'],
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true
        }
      }
    },
    android: {
      package: 'dev.personal.picompanion',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#F4F7F6'
      }
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      'expo-status-bar',
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: true
          }
        }
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          imageWidth: 220,
          resizeMode: 'contain',
          backgroundColor: '#F4F7F6'
        }
      ]
    ]
  }
}
