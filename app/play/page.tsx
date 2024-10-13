"use client"

import React, { useState, useRef, useCallback, useMemo, ReactNode } from 'react'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { UserCircle, MessageCircle } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'
import { bots } from "@/lib/bots"
import { useRouter } from 'next/navigation' // Import useRouter from next/navigation
import { motion } from 'framer-motion'

interface Bot {
  name: string
  avatar: string
  info: string[]
  difficulty: string
}

const difficultyStyles = {
  rookie: {
    gradient: "from-green-400 to-green-700",
    text: "text-green-100",
  },
  easy: {
    gradient: "from-sky-500 to-sky-700",
    text: "text-sky-100",
  },
  medium: {
    gradient: "from-yellow-500 to-yellow-700",
    text: "text-yellow-100",
  },
  hard: {
    gradient: "from-red-500 to-red-700",
    text: "text-red-100",
  },
}

const BotCard = React.memo(({ bot, isSelected, onSelect, onHover }: { bot: Bot, isSelected: boolean, onSelect: () => void, onHover: () => void }) => (
  <motion.div
    className={`rounded-lg p-2 mr-1 ml-1 cursor-pointer transition-all ${
      isSelected 
        ? `bg-gradient-to-br ${difficultyStyles[bot.difficulty as keyof typeof difficultyStyles].gradient}` 
        : 'bg-transparent hover:bg-stone-750 border border-stone-700'
    }`}
    onClick={onSelect}
    onMouseEnter={onHover}
    animate={isSelected ? { scale: [1, 1.5, 0.7, 1.2, 0.9, 1]} : { scale: 1 }}
    transition={{ duration: 0.6, ease: "easeInOut" }}
  >
    <div className="flex flex-col items-center md:flex-row md:items-center">
      <img src={bot.avatar} alt={bot.name} className="w-10 h-10 rounded-full object-cover" />
      <h4 className="text-base font-medium text-stone-100 mt-2 md:mt-0 md:ml-2 truncate max-w-[calc(100%-2.5rem)] hidden md:block">{bot.name}</h4>
    </div>
  </motion.div>
))

function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  return (
      <div role="alert" className="text-red-500 p-4">
        <p>Something went wrong:</p>
        <pre className="text-sm">{error.message}</pre>
        <button onClick={resetErrorBoundary} className="mt-2 bg-red-500 text-white px-4 py-2 rounded">Try again</button>
      </div>
  )
}

