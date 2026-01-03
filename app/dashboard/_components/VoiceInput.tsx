'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onParse?: (parsed: ParsedVoiceData) => void
  type: 'expense' | 'income'
}

export interface ParsedVoiceData {
  name?: string
  amount?: number
  date?: string
  tag?: string
  category?: string
}

function VoiceInput({ onTranscript, onParse, type }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Check if browser supports Speech Recognition
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setIsSupported(false)
        toast.error('Voice input requires HTTPS. Please use a secure connection.')
        return
      }

      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
        toast.info('Listening... Speak now')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcriptText = event.results[0][0].transcript
        setTranscript(transcriptText)
        onTranscript(transcriptText)
        
        // Parse the transcript
        const parsed = parseVoiceInput(transcriptText, type)
        if (onParse) {
          onParse(parsed)
        }
        
        toast.success('Voice input captured!')
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.')
        } else if (event.error === 'not-allowed') {
          toast.error(
            'Microphone permission denied. Please click the microphone icon in your browser\'s address bar and allow access, or check your browser settings.',
            { duration: 5000 }
          )
        } else if (event.error === 'aborted') {
          // User stopped it, no need to show error
        } else {
          toast.error(`Speech recognition error: ${event.error}. Please try again.`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript, onParse, type])

  const startListening = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      toast.error('Voice input is not available in this environment.')
      return
    }

    if (recognitionRef.current && !isListening) {
      try {
        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (permissionError: any) {
          if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
            toast.error(
              'Microphone permission is required. Please:\n1. Click the lock/microphone icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page and try again',
              { duration: 6000 }
            )
            return
          } else if (permissionError.name === 'NotFoundError') {
            toast.error('No microphone found. Please connect a microphone and try again.')
            return
          }
        }

        recognitionRef.current.start()
      } catch (error: any) {
        console.error('Error starting recognition:', error)
        if (error.name === 'NotAllowedError' || error.message?.includes('not-allowed')) {
          toast.error(
            'Microphone permission denied. Please allow microphone access in your browser settings and try again.',
            { duration: 5000 }
          )
        } else {
          toast.error('Failed to start voice recognition. Please try again.')
        }
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const parseVoiceInput = (text: string, type: 'expense' | 'income'): ParsedVoiceData => {
    const parsed: ParsedVoiceData = {}
    const lowerText = text.toLowerCase()

    // Extract amount (look for numbers followed by dollar, dollars, or just numbers)
    // Handle patterns like "50 dollars", "fifty dollars", "$50", "50.99"
    const amountMatch = text.match(/\$(\d+(?:\.\d{2})?)/i) ||
                       text.match(/(\d+(?:\.\d{2})?)\s*(?:dollars?|dollar|bucks?|usd)/i) ||
                       text.match(/(?:dollars?|dollar|bucks?|usd)\s*(\d+(?:\.\d{2})?)/i) ||
                       text.match(/(\d+(?:\.\d{2})?)/)
    
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1])
      if (!isNaN(amount) && amount > 0) {
        parsed.amount = amount
      }
    }

    // Handle written numbers (e.g., "fifty", "one hundred")
    const writtenNumbers: { [key: string]: number } = {
      'fifty': 50, 'fifteen': 15, 'twenty': 20, 'thirty': 30, 'forty': 40,
      'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
      'one hundred': 100, 'two hundred': 200, 'three hundred': 300,
      'four hundred': 400, 'five hundred': 500, 'six hundred': 600,
      'seven hundred': 700, 'eight hundred': 800, 'nine hundred': 900,
      'one thousand': 1000, 'two thousand': 2000, 'three thousand': 3000,
      'four thousand': 4000, 'five thousand': 5000
    }
    
    if (!parsed.amount) {
      for (const [word, value] of Object.entries(writtenNumbers)) {
        if (lowerText.includes(word)) {
          parsed.amount = value
          break
        }
      }
    }

    // Extract date (look for "today", "yesterday", or date patterns)
    if (lowerText.includes('today')) {
      const today = new Date()
      parsed.date = today.toISOString().split('T')[0]
    } else if (lowerText.includes('yesterday')) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      parsed.date = yesterday.toISOString().split('T')[0]
    } else {
      // Try to extract date patterns like "January 15" or "01/15"
      const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4})?)?/)
      if (dateMatch) {
        const month = parseInt(dateMatch[1])
        const day = parseInt(dateMatch[2])
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear()
        const date = new Date(year, month - 1, day)
        parsed.date = date.toISOString().split('T')[0]
      }
    }

    // Remove amount and date from text to get the name
    let nameText = text
      .replace(/\$?\d+(?:\.\d{2})?\s*(?:dollars?|dollar|bucks?|usd)?/gi, '')
      .replace(/today|yesterday|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/gi, '')
      .replace(/for\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Common expense/income keywords to remove
    const keywordsToRemove = [
      'add', 'expense', 'income', 'spent', 'paid', 'received', 'earned',
      'on', 'the', 'a', 'an', 'is', 'was', 'at', 'to', 'from'
    ]
    
    keywordsToRemove.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      nameText = nameText.replace(regex, '')
    })

    nameText = nameText.trim()
    if (nameText) {
      parsed.name = nameText
    }

    // For expenses, try to extract tag/category
    if (type === 'expense') {
      const commonTags = ['groceries', 'food', 'gas', 'fuel', 'restaurant', 'shopping', 
                         'utilities', 'rent', 'bills', 'entertainment', 'transport', 
                         'health', 'medical', 'education', 'clothing']
      for (const tag of commonTags) {
        if (lowerText.includes(tag)) {
          parsed.tag = tag
          break
        }
      }
    }

    // For incomes, try to extract category
    if (type === 'income') {
      const categories = ['salary', 'rental', 'investments', 'freelance', 'gifts', 'other']
      for (const cat of categories) {
        if (lowerText.includes(cat)) {
          parsed.category = cat.charAt(0).toUpperCase() + cat.slice(1)
          break
        }
      }
    }

    return parsed
  }

  if (!isSupported) {
    return (
      <div className='text-xs text-muted-foreground'>
        Voice input not supported in this browser. Please use Chrome, Edge, or Safari.
        {typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && (
          <div className='mt-1 text-red-500'>
            Note: Voice input requires HTTPS connection.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant={isListening ? 'destructive' : 'outline'}
          size='sm'
          onClick={isListening ? stopListening : startListening}
          className='flex items-center gap-2'
        >
          {isListening ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Mic className='h-4 w-4' />
              <span>Voice Input</span>
            </>
          )}
        </Button>
        {transcript && (
          <Badge variant='outline' className='text-xs max-w-xs truncate'>
            {transcript}
          </Badge>
        )}
      </div>
      {isListening && (
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse' />
          <span>Listening...</span>
        </div>
      )}
    </div>
  )
}

export default VoiceInput

