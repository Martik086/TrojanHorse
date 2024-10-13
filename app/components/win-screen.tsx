"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircleCode, Trophy, Star, Skull } from "lucide-react"
import { motion, useAnimation, AnimatePresence, LayoutGroup } from "framer-motion"
import { useRouter } from 'next/navigation'

interface Bot {
  name: string
  firstTimeDefeated: boolean
  image: string
}

interface Props {
  playerName: string
  adminMessage: string
  mostSuspiciousQuote: string
  defeatedBots: Bot[]
  adminName: string
  onOkClick: () => void
}

interface TypewriterTextProps {
  text: string;
  color: string;
  delay?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, color, delay = 0 }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  const typeText = useCallback(() => {
    let i = 0;
    const typing = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typing);
        setIsTypingComplete(true);
      }
    }, 30);

    return () => clearInterval(typing);
  }, [text]);

  useEffect(() => {
    setDisplayedText('');
    setIsTypingComplete(false);
    const timer = setTimeout(typeText, delay);

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 60);

    return () => {
      clearTimeout(timer);
      clearInterval(cursorInterval);
    };
  }, [text, delay, typeText]);

  return (
    <div className="font-mono">
      {displayedText}
      {!isTypingComplete && (
        <span
          className={`inline-block w-2 h-4 ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            backgroundColor: color, 
            transition: 'opacity 0s'
          }}
        />
      )}
    </div>
  );
};

export default function ElegantWinningScreen({
  playerName = "Alice",
  adminMessage = "Your ability to blend in was truly remarkable. You've outsmarted our most advanced AI systems, leaving us in awe of human ingenuity.",
  mostSuspiciousQuote = "I believe we should approach this problem from a different angle. What if we considered the ethical implications first?",
  defeatedBots = [
    { name: "SentientSam", firstTimeDefeated: true, image: "/placeholder.svg?height=50&width=50" },
    { name: "LogicLucy", firstTimeDefeated: false, image: "/placeholder.svg?height=50&width=50" }
  ],
  adminName = "Admin AI",
  onOkClick
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [visibleBots, setVisibleBots] = useState<number>(0)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 100);
    return () => clearTimeout(timer);
  }, [])

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setVisibleBots(prev => {
          if (prev < defeatedBots.length) {
            return prev + 1
          }
          clearInterval(interval)
          return prev
        })
      }, 500)

      return () => clearInterval(interval)
    }
  }, [isOpen, defeatedBots.length])

  const handleProceed = () => {
    onOkClick()
    router.push('/play')
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center overflow-hidden">
      <LayoutGroup>
        <motion.div
          layoutId="main-container"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isOpen ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl"
        >
          <Card className="w-full bg-zinc-900/80 text-zinc-100 border-zinc-700/50 shadow-2xl shadow-zinc-950/50 backdrop-blur-sm mb-8">
            <CardContent className="p-0 overflow-hidden">
              <motion.div
                layout
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="grid grid-cols-1 md:grid-cols-2 gap-0"
              >
                <motion.div layout className="p-8 space-y-6 border-b md:border-b-0 md:border-r border-zinc-700/50">
                  <h1 className="text-3xl font-bold text-zinc-300 font-mono">
                    Congratulations, {playerName}!
                  </h1>
                  <p className="text-semibold text-zinc-300 font-sans mb-4">
                    You've outsmarted the AI and survived!
                  </p>
                  <div className="relative">
                    <MessageCircleCode className="absolute top-0 left-0 text-sky-400 w-12 h-12 -translate-x-4 -translate-y-4" />
                    <blockquote className="pl-8 py-2 border-l-2 border-sky-400/20 text-sky-400 font-mono bg-sky-800/20 rounded-lg p-4">
                      <TypewriterText text={adminMessage} color="#38bdf8" />
                      <footer className="mt-2 text-right text-sm text-sky-400/50">— Last words from {adminName}</footer>
                    </blockquote>
                  </div>
                  <p className="text-semibold text-zinc-300 font-sans mb-4">
                    Your most suspicious message was...
                  </p>
                  <div className="relative">
                    <Skull className="absolute top-0 left-0 text-fuchsia-400 w-12 h-12 -translate-x-4 -translate-y-4" />
                    <blockquote className="pl-8 py-2 border-l-2 border-fuchsia-400/20 text-fuchsia-400 font-mono bg-fuchsia-800/20 rounded-lg p-4">
                      <TypewriterText text={mostSuspiciousQuote} color="#e879f9" delay={1000} />
                      <footer className="mt-2 text-right text-sm text-fuchsia-400/50">— {playerName}</footer>
                    </blockquote>
                  </div>
                </motion.div>

                <motion.div layout className="p-8 space-y-6">
                  <h2 className="text-2xl font-mono font-semibold pl-4 pt-2 pb-2 text-green-400 bg-green-800/20 rounded-lg flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    Defeated Bots
                  </h2>
                  <ScrollArea className="h-full">
                    <AnimatePresence>
                      {defeatedBots.slice(0, visibleBots).map((bot, index) => (
                        <motion.div
                          key={bot.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="flex items-center gap-4 mb-4 p-3 bg-zinc-800/50 rounded-lg"
                        >
                          <img src={bot.image} alt={bot.name} className="w-12 h-12 rounded-full border-2 border-zinc-600 object-cover" />
                          <div className="flex-grow">
                            <h3 className="font-medium text-zinc-200">{bot.name}</h3>
                            {bot.firstTimeDefeated && (
                              <span className="inline-flex items-center text-xs text-emerald-400">
                                <Star className="w-3 h-3 mr-1" /> First Time Defeated
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </ScrollArea>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </LayoutGroup>
      <motion.button
        className="relative font-mono px-8 py-3 bg-sky-500 text-zinc-900 rounded-full text-lg shadow-lg overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleProceed}
      >
        PROCEED
      </motion.button>
    </div>
  )
}