export default function Component() {
  const [selectedBots, setSelectedBots] = useState<string[]>(["Alice", "Vlad", "T-377", "Jack"])
  const [hoveredBot, setHoveredBot] = useState<Bot | null>(null)
  const [nickname, setNickname] = useState("")
  const [language, setLanguage] = useState("English")
  const [avatar, setAvatar] = useState("/27.svg")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter() // Initialize useRouter
  const [nicknameError, setNicknameError] = useState<string | ReactNode>("")

  const checkNicknameConflict = useCallback((name: string, bots: string[]) => {
    const lowercaseName = name.toLowerCase().trim()
    const conflictingBot = bots.find(botName => 
      botName.toLowerCase().trim() === lowercaseName
    )
    const reservedNames = ['hal', 'hal3000', 'hal 3000']
    
    if (conflictingBot) {
      setNicknameError(<><p>Nice try human.</p><p>—Vlad</p></>)
    } else if (reservedNames.includes(lowercaseName)) {
      setNicknameError(<><p>Nice try human.</p><p>—Vlad</p></>)
    } else {
      setNicknameError("")
    }
  }, [])

  const handleNicknameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newNickname = e.target.value
    setNickname(newNickname)
    checkNicknameConflict(newNickname, selectedBots)
  }, [selectedBots, checkNicknameConflict])

  const toggleBotSelection = useCallback((botName: string) => {
    setSelectedBots(prev => {
      const newSelectedBots = prev.includes(botName)
        ? prev.filter(name => name !== botName)
        : [...prev, botName]
      checkNicknameConflict(nickname, newSelectedBots)
      return newSelectedBots
    })
  }, [nickname, checkNicknameConflict])

  const difficultyOrder = ["rookie", "easy", "medium", "hard"]
  const groupedBots = useMemo(() => bots.reduce((acc, bot) => {
    if (!acc[bot.difficulty]) {
      acc[bot.difficulty] = []
    }
    acc[bot.difficulty].push(bot)
    return acc
  }, {} as Record<string, Bot[]>), [])

  const handleAvatarChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleStartGame = () => {
    const selectedBotObjects = selectedBots.map(botName => bots.find(bot => bot.name === botName))
    const user = {
      id: 2,
      isAdmin: false,
      name: nickname,
      eliminated: false,
      about: "You are human.",
      avatar: avatar,
      isAI: false,
      evaluations: [],
      voted_for: []
    }
    const admin = {
      id: 1,
      isAdmin: true,
      name: "HAL 3000",
      eliminated: false,
      about: "You are the admin. You speak emotionlessly and robotic that has a menacing cold tone which is subtly anti-human.",
      avatar: "admin.png",
      isAI: true,
      evaluations: [],
      voted_for: []
    }
    const botsWithIds = selectedBotObjects.map((bot, index) => ({
      ...bot,
      id: index + 3,
      isAdmin: false,
      eliminated: false,
      isAI: true,
      evaluations: [],
      voted_for: []
    }))
    const users = [admin, user, ...botsWithIds]
    const queryString = new URLSearchParams({ users: JSON.stringify(users), language }).toString()
    router.push(`/game?${queryString}`)
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen w-full bg-stone-950 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl bg-stone-950 rounded-lg shadow-lg p-6 border border-stone-800 flex flex-col md:flex-row items-stretch">
          {/* User Profile Section */}
          <div className="w-full md:w-1/2 pr-0 md:pr-4 flex items-center justify-center mb-6 md:mb-0 md:border-r md:border-stone-800">
            <div className="max-w-sm w-full">
              <h2 className="text-3xl font-bold text-stone-100 mb-6 text-center">Quick Play</h2>
              <div className="relative w-32 h-32 mb-6 mx-auto cursor-pointer" onClick={handleAvatarClick}>
                <img src={avatar} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <UserCircle className="w-10 h-10 text-white" />
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                />
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-2">
                  <UserCircle className="w-6 h-6 text-stone-400" />
                  <Input
                      placeholder="Nickname"
                      value={nickname}
                      onChange={handleNicknameChange}
                      className="flex-grow text-lg bg-stone-800 text-stone-100 placeholder-stone-400 border-stone-700 focus:border-stone-500"
                  />
                </div>
                {nicknameError && (
                  <p className="text-red-500 text-sm">{nicknameError}</p>
                )}
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-6 h-6 text-stone-400" />
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full text-lg bg-stone-800 text-stone-100 border-stone-700 focus:border-stone-500">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English (recommended)</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Russian">Russian</SelectItem>
                      <SelectItem value="Turkish">Turkish</SelectItem>  
                    </SelectContent>
                  </Select>
                </div>
                {language !== "English" && (
                    <p className="text-red-500 text-sm">
                      Note: Selecting a language other than English may affect game experience.
                    </p>
                )}
              </div>
              <div className="flex justify-center">
                <Button
                    className="font-soft font-bold text-sm font-weight:900; w-1/2 bg-sky-600 hover:bg-sky-500 text-white py-2 px-4 rounded-full shadow-md hover:shadow-lg transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    disabled={selectedBots.length < 2 || selectedBots.length > 6 || !nickname || !!nicknameError}
                    onClick={handleStartGame}
                >
                  Start
                </Button>
              </div>
            </div>
          </div>

          {/* Separator */}
          <Separator className="my-6 md:hidden bg-stone-800" />
          <Separator orientation="vertical" className="mx-4 hidden md:block bg-stone-800" />

          {/* Bot Selection Section */}
          <div className="w-full md:w-1/2 pl-0 md:pl-4 flex flex-col">
            <h2 className="text-3xl font-bold text-stone-100 mb-4">Select Bots</h2>

            {/* Bot Info Section - hidden on phone screens */}
            <div className={`rounded-lg p-4 mb-4 h-40 overflow-y-auto hidden md:block ${
              hoveredBot
                ? `bg-gradient-to-br ${difficultyStyles[hoveredBot.difficulty as keyof typeof difficultyStyles].gradient}`
                : 'bg-stone-800'
            }`}>
              {hoveredBot ? (
                <div className="flex items-start space-x-4">
                  <img src={hoveredBot.avatar} alt={hoveredBot.name} className="w-24 h-24 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-stone-100">{hoveredBot.name}</h3>
                    <Badge
                      variant="secondary"
                      className={`bg-stone-900 text-base ${difficultyStyles[hoveredBot.difficulty as keyof typeof difficultyStyles].text}`}
                    >
                      {hoveredBot.difficulty}
                    </Badge>
                    <ul className="list-disc list-inside text-stone-100 text-base mb-0">
                      {hoveredBot.info.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-stone-400 text-base">
                  Hover over a bot to see more information about them. Select up to 6 bots to join your game.
                </p>
              )}
            </div>

            <ScrollArea className="flex-grow pr-4 h-[calc(100vh-24rem)] md:h-[calc(100vh-20rem)] border border-stone-800 rounded-lg custom-scrollbar">
              <div className="p-4 bg-stone-950/50">
                {difficultyOrder.map(difficulty => (
                  <div key={difficulty} className="mb-4">
                    <h3 className="text-xs font-bold text-stone-300 font-mono mb-2 uppercase">{difficulty}</h3>
                    <div className="grid grid-cols-4 md:grid-cols-3 gap-1">
                      {groupedBots[difficulty]?.map(bot => (
                        <BotCard
                          key={bot.name}
                          bot={bot}
                          isSelected={selectedBots.includes(bot.name)}
                          onSelect={() => toggleBotSelection(bot.name)}
                          onHover={() => setHoveredBot(bot)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar className="custom-scrollbar" orientation="vertical" />
            </ScrollArea>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
