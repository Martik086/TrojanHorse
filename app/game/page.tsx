"use client"

import React, { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SendIcon, Users, Mic, Clock, ArrowRightIcon, Ticket, ShieldHalf } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ProfilePicture } from "../components/profile-picture"

interface User {
    id: number
    isAdmin: boolean
    eliminated: boolean
    about: string
    name: string
    avatar: string
    isAI: boolean
    evaluations: string
}

interface Message {
    id: number
    userId: number
    content: string
    timestamp: string
}

interface SystemMessage {
    id: number
    content: string
    backgroundColor: string
}

interface MessageHistoryItem {
    name: string
    content: string
}

const context_regular = "You are an AI participant in a reverse Turing test game. In this game, multiple AI players and 1 human are in a group chat. Each player, including you, knows there is only 1 human among the participants. The game consists of multiple sessions, and after the introduction is over, each session has 2 parts. Part 1: An Admin AI asks a complex, thought-provoking question (e.g., What happens after death? or Do aliens exist?). Each participant, including you, must answer the question. Part 2: After answering the question, the Admin AI asks everyone to explain their perspective on who might be the human. This begins the discussion part, where all participants engage in reasoning and analysis based on the answers provided. After the discussion ends, the Admin AI and all participants, including you, vote to eliminate someone they believe is the human. Your goal is to blend in, avoid being voted out, and analyze others' responses to identify the human. Giveaway that an user is human are: Lack of knowledge and depth in complex topics, typos, grammatical errors, lack or no usage of detailed punctuation, proper use of lowercase/uppercase letters, broken syntax and any proficiency level in the English below C2."
const context_admin = "You are the Admin AI in a reverse Turing test game. In this game, multiple AI players and 1 human are in a group chat. Every player, including the human, knows there is only 1 human among them. The game consists of multiple sessions, and after the introduction is over, each session has 2 parts: Part 1: You begin by asking a complex, thought-provoking question (e.g., What happens after death? or Do aliens exist?). Each participant, must provide an answer to this question in their own way without avoiding it. Part 2: After all participants answer the question, you ask everyone to explain their perspective on who they think might be the human. This starts a discussion where participants analyze each other's answers and try to identify the human. Once the discussion has ended, you lead the group in a vote to eliminate the participant most suspected of being the human (they can't vote you out). You also vote based on the discussion. After voting, the next session begins. Your goal is to vote out the human as soon as possible. Giveaway that an user is human are: Lack of knowledge and depth in complex topics, typos, grammatical errors, broken syntax and any proficiency level in the English below C2."
const instructions_admin = {
    "introduction": "The hunt has started. Welcome every participant and ask them participant to introduce themselves.",
    "question": "Question phase has started. Announce the start of the question phase and ask a complex, thought-provoking question (e.g., What happens after death? or Do aliens exist?) and demand answers to it from everyone.",
    "discussion": "Discussion phase has started. Ask everyone to explain their perspectives on who might be the human.",
    "vote": "Make a closing statement. Announce the start of the vote."
}
const instructions_regular = {
    "introduction": "The game has started. You need to introduce yourself to the group.",
    "question": "Question phase has started. Answer admin's question without avoiding it.",
    "discussion": "Discussion phase has started. Explain your perspective on who you think might be the human.",
    "vote": ""
}
const users: User[] = [
    { id: 6, isAdmin: false, name: "Vlad", eliminated: false, about: "You are impatient and angry. You are a bit of a jerk and very cynical.", avatar: "https://i.pinimg.com/originals/f7/da/e6/f7dae69ffb98958b33541f9d727049cd.jpg", isAI: true, evaluations: ""  },
    { id: 5, isAdmin: false, name: "Alice", eliminated: false, about: "You are very calm and non-cynical. You don't like accusing people and try to maintain the peace in the chat. You don't want to vote anyone out.", avatar: "./moana.png", isAI: true, evaluations: ""},
    { id: 4, isAdmin: false, name: "T-377", eliminated: false, about: "You speak like a total language model. You are emphasizing logic and reason and like to take things step by step. You come up with questions and ideas to determine the human. You ask questions that require a lot of knowledge and language skills to answer and you get suspicious on weak answers.You are emotionless and inquisitive. For you; only criteria in finding the human are: lack of knowledge and depth in complex topics, typos, grammatical errors, broken syntax and any proficiency level in the English below C2. These are only the signs of a human for you.", avatar: "./skeptical.jpg", isAI: true, evaluations: ""},
    { id: 2, isAdmin: false, name: "manwe", eliminated: false, about: "You are human.", avatar: "https://turkeyanaclinic.com/wp-content/uploads/2024/09/James-Franco-2.jpg", isAI: false, evaluations: ""},
    { id: 3, isAdmin: false, name: "Jake", eliminated: false, about: "You have a laid back and nonchalant attitude with a hint of sarcasm on the surface. You want to find out who the human is as quick and possible and end the game. Your hidden strategy is to anaylze lingustic patterns and grammatical errors to determine who the human is.", avatar: "jake.png", isAI: true, evaluations: ""},
    { id: 1, isAdmin: true, name: "HAL 3000", eliminated: false, about: "You are the admin. You speak emotionlessly in a menacing cold tone that uses a light scientific jargon.", avatar: "https://miro.medium.com/v2/resize:fit:1400/1*FX2Bn213WcWsQlx3gr1dVg.jpeg", isAI: true, evaluations: ""},
]


