// List of all screens that need to be made responsive with bottom buttons
const screensToUpdate = [
  'OnboardingPermissionsScreen.js',
  'OnboardingTourScreen.js', 
  'OnboardingProfileScreen.js',
  'OnboardingPhotoScreen.js',
  'OnboardingPreviewScreen.js',
  'SettingsScreen.js',
  'SettingsProfileScreen.js',
  'SettingsAvatarScreen.js', 
  'SettingsUsernameScreen.js'
]

// Common imports to add to each screen
const importsToAdd = `
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'
`

// Common layout pattern to apply
const layoutPattern = `
  // Add ScrollView import to existing imports
  // Update return JSX to wrap content in ScrollView with fixed buttons at bottom
  // Update styles to use responsive spacing
`

// Reference for screens that need responsive updates:
// screensToUpdate.forEach((screen, index) => {
//   console.log(`${index + 1}. ${screen}`)
// })
//
// Pattern to apply:
// 1. Add ScrollView to imports
// 2. Import responsive utilities
// 3. Wrap content in ScrollView
// 4. Move buttons outside ScrollView to fix at bottom
// 5. Update styles to use responsive spacing
// 6. Use getImageSize() for SVG dimensions
