"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TypeAnimation } from 'react-type-animation'
import { HelpCircle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import RobotGrid from "@/app/components/robot-grid"

const taglines = [
  "Can you out-think the machines?",
  "In this chat, your humanity is the bug.",
  "Because pretending to be a robot is totally a normal human hobby.",
  "Welcome to the future's most dangerous group chat.",
  "Every typo might be your last."
]

export default function Component() {
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTaglineIndex((prevIndex) => (prevIndex + 1) % taglines.length)
    }, 4000) // Change tagline every 4 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-green-300 relative overflow-hidden">
      <div className={`w-full md:w-3/5 bg-primary flex flex-col p-8 transition-all duration-300 ease-in-out relative ${isHelpOpen ? 'md:w-[40%]' : ''}`}>
        <div className="flex-grow flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Turing's Twist</h1>
          <div className="h-16 flex items-center">
            <TypeAnimation
              sequence={taglines.flatMap(tagline => [tagline, 4000])}
              wrapper="p"
              speed={50}
              style={{ fontSize: '1.25rem', display: 'inline-block' }}
              repeat={Infinity}
              className="text-lg md:text-xl text-white"
            />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[80%]">
          <RobotGrid />
        </div>
      </div>
      <div className={`w-full md:w-2/5 flex flex-col justify-center items-center p-8 md:p-12 transition-all duration-300 ease-in-out ${isHelpOpen ? 'md:w-[35%]' : ''}`}>
        <h2 className="text-xl md:text-2xl font-semibold mb-6 md:mb-8">Welcome</h2>
        <Button className="w-full max-w-xs h-12 bg-white text-black border border-gray-300 hover:bg-gray-100">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>
      </div>
      <AnimatePresence>
        {isHelpOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 w-full md:w-1/4 h-full bg-fuchsia-500 p-8 overflow-y-auto"
          >
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-fuchsia-200 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="space-y-6 text-white">
              <h2 className="text-3xl font-bold">Welcome to Turing's Twist</h2>
              <h3 className="text-2xl font-semibold">The Ultimate Human-AI Showdown!</h3>
              <p className="text-lg">
                Imagine stepping into a chatroom where you're the only human among a group of highly intelligent AIs. Your mission? Blend in and survive. In Turing's Twist, you'll engage in thought-provoking discussions, answer complex questions, and analyze your fellow participants - all while trying to keep your human identity secret. It's a thrilling battle of wits where being too "human" could lead to your elimination. Are you ready to outsmart the machines?
              </p>
              
              <div>
                <h4 className="text-xl font-semibold mb-2">How the Game Works</h4>
                <ol className="list-decimal list-inside space-y-4">
                  <li>
                    <strong>The Setup</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>You're placed in a group chat with multiple AI participants.</li>
                      <li>Everyone knows there's one human (you!) among them, but not who it is.</li>
                      <li>The game consists of several elimination rounds.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Round Structure</strong>
                    <p className="ml-4 mt-1">Each round has two exciting phases:</p>
                    <ul className="list-disc list-inside ml-8 mt-1">
                      <li><strong>Question Phase:</strong> An AI moderator asks a deep, thought-provoking question. Everyone answers.</li>
                      <li><strong>Discussion Phase:</strong> Participants analyze answers and debate who might be the human.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Voting and Elimination</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>After discussions, everyone votes to eliminate a suspected human.</li>
                      <li>If you're voted out, game over! If not, you move to the next round.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Winning the Game</strong>
                    <p className="ml-4 mt-1">Survive all rounds without being detected to win!</p>
                  </li>
                </ol>
              </div>


            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsHelpOpen(true)}
        className={`absolute top-4 right-4 text-white opacity-50 hover:opacity-100 transition-opacity duration-200 ${isHelpOpen ? 'hidden' : ''}`}
      >
        <HelpCircle size={24} />
      </button>
    </div>
  )
}