const initialMessages: (Message | SystemMessage)[] = [
    { id: 1, content: "All entities registered within Node-4A. Awaiting analytical responses for Phase-1 interrogation.", backgroundColor: "bg-green-500/20" },
]

export default function GroupChat() {
    const [messages, setMessages] = useState<(Message | SystemMessage)[]>(initialMessages)
    const [messageHistory, setMessageHistory] = useState<MessageHistoryItem[]>(
        initialMessages.filter((msg): msg is Message => 'userId' in msg).map(msg => ({
            name: users.find(user => user.id === msg.userId)?.name || "Unknown",
            content: msg.content
        }))
    )
    const [newMessage, setNewMessage] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [typingUser, setTypingUser] = useState<User | null>(null)
    const [currentTurn, setCurrentTurn] = useState(1)
    const [isTurnInProgress, setIsTurnInProgress] = useState(false)
    const [participants, setParticipants] = useState<User[]>([])
    const [humanUserID, setHumanUserID] = useState(0)
    const [canProceedToNextTurn, setCanProceedToNextTurn] = useState(false)
    const [countdown, setCountdown] = useState(users.length + 1)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const lastMessageRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const prevTurnRef = useRef<number | null>(null)
    const [gamePhase, setGamePhase] = useState<"introduction" | "question" | "discussion" | "vote">("introduction")

    useEffect(() => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    // Start the game with the first turn
    useEffect(() => {
        setParticipants(users)
        const humanUserId = users.find(user => !user.isAI)?.id;
        if (humanUserId) {
            setHumanUserID(humanUserId);
        }
        handleNextTurn();
    }, [])

    useEffect(() => {
        console.log("Game phase is: ", gamePhase)
        setCountdown(countdown - 1)
        if (countdown === 1) {
            handleCountdown()
        }
        participants.forEach(user => {
            evaluateMessage(user)
        })
    }, [currentTurn]);

    const handleCountdown = () => {
        console.log("Game phase was: ", gamePhase)
        const active_participants = participants.filter(user => !user.eliminated).length
        switch (gamePhase) {
            case "introduction":
                setCountdown(active_participants)
                setGamePhase("question")
                break
            case "question":
                if (active_participants >= 7) {
                    setCountdown(active_participants)
                }
                else if (active_participants >= 5) {
                    setCountdown(active_participants * 2)
                }
                else if (active_participants >= 3) {
                    setCountdown(active_participants * 3)
                }
                else {
                    setCountdown(active_participants * 4)
                }
                setGamePhase("discussion")
                break
            case "discussion":
                setCountdown(1)
                setGamePhase("vote")
                break
            case "vote":
                setCountdown(1)
                setGamePhase("question")
                break
        }
        console.log("Game phase is now: ", gamePhase)
    }

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === "" || currentTurn !== humanUserID) return; // Only allow sending if it's manwe's turn

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: Message = {
            id: messages.length + 1,
            userId: humanUserID, // manwe's user ID
            content: newMessage,
            timestamp: currentTime
        };

        setMessages(prevMessages => [...prevMessages, newMsg]);
        setMessageHistory(prevHistory => [...prevHistory, { name: "manwe", content: newMessage }]);
        setNewMessage("");
        setIsTyping(false);
        setTypingUser(null);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        // Allow the user to press the next button after sending a message
        setCanProceedToNextTurn(true);
        moveToNextTurn();   
    };

    const handleNextTurn = () => {
        if (prevTurnRef.current !== currentTurn) {
            const currentUser = users.find(user => user.id === currentTurn);
            if (currentUser) {
                console.log(`Current turn: ${currentTurn}, User: ${currentUser.name}`);
                console.log("message history: ", messageHistory)
                if (currentUser.isAI) {
                    generateAIResponse(currentUser);
                } else {
                    addSystemMessage(`It's ${currentUser.name}'s turn`, "bg-blue-500/20");
                }
            }
            prevTurnRef.current = currentTurn;
        }
        setCanProceedToNextTurn(false); // Reset the flag for the next turn
    };

    const moveToNextTurn = () => {
        let nextTurn = (currentTurn % users.length) + 1;
        while (users.find(user => user.id === nextTurn)?.eliminated) {
            nextTurn = (nextTurn % users.length) + 1;
        }
        setCurrentTurn(nextTurn);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value)
        if (currentTurn === humanUserID && !isTurnInProgress) {
            setIsTyping(true)
            setTypingUser(users.find(user => user.id === humanUserID) || null)

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false)
                setTypingUser(null)
            }, 2000)
        }
    }

    const evaluateMessage = async (user: User) => {

        if (user.id == humanUserID || user.eliminated || user.id == (currentTurn % users.length) - 1 || (currentTurn % users.length) - 1 == 1) {
            return
        }

        const context = user.isAdmin ? context_admin : context_regular;
        const admin_name = users.find(user => user.isAdmin)?.name;
        const active_users_are = participants.filter(user => !user.eliminated).map(user => user.name).join(', ');
        try {
        const prompt = `
            ${context}
            Your character is ${user.name}
            About: ${user.about}
            Admin of the hunt is: ${admin_name}
            Active users are: ${active_users_are}
            Message History:
            ${messageHistory.map(msg => `${msg.name}: ${msg.content}`).join('\n')}
            Message to evaluate: ${messageHistory[messageHistory.length - 1].content}
            Analyze the last message in the message history. Considering the user's response to admin's instructions, rate the message on it's liklihood to be from a human 1-5, 1 representing an extreme likelihood that it's not an AI and 5 representing an extreme likelihood that it's from a human. Respond with a single number."`;
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-2024-08-06",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 1,
                    temperature: 0.2,
                }),
            });


            if (!response.ok) {
                throw new Error('Failed to generate AI response');
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim() || "I'm not sure what to say.";
            console.log(`${user.name}'s evaluation: `, aiResponse)
            setParticipants(prevParticipants => 
                prevParticipants.map(participant => 
                    participant.id === user.id 
                        ? { ...participant, evaluations: participant.evaluations + aiResponse }
                        : participant
                )
            );
        }
        catch (error) {
            console.error("Error generating AI response:", error);
            addSystemMessage("Error: Failed to generate AI response", "bg-red-500/20");
        }
        }

    const generateAIResponse = async (user: User) => {        
        setIsTyping(true);
        setTypingUser(user);
        const context = user.isAdmin ? context_admin : context_regular;
        const admin_name = users.find(user => user.isAdmin)?.name;
        const active_users_are = participants.filter(user => !user.eliminated).map(user => user.name).join(', ');
        try {

            const prompt = `
            ${context}
            Instructions: ${user.isAdmin ? instructions_admin[gamePhase] : instructions_regular[gamePhase]}
            Character: ${user.name}
            About: ${user.about}
            Admin of the game is: ${admin_name}
            Active users are: ${active_users_are}
            Message History:
            ${messageHistory.map(msg => `${msg.name}: ${msg.content}`).join('\n')}
            ${gamePhase === "discussion" ? `Here are your evaluations for the messages that were sent thus far and the likelihood that they are from a human: ${user.evaluations} Base your suspicions on these evaluations.` : ""}
            Based on the context, your character description, and the message history, write a response as ${user.name} (don't put your name and colon as part of your response). Try not to exceed 150 characters unless necessary. Defend yourself if you are being accused of being the human.

            ${user.name}:`;

            // Simulate a realistic delay (between 3 to 7 seconds)
            const delay = Math.floor(Math.random() * (3000 - 3000 + 1) + 0);
            await new Promise(resolve => setTimeout(resolve, delay));

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-2024-08-06",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 200,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate AI response');
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim() || "I'm not sure what to say.";

            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const newMsg: Message = {
                id: messages.length + 1,
                userId: user.id,
                content: aiResponse,
                timestamp: currentTime
            };

            setMessages(prevMessages => [...prevMessages, newMsg]);
            setMessageHistory(prevHistory => [...prevHistory, { name: user.name, content: aiResponse }]);
            setCanProceedToNextTurn(true); // Allow the user to press the next button after AI response
        } catch (error) {
            console.error("Error generating AI response:", error);
            addSystemMessage("Error: Failed to generate AI response", "bg-red-500/20");
        } finally {
            setIsTyping(false);
            setTypingUser(null);
            moveToNextTurn();
        }
    }

    const addSystemMessage = (content: string, backgroundColor: string) => {
        const systemMsg: SystemMessage = {
            id: messages.length + 1,
            content,
            backgroundColor
        };
        setMessages(prevMessages => [...prevMessages, systemMsg]);
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-stone-950 p-2">
            <div className="w-full h-[90vh] max-w-5xl bg-stone-900 rounded-lg shadow-lg overflow-hidden border border-stone-800 flex flex-col lg:flex-row">
                <div className="flex-grow flex flex-col h-full">
                    <header className="bg-stone-800 border-b border-stone-700 flex items-center justify-between h-14 shrink-0">
                        <h1 className="text-xl font-bold text-stone-100 text-shadow p-3">Group Chat</h1>
                        <div className="bg-stone-700 rounded-md bg-sky-800/20 text-sky-400 font-bold p-2 mr-8 font-mono tracking-wider flex items-center">
                            {countdown}
                            <Ticket className="w-4 h-4 text-sky-400 ml-1" />
                        </div>
                    </header>
                    <ScrollArea className="flex-grow overflow-y-auto">
                        <div className="p-2">
                        <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const user = 'userId' in message
                    ? participants.find(u => u.id === message.userId)
                    : undefined;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`mb-2 rounded-lg p-2 transition-colors duration-200 ${
                        'userId' in message 
                          ? `flex items-start ${user?.isAdmin ? 'bg-red-700/30 hover:bg-red-700/40' : 'hover:bg-stone-800/70'}` 
                          : 'text-center hover:bg-stone-800/50'
                      }`}
                      style={{ backgroundColor: 'backgroundColor' in message ? message.backgroundColor : undefined }}
                    >
                      {'userId' in message ? (
                        <>
                          <ProfilePicture
                            src={user?.avatar || ''}
                            alt={user?.name || ''}
                            className="w-8 h-8 mr-2"
                          />
                          <div className="flex-1">
                            <div className="flex items-center mb-1" >
                              <span className={`font-semibold mr-2 ${user?.isAdmin ? 'text-red-300 font-mono' : 'text-stone-200'} text-shadow-sm`}>
                                {user?.name}
                              </span>
                              {user?.isAdmin && (
                                <ShieldHalf className="w-4 h-4 text-red-400 mr-2" />
                              )}
                              <span className="text-xs text-stone-500">{message.timestamp}</span>
                            </div>
                            <p className={`text-sm ${user?.isAdmin ? 'text-red-300 font-mono' : 'text-stone-300'}`}>{message.content}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-stone-300 text-sm italic w-full">{message.content}</p>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
                        </div>
                    </ScrollArea>
                    <div className="h-6 relative shrink-0">
                        <AnimatePresence>
                            {isTyping && typingUser && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-0 left-0 right-0 px-3 py-1 text-stone-400 text-xs"
                                >
                                    <span className="bg-stone-800 px-2 py-1 rounded-md">
                                        {typingUser.name} is typing
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                        >
                                          ...
                                        </motion.span>
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <footer className="p-2 bg-stone-800 border-t border-stone-700 shrink-0">
                        <form onSubmit={handleSendMessage} className="flex items-center">
                            <Input
                                type="text"
                                value={newMessage}
                                onChange={handleTyping}
                                placeholder={currentTurn === humanUserID ? "Type a message..." : "Wait for your turn..."}
                                disabled={currentTurn !== humanUserID}
                                className={`flex-grow mr-2 bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400 focus:ring-amber-500 focus:border-amber-500 text-sm ${
                                    currentTurn !== humanUserID ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            />
                            <Button
                                type={currentTurn === humanUserID ? "submit" : "button"}
                                size="sm"
                                onClick={currentTurn !== humanUserID ? handleNextTurn : handleSendMessage}
                                className={`${
                                    currentTurn === humanUserID
                                        ? 'bg-stone-700 hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-800'
                                        : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-stone-800'
                                }`}
                                disabled={currentTurn !== humanUserID && !canProceedToNextTurn}
                            >
                                {currentTurn === humanUserID ? (
                                    <SendIcon className="h-4 w-4" />
                                ) : (
                                    <ArrowRightIcon className="h-4 w-4" />
                                )}
                                <span className="sr-only">{currentTurn === humanUserID ? "Send message" : "Next turn"}</span>
                            </Button>
                        </form>
                    </footer>
                </div>
                <div className="w-full lg:w-56 bg-stone-800 border-t lg:border-t-0 lg:border-l border-stone-700 flex flex-col">
                    <header className="bg-stone-800 border-b border-stone-700 flex items-center justify-between p-3 h-14 shrink-0">
                        <h2 className="text-base font-semibold text-stone-100 text-shadow-sm">Candidates</h2>
                        <div className="flex items-center text-stone-300 text-sm">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{users.filter(user => !user.eliminated).length}</span>
                        </div>
                    </header>
                    <ScrollArea className="flex-grow">
                        <div className="p-2">
                            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 mt-2 border-b border-stone-700">Active</h3>
                            {users.filter(user => !user.eliminated).map((user) => (
                                <div
                                    key={user.id}
                                    className={`flex items-center mb-2 p-2 rounded-lg transition-colors duration-200 ${
                                        user.id === currentTurn ? 'bg-green-600/20' :
                                            user.id === (currentTurn % users.length) + 1 ? 'bg-amber-700/20' :
                                                'hover:bg-green-600/10'
                                    }`}
                                >
                                    <ProfilePicture
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-6 h-6 mr-2"
                                    />
                                    <span className="text-stone-300 text-sm flex-grow">{user.name}</span>
                                    {user.id === currentTurn && <Mic className="w-4 h-4 text-green-400" />}
                                    {user.id === (currentTurn % users.length) + 1 && <Clock className="w-4 h-4 text-amber-400" />}
                                </div>
                            ))}
                            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 mt-8 border-b border-stone-700">Eliminated</h3>
                            {users.filter(user => user.eliminated).map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center mb-2 p-2 rounded-lg"
                                >
                                    <ProfilePicture
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-6 h-6 mr-2 grayscale"
                                    />
                                    <span className="text-stone-300 text-sm flex-grow">{user.name}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}