import { useState, useCallback, useEffect, useRef } from 'react';

const LANG_MAP = {
  'en-IN': 'en-IN',
  'hi-IN': 'hi-IN',
  'en': 'en-US',
};

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      }
    };
  }, []);

  const speak = useCallback((text, language = 'en-IN') => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const lang = LANG_MAP[language] || language;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.volume = 1;

    const voices = synthRef.current.getVoices();
    const indianVoice = voices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN'));
    if (indianVoice) utter.voice = indianVoice;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utter);
  }, []);

  const listen = useCallback((onResult) => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
      return;
    }

    setIsListening(true);
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  }, [isListening]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, listen, stopSpeaking, isListening, isSpeaking };
}
