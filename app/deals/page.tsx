"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Gem } from "lucide-react"

interface TokenDeal {
  tokens: number
  price: number
  image: string
}

const tokenDeals: TokenDeal[] = [
  { tokens: 3, price: 0.49, image: "/deal-small.png" },
  { tokens: 15, price: 1.99, image: "/placeholder.svg?height=80&width=80" },
  { tokens: 50, price: 4.99, image: "/placeholder.svg?height=80&width=80" },
  { tokens: 120, price: 9.99, image: "/placeholder.svg?height=80&width=80" }
]

export default function TokenPurchaseComponent() {
  const [selectedDeal, setSelectedDeal] = React.useState<TokenDeal | null>(null)

  const handlePurchase = (deal: TokenDeal) => {
    setSelectedDeal(deal)
    // Here you would typically integrate with a payment gateway
    console.log(`Purchasing ${deal.tokens} tokens for $${deal.price}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-950 p-2">
      <Card className="w-full max-w-xl bg-stone-900 border-stone-800">
        <CardHeader className="space-y-1 py-4">
          <CardTitle className="text-3xl sm:text-4xl font-bold text-center text-stone-100">Purchase Tokens</CardTitle>
          <CardDescription className="text-center text-stone-400 text-base sm:text-lg">
            Select a token package to enhance your gaming experience
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {tokenDeals.map((deal, index) => (
            <div key={index} className="w-[calc(50%-0.25rem)] sm:w-[calc(50%-0.5rem)]">
              <Card className="bg-black border-stone-900 hover:border-stone-800 transition-colors shadow-lg hover:shadow-green-500/20 overflow-hidden w-full aspect-square">
                <div className="flex flex-col h-full">
                  <CardHeader className="p-2 sm:p-3 text-center flex-shrink-0">
                    <CardTitle className="text-lg sm:text-xl font-mono font-semibold flex items-center justify-center bg-green-800/20 text-green-400 rounded-sm py-1">
                      {deal.tokens} <Gem className="inline-block w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 relative flex-grow flex flex-col justify-between">
                    <div className="p-2 sm:p-3 pb-0">
                      <div className="h-24 sm:h-32 overflow-hidden">
                        <img src={deal.image} alt={`${deal.tokens} Tokens`} className="object-cover w-full h-full" />
                      </div>
                    </div>
                    <div className="p-2 sm:p-3">
                      <Button 
                        className="w-full border border-stone-800 bg-black hover:bg-stone-800 text-stone-100 py-1 sm:py-1.5 px-2 sm:px-3 text-sm sm:text-base"
                        onClick={() => handlePurchase(deal)}
                      >
                        <span className="font-semibold mr-1">${deal.price.toFixed(2)}</span>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 py-3">
          <div className="text-base text-stone-500 text-center">
            Tokens will be added to your account immediately after purchase.
          </div>
        </CardFooter>
      </Card>
      {selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-full max-w-md bg-stone-900 border-stone-800">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-stone-100">Confirm Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-400 text-lg">You are about to purchase {selectedDeal.tokens} tokens for ${selectedDeal.price.toFixed(2)}.</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="bg-stone-800 text-stone-100 hover:bg-stone-700 border-stone-700" onClick={() => setSelectedDeal(null)}>Cancel</Button>
              <Button className="bg-stone-700 hover:bg-stone-600 text-stone-100" onClick={() => {
                console.log(`Confirmed purchase of ${selectedDeal.tokens} tokens for $${selectedDeal.price.toFixed(2)}`)
                setSelectedDeal(null)
              }}>Confirm</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}