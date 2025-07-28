# ElevenMobile - React Native App

This is a React Native Expo app for the Eleven platform, featuring voice messaging, connections, and comprehensive authentication flows.

## Features

- Complete authentication system (signup, signin, onboarding)
- Voice message recording and playback with CDN integration
- Connection management and messaging
- Responsive design for various iOS device sizes
- Over-the-air updates via EAS Updates
- QR code sharing functionality
- Comprehensive message pagination and audio preloading

## Tech Stack

- **React Native** with Expo 53
- **EAS Build & Updates** for production builds and OTA updates
- **React Navigation** for navigation
- **Expo AV** for audio recording and playback
- **AsyncStorage** for local data persistence
- **React Native SVG** for graphics and QR codes
- **Axios** for API communication

## Local Development Setup

### Prerequisites

- Node.js 16+ and yarn
- Xcode (for iOS development)
- EAS CLI: `npm install -g @expo/eas-cli`
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator or physical iOS device

### Installation

1. Clone the repository and install dependencies:
```bash
git clone [repository-url]
cd ElevenMobile
yarn install
```

2. Environment Configuration:
   - Copy `.env.example` to `.env`
   - Configure API_URL for your local development server
   - For physical device testing, use your Mac's IP address instead of localhost

3. Start the development server:
```bash
expo start
```

4. Run on iOS:
```bash
expo run:ios
```

### Development with Physical Devices

For testing on physical devices, update your environment variables:
```
API_URL=http://[YOUR_MAC_IP]:3001
```

Find your Mac's IP with: `ifconfig | grep "inet "`

## Build Process

### Development Builds

For development builds with native modules:
```bash
eas build --profile development --platform ios
```

### Production Builds

1. Update version numbers in `app.json`:
   - Increment `expo.version` for display version
   - Increment `expo.ios.buildNumber` for build number

2. Create production build:
```bash
eas build --profile production --platform ios
```

3. Build for Android:
```bash
eas build --profile production --platform android
```

### Build Configuration

The app uses EAS Build profiles defined in `eas.json`:
- **development**: For testing with native modules
- **preview**: For internal testing
- **production**: For App Store submission

## Release Management

### iOS App Store Release

1. After EAS build completes, download the `.ipa` file
2. Upload to App Store Connect using Transporter or Xcode
3. Configure app metadata in App Store Connect
4. Submit for review

### Android Play Store Release

1. After EAS build completes, download the `.aab` file
2. Upload to Google Play Console
3. Configure release notes and rollout percentage
4. Publish to production

### Over-The-Air Updates

The app supports EAS Updates for JavaScript-only changes:

1. Make code changes (no native dependencies)
2. Publish update:
```bash
eas update --branch production --message "Your update message"
```

3. Users receive updates automatically on app restart

### Update Channels

- **production**: Live App Store version
- **preview**: Internal testing
- **development**: Development builds

## Configuration Files

### app.json
Contains app configuration, permissions, and build settings:
- Bundle identifier: `com.getelevenapp.mobile`
- iOS deployment target: iOS 13+
- Required permissions for audio, camera, and network access
- Network security configuration for CDN access

### eas.json
Defines build profiles and update channels for different environments.

### Environment Variables

Create `.env` file with:
```
API_URL=http://localhost:3001
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## Audio Configuration

The app includes production-ready audio configuration:
- CDN integration for audio playback from DigitalOcean Spaces
- Background audio support
- Network security exceptions for HTTPS audio files
- Audio session management for iOS

## Testing

### Device Testing
- iOS Simulator (iPhone SE, iPhone 15 Pro)
- Physical iOS devices
- Test responsive design on various screen sizes

### Audio Testing
- Test voice recording and playback
- Verify CDN audio loading in production builds
- Test background audio playback

## Troubleshooting

### Common Issues

1. **Audio not playing on device**: Check network security configuration in `app.json`
2. **Build failures**: Ensure all dependencies are compatible with current Expo SDK
3. **Network errors on device**: Use Mac IP address instead of localhost
4. **EAS Update not received**: Check update channel and branch configuration

### Debug Commands

```bash
# Check EAS build status
eas build:list

# View update history
eas update:list

# Check project configuration
expo config

# Clear Metro cache
expo start --clear
```

## Development Workflow

1. Make changes in development environment
2. Test on iOS Simulator and physical device
3. For native changes: Create new EAS build
4. For JS-only changes: Use EAS Update
5. Submit builds to App Store for major releases
6. Use OTA updates for hotfixes and minor updates
