import { Dimensions, Platform } from 'react-native'

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// Device breakpoints based on common iOS device sizes
export const DeviceBreakpoints = {
  // iPhone SE (1st gen): 320x568
  // iPhone SE (2nd/3rd gen): 375x667
  small: 380,
  // iPhone 12/13/14 mini: 375x812
  // iPhone 12/13/14/15: 390x844
  medium: 400,
  // iPhone 12/13/14/15 Plus: 428x926
  // iPhone 12/13/14/15 Pro Max: 430x932
  large: 450
}

// Device size helpers
export const isSmallDevice = screenWidth < DeviceBreakpoints.small
export const isMediumDevice =
  screenWidth >= DeviceBreakpoints.small &&
  screenWidth < DeviceBreakpoints.medium
export const isLargeDevice = screenWidth >= DeviceBreakpoints.large

// Screen size helpers
export const isShortScreen = screenHeight < 700
export const isTallScreen = screenHeight > 850

// Responsive scaling functions
export const scale = size => {
  if (isSmallDevice) {
    return Math.round(size * 0.85) // Scale down by 15% for small devices
  }
  if (isMediumDevice) {
    return Math.round(size * 0.95) // Scale down by 5% for medium devices
  }
  return size // Normal size for large devices
}

export const verticalScale = size => {
  if (isShortScreen) {
    return Math.round(size * 0.8) // Reduce vertical spacing on short screens
  }
  return size
}

export const moderateScale = (size, factor = 0.5) => {
  const normalScale = scale(size)
  return size + (normalScale - size) * factor
}

// Font scaling for better readability across devices
export const scaleFont = fontSize => {
  if (isSmallDevice) {
    return Math.max(12, Math.round(fontSize * 0.9)) // Don't go below 12px
  }
  return fontSize
}

// Responsive spacing
export const getSpacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48)
}

// Responsive margins and padding based on screen size
export const getResponsiveSpacing = {
  // Horizontal padding - condensed on small screens
  horizontalPadding: isSmallDevice ? 12 : 15,

  // Vertical spacing between elements
  elementSpacing: isSmallDevice
    ? isShortScreen
      ? 15
      : 20
    : isShortScreen
    ? 15
    : 20,

  // Image container spacing
  imageMarginVertical: isSmallDevice ? (isShortScreen ? 20 : 30) : 40,

  // Title bottom margin
  titleMarginBottom: isSmallDevice ? (isShortScreen ? 20 : 30) : 55,

  // Button group spacing
  buttonGroupPadding: isSmallDevice ? (isShortScreen ? 15 : 20) : 20
}

// Responsive sizes for images and SVGs
export const getImageSize = (baseSize = 300) => {
  if (isSmallDevice) {
    return isShortScreen
      ? Math.round(baseSize * 0.6)
      : Math.round(baseSize * 0.7)
  }
  if (isMediumDevice) {
    return Math.round(baseSize * 0.85)
  }
  return baseSize
}

// Responsive button heights
export const getButtonHeight = () => {
  return isSmallDevice ? 44 : 48 // Minimum touch target of 44pt on iOS
}

// Helper to get responsive container styles
export const getResponsiveContainer = () => ({
  flex: 1,
  backgroundColor: '#ffffff',
  width: '100%'
})

// Helper to get responsive content styles
export const getResponsiveContent = () => ({
  flex: 1,
  paddingHorizontal: getResponsiveSpacing.horizontalPadding,
  alignItems: 'center'
})

// Helper for bottom-fixed buttons
export const getButtonGroupStyles = () => ({
  width: '100%',
  marginTop: 'auto', // Push to bottom
  paddingBottom:
    Platform.OS === 'ios'
      ? isShortScreen
        ? 10
        : 20 // Account for home indicator
      : getResponsiveSpacing.buttonGroupPadding,
  paddingTop: getResponsiveSpacing.buttonGroupPadding
})

// Debug helper to log device info (disabled in production)
export const logDeviceInfo = () => {
  // Debug info disabled in production
}
