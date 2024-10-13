'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function TerminationTransition() {
  const [stage, setStage] = useState<'blur' | 'fade' | 'type' | 'complete'>('blur')
  const [text, setText] = useState('')
  const fullText = "bye human"
  const router = useRouter()

  useEffect(() => {
    const stageTimers = [
      setTimeout(() => setStage('fade'), 500),
      setTimeout(() => setStage('type'), 1000),
      setTimeout(() => setStage('complete'), 2000)
    ];

    return () => stageTimers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (stage === 'type') {
      let currentIndex = 0
      const typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setText(fullText.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(typingInterval)
        }
      }, 100)

      return () => clearInterval(typingInterval)
    }
  }, [stage])

  useEffect(() => {
    if (stage === 'complete') {
      const redirectTimer = setTimeout(() => {
        router.push('/play')
      }, 2000)

      return () => clearTimeout(redirectTimer)
    }
  }, [stage, router])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <motion.div
        initial={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
        animate={{ 
          backdropFilter: stage === 'blur' ? 'blur(8px)' : 'blur(0px)',
          backgroundColor: stage !== 'blur' ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.3)'
        }}
        transition={{ duration: 2 }}
        className="absolute inset-0"
      />
      {(stage === 'type' || stage === 'complete') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-red-600 text-4xl md:text-6xl font-mono z-10"
        >
          <span className="sr-only">You are terminated.</span>
          <span aria-hidden="true" className="glitch-text" data-text={text}>
            {text}
          </span>
        </motion.div>
      )}
      <style jsx global>{`
        @keyframes glitch {
          0% { transform: translate(0) }
          20% { transform: translate(-2px, 2px) }
          40% { transform: translate(-2px, -2px) }
          60% { transform: translate(2px, 2px) }
          80% { transform: translate(2px, -2px) }
          100% { transform: translate(0) }
        }
        .glitch-text {
          position: relative;
          display: inline-block;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-text::before {
          left: 2px;
          text-shadow: -2px 0 #ff6666;
          animation: glitch 0.3s infinite;
        }
        .glitch-text::after {
          left: -2px;
          text-shadow: 2px 0 #990000;
          animation: glitch 0.3s infinite reverse;
        }
      `}</style>
    </div>
  )
}