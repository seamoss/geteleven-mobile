import { Platform } from 'react-native'
import {
  scale,
  scaleFont,
  getResponsiveSpacing,
  getButtonHeight,
  getResponsiveContainer,
  getResponsiveContent,
  getButtonGroupStyles
} from '../utils/responsive'

// Check if Nexa fonts are available (will be true after fonts are added)
const NEXA_FONTS_AVAILABLE = true // Set to true after adding Nexa font files

// Font family mappings to match the web app
export const FontFamilies = {
  // Main body font (Inter equivalent)
  regular: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
    default: 'Inter_400Regular'
  }),
  light: Platform.select({
    ios: 'Inter-Light',
    android: 'Inter-Light',
    default: 'Inter_300Light'
  }),
  medium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter-Medium',
    default: 'Inter_500Medium'
  }),
  semiBold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
    default: 'Inter_600SemiBold'
  }),
  bold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
    default: 'Inter_700Bold'
  }),

  // Callout/headings font - Use Nexa if available, fallback to Poppins
  calloutRegular: NEXA_FONTS_AVAILABLE
    ? 'Nexa-Regular' // Use Regular for most headings
    : Platform.select({
        ios: 'Poppins-Regular',
        android: 'Poppins-Regular',
        default: 'Poppins_400Regular'
      }),
  calloutMedium: NEXA_FONTS_AVAILABLE
    ? 'Nexa-Regular'
    : Platform.select({
        ios: 'Poppins-Medium',
        android: 'Poppins-Medium',
        default: 'Poppins_500Medium'
      }),
  calloutMediumPoppins: Platform.select({
    ios: 'Poppins-Medium',
    android: 'Poppins-Medium',
    default: 'Poppins_500Medium'
  }),
  calloutSemiBold: NEXA_FONTS_AVAILABLE
    ? 'Nexa-Heavy' // Jump to Heavy for emphasis
    : Platform.select({
        ios: 'Poppins-SemiBold',
        android: 'Poppins-SemiBold',
        default: 'Poppins_600SemiBold'
      }),
  calloutBold: NEXA_FONTS_AVAILABLE
    ? 'Nexa-Heavy' // Bold = Heavy
    : Platform.select({
        ios: 'Poppins-Bold',
        android: 'Poppins-Bold',
        default: 'Poppins_700Bold'
      }),

  // Nexa specific variants (for direct use)
  nexaExtraLight: NEXA_FONTS_AVAILABLE ? 'Nexa-ExtraLight' : null,
  nexaRegular: NEXA_FONTS_AVAILABLE ? 'Nexa-Regular' : null,
  nexaHeavy: NEXA_FONTS_AVAILABLE ? 'Nexa-Heavy' : null
}

// Colors to match web app CSS variables
export const Colors = {
  background: '#f8fafc',
  foreground: '#020617',
  copy: '#64748b',
  white: '#ffffff',
  border: '#e2e8f0',
  error: '#ef4444',
  primary: '#3b82f6', // Blue primary color
  placeholder: '#9ca3af',
  lightGray: '#f0f0f0'
}

// Common text styles that match the web app - now responsive
export const TextStyles = {
  // Equivalent to h1 in web app
  title: {
    fontFamily: FontFamilies.calloutMedium,
    fontSize: scaleFont(32),
    fontWeight: '500',
    color: Colors.foreground,
    lineHeight: scaleFont(40)
  },

  // Equivalent to h2 in web app
  heading: {
    fontFamily: FontFamilies.calloutRegular,
    fontSize: scaleFont(20),
    fontWeight: '400',
    color: Colors.foreground,
    marginBottom: scale(10)
  },

  // Equivalent to p in web app
  body: {
    fontFamily: FontFamilies.light,
    fontSize: scaleFont(15.2), // 0.95em of 16px
    fontWeight: '300',
    color: Colors.copy,
    letterSpacing: 0.2,
    lineHeight: scaleFont(22)
  },

  // Button text styles
  buttonDark: {
    fontFamily: FontFamilies.regular,
    fontSize: scaleFont(16),
    fontWeight: '400',
    color: Colors.white
  },

  buttonLight: {
    fontFamily: FontFamilies.regular,
    fontSize: scaleFont(16),
    fontWeight: '400',
    color: Colors.foreground
  },

  // Large callout style
  callout: {
    fontFamily: FontFamilies.calloutMedium,
    fontSize: scaleFont(40), // 2.5rem equivalent
    fontWeight: '500',
    color: Colors.foreground
  },

  // Additional text styles
  h2: {
    fontFamily: FontFamilies.calloutMedium,
    fontSize: scaleFont(28),
    fontWeight: '500',
    color: Colors.foreground
  },

  h3: {
    fontFamily: FontFamilies.calloutMedium,
    fontSize: scaleFont(20),
    fontWeight: '500',
    color: Colors.foreground
  },

  button: {
    fontFamily: FontFamilies.regular,
    fontSize: scaleFont(16),
    fontWeight: '500',
    color: Colors.white
  },

  caption: {
    fontFamily: FontFamilies.regular,
    fontSize: scaleFont(12),
    fontWeight: '400',
    color: Colors.placeholder
  }
}

// Common component styles - now responsive
export const ComponentStyles = {
  width: '100%',
  container: getResponsiveContainer(),
  content: getResponsiveContent(),
  nav: {
    flexDirection: 'row',
    justifyContent: 'left',
    paddingVertical: scale(10),
    marginBottom: getResponsiveSpacing.elementSpacing
  },

  logo: {
    marginTop: scale(20)
  },

  pageImage: {
    width: '75%',
    aspectRatio: 1,
    marginBottom: getResponsiveSpacing.imageMarginVertical
  },

  buttonGroup: getButtonGroupStyles(),

  button: {
    paddingVertical: getButtonHeight() / 2.8, // Dynamic padding based on button height
    paddingHorizontal: scale(24),
    borderRadius: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: scale(6),
    minHeight: getButtonHeight() // Ensure minimum touch target
  },

  buttonDark: {
    backgroundColor: Colors.foreground
  },

  buttonLight: {
    backgroundColor: Colors.white
  }
}
