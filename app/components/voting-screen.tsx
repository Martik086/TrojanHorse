"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function ProfilePicture({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover border-2 border-zinc-600 ${className}`}
    />
  )
}

interface User {
  id: number
  name: string
  avatar: string
  isAI: boolean
  eliminated: boolean
  isAdmin: boolean
}

interface Vote {
  voterId: number
  votedForId: number
}

interface VotingScreenProps {
  users: User[]
  currentUserId: number
  predeterminedVotes: Vote[]
  onVoteComplete: (eliminatedUserId: number | null) => void
}

export default function VotingScreen({ users = [], currentUserId, predeterminedVotes = [], onVoteComplete }: VotingScreenProps) {
  const [userVote, setUserVote] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [votableUsers, setVotableUsers] = useState<User[]>([])
  const [voteResults, setVoteResults] = useState<{ [key: number]: number }>({})

  const humanUser = users.find(user => !user.isAI)

  useEffect(() => {
    if (users && users.length > 0) {
      setVotableUsers(users.filter(user => !user.eliminated && !user.isAdmin && user.isAI))
    }
  }, [users])

  useEffect(() => {
    if (showResults) {
      const results: { [key: number]: number } = {}
      users.forEach(user => {
        if (!user.eliminated && !user.isAdmin) {
          results[user.id] = getVotesForUser(user.id).length
        }
      })
      setVoteResults(results)
    }
  }, [showResults, userVote])

  const handleVote = (votedForId: number) => {
    if (userVote === null) {
      setUserVote(votedForId)
      setShowResults(true)
    }
  }

  const getVotesForUser = (userId: number) => {
    return [...predeterminedVotes, ...(userVote ? [{ voterId: currentUserId, votedForId: userVote }] : [])]
      .filter(vote => vote.votedForId === userId)
  }

  const getVotersForUser = (userId: number) => {
    return getVotesForUser(userId).map(vote => {
      const voter = users.find(user => user.id === vote.voterId)
      return voter ? voter.name : 'Unknown'
    })
  }

  const maxVotes = Math.max(...Object.values(voteResults), 0)
  const eliminatedUserId = Object.entries(voteResults).length > 0
    ? Object.entries(voteResults).reduce((a, b) => a[1] > b[1] ? a : b)[0]
    : null

  if (!users || users.length === 0) {
    return <div className="text-white">Loading...</div>
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto bg-zinc-900 rounded-lg shadow-lg p-6 border border-zinc-700">
        <h2 className="text-2xl font-bold font-mono text-zinc-100 mb-6 text-center uppercase tracking-wider">Vote to Eliminate</h2>
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="voting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-800 rounded-lg p-4 shadow-inner"
            >
              <ScrollArea className="h-[60vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {votableUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      className={`relative bg-zinc-700 rounded-lg p-4 cursor-pointer transition-all shadow-md ${
                        userVote === user.id ? 'ring-2 ring-green-500 shadow-green-500/50' : 'hover:shadow-lg hover:shadow-zinc-600/50'
                      }`}
                      onClick={() => handleVote(user.id)}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center mb-2">
                        <ProfilePicture src={user.avatar} alt={user.name} className="w-12 h-12 mr-4" />
                        <span className="text-lg font-semibold text-zinc-100">{user.name}</span>
                      </div>
                      {user.id === currentUserId && (
                        <span className="text-xs text-zinc-400">(You)</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6 bg-zinc-800 rounded-lg p-4 shadow-inner"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {users.filter(user => !user.eliminated && !user.isAdmin).map((user) => {
                  const voteCount = voteResults[user.id] || 0
                  const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0
                  const voters = getVotersForUser(user.id)
                  const isHighestVote = voteCount === maxVotes && maxVotes > 0
                  return (
                    <Tooltip key={user.id}>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                          <div className="w-full h-40 bg-zinc-700 rounded-lg relative overflow-hidden">
                            <motion.div
                              className={`absolute bottom-0 left-0 right-0 ${isHighestVote ? 'bg-red-600' : 'bg-amber-500'}`}
                              initial={{ height: 0 }}
                              animate={{ height: `${percentage}%` }}
                              transition={{ duration: 2, delay: 0.2 }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-mono text-white">{voteCount}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <ProfilePicture src={user.avatar} alt={user.name} className="w-8 h-8 mx-auto mb-1" />
                            <span className="text-zinc-300 text-sm">{user.name}</span>
                            {user.id === humanUser?.id && (
                              <span className="text-xs text-zinc-400 block">(You)</span>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">{user.name}: {voteCount} vote(s)</p>
                        {voters.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Voters:</p>
                            <ul className="list-disc list-inside">
                              {voters.map((voter, index) => (
                                <li key={index} className="text-sm">{voter}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => onVoteComplete(eliminatedUserId ? Number(eliminatedUserId) : null)}
            disabled={!showResults}
            className="bg-sky-600 hover:bg-sky-500 text-white font-mono py-2 px-6 rounded-sm shadow-md hover:shadow-lg transition-all uppercase tracking-wider"
          >
            Proceed
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}