"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Play, Pause, Upload, Download, Trash2, Volume2 } from "lucide-react"
import { toast } from "sonner"

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioUrl: string) => void
  maxDuration?: number
  className?: string
}

export function VoiceRecorder({ onRecordingComplete, maxDuration = 300, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null)
  const [serverAudioUrl, setServerAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio recorder
  const initializeRecorder = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media recording not supported in this browser")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder not supported in this browser")
      }

      // Try different mime types for better compatibility
      let mimeType = "audio/webm;codecs=opus"
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm"
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/mp4"
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "audio/wav"
          }
        }
      }


      const mediaRecorder = new MediaRecorder(stream, { mimeType })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const localUrl = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setLocalAudioUrl(localUrl)

        const extension = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : "wav"
        await uploadAudioToServer(blob, `recording-${Date.now()}.${extension}`)

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        toast.error("Recording error occurred")
      }

      return true
    } catch (error) {
      console.error("Failed to initialize recorder:", error)
      let errorMessage = "Failed to access microphone."
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Microphone access denied. Please allow microphone permissions and try again."
        } else if (error.name === "NotFoundError") {
          errorMessage = "No microphone found. Please connect a microphone and try again."
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Media recording not supported in this browser."
        } else {
          errorMessage = `Recording error: ${error.message}`
        }
      }
      
      toast.error(errorMessage)
      return false
    }
  }

  // Upload audio to server
  const uploadAudioToServer = async (blob: Blob, filename: string) => {
    try {
      setIsUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append("audio", blob, filename)


      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch("/api/voice/upload-audio", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`)
      }

      const result = await response.json()


      if (result.success && result.audioUrl) {
        setServerAudioUrl(result.audioUrl)
        onRecordingComplete(blob, result.audioUrl)
        toast.success("Audio uploaded successfully!")
      } else {
        throw new Error(result.message || "Upload failed - no audio URL returned")
      }
    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown upload error"
      toast.error(`Failed to upload audio: ${errorMessage}`)
      
      // Still call onRecordingComplete with local blob URL as fallback
      const localUrl = URL.createObjectURL(blob)
      onRecordingComplete(blob, localUrl)
      toast.info("Using local audio file - upload will be retried")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Start recording
  const startRecording = async () => {
    const initialized = await initializeRecorder()
    if (!initialized) return

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      toast.success("Recording started!")
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      toast.success("Recording stopped! Uploading to server...")
    }
  }

  // Play recorded audio
  const playAudio = () => {
    if (localAudioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Pause audio playback
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  // Clear recording
  const clearRecording = () => {
    if (localAudioUrl) {
      URL.revokeObjectURL(localAudioUrl)
    }
    setAudioBlob(null)
    setLocalAudioUrl(null)
    setServerAudioUrl(null)
    setRecordingTime(0)
    setIsPlaying(false)
    toast.success("Recording cleared!")
  }

  // Upload audio file
  const uploadAudioFile = async (file: File) => {

    // Validate file type
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
      "audio/mp4",
      "audio/aac",
      "audio/m4a",
    ]

    const fileExtension = file.name.toLowerCase().split(".").pop()
    const allowedExtensions = ["mp3", "wav", "ogg", "webm", "mp4", "aac", "m4a"]

    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension || "")

    if (!isValidType) {
      toast.error(
        `Invalid file type. Please select an audio file. File type: ${file.type}, Extension: ${fileExtension}`,
      )
      return
    }

    // Check file size (25MB max)
    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 25MB.")
      return
    }

    const localUrl = URL.createObjectURL(file)
    setAudioBlob(file)
    setLocalAudioUrl(localUrl)

    // Upload to server
    await uploadAudioToServer(file, file.name)
  }

  // Handle file input
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadAudioFile(file)
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ""
  }

  // Download recorded audio
  const downloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `voice-recording-${Date.now()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Download started!")
    }
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (localAudioUrl) {
        URL.revokeObjectURL(localAudioUrl)
      }
    }
  }, [localAudioUrl])

  return (
    <Card className={`border border-purple-200 shadow-md overflow-hidden bg-white ${className}`}>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        <CardTitle className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-purple-600" />
          <span>Voice Recording</span>
          {!navigator.mediaDevices && (
            <Badge variant="destructive" className="ml-2 text-xs">
              Not Supported
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Record your voice message or upload an audio file
          {!navigator.mediaDevices && " (Recording not supported in this browser)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isUploading || !!localAudioUrl}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Mic className="h-4 w-4 mr-2" />
              <span>Start Recording</span>
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" className="bg-red-500 hover:bg-red-600">
              <Square className="h-4 w-4 mr-2" />
              <span>Stop Recording</span>
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.webm,.mp4,.aac,.m4a"
              onChange={handleFileInput}
              className="hidden"
              id="audio-upload"
              disabled={isRecording || isUploading}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("audio-upload")?.click()}
              disabled={isRecording || isUploading}
              className="border-purple-200 hover:border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span>Upload Audio</span>
            </Button>
          </div>
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="animate-pulse bg-red-500">
                <Mic className="h-3 w-3 mr-1" />
                Recording...
              </Badge>
              <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
            </div>
            <Progress value={(recordingTime / maxDuration) * 100} className="w-full h-2" />
            <p className="text-xs text-muted-foreground text-center">Maximum duration: {formatTime(maxDuration)}</p>
          </div>
        )}

        {/* Upload Status */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 p-4 bg-purple-50 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm text-purple-700">Uploading audio to server...</span>
            </div>
            <Progress value={uploadProgress} className="w-full h-2" />
            <p className="text-xs text-center text-purple-600">{uploadProgress}% uploaded</p>
          </div>
        )}

        {/* Audio Playback */}
        {localAudioUrl && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">Audio Ready</Badge>
                  {serverAudioUrl ? (
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">Server Ready</Badge>
                  ) : (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">Uploading...</Badge>
                  )}
                </div>
                <span className="text-sm font-medium text-purple-700">
                  {recordingTime > 0 ? formatTime(recordingTime) : "Audio File"}
                </span>
              </div>

              <audio
                ref={audioRef}
                src={localAudioUrl}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                className="w-full"
                controls
              />

              {serverAudioUrl ? (
                <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                  ✅ Audio uploaded successfully and ready for voice campaigns
                </div>
              ) : isUploading ? (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  ⏳ Uploading audio to server... Please wait.
                </div>
              ) : (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                  ⏳ Audio will be uploaded to server automatically
                </div>
              )}
            </div>

            <div className="flex items-center justify-center space-x-4">
              {!isPlaying ? (
                <Button
                  onClick={playAudio}
                  variant="outline"
                  className="border-purple-200 hover:border-purple-300 text-purple-600 hover:bg-purple-50 bg-transparent"
                >
                  <Play className="h-4 w-4 mr-2" />
                  <span>Play</span>
                </Button>
              ) : (
                <Button
                  onClick={pauseAudio}
                  variant="outline"
                  className="border-purple-200 hover:border-purple-300 text-purple-600 hover:bg-purple-50 bg-transparent"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  <span>Pause</span>
                </Button>
              )}

              <Button
                onClick={downloadAudio}
                variant="outline"
                className="border-purple-200 hover:border-purple-300 text-purple-600 hover:bg-purple-50 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Download</span>
              </Button>

              <Button
                onClick={clearRecording}
                variant="outline"
                className="border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Clear</span>
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 mt-4 pt-4 border-t border-purple-100">
          <p>• Click "Start Recording" to record your voice message</p>
          <p>• Or upload an existing audio file (MP3, WAV, etc.)</p>
          <p>• Audio files are automatically uploaded to the server for voice campaigns</p>
          <p>• Maximum recording duration: {formatTime(maxDuration)}</p>
          <p>• Supported formats: MP3, WAV, OGG, WebM, AAC, M4A</p>
        </div>
      </CardContent>
    </Card>
  )
}
