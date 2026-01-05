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

    // Detect mobile browser
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

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

      // iOS Safari has limited support - show warning
      if (isIOS && isSafari) {
        console.warn('iOS Safari has limited Web Speech API support. Consider using Chrome on iOS for better results.')
      }

      setIsSupported(true)
      const recognition = new SpeechRecognition()
      
      // Mobile browsers may need different settings
      if (isMobile) {
        recognition.continuous = false
        recognition.interimResults = false
        // Some mobile browsers work better with shorter timeouts
        recognition.maxAlternatives = 1
      } else {
        recognition.continuous = false
        recognition.interimResults = false
      }
      
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
        setParsedData(null)
        setError(null)
        toast.info('Listening... Speak now')
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (event.results && event.results.length > 0 && event.results[0].length > 0) {
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
        } else {
          toast.error('No speech detected. Please try again.')
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        const errorMessage = `Error: ${event.error}${event.message ? ` - ${event.message}` : ''}`
        setError(errorMessage)
        
        if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.')
        } else if (event.error === 'not-allowed') {
          const msg = isMobile 
            ? 'Microphone permission denied. Please:\n1. Go to your browser settings\n2. Allow microphone access for this site\n3. Refresh and try again'
            : 'Microphone permission denied. Please click the microphone icon in your browser\'s address bar and allow access, or check your browser settings.'
          setError(msg)
          toast.error(msg, { duration: 6000 })
        } else if (event.error === 'aborted') {
          // User stopped it, no need to show error
          setError(null)
        } else if (event.error === 'network') {
          const msg = 'Network error. Please check your internet connection and try again.'
          setError(msg)
          toast.error(msg)
        } else if (event.error === 'service-not-allowed') {
          const msg = isMobile
            ? 'Speech recognition service not available. Please try using Chrome browser on mobile for better support.'
            : 'Speech recognition service not available. Please try again.'
          setError(msg)
          toast.error(msg, { duration: 5000 })
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
      if (isMobile) {
        console.warn('Web Speech API not supported on this mobile browser. Try Chrome or Edge on mobile.')
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [onTranscript, onParse, type])

  const startListening = async () => {
    if (typeof window === 'undefined') {
      const msg = 'Voice input is not available in this environment.'
      setError(msg)
      toast.error(msg)
      return
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (recognitionRef.current && !isListening) {
      try {
        setError(null)
        
        // Request microphone permission first (especially important for mobile)
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            // On mobile, this is crucial for getting permissions
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            // Stop the stream immediately - we just needed permission
            stream.getTracks().forEach(track => track.stop())
          } catch (permissionError: any) {
            const errorMsg = `Permission Error: ${permissionError.name} - ${permissionError.message || 'Microphone access denied'}`
            setError(errorMsg)
            
            if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
              const msg = isMobile
                ? 'Microphone permission is required. Please:\n1. Tap the lock/microphone icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page and try again\n\nNote: On iOS Safari, voice input may have limited support. Try Chrome on mobile for better results.'
                : 'Microphone permission is required. Please:\n1. Click the lock/microphone icon in your browser address bar\n2. Allow microphone access\n3. Refresh the page and try again'
              setError(msg)
              toast.error(msg, { duration: 7000 })
              return
            } else if (permissionError.name === 'NotFoundError') {
              const msg = 'No microphone found. Please connect a microphone and try again.'
              setError(msg)
              toast.error(msg)
              return
            } else if (permissionError.name === 'NotReadableError' || permissionError.name === 'TrackStartError') {
              const msg = 'Microphone is being used by another application. Please close other apps using the microphone and try again.'
              setError(msg)
              toast.error(msg, { duration: 5000 })
              return
            }
          }
        } else {
          // Fallback for browsers without getUserMedia
          console.warn('getUserMedia not available, proceeding without explicit permission check')
        }

        // Small delay for mobile browsers to ensure permissions are set
        if (isMobile) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        recognitionRef.current.start()
      } catch (error: any) {
        console.error('Error starting recognition:', error)
        const errorMsg = `Start Error: ${error.name || 'Unknown'} - ${error.message || 'Failed to start voice recognition'}`
        setError(errorMsg)
        
        if (error.name === 'NotAllowedError' || error.message?.includes('not-allowed')) {
          const msg = isMobile
            ? 'Microphone permission denied. Please allow microphone access in your browser settings and try again. On iOS, try using Chrome for better support.'
            : 'Microphone permission denied. Please allow microphone access in your browser settings and try again.'
          setError(msg)
          toast.error(msg, { duration: 6000 })
        } else if (error.message?.includes('already started')) {
          // Recognition already started, just update state
          setIsListening(true)
        } else {
          const msg = isMobile
            ? 'Failed to start voice recognition. On mobile, try using Chrome browser for better support.'
            : 'Failed to start voice recognition. Please try again.'
          toast.error(msg, { duration: 5000 })
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
    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    return (
      <div className='text-xs text-muted-foreground'>
        Voice input not supported in this browser. 
        {isMobile ? (
          <div className='mt-1'>
            Please use <strong>Chrome</strong> or <strong>Edge</strong> on mobile for best results.
            <div className='mt-1 text-amber-600'>
              Note: iOS Safari has limited Web Speech API support.
            </div>
          </div>
        ) : (
          <div className='mt-1'>Please use Chrome, Edge, or Safari.</div>
        )}
        {typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && (
          <div className='mt-1 text-red-500'>
            Note: Voice input requires HTTPS connection.
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant={isListening ? 'destructive' : 'default'}
          size='sm'
          onClick={isListening ? stopListening : startListening}
          className='flex items-center gap-2 w-full'
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
        <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm'>
          <div className='font-semibold text-xs text-blue-700 mb-1'>Transcript:</div>
          <div className='text-xs text-blue-600'>{transcript}</div>
        </div>
      )}

      {/* Parsed Data Display */}
      {parsedData && (parsedData.name || parsedData.amount || parsedData.date) && (
        <div className='mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm'>
          <div className='font-semibold text-xs text-green-700 mb-1'>Parsed Data:</div>
          <div className='text-xs text-green-600 space-y-1'>
            {parsedData.name && <div>Name: {parsedData.name}</div>}
            {parsedData.amount && <div>Amount: ${parsedData.amount}</div>}
            {parsedData.date && <div>Date: {parsedData.date}</div>}
            {parsedData.tag && <div>Tag: {parsedData.tag}</div>}
            {parsedData.category && <div>Category: {parsedData.category}</div>}
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

