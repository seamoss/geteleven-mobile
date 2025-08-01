const IS_DEV = process.env.NODE_ENV === 'development'

const config = {
  expo: {
    name: 'Eleven',
    slug: 'Eleven-Expo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    developmentClient: {
      silentLaunch: true
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#020617'
    },
    ios: {
      buildNumber: '2',
      supportsTablet: true,
      bundleIdentifier: 'com.getelevenapp.mobile',
      infoPlist: {
        UILaunchStoryboardName: 'SplashScreen',
        NSCameraUsageDescription:
          'This app uses the camera to let you take a profile photo.',
        NSPhotoLibraryUsageDescription:
          'This app accesses the photo library to let you select a profile photo.',
        NSMicrophoneUsageDescription:
          'This app uses the microphone to record and send voice messages to your connections.',
        UIBackgroundModes: [
          'audio',
          'audio',
          'background-fetch',
          'remote-notification'
        ],
        AVAudioSessionCategoryOptions: [
          'MixWithOthers',
          'DuckOthers',
          'MixWithOthers',
          'DuckOthers'
        ],
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSAllowsArbitraryLoadsInWebContent: false,
          NSExceptionDomains: {
            localhost: {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSExceptionMinimumTLSVersion: '1.0',
              NSExceptionRequiresForwardSecrecy: false,
              NSExceptionAllowsLocalNetworking: true
            },
            'geteleven-cdn.sfo2.digitaloceanspaces.com': {
              NSExceptionRequiresForwardSecrecy: false,
              NSExceptionMinimumTLSVersion: '1.2',
              NSIncludesSubdomains: false,
              NSThirdPartyExceptionAllowsInsecureHTTPLoads: false,
              NSThirdPartyExceptionMinimumTLSVersion: '1.2'
            },
            'platform.getelevenapp.com': {
              NSExceptionRequiresForwardSecrecy: false,
              NSExceptionMinimumTLSVersion: '1.2',
              NSIncludesSubdomains: true,
              NSThirdPartyExceptionAllowsInsecureHTTPLoads: false,
              NSThirdPartyExceptionMinimumTLSVersion: '1.2'
            },
            'digitaloceanspaces.com': {
              NSExceptionRequiresForwardSecrecy: false,
              NSExceptionMinimumTLSVersion: '1.2',
              NSIncludesSubdomains: true,
              NSThirdPartyExceptionAllowsInsecureHTTPLoads: false,
              NSThirdPartyExceptionMinimumTLSVersion: '1.2'
            }
          }
        },
        ITSAppUsesNonExemptEncryption: false
      },
      runtimeVersion: {
        policy: 'appVersion'
      },
      entitlements: {
        'aps-environment': 'development',
        'com.apple.developer.in-app-payments': [
          'merchant.com.getelevenapp.mobile'
        ],
        'com.apple.external-accessory.wireless-configuration': true
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#020617'
      },
      edgeToEdgeEnabled: true,
      package: 'com.getelevenapp.mobile',
      permissions: [
        'INTERNET',
        'RECORD_AUDIO',
        'WRITE_EXTERNAL_STORAGE',
        'READ_EXTERNAL_STORAGE',
        'CAMERA',
        'RECEIVE_BOOT_COMPLETED',
        // 'VIBRATE',
        'com.google.android.c2dm.permission.RECEIVE',
        'android.permission.WAKE_LOCK'
      ],
      usesCleartextTraffic: false,
      runtimeVersion: '1.0.0'
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'a15191fc-bdca-4e57-ac76-b1b678bcac7f'
      }
    },
    updates: {
      url: 'https://u.expo.dev/a15191fc-bdca-4e57-ac76-b1b678bcac7f'
    }
  }
}

// Only add plugins when not in development or when explicitly building
// if (!IS_DEV || process.env.EAS_BUILD) {
//   config.expo.plugins = [
//     "expo-notifications",
//     "expo-apple-authentication",
//     "expo-in-app-purchases"
//   ];
// }

export default config
