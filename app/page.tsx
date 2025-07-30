"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Volume2, MapPin, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PronunciationGuide } from "@/components/pronunciation-guide"

interface DialogueStep {
  id: number
  speaker: "lenoir" | "kouassi" | "user"
  text: string
  audioFile?: string
  userPrompt?: string
  fallbackText?: string
  fallbackAudio?: string
}

const dialogueSteps: DialogueStep[] = [
  {
    id: 1,
    speaker: "lenoir",
    text: "Très bien, we're on Ghanaian soil, Agent Touré. But now we need to find the airport exit, la sortie. Hey, voilà! That's Kouassi, who sat next to us on the plane in aisle C. Let's ask him where the exit is. Say to him: 'Excusez-moi, je cherche la sortie.'",
    audioFile: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lenoir%20Line%201-ie4rCbCKrBo8UFDTCNcaG0i76mYzqF.mp3",
  },
  {
    id: 2,
    speaker: "user",
    text: "Ask Kouassi where the exit is:",
    userPrompt: "Excusez-moi, je cherche la sortie.",
    fallbackText: "Vous attendez quoi? What are you waiting for, Touré? Ask Kouassi where the exit is!",
    fallbackAudio: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lenoir%20Line%202-cnkpjjbakQXOpmqfJplir4KIGK38nW.mp3",
  },
  {
    id: 3,
    speaker: "kouassi",
    text: "Oh, c'est Touré! Vous cherchez la sortie? Viens, je t'y conduis.",
    audioFile: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Kouassi%20Line%201-Q3aH0V9uAB7Cy1jcvMykrmUEZx47Mz.mp3",
  },
  {
    id: 4,
    speaker: "lenoir",
    text: "Parfait. He's taking us to the exit. Hmm… he seems young, almost like a student. Ask him if he's also going to the University of Ghana at Legon. Remember: 'Est-ce que vous allez aussi à UG Legon ?' Allez-y.",
    audioFile: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lenoir%20Line%203-ZEYY754ZIfDo5IQNg6kHR0qm1u542u.mp3",
  },
  {
    id: 5,
    speaker: "user",
    text: "Ask if Kouassi is going to UG Legon too:",
    userPrompt: "Est-ce que vous allez aussi à UG Legon ?",
    fallbackText: "Ce n'est pas compliqué, Touré. Ask if he's going to UG Legon!",
    fallbackAudio: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lenoir%20Line%204-QzuMwDyRO0vyahPVI5WoRjZYUeFcbG.mp3",
  },
  {
    id: 6,
    speaker: "kouassi",
    text: "Oui, je vais à UG. Je suis étudiant là-bas, étudiant de droit, de troisième année. Toi aussi, non? T'inquiète, je vais te faire voir le campus.",
    audioFile: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Kouassi%20Line%202-OqehkGP0buOdLzyBE2e6oi3tbfwbE8.mp3",
  },
  {
    id: 7,
    speaker: "lenoir",
    text: "Fantastique. A guide on campus—perfect for our mission. Thank him with: 'Merci beaucoup, c'est ma première fois au Ghana.'",
    audioFile: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lenoir%20Line%205-1ThUk6t0nWUUaibuez5xW7uY4sD3mG.mp3",
  },
  {
    id: 8,
    speaker: "user",
    text: "Thank him:",
    userPrompt: "Merci beaucoup, c'est ma première fois au Ghana.",
    fallbackText: "Pas le moment de rester muet, agent. Thank him!",
    fallbackAudio: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Lenoir%20Line%206-WMtDn6pKv5FlQ4peMTb1WJUJtxzOwO.mp3",
  },
  {
    id: 9,
    speaker: "kouassi",
    text: "Pas de problème! Maintenant, commandons un Bolt, je crois que j'ai encore une réduction dont je n'ai pas encore profité.",
    audioFile: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Kouassi%20Line%203-tiZ9yWSEf8PzJ8aJVfFxvYolsZn1Is.mp3",
  },
]

