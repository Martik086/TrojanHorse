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
  { tokens: 3, price: 0.49, image: "/placeholder.svg?height=80&width=80" },
  { tokens: 15, price: 1.99, image: "/placeholder.svg?height=80&width=80" },
  { tokens: 50, price: 4.99, image: "/placeholder.svg?height=80&width=80" },
  { tokens: 120, price: 9.99, image: "/placeholder.svg?height=80&width=80" },
  { tokens: 300, price: 19.99, image: "/placeholder.svg?height=80&width=80" },
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
      <Card className="w-full max-w-3xl bg-stone-900 border-stone-800">
        <CardHeader className="space-y-1 py-4">
          <CardTitle className="text-4xl font-bold text-center text-stone-100">Purchase Tokens</CardTitle>
          <CardDescription className="text-center text-stone-400 text-lg">
            Select a token package to enhance your gaming experience
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {tokenDeals.map((deal, index) => (
            <Card key={index} className="bg-stone-800 border-stone-700 hover:border-amber-500 transition-colors shadow-lg hover:shadow-amber-500/20 overflow-hidden">
              <CardHeader className="p-2 text-center">
                <CardTitle className="text-lg font-bold text-stone-100">${deal.price.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative">
                <img src={deal.image} alt={`${deal.tokens} Tokens`} className="w-full h-20 object-cover" />
                <div className="p-2">
                  <Button 
                    className="w-full bg-stone-700 hover:bg-stone-600 text-stone-100 py-1 px-2 text-sm"
                    onClick={() => handlePurchase(deal)}
                  >
                    <span className="text-amber-400 font-bold mr-1">+</span>
                    <span className="text-amber-400 font-bold mr-1">{deal.tokens}</span>
                    <Gem className="w-4 h-4 text-amber-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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