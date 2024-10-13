"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Star, Zap, Moon, Sun, CloudMoon } from "lucide-react"

interface Deal {
  tokens: number
  price: number
  name: string
  icon: React.ReactNode
  color: string
}

const Deals: Deal[] = [
  { tokens: 3, price: 0.49, name: "Stardust", icon: <Star className="w-6 h-6" />, color: "from-yellow-300 to-yellow-500" },
  { tokens: 10, price: 1.99, name: "Nebula", icon: <Zap className="w-6 h-6" />, color: "from-purple-400 to-pink-500" },
  { tokens: 50, price: 4.99, name: "Galaxy", icon: <Moon className="w-6 h-6" />, color: "from-blue-400 to-indigo-500" },
  { tokens: 120, price: 9.99, name: "Universe", icon: <Sun className="w-6 h-6" />, color: "from-red-400 to-orange-500" },
]

export default function CosmicTokenEmporium() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number }[]>([])

  useEffect(() => {
    const newStars = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
    }))
    setStars(newStars)
  }, [])

  const handlePurchase = (deal: Deal) => {
    setSelectedDeal(deal)
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000) // Simulating API call
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-900 flex items-center justify-center p-4 overflow-hidden relative">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute bg-white rounded-full animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
        />
      ))}
      <Card className="w-full max-w-4xl bg-black/30 backdrop-blur-md border-none shadow-2xl text-white overflow-hidden">
        <CardHeader className="text-center relative">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CardTitle className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Ticket Market
            </CardTitle>
          </motion.div>
          <p className="text-lg text-blue-200">Fuel your intergalactic adventures!</p>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-6">
          {Deals.map((deal, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                className={`h-auto w-full py-6 px-4 flex flex-col items-center justify-center bg-gradient-to-br ${deal.color} text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
                onClick={() => handlePurchase(deal)}
              >
                <motion.div
                  className="mb-4 text-4xl"
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                >
                  {deal.icon}
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">{deal.name}</h3>
                <div className="flex items-center mb-2">
                  <span className="text-3xl font-bold mr-2">{deal.tokens}</span>
                  <span className="text-lg">Tokens</span>
                </div>
                <span className="text-xl font-semibold">${deal.price.toFixed(2)}</span>
                <motion.div
                  className="absolute inset-0 bg-white rounded-lg opacity-0"
                  initial={false}
                  whileHover={{ opacity: 0.1 }}
                  transition={{ duration: 0.3 }}
                />
              </Button>
            </motion.div>
          ))}
        </CardContent>
      </Card>
      <AnimatePresence>
        {selectedDeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
            >
              <Card className="w-full max-w-md bg-gradient-to-br from-indigo-900 to-purple-900 text-white border-none">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold mb-2">Confirm Your Cosmic Purchase</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <motion.div
                      className="text-5xl mb-4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      {selectedDeal.icon}
                    </motion.div>
                    <p className="text-xl mb-2">
                      You're about to acquire <span className="font-bold text-2xl">{selectedDeal.tokens} {selectedDeal.name} Tokens</span>
                    </p>
                    <p className="text-3xl font-bold text-yellow-400">${selectedDeal.price.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={() => setSelectedDeal(null)} className="border-white text-white hover:bg-white/20">
                      Cancel
                    </Button>
                    <Button
                      className={`bg-gradient-to-r ${selectedDeal.color} text-white`}
                      onClick={() => {
                        console.log(`Confirmed purchase of ${selectedDeal.tokens} ${selectedDeal.name} Tokens for $${selectedDeal.price.toFixed(2)}`)
                        setSelectedDeal(null)
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Star className="w-5 h-5 mr-2" />
                          Confirm Purchase
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}