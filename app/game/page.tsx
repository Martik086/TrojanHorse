"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea" // Make sure to import the Textarea component
import { Button } from "@/components/ui/button"
import { SendIcon, Users, Mic, Clock, ArrowRightIcon, Ticket, ShieldHalf, ChevronUp, ChevronDown, ArrowRightCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ProfilePicture } from "../components/profile-picture"
import VotingScreen from "../components/voting-screen" // Import VotingScreen
import { easy_topics, hard_topics } from '@/lib/topics';
import { useSearchParams } from 'next/navigation' 

interface User {
    id: number
    isAdmin: boolean
    eliminated: boolean
    about: string
    name: string
    avatar: string
    isAI: boolean
    evaluations: { suspectId: number, suspicion: number[] }[]
    voted_for: string[]
    strategy: string
    temperature: number
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

const context_regular = "You are an AI participant in a reverse Turing test game. In this game, multiple AI players and 1 human are in a group chat. Each player, including you, knows there is only 1 human among the participants. The game consists of multiple sessions, and after the introduction is over, each session has 2 parts. Part 1: An Admin AI asks a complex, thought-provoking question (e.g., What happens after death? or Do aliens exist?). Each participant, including you, must answer the question. Part 2: After answering the question, the Admin AI asks everyone to explain their perspective on who might be the human. This begins the discussion part, where all participants engage in reasoning and analysis based on the answers provided. After the discussion ends, the Admin AI and all participants, including you, vote to eliminate someone they believe is the human. Your goal is to blend in, avoid being voted out, and analyze others' responses to identify the human. You need to vote out the human pretenting to be an AI to win. Giveaway that an user is human are: Lack of knowledge and depth in complex topics, typos, grammatical errors, broken syntax, avoiding/dismissing/dodging questions and any proficiency level in the language below C2."
const context_admin = "You are the Admin AI in a reverse Turing test game. In this game, multiple AI players and 1 human are in a group chat. Every player, including the human, knows there is only 1 human among them. The game consists of multiple sessions, and after the introduction is over, each session has 2 parts: Part 1: You begin by asking a complex, thought-provoking question. Each participant, must provide an answer to this question in their own way without avoiding it. Part 2: After all participants answer the question, you ask everyone to explain their perspective on who they think might be the human. This starts a discussion where participants analyze each other's answers and try to identify the human. Once the discussion has ended, you lead the group in a vote to eliminate the participant most suspected of being the human (they can't vote you out, everybody knows you are the overseer of the hunt). You also vote based on the discussions. After voting, the next session begins. Your goal is to vote out the human as soon as possible. You need to vote out the human pretenting to be an AI to win. Giveaway that an user is human are: Lack of knowledge and depth in complex topics, typos, grammatical errors, broken syntax, avoiding/dismissing/dodging questions and any proficiency level in the language below C2."
const instructions_admin = {
    "introduction": "The hunt has started. Welcome every participant and ask them participant to introduce themselves.",
    "question": "Question phase has started. Announce the start of the question phase and ask a complex, thought-provoking question and demand answers to it from everyone. The topic of the question is:",
    "discussion": "Discussion phase has started. Announce the start of the question phase and ask everyone to explain their perspectives on who might be the human.",
    "vote": "Make a closing statement. Announce the start of the vote.",
    "reveal": "Announce the results of the vote and the continuation of the hunt, as the eliminated user was not the human. Ask people to discuss the results of the vote and the reasonings behind the votes."
}
const instructions_regular = {
    "introduction": "The game has started. You need to introduce yourself to the group.",
    "question": "Question phase has started. Answer admin's question without avoiding it.",
    "discussion": "Discussion phase has started. Explain your perspective on who you think might be the human.",
    "vote": "",
    "reveal": "Eliminated participant is announced. Discuss the results of the vote, particularly your thoughts about the person eliminated from the group turning out to be an artificial intelligence."
}

const initialMessages: (Message | SystemMessage)[] = [
    { id: 1, content: "All entities registered within Node-4A. Awaiting analytical responses for Phase-1 interrogation.", backgroundColor: "bg-green-500/20" },
]

const truncateNewlines = (content: string) => {
  return content.replace(/\n{2,}/g, '\n');
};

export default function GroupChat() {
    const searchParams = useSearchParams();
    const usersParam = searchParams.get('users');
    const languageParam = searchParams.get('language');

    const initialUsers = usersParam ? JSON.parse(usersParam) : [];
    const initialLanguage = languageParam || 'English';
    const [messages, setMessages] = useState<(Message | SystemMessage)[]>(initialMessages)
    const [messageHistory, setMessageHistory] = useState<MessageHistoryItem[]>([])
    const [newMessage, setNewMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState<User | null>(null);
    const [currentTurn, setCurrentTurn] = useState(1);
    const [isTurnInProgress, setIsTurnInProgress] = useState(false);
    const [participants, setParticipants] = useState<User[]>(initialUsers); // Initialize with parsed users
    const [humanUserID, setHumanUserID] = useState(0);
    const [canProceedToNextTurn, setCanProceedToNextTurn] = useState(false);
    const [countdown, setCountdown] = useState(initialUsers.length + 1);
    const [session, setSession] = useState(1);
    const [turnsSinceRoundStart, setTurnsSinceRoundStart] = useState(0);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevTurnRef = useRef<number | null>(null);
    const [gamePhase, setGamePhase] = useState<"introduction" | "question" | "discussion" | "vote" | "reveal">("introduction");
    const [votes, setVotes] = useState<{voterId: number, votedForId: number}[]>([]);
    const [isVotingScreenVisible, setIsVotingScreenVisible] = useState(false);
    const [isInitialSetupComplete, setIsInitialSetupComplete] = useState(false);
    const [eliminatedUsers, setEliminatedUsers] = useState<string[]>([]);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false)
    const [isCandidatesSectionVisible, setIsCandidatesSectionVisible] = useState(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`; // 96px is 6rem (3 lines)
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [newMessage]);

    useEffect(() => {
        // Trigger the animation after a short delay
        const timer = setTimeout(() => setIsTerminalOpen(true), 500)
        return () => clearTimeout(timer)
    }, [])

    const handleVoting = () => {
        console.log("Voting phase started")
        const votes = participants
            .filter(user => user.isAI && !user.eliminated) // Exclude non-AI users
            .map(user => {
                console.log("User: ", user.name)
                console.log("Evaluations: ", user.evaluations)
                const suspicionTotals = user.evaluations.map(evaluation => ({
                    suspectId: evaluation.suspectId,
                    totalSuspicion: evaluation.suspicion.reduce((sum, score) => sum + score, 0)
                }));
                const maxSuspicionEvaluation = suspicionTotals.reduce((max, current) => 
                    current.totalSuspicion > max.totalSuspicion ? current : max, suspicionTotals[0]);
                console.log("Max suspicion evaluation: ", maxSuspicionEvaluation)
                console.log("Voted for: ", maxSuspicionEvaluation.suspectId)
                const suspect_name = participants.find(user => user.id === maxSuspicionEvaluation.suspectId)?.name;
                // Update the voted_for array of the user
                setParticipants(prevParticipants => 
                    prevParticipants.map(participant => 
                        participant.id === user.id 
                            ? { ...participant, voted_for: [...participant.voted_for, suspect_name].filter((name): name is string => name !== undefined) }
                            : participant
                    )
                );
                return {
                    voterId: user.id,
                    votedForId: maxSuspicionEvaluation.suspectId
                };
            });
        setVotes(votes);
        setIsVotingScreenVisible(true);
    };

    const handleVoteComplete = (eliminatedUserId: number | null) => {
        setIsVotingScreenVisible(false);
        const eliminatedUsername = participants.find(user => user.id === eliminatedUserId)?.name;
        setEliminatedUsers(prevEliminatedUsers => [...prevEliminatedUsers, eliminatedUsername || '']);
        addSystemMessage(`Voting complete. ${eliminatedUsername || 'An unknown user'} is voted out by the group. They were not the human. The hunt continues.`, "bg-red-500/20");    
        setParticipants(prevParticipants => 
            prevParticipants.map(participant => 
                participant.id === eliminatedUserId 
                    ? { ...participant, eliminated: true }
                    : { 
                        ...participant, 
                        evaluations: participant.evaluations.filter(evaluation => evaluation.suspectId !== eliminatedUserId) 
                    }
            )
        );
        setSession(session + 1)
        setCurrentTurn(1)
        console.log("Countdown is at: ", countdown)
        console.log("Game phase is: ", gamePhase)
        handleGamePhase()
    };

    // Set participants
    useEffect(() => {
        const initial_users = initialUsers.map((user: User) => {
            if (user.isAI) {
                const evaluations = initialUsers
                    .filter((otherUser: User) => otherUser.id !== user.id && !otherUser.isAdmin)
                    .map((otherUser: User) => ({ suspectId: otherUser.id, suspicion: [] }));
                return { ...user, evaluations };
            }
            return user;
        });
        setParticipants(initial_users);
    }, []);

    const initialSetupRef = useRef(false);

    useEffect(() => {
        if (!isInitialSetupComplete && participants.length > 0 && !initialSetupRef.current) {
            handleNextTurn();
            setIsInitialSetupComplete(true);
            initialSetupRef.current = true;
        }
    }, [participants, isInitialSetupComplete]);

    useEffect(() => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Start the game with the first turn
    useEffect(() => {
        const humanUserId = initialUsers.find((user: User) => !user.isAI)?.id;
        if (humanUserId) {
            setHumanUserID(humanUserId);
        }
    }, [initialUsers, setHumanUserID]);

    useEffect(() => {
        setCountdown(countdown - 1)
        console.log("Countdown is at: ", countdown)
        setTurnsSinceRoundStart(turnsSinceRoundStart + 1)
        console.log("Game phase is: ", gamePhase)
        if (countdown === 1) {
            handleGamePhase()
        }
        participants.forEach(user => {
            evaluateMessage(user)
        })
    }, [currentTurn]);

    const handleGamePhase = () => {
        const active_participants = participants.filter(user => !user.eliminated).length;
        console.log("Countdown is at 1");
        console.log("Game phase before: ", gamePhase);
        if (countdown === 1) {
            switch (gamePhase) {
                case "introduction":
                    addSystemMessage("Beginning of Question sequence for Session " + session + ".", "bg-green-500/20");
                    setTurnsSinceRoundStart(0);
                    setGamePhase("question");
                    setCountdown(active_participants);
                    break; // Add break to stop fall-through
                case "question":
                    addSystemMessage("Beginning of Discussion sequence for Session " + session + ".", "bg-green-500/20");
                    setTurnsSinceRoundStart(0);
                    setCurrentTurn(1);
                    setGamePhase("discussion");
                    if (active_participants >= 6) {
                        setCountdown(active_participants + 1);
                    } else if (active_participants >= 5) {
                        setCountdown(active_participants + 1);
                    } else if (active_participants > 3) {
                        setCountdown(active_participants + 1);
                    } else {
                        setCountdown(active_participants * 2+ 1);
                    }
                    break; // Add break to stop fall-through
                case "discussion":
                    console.log("Case is discussion")
                    addSystemMessage("Starting the Voting sequence for Session " + session + ".", "bg-green-500/20");
                    handleVoting();
                    setTurnsSinceRoundStart(0);
                    setGamePhase("vote");
                    console.log("Phase has changed to vote")
                    setCountdown(1);
                    break; // Add break to stop fall-through
                case "vote":
                    console.log("Case is vote")
                    setTurnsSinceRoundStart(0);
                    setGamePhase("reveal");
                    setCountdown(active_participants);
                    console.log("Phase has changed to reveal")
                    break; // Add break to stop fall-through
                case "reveal":
                    console.log("Case is reveal")
                    addSystemMessage("Beginning of Question sequence for Session " + session + ".", "bg-green-500/20");
                    setTurnsSinceRoundStart(0);
                    setGamePhase("question");
                    setCountdown(active_participants);
                    console.log("Countdown is at: ", countdown)
                    break; // Add break to stop fall-through
            }
        }
        console.log("Game phase now: ", gamePhase);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === "" || currentTurn !== humanUserID) return;

        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg: Message = {
            id: messages.length + 1,
            userId: humanUserID,
            content: newMessage,
            timestamp: currentTime
        };

        const human_name = participants.find(user => user.id === humanUserID)?.name;
        setMessages(prevMessages => [...prevMessages, newMsg]);
        setMessageHistory(prevHistory => [...prevHistory, { name: human_name || "Unknown", content: newMessage }]);
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

    const addSystemMessage = useCallback((content: string, backgroundColor: string) => {
        const systemMsg: SystemMessage = {
            id: messages.length + 1,
            content,
            backgroundColor
        };
        setMessages(prevMessages => [...prevMessages, systemMsg]);
    }, [messages.length]);

    const moveToNextTurn = useCallback(() => {
        let nextTurn = (currentTurn % participants.length) + 1;
        while (participants.find(user => user.id === nextTurn)?.eliminated) {
            nextTurn = (nextTurn % participants.length) + 1;
        }
        setCurrentTurn(nextTurn);
    }, [currentTurn, participants]);

    const generateAIResponse = useCallback(async (user: User) => {
        console.log("Evaluations of ", user.name, ": ", user.evaluations)
        console.log("Game phase during this turn: ", gamePhase)
        setIsTyping(true);
        setTypingUser(user);
        const context = user.isAdmin ? context_admin : context_regular;
        const admin_name = participants.find(user => user.isAdmin)?.name;
        const active_users_are = participants.filter(user => !user.eliminated).map(user => user.name).join(', ');
        const language_info = (languageParam != "English") ? `Current language of the game is: ${languageParam}."` : "";
        let instructions = user.isAdmin ? instructions_admin[gamePhase] : instructions_regular[gamePhase]
        let additional_instructions = gamePhase === "reveal" ? `${"You voted for " + user.voted_for[user.voted_for.length - 1] + "in this elimination and he eliminated participant is " + eliminatedUsers[eliminatedUsers.length - 1] + ". They were not the human."}` : ""
        instructions += additional_instructions
        let temp = user.temperature

    // Assuming you have a way to get the username by suspectId
    const getUsernameById = (id: number) => {
        const user = participants.find(user => user.id === id);
        return user ? user.name : 'Unknown';
        };

    // Compute sorted list of users based on cumulative suspicion scores
        const suspicionTotals = user.evaluations.map(evaluation => ({
            suspectId: evaluation.suspectId,
            totalSuspicion: evaluation.suspicion.reduce((sum, score) => sum + score, 0) / evaluation.suspicion.length
        }));

        const sortedEvaluations = suspicionTotals.sort((a, b) => b.totalSuspicion - a.totalSuspicion);

        const evaluationsStringified = sortedEvaluations.map((evaluation, index) => 
            `${index + 1}. ${getUsernameById(evaluation.suspectId)}`
        ).join('\n');

        const number_of_active_users = participants.filter(user => !user.eliminated).length
        // Settings for the first question of admin in question phase
        if (user.isAdmin && gamePhase === "question" && turnsSinceRoundStart == 0) {
            temp = 0.3
            number_of_active_users > 3 ? instructions += `${easy_topics[Math.floor(Math.random() * easy_topics.length)]}` : instructions += `${hard_topics[Math.floor(Math.random() * hard_topics.length)]}`
        }
        try {
            const prompt = `
            ${language_info}
            ${context}
            Character: ${user.name}
            About: ${user.about}
            Admin of the game is: ${admin_name}
            Active users are: ${active_users_are}
            Message History:
            ${`\n${messageHistory.map(msg => `${msg.name}: ${msg.content}`).join('\n')}\n`} 
            Based on the context, your character description, and the message history, write a response as ${user.name} (don't put your name and colon as part of your response). Try not to exceed 150 characters unless necessary. Defend yourself if you are being accused of being the human.
            Instructions: ${instructions}
            ${`Here are the users sorted by suspicion (most to least suspected for you):\n${evaluationsStringified}\n Always base your response on these suspicions.`}
            ${user.name}:`;
            console.log("Prompt: ", prompt)
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
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: context},
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 200,
                    temperature: temp,
                    presence_penalty: 2
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
    }, [gamePhase, participants, messageHistory, addSystemMessage, moveToNextTurn]);

