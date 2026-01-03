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
  const [parsedData, setParsedData] = useState<ParsedVoiceData | null>(null)
  const [error, setError] = useState<string | null>(null)
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
        setParsedData(null)
        setError(null)
        toast.info('Listening... Speak now')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcriptText = event.results[0][0].transcript
        setTranscript(transcriptText)
        setError(null)
        onTranscript(transcriptText)
        
        // Parse the transcript
        const parsed = parseVoiceInput(transcriptText, type)
        setParsedData(parsed)
        
        if (onParse) {
          onParse(parsed)
        }
        
        toast.success('Voice input captured!')
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        const errorMessage = `Error: ${event.error}${event.message ? ` - ${event.message}` : ''}`
        setError(errorMessage)
        
        if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.')
        } else if (event.error === 'not-allowed') {
          const msg = 'Microphone permission denied. Please click the microphone icon in your browser\'s address bar and allow access, or check your browser settings.'
          setError(msg)
          toast.error(msg, { duration: 5000 })
        } else if (event.error === 'aborted') {
          // User stopped it, no need to show error
          setError(null)
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
      const msg = 'Voice input is not available in this environment.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (recognitionRef.current && !isListening) {
      try {
        setError(null)
        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (permissionError: any) {
          const errorMsg = `Permission Error: ${permissionError.name} - ${permissionError.message || 'Microphone access denied'}`
          setError(errorMsg)
          
          if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
            const msg = 'Microphone permission is required. Please:\n1. Click the lock/microphone icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page and try again'
            setError(msg)
            toast.error(msg, { duration: 6000 })
            return
          } else if (permissionError.name === 'NotFoundError') {
            const msg = 'No microphone found. Please connect a microphone and try again.'
            setError(msg)
            toast.error(msg)
            return
          }
        }

        recognitionRef.current.start()
      } catch (error: any) {
        console.error('Error starting recognition:', error)
        const errorMsg = `Start Error: ${error.name || 'Unknown'} - ${error.message || 'Failed to start voice recognition'}`
        setError(errorMsg)
        
        if (error.name === 'NotAllowedError' || error.message?.includes('not-allowed')) {
          const msg = 'Microphone permission denied. Please allow microphone access in your browser settings and try again.'
          setError(msg)
          toast.error(msg, { duration: 5000 })
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
    <div className='flex flex-col gap-2 p-3 border rounded-lg bg-slate-50'>
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
        {isListening && (
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse' />
            <span>Listening...</span>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className='mt-2 p-2 bg-white border rounded text-sm'>
          <div className='font-semibold text-xs text-muted-foreground mb-1'>Transcript:</div>
          <div className='text-sm'>{transcript}</div>
        </div>
      )}

      {/* Parsed Data Display */}
      {parsedData && (
        <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm'>
          <div className='font-semibold text-xs text-blue-700 mb-2'>Parsed Data:</div>
          <div className='space-y-1 text-xs'>
            {parsedData.name && (
              <div><span className='font-medium'>Name:</span> {parsedData.name}</div>
            )}
            {parsedData.amount && (
              <div><span className='font-medium'>Amount:</span> ${parsedData.amount}</div>
            )}
            {parsedData.date && (
              <div><span className='font-medium'>Date:</span> {parsedData.date}</div>
            )}
            {parsedData.tag && (
              <div><span className='font-medium'>Tag:</span> {parsedData.tag}</div>
            )}
            {parsedData.category && (
              <div><span className='font-medium'>Category:</span> {parsedData.category}</div>
            )}
            {!parsedData.name && !parsedData.amount && !parsedData.date && !parsedData.tag && !parsedData.category && (
              <div className='text-muted-foreground italic'>No data extracted from transcript</div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm'>
          <div className='font-semibold text-xs text-red-700 mb-1'>Error:</div>
          <div className='text-xs text-red-600 whitespace-pre-wrap'>{error}</div>
        </div>
      )}
    </div>
  )
}

export default VoiceInput

