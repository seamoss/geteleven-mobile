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
    scheme: 'eleven',
    ios: {
      buildNumber: '2',
      supportsTablet: false,
      bundleIdentifier: 'com.getelevenapp.mobile',
      associatedDomains: [
        'applinks:getelevenapp.com',
        'applinks:www.getelevenapp.com'
      ],
      infoPlist: {
        UILaunchStoryboardName: 'SplashScreen',
        NSCameraUsageDescription:
          'This app uses the camera to let you take a profile photo.',
        NSPhotoLibraryUsageDescription:
          'This app accesses the photo library to let you select a profile photo.',
        NSMicrophoneUsageDescription:
          'This app uses the microphone to record and send voice messages to your connections.',
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
            // Only allow localhost in development builds
            ...(IS_DEV
              ? {
                  localhost: {
                    NSExceptionAllowsInsecureHTTPLoads: true,
                    NSExceptionMinimumTLSVersion: '1.0',
                    NSExceptionRequiresForwardSecrecy: false,
                    NSExceptionAllowsLocalNetworking: true
                  }
                }
              : {}),
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
        'aps-environment': 'development'
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#020617'
      },
      edgeToEdgeEnabled: true,
      package: 'com.getelevenapp.mobile',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'getelevenapp.com',
              pathPrefix: '/profile'
            },
            {
              scheme: 'https',
              host: 'www.getelevenapp.com',
              pathPrefix: '/profile'
            }
          ],
          category: ['BROWSABLE', 'DEFAULT']
        },
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'eleven'
            }
          ],
          category: ['BROWSABLE', 'DEFAULT']
        }
      ],
      permissions: [
        'INTERNET',
        'RECORD_AUDIO',
        'WRITE_EXTERNAL_STORAGE',
        'READ_EXTERNAL_STORAGE',
        'CAMERA',
        'RECEIVE_BOOT_COMPLETED',
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
      },
      // RevenueCat API keys for fallback in feature flags
      REVENUECAT_API_KEY_IOS: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
      REVENUECAT_API_KEY_ANDROID: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID
    },
    updates: {
      url: 'https://u.expo.dev/a15191fc-bdca-4e57-ac76-b1b678bcac7f'
    },
    plugins: [
      // Only include plugins for EAS builds, not dev builds
      ...(process.env.EAS_BUILD
        ? [
            [
              'expo-notifications',
              {
                icon: './assets/notification-icon.png',
                color: '#020617',
                sounds: []
              }
            ]
            // "expo-apple-authentication" // Disabled - not using Apple Sign In
          ]
        : [])
    ]
  }
}

export default config