const pronunciationGuides = {
  "Excusez-moi, je cherche la sortie.": {
    phonetic: "eks-kü-ZAY mwah, zhuh SHERSH lah sor-TEE",
    translation: "Excuse me, I'm looking for the exit.",
    audioFile: "/audio/pronunciation/excusez-moi-sortie.mp3",
  },
  "Est-ce que vous allez aussi à UG Legon ?": {
    phonetic: "es-kuh voo zah-LAY oh-SEE ah ü-zhay luh-GOHN",
    translation: "Are you also going to UG Legon?",
    audioFile: "/audio/pronunciation/ug-legon-question.mp3",
  },
  "Merci beaucoup, c'est ma première fois au Ghana.": {
    phonetic: "mer-SEE boh-KOO, say mah pruh-mee-YAIR fwah oh gah-NAH",
    translation: "Thank you very much, it's my first time in Ghana.",
    audioFile: "/audio/pronunciation/merci-premiere-fois.mp3",
  },
}

export default function SeyGeReflexApp() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTimer, setRecordingTimer] = useState(0)
  const [showFallback, setShowFallback] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioPermission, setAudioPermission] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [currentAudioSpeaker, setCurrentAudioSpeaker] = useState<"lenoir" | "kouassi" | null>(null)
  const [audioLoadingPromise, setAudioLoadingPromise] = useState<Promise<void> | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Request microphone permission
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setAudioPermission(true))
      .catch(console.error)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const stopCurrentAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlayingAudio(false)
      setCurrentAudioSpeaker(null)
    }
  }

  const playAudio = async (audioFile: string, speaker?: "lenoir" | "kouassi") => {
    if (!audioRef.current) return

    try {
      // Stop any currently playing audio
      stopCurrentAudio()

      // Wait for any pending audio loading to complete
      if (audioLoadingPromise) {
        await audioLoadingPromise
      }

      // Create a new loading promise
      const loadingPromise = new Promise<void>((resolve, reject) => {
        if (!audioRef.current) {
          reject(new Error("Audio element not available"))
          return
        }

        const audio = audioRef.current

        // Set up event listeners
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay)
          audio.removeEventListener("error", onError)
          resolve()
        }

        const onError = (e: Event) => {
          audio.removeEventListener("canplay", onCanPlay)
          audio.removeEventListener("error", onError)
          reject(new Error("Failed to load audio"))
        }

        audio.addEventListener("canplay", onCanPlay)
        audio.addEventListener("error", onError)

        // Load the audio file
        audio.src = audioFile
        audio.load()
      })

      setAudioLoadingPromise(loadingPromise)

      // Wait for audio to be ready
      await loadingPromise

      if (!audioRef.current) return

      // Set up playback event listeners
      setIsPlayingAudio(true)
      setCurrentAudioSpeaker(speaker || null)

      const onEnded = () => {
        setIsPlayingAudio(false)
        setCurrentAudioSpeaker(null)
        if (audioRef.current) {
          audioRef.current.removeEventListener("ended", onEnded)
          audioRef.current.removeEventListener("error", onPlayError)
        }
      }

      const onPlayError = () => {
        setIsPlayingAudio(false)
        setCurrentAudioSpeaker(null)
        if (audioRef.current) {
          audioRef.current.removeEventListener("ended", onEnded)
          audioRef.current.removeEventListener("error", onPlayError)
        }
      }

      audioRef.current.addEventListener("ended", onEnded)
      audioRef.current.addEventListener("error", onPlayError)

      // Start playback
      await audioRef.current.play()

      // Clear the loading promise
      setAudioLoadingPromise(null)
    } catch (error) {
      console.error("Error playing audio:", error)
      setIsPlayingAudio(false)
      setCurrentAudioSpeaker(null)
      setAudioLoadingPromise(null)
    }
  }

  const startRecording = async () => {
    if (!audioPermission) return

    try {
      // Stop any playing audio before recording
      stopCurrentAudio()

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTimer(5)
      setShowFallback(false)

      // Start 5-second countdown
      timerRef.current = setInterval(() => {
        setRecordingTimer((prev) => {
          if (prev <= 1) {
            // Time's up - show fallback
            stopRecording()
            showFallbackMessage()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      recorder.start()

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Simulate successful recording
          setTimeout(() => {
            completeUserStep()
          }, 500)
        }
      }
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const showFallbackMessage = () => {
    const step = dialogueSteps[currentStep]
    if (step.fallbackText) {
      setShowFallback(true)
      if (step.fallbackAudio) {
        // Add a small delay before playing fallback audio
        setTimeout(() => {
          playAudio(step.fallbackAudio!, "lenoir")
        }, 100)
      }
      // Auto-restart recording after fallback
      setTimeout(() => {
        setShowFallback(false)
        startRecording()
      }, 3000)
    }
  }

  const completeUserStep = () => {
    setIsRecording(false)
    setShowFallback(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Move to next step
    setTimeout(() => {
      if (currentStep < dialogueSteps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        setIsComplete(true)
      }
    }, 1000)
  }

  const nextStep = () => {
    // Stop any playing audio when moving to next step
    stopCurrentAudio()

    if (currentStep < dialogueSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsComplete(true)
    }
  }

  const currentDialogue = dialogueSteps[currentStep]
  const progress = ((currentStep + 1) / dialogueSteps.length) * 100

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-slate-800 border-green-500 border-2">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold text-green-400 mb-4">Scene Complete</h1>
          <p className="text-slate-300 mb-6">En route to UG Campus…</p>
          <div className="text-sm text-slate-400">
            Mission Status: <span className="text-green-400 font-semibold">SUCCESS</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/backgrounds/kotoka-airport.jpg')" }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Audio Status Indicator */}
      {isPlayingAudio && currentAudioSpeaker && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg p-3 flex items-center space-x-2">
            <Volume2
              className={`w-4 h-4 animate-pulse ${
                currentAudioSpeaker === "lenoir" ? "text-blue-400" : "text-yellow-400"
              }`}
            />
            <span className="text-white text-sm font-medium">
              {currentAudioSpeaker === "lenoir" ? "Commandant Lenoir" : "Kouassi"} speaking...
            </span>
          </div>
        </div>
      )}

      {/* Main audio player */}
      <audio ref={audioRef} preload="none" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col p-4">
        {/* Header */}
        <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Plane className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-mono text-sm">SRLUF REFLEX TRAINING</span>
              </div>
              <div className="h-4 w-px bg-slate-600" />
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-mono text-sm">KOTOKA INTERNATIONAL AIRPORT</span>
              </div>
            </div>
            <div className="text-blue-400 font-mono text-sm">SCENE 1 - GHANA</div>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="mb-6 h-2 bg-slate-800" />

        {/* Character displays */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Lenoir */}
          <Card
            className={`p-4 transition-all duration-300 ${
              currentDialogue.speaker === "lenoir"
                ? "bg-blue-900/20 border-blue-400 border-2 scale-105"
                : "bg-slate-800/50 border-slate-600"
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <img
                src="/images/characters/lenoir-portrait.jpg"
                alt="Commandant Lenoir"
                className={`w-20 h-20 rounded-full object-cover transition-all duration-300 ${
                  currentDialogue.speaker === "lenoir" ? "border-blue-400 border-3" : "border-2 border-slate-500"
                }`}
              />
              <div className="text-center">
                <h3
                  className={`font-semibold text-sm ${
                    currentDialogue.speaker === "lenoir" ? "text-white" : "text-slate-400"
                  }`}
                >
                  Commandant Lenoir
                </h3>
                <p className={`text-xs ${currentDialogue.speaker === "lenoir" ? "text-slate-300" : "text-slate-500"}`}>
                  SRLUF Intelligence Officer
                </p>
              </div>
            </div>
          </Card>

          {/* Touré */}
          <Card
            className={`p-4 transition-all duration-300 ${
              currentDialogue.speaker === "user"
                ? "bg-green-900/20 border-green-400 border-2 scale-105"
                : "bg-slate-800/50 border-slate-600"
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <img
                src="/placeholder.svg?height=80&width=80"
                alt="Touré Yao"
                className={`w-20 h-20 rounded-full object-cover transition-all duration-300 ${
                  currentDialogue.speaker === "user" ? "border-green-400 border-3" : "border-2 border-slate-500"
                }`}
              />
              <div className="text-center">
                <h3
                  className={`font-semibold text-sm ${
                    currentDialogue.speaker === "user" ? "text-white" : "text-slate-400"
                  }`}
                >
                  Touré Yao
                </h3>
                <p className={`text-xs ${currentDialogue.speaker === "user" ? "text-slate-300" : "text-slate-500"}`}>
                  SRLUF Agent
                </p>
              </div>
            </div>
          </Card>

          {/* Kouassi */}
          <Card
            className={`p-4 transition-all duration-300 ${
              currentDialogue.speaker === "kouassi"
                ? "bg-yellow-900/20 border-yellow-400 border-2 scale-105"
                : "bg-slate-800/50 border-slate-600"
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <img
                src="/images/characters/kouassi-portrait.jpg"
                alt="Kouassi"
                className={`w-20 h-20 rounded-full object-cover transition-all duration-300 ${
                  currentDialogue.speaker === "kouassi" ? "border-yellow-400 border-3" : "border-2 border-slate-500"
                }`}
              />
              <div className="text-center">
                <h3
                  className={`font-semibold text-sm ${
                    currentDialogue.speaker === "kouassi" ? "text-white" : "text-slate-400"
                  }`}
                >
                  Kouassi
                </h3>
                <p className={`text-xs ${currentDialogue.speaker === "kouassi" ? "text-slate-300" : "text-slate-500"}`}>
                  UG Law Student
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main dialogue area */}
        <div className="flex-1 flex flex-col justify-center space-y-6">
          {/* Current dialogue */}
          <Card
            className={`p-6 max-w-2xl mx-auto w-full relative ${
              currentDialogue.speaker === "lenoir"
                ? "bg-blue-900/80 border-blue-400"
                : currentDialogue.speaker === "kouassi"
                  ? "bg-yellow-900/80 border-yellow-400"
                  : "bg-green-900/80 border-green-400"
            }`}
          >
            {/* Character portrait overlay for active speaker */}
            {currentDialogue.speaker !== "user" && (
              <div className="absolute -top-6 -left-6 z-10">
                <img
                  src={
                    currentDialogue.speaker === "lenoir"
                      ? "/images/characters/lenoir-portrait.jpg"
                      : "/images/characters/kouassi-portrait.jpg"
                  }
                  alt={currentDialogue.speaker === "lenoir" ? "Commandant Lenoir" : "Kouassi"}
                  className={`w-16 h-16 rounded-full object-cover border-3 ${
                    currentDialogue.speaker === "lenoir" ? "border-blue-400" : "border-yellow-400"
                  }`}
                />
              </div>
            )}

            <div className="flex items-start space-x-4">
              <div
                className={`w-3 h-3 rounded-full mt-2 ${
                  currentDialogue.speaker === "lenoir"
                    ? "bg-blue-400"
                    : currentDialogue.speaker === "kouassi"
                      ? "bg-yellow-400"
                      : "bg-green-400"
                }`}
              />

              <div className="flex-1">
                <p className="text-white text-lg leading-relaxed mb-4">
                  {showFallback && currentDialogue.fallbackText ? currentDialogue.fallbackText : currentDialogue.text}
                </p>

                {currentDialogue.userPrompt && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-green-300 font-semibold text-xl">"{currentDialogue.userPrompt}"</p>
                    </div>

                    <PronunciationGuide
                      phrase={currentDialogue.userPrompt}
                      phonetic={
                        pronunciationGuides[currentDialogue.userPrompt as keyof typeof pronunciationGuides]?.phonetic ||
                        ""
                      }
                      translation={
                        pronunciationGuides[currentDialogue.userPrompt as keyof typeof pronunciationGuides]
                          ?.translation || ""
                      }
                      audioFile={
                        pronunciationGuides[currentDialogue.userPrompt as keyof typeof pronunciationGuides]?.audioFile
                      }
                      onPlayAudio={(audioFile) => playAudio(audioFile)}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  {currentDialogue.audioFile && (
                    <Button
                      onClick={() =>
                        playAudio(currentDialogue.audioFile!, currentDialogue.speaker as "lenoir" | "kouassi")
                      }
                      disabled={isPlayingAudio}
                      variant="outline"
                      size="sm"
                      className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      {isPlayingAudio ? "Playing..." : "Play Audio"}
                    </Button>
                  )}

                  {currentDialogue.speaker !== "user" && (
                    <Button onClick={nextStep} className="bg-green-600 hover:bg-green-700">
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Recording interface for user prompts */}
          {currentDialogue.speaker === "user" && (
            <Card className="p-6 max-w-md mx-auto w-full bg-slate-800/90 border-green-400">
              <div className="text-center">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    disabled={!audioPermission}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
                  >
                    <Mic className="w-6 h-6 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <MicOff className="w-6 h-6 text-red-400 animate-pulse" />
                      <span className="text-white text-lg">Recording...</span>
                    </div>

                    <div className="text-3xl font-bold text-red-400">{recordingTimer}s</div>

                    <Button
                      onClick={() => {
                        stopRecording()
                        completeUserStep()
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Complete
                    </Button>
                  </div>
                )}

                {!audioPermission && <p className="text-red-400 text-sm mt-2">Microphone permission required</p>}
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm mt-6">
          Step {currentStep + 1} of {dialogueSteps.length} • SeyGe Reflex™ Training Simulation
        </div>
      </div>
    </div>
  )
}
