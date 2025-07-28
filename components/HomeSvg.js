import React from 'react'
import Svg, { Path, Circle, Rect, G } from 'react-native-svg'

const HomeSvg = ({ width = 200, height = 200, color = '#020617' }) => {
  return (
    <Svg width={width} height={height} viewBox='0 0 200 200'>
      <G>
        {/* Microphone */}
        <Rect
          x='85'
          y='50'
          width='30'
          height='60'
          rx='15'
          fill={color}
          opacity='0.8'
        />
        <Circle cx='100' cy='140' r='8' fill={color} opacity='0.6' />
        <Rect x='98' y='118' width='4' height='22' fill={color} opacity='0.6' />

        {/* Sound waves */}
        <Path
          d='M 130 80 Q 140 100 130 120'
          stroke={color}
          strokeWidth='3'
          fill='none'
          opacity='0.4'
        />
        <Path
          d='M 70 80 Q 60 100 70 120'
          stroke={color}
          strokeWidth='3'
          fill='none'
          opacity='0.4'
        />
        <Path
          d='M 140 70 Q 155 100 140 130'
          stroke={color}
          strokeWidth='2'
          fill='none'
          opacity='0.3'
        />
        <Path
          d='M 60 70 Q 45 100 60 130'
          stroke={color}
          strokeWidth='2'
          fill='none'
          opacity='0.3'
        />

        {/* Chat bubbles */}
        <Circle cx='40' cy='160' r='12' fill={color} opacity='0.5' />
        <Circle cx='160' cy='160' r='12' fill={color} opacity='0.5' />
        <Circle cx='100' cy='170' r='8' fill={color} opacity='0.3' />
      </G>
    </Svg>
  )
}

export default HomeSvg
