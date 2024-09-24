import React from "react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

interface ProfilePictureProps {
  src: string
  alt: string
  className?: string
}

export function ProfilePicture({ src, alt, className = "" }: ProfilePictureProps) {
  return (
    <HoverCard openDelay={20} closeDelay={20}>
      <HoverCardTrigger asChild>
        <img
          src={src}
          alt={alt}
          className={`rounded-full object-cover ${className}`}
        />
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-32 p-0 bg-stone-800 border-stone-700 border-2 shadow-lg"
        sideOffset={5}
        side="top"
        align="center"
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-32 object-cover rounded-md"
        />
      </HoverCardContent>
    </HoverCard>
  )
}