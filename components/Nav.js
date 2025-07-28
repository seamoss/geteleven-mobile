'use client'

import React from 'react'
import { View, StyleSheet } from 'react-native'
import LogoSvg from '../assets/images/svg/logo.svg'
import { ComponentStyles } from '../styles/fonts'

import useTransition from '../hooks/transition'

export default function Nav () {
  const { navigate } = useTransition()

  return (
    <View style={styles.nav}>
      <View style={styles.logo}>
        <LogoSvg width={300} height={40} color='#020617' />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  nav: {
    ...ComponentStyles.nav,
    justifyContent: 'flex-start', // Align logo to left instead of space-between
    paddingHorizontal: 15 // Add horizontal padding for consistent spacing
  },
  logo: {
    ...ComponentStyles.logo
  }
})
