"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bot, User } from "lucide-react"

const GRID_SIZE = 11
const UPDATE_INTERVAL = 1000 // 1 second

export default function Component() {
  const [grid, setGrid] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  )

  useEffect(() => {
    const intervalId = setInterval(() => {
      setGrid((prevGrid) =>
        prevGrid.map((row) =>
          row.map(() => Math.random() < 0.05)
        )
      )
    }, UPDATE_INTERVAL)

    return () => clearInterval(intervalId)
  }, [])

  const getColor = (i: number, j: number) => {
    const hue = 190 - (i + j) * (70 / (GRID_SIZE * 2)) // Hue range from 160 (teal) to 130 (green)
    return `hsl(${hue}, 100%, 50%)`
  }

  return (
    <div className="w-full h-full p-4">
      <div className="w-full h-full grid" style={{ aspectRatio: '1 / 1' }}>
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            gap: '2px',
          }}
        >
          {grid.map((row, i) =>
            row.map((isUser, j) => (
              <motion.div
                key={`${i}-${j}`}
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-1/2 h-1/2 flex items-center justify-center">
                  {isUser ? (
                    <User 
                      className="w-full h-full" 
                      style={{
                        color: getColor(i, j),
                        opacity: 0.5 * (i / (GRID_SIZE - 1))
                      }}
                    />
                  ) : (
                    <Bot 
                      className="w-full h-full" 
                      style={{
                        color: getColor(i, j),
                        opacity: 0.5 * (i / (GRID_SIZE - 1))
                      }}
                    />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}