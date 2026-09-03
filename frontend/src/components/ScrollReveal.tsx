import React from 'react'
import { motion, type Variants } from 'framer-motion'

export interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  yOffset?: number
  scaleStart?: number
  stagger?: boolean
  staggerDelay?: number
}

const popUpVariants: Variants = {
  hidden: (custom: { yOffset: number; scaleStart: number }) => ({
    opacity: 0,
    y: custom.yOffset,
    scale: custom.scaleStart,
    filter: 'blur(4px)',
  }),
  visible: (custom: { delay: number; duration: number }) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: custom.duration,
      delay: custom.delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.7,
  yOffset = 36,
  scaleStart = 0.95,
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      custom={{ delay, duration, yOffset, scaleStart }}
      variants={popUpVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default ScrollReveal