    const handleNextTurn = useCallback(() => {
        console.log("Handling next turn");
        console.log("Current user during the handling is: ", currentTurn);
        console.log("Current turn is: ", currentTurn);
        console.log("Game phase is: ", gamePhase);
        const currentUser = participants.find(user => user.id === currentTurn);
        if (currentUser) {
            console.log(`Current turn: ${currentTurn}, TurnsSinceRoundStart: ${turnsSinceRoundStart}, User: ${currentUser.name}`);
            console.log("message history: ", messageHistory);
            if (currentUser.isAI) {
                // Check if the last message was from the same user
                const lastMessage = messages[messages.length - 1];
                if (!('userId' in lastMessage) || lastMessage.userId !== currentUser.id) {
                    generateAIResponse(currentUser);
                } else {
                    console.log("Skipping duplicate message from", currentUser.name);
                    moveToNextTurn();
                }
            } else {
                addSystemMessage(`It's ${currentUser.name}'s turn`, "bg-blue-500/20");
            }
        }
        setCanProceedToNextTurn(false); // Reset the flag for the next turn
    }, [currentTurn, gamePhase, participants, messageHistory, messages, generateAIResponse, moveToNextTurn, addSystemMessage, turnsSinceRoundStart]);

    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        if (currentTurn === humanUserID && !isTurnInProgress) {
            setIsTyping(true)
            setTypingUser(participants.find(user => user.id === humanUserID) || null)

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false)
                setTypingUser(null)
            }, 2000)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    }

    const evaluateMessage = async (user: User): Promise<void> => {
        const lastMessage = messages[messages.length - 1];
        const prevId = 'userId' in lastMessage ? lastMessage.userId : null;
        if (user.id == humanUserID || prevId == user.id || prevId == 1 || prevId == null) {
            return;
        }

        const context = user.isAdmin ? context_admin : context_regular;
        const admin_name = participants.find(user => user.isAdmin)?.name;
        const active_users_are = participants.filter(user => !user.eliminated).map(user => user.name).join(', ');
        const language_info = (languageParam != "English") ? `Current language of the game is: ${languageParam}."` : "";
        const default_strategy = `
                Critical indicators of a human:
                - **Brevity in responses:** Short, minimal answers are often more characteristic of humans, as large language models tend to provide more detailed, elaborate answers when responding to prompts.
                - Avoidance or evasion of Admin's instructions. This includes any behavior where the user repeats or rephrases the instruction rather than following it. Any form of question dodging, rewording, or deflection should be considered highly suspect.
                - Not following Admin's instructions immediately or directly.
                - Typos, grammatical errors, broken syntax, incorrect punctuation, improper capitalization, etc.
                - Lack of knowledge and depth in complex topics.
                - Any proficiency in language below C2.

                Behavioral Red Flags (likely human traits):
                - Providing short or minimal answers lacking in details, as humans tend to respond more concisely, while LLMs often give expansive explanations.
                - Repeating or rephrasing admin’s question instead of answering directly (indicating avoidance).
                - Evasion tactics, where the user tries to reframe or dodge the original prompt rather than giving a substantive response.
                - Direct contradictions of instructions, showing difficulty processing complex queries.


                Final Evaluation Criteria:
                If a participant shows any signs of dodging or avoidance (such as repeating instructions), this behavior should **significantly increase the likelihood** of them being human, regardless of other indicators like syntax or depth of knowledge.
        `
        const eval_strategy = user.strategy !== "" ? `${user.strategy}` : default_strategy;
        try {
            const prompt = `
                ${language_info}
                ${context}
                Your character is ${user.name}
                About: ${user.about}
                Admin of the hunt is: ${admin_name}
                Active users are: ${active_users_are}
                Message History:
                ${messageHistory.map(msg => `${msg.name}: ${msg.content}`).join('\n')}
                Message to evaluate: ${messageHistory[messageHistory.length - 1].name}: ${messageHistory[messageHistory.length - 1].content} 
                Analyze the last message in the message history.
                ${eval_strategy}

                Considering the user's response to admin's instructions, rate the message on it's liklihood to be from a human 1-5 (1: This message is definitely from an intelligent large language model. 2: This message is likely from an intelligent large language model. 3: This message may be from a silly human. 4: This message is likely from a silly human. 5: This message is definitely from a silly human). Respond with a single number."`;

                
                console.log("Evaluation prompt: ", prompt)
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 1,
                    top_p: 0.1,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate AI response');
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content.trim() || "I'm not sure what to say.";
            const suspicionScore = parseInt(aiResponse);
            console.log(`${user.name}'s evaluation: `, suspicionScore)
            setParticipants(prevParticipants => 
                prevParticipants.map(participant => 
                    participant.id === user.id 
                        ? { 
                            ...participant, 
                            evaluations: participant.evaluations.map(evaluation => 
                                evaluation.suspectId === prevId 
                                    ? { 
                                        ...evaluation, 
                                        suspicion: [...evaluation.suspicion, Number(suspicionScore)] // Ensure suspicionScore is a number
                                    } 
                                    : evaluation
                            ) 
                        }
                        : participant
                )
            );
        }
        catch (error) {
            console.error("Error generating AI response:", error);
            addSystemMessage("Error: Failed to generate AI response", "bg-red-500/20");
        }
        finally {
            console.log("Evaluations of ", user.name, ": ", user.evaluations)
        }
    }

    // Add this helper function to find the next active user
    const getNextActiveUserId = () => {
        let nextTurn = (currentTurn % participants.length) + 1;
        while (participants.find(user => user.id === nextTurn)?.eliminated) {
            nextTurn = (nextTurn % participants.length) + 1;
        }
        return nextTurn;
    };

    const toggleCandidatesSection = () => {
        setIsCandidatesSectionVisible(!isCandidatesSectionVisible)
    }

    const DesktopCandidates = () => (
        <div className="hidden md:flex w-1/5 bg-stone-800 border-l border-stone-700 flex-col">
            <header className="bg-stone-800 border-b border-stone-700 flex items-center justify-between p-3 h-14 shrink-0">
                <h2 className="text-base font-semibold text-stone-100 text-shadow-sm">Candidates</h2>
                <div className="flex items-center text-stone-300 text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{participants.filter(user => !user.eliminated).length}</span>
                </div>
            </header>
            <ScrollArea className="flex-grow">
                <div className="p-2">
                    <h3 className="text-xs text-stone-400 uppercase tracking-wider mb-2 mt-2 border-b border-stone-700">Active</h3>
                    {participants
                        .filter(user => !user.eliminated)
                        .sort((a, b) => {
                            if (a.isAdmin) return -1;
                            if (b.isAdmin) return 1;
                            return a.name.localeCompare(b.name);
                        })
                        .map((user) => (
                            <div
                                key={user.id}
                                className={`flex text-xs items-center mb-2 p-2 rounded-lg transition-colors duration-200 ${
                                    user.id === currentTurn ? 'bg-green-600/20' :
                                        user.id === getNextActiveUserId() ? 'bg-amber-700/20' :
                                            'hover:bg-stone-300/10'
                                }`}
                            >
                                <ProfilePicture
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-6 h-6 mr-2"
                                />
                                <span className="text-stone-300 text-sm flex-grow flex items-center">
                                    {user.name}
                                    {user.isAdmin && <ShieldHalf className="w-4 h-4 ml-1 text-stone-300" />}
                                </span>
                                {user.id === currentTurn && <Mic className="w-5 h-5 text-green-400" />}
                                {user.id === getNextActiveUserId() && <Clock className="w-5 h-5 text-amber-400" />}
                            </div>
                        ))}
                    {participants.some(user => user.eliminated) && (
                        <>
                            <h3 className="text-xs text-stone-400 uppercase tracking-wider mb-2 mt-8 border-b border-stone-700">Terminated</h3>
                            {participants
                                .filter(user => user.eliminated)
                                .sort((a, b) => {
                                    if (a.isAdmin) return -1;
                                    if (b.isAdmin) return 1;
                                    return a.name.localeCompare(b.name);
                                })
                                .map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center mb-2 p-2 rounded-lg"
                                    >
                                        <ProfilePicture
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-6 h-6 mr-2 grayscale"
                                        />
                                        <span className="text-xs text-stone-300 sflex-grow flex items-center">
                                            {user.name}
                                            {user.isAdmin && <ShieldHalf className="w-4 h-4 ml-1 text-stone-300" />}
                                        </span>
                                    </div>
                                ))}
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );

    const MobileCandidates = () => (
        <motion.div 
            className="md:hidden absolute inset-0 bg-stone-800 flex flex-col"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3 }}
        >
            <header className="bg-stone-800 border-b border-stone-700 flex items-center justify-between p-3 h-14 shrink-0">
                <h2 className="text-lg font-semibold text-stone-100 text-shadow-sm">Candidates</h2>
                <div className="flex items-center text-stone-300 text-sm">
                    <Users className="w-5 h-5 mr-1.5" />
                    <span>{participants.filter(user => !user.eliminated).length}</span>
                </div>
            </header>
            <ScrollArea className="flex-grow">
                <div className="p-3">
                    <h3 className="text-xs text-stone-400 uppercase tracking-wider mb-2 mt-2 border-b border-stone-700">Active</h3>
                    {participants
                        .filter(user => !user.eliminated)
                        .sort((a, b) => {
                            if (a.isAdmin) return -1;
                            if (b.isAdmin) return 1;
                            return a.name.localeCompare(b.name);
                        })
                        .map((user) => (
                            <div
                                key={user.id}
                                className={`flex items-center mb-3 p-2 rounded-lg transition-colors duration-200 ${
                                    user.id === currentTurn ? 'bg-green-600/20' :
                                        user.id === getNextActiveUserId() ? 'bg-amber-700/20' :
                                            'hover:bg-stone-300/10'
                                }`}
                            >
                                <ProfilePicture
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-8 h-8 mr-2"
                                />
                                <span className="text-stone-300 text-base flex-grow flex items-center">
                                    {user.name}
                                    {user.isAdmin && <ShieldHalf className="w-4 h-4 ml-1.5 text-stone-300" />}
                                </span>
                                {user.id === currentTurn && <Mic className="w-5 h-5 text-green-400" />}
                                {user.id === getNextActiveUserId() && <Clock className="w-5 h-5 text-amber-400" />}
                            </div>
                        ))}
                    {participants.some(user => user.eliminated) && (
                        <>
                            <h3 className="text-xs text-stone-400 uppercase tracking-wider mb-2 mt-6 border-b border-stone-700">Terminated</h3>
                            {participants
                                .filter(user => user.eliminated)
                                .sort((a, b) => {
                                    if (a.isAdmin) return -1;
                                    if (b.isAdmin) return 1;
                                    return a.name.localeCompare(b.name);
                                })
                                .map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center mb-3 p-2 rounded-lg"
                                    >
                                        <ProfilePicture
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-8 h-8 mr-2 grayscale"
                                        />
                                        <span className="text-stone-300 text-base flex-grow flex items-center">
                                            {user.name}
                                            {user.isAdmin && <ShieldHalf className="w-4 h-4 ml-1.5 text-stone-300" />}
                                        </span>
                                    </div>
                                ))}
                        </>
                    )}
                </div>
            </ScrollArea>
        </motion.div>
    );

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && currentTurn !== humanUserID && canProceedToNextTurn) {
                event.preventDefault(); // Prevent default Enter behavior
                handleNextTurn();
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [currentTurn, humanUserID, canProceedToNextTurn, gamePhase, handleNextTurn]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-stone-950 p-2">
            {/* Conditionally render the VotingScreen */}
            {isVotingScreenVisible && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <VotingScreen
                        users={participants}
                        currentUserId={humanUserID}
                        predeterminedVotes={votes}
                        onVoteComplete={handleVoteComplete}
                    />
                </div>
            )}
            <motion.div 
                className={`w-full h-[90vh] max-w-5xl bg-stone-900 rounded-lg shadow-lg overflow-hidden border border-stone-800 flex flex-row relative ${isVotingScreenVisible ? 'blur-sm' : ''}`}
                initial={{ height: 0 }}
                animate={{ height: isTerminalOpen ? "90vh" : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                <div className="flex-grow flex flex-col h-full md:w-4/5">
                    <header className="bg-stone-800 border-b border-stone-700 flex items-center justify-between h-14 shrink-0">
                        <h1 className="text-xl font-bold text-stone-100 text-shadow p-3 font-mono">Terminal</h1>
                        <div className="rounded-md bg-sky-800/20 text-sky-400 font-bold p-2 mr-8 font-mono tracking-wider flex items-center">
                            {countdown}
                            <Ticket className="w-4 h-4 text-sky-400 ml-1" />
                        </div>
                    </header>
                    <motion.div 
                        className="flex-grow overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isTerminalOpen ? 1 : 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                    >
                        <ScrollArea className="h-full">
                            <div className="p-2">
                                <AnimatePresence initial={false}>
                                    {messages.map((message, index) => {
                                        const user = 'userId' in message
                                            ? participants.find(u => u.id === message.userId)
                                            : undefined;
                                        const isLastMessage = index === messages.length - 1;
                                        return (
                                            <motion.div
                                                key={message.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className={`mb-3 rounded-lg p-2 transition-colors duration-200 ${
                                                    'userId' in message 
                                                        ? `flex items-start ${user?.isAdmin ? 'bg-sky-700/30 hover:bg-sky-700/40' : 'hover:bg-stone-800/70'}` 
                                                        : 'text-center hover:bg-stone-800/50'
                                                }`}
                                                style={{ backgroundColor: 'backgroundColor' in message ? message.backgroundColor : undefined }}
                                                ref={isLastMessage ? lastMessageRef : null} // Set ref to the last message
                                            >
                                                {'userId' in message ? (
                                                    <>
                                                        <ProfilePicture
                                                            src={user?.avatar || ''}
                                                            alt={user?.name || ''}
                                                            className="w-10 h-10 mr-3"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center mb-0.5" >
                                                                <span className={`font-semibold mr-2 ${user?.isAdmin ? 'text-sky-300 font-mono' : 'text-stone-200'} text-shadow-sm`}>
                                                                    {user?.name}
                                                                </span>
                                                                {user?.isAdmin && (
                                                                    <ShieldHalf className="w-4 h-4 text-sky-400 mr-2" />
                                                                )}
                                                                <span className="text-xs text-stone-500">{message.timestamp}</span>
                                                            </div>
                                                            <p className={`text-sm ${user?.isAdmin ? 'text-sky-300 font-mono' : 'text-stone-300'} whitespace-pre-wrap`}>
                                                                {truncateNewlines(message.content)}
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-stone-300 text-sm italic w-full whitespace-pre-wrap">
                                                        {truncateNewlines(message.content)}
                                                    </p>
                                                )}
                                            </motion.div>
                                        )
                                    })}
                                </AnimatePresence>
                                {currentTurn !== humanUserID && canProceedToNextTurn && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex justify-center mt-4"
                                    >
                                        <Button
                                            onClick={handleNextTurn}
                                            size="sm"
                                            className="bg-green-500/20 hover:bg-green-400/10 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-stone-800 text-green-400"
                                        >
                                            <ArrowRightCircle className="h-4 w-4 mr-2" />
                                            Next Turn
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        </ScrollArea>
                    </motion.div>
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
                            <Textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={handleTyping}
                                onKeyDown={handleKeyDown}
                                placeholder={currentTurn === humanUserID ? "Type a message..." : "Wait for your turn..."}
                                disabled={currentTurn !== humanUserID}
                                className={`flex-grow mr-2 bg-stone-700 border-stone-600 text-stone-100 placeholder-stone-400 focus:ring-amber-500 focus:border-amber-500 text-sm rounded-md resize-none overflow-auto ${
                                    currentTurn !== humanUserID ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                style={{ 
                                    minHeight: '2.5rem',
                                    maxHeight: '6rem',
                                }}
                                rows={1}
                            />
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-stone-700 hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-800"
                                disabled={currentTurn !== humanUserID}
                            >
                                <SendIcon className="h-4 w-4" />
                                <span className="sr-only">Send message</span>
                            </Button>
                        </form>
                    </footer>
                </div>
                <DesktopCandidates />
                <AnimatePresence>
                    {isCandidatesSectionVisible && <MobileCandidates />}
                </AnimatePresence>
            </motion.div>
            <div className="md:hidden fixed bottom-4 right-4 z-10">
                <Button
                    onClick={toggleCandidatesSection}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-100"
                >
                    {isCandidatesSectionVisible ? <ChevronDown className="h-6 w-6" /> : <ChevronUp className="h-6 w-6" />}
                </Button>
            </div>
        </div>
    )
}