import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, MicrophoneIcon, StopIcon, PlayIcon, PauseIcon } from './Icons';
import { useGemini } from '../services/geminiService';

interface AIReaderProps {
  text?: string;
  onTextChange?: (text: string) => void;
}

const AIReader: React.FC<AIReaderProps> = ({ text = '', onTextChange }) => {
  const [inputText, setInputText] = useState(text);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { generateSpeech } = useGemini();

  useEffect(() => {
    setInputText(text);
  }, [text]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const newText = inputText + ' ' + transcript;
        setInputText(newText);
        onTextChange?.(newText);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [inputText, onTextChange, audioUrl]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const generateAudio = async () => {
    if (!inputText.trim()) return;

    setIsGenerating(true);
    try {
      const audioBlob = await generateSpeech(inputText);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error generating speech:', error);
      alert('Failed to generate speech. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <SparklesIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">AI Reader</h2>
      </div>

      <div className="space-y-6">
        {/* Text Input */}
        <div>
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
            Enter text to read aloud
          </label>
          <textarea
            id="text-input"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              onTextChange?.(e.target.value);
            }}
            placeholder="Type or speak your text here..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Voice Input Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isListening
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <MicrophoneIcon className="w-5 h-5" />
            {isListening ? 'Stop Listening' : 'Start Voice Input'}
          </button>
          {isListening && (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Listening...</span>
            </div>
          )}
        </div>

        {/* Generate Audio Button */}
        <div className="flex justify-center">
          <button
            onClick={generateAudio}
            disabled={!inputText.trim() || isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Audio...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate Speech
              </>
            )}
          </button>
        </div>

        {/* Audio Playback Controls */}
        {audioUrl && (
          <div className="bg-gray-50 rounded-lg p-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={isPlaying ? pauseAudio : playAudio}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={stopAudio}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <StopIcon className="w-5 h-5" />
                Stop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIReader;
