import React, { useState, useRef } from "react";

interface SpeechToTextMedicationProps {
  onMedicationTaken: (timeOfDay: "morning" | "afternoon" | "night") => void;
}

const SpeechToTextMedication: React.FC<SpeechToTextMedicationProps> = ({
  onMedicationTaken,
}) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const speechResult = event.results[0][0].transcript.toLowerCase();
      setTranscript(speechResult);
      checkForMedicationKeywords(speechResult);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
      
      // Show user-friendly error messages
      let errorMessage = "Speech recognition failed. ";
      switch(event.error) {
        case 'no-speech':
          errorMessage += "No speech detected. Please try again.";
          break;
        case 'audio-capture':
          errorMessage += "Microphone access denied or unavailable.";
          break;
        case 'not-allowed':
          errorMessage += "Microphone permission denied. Please allow microphone access.";
          break;
        default:
          errorMessage += "Please try again.";
      }
      alert(errorMessage);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const checkForMedicationKeywords = (speech: string) => {
    console.log("Processing speech:", speech);
    
    // More comprehensive keyword matching
    const morningKeywords = [
      "morning pill", "morning medicine", "morning medication", "morning dose",
      "took my morning", "morning meds", "morning tablet", "morning"
    ];
    
    const afternoonKeywords = [
      "afternoon pill", "afternoon medicine", "afternoon medication", "afternoon dose",
      "took my afternoon", "afternoon meds", "afternoon tablet", "noon pill", "midday", "afternoon"
    ];
    
    const nightKeywords = [
      "night pill", "night medicine", "night medication", "night dose",
      "took my night", "night meds", "night tablet", "evening pill", "evening medicine",
      "bedtime pill", "bedtime medicine", "night", "evening"
    ];

    // Enhanced debugging
    console.log("Checking keywords for:", speech);
    console.log("Morning match:", morningKeywords.some(keyword => speech.includes(keyword)));
    console.log("Afternoon match:", afternoonKeywords.some(keyword => speech.includes(keyword)));
    console.log("Night match:", nightKeywords.some(keyword => speech.includes(keyword)));

    // Check for matches
    if (morningKeywords.some(keyword => speech.includes(keyword))) {
      console.log("🌅 Detected MORNING medication");
      onMedicationTaken("morning");
    } else if (afternoonKeywords.some(keyword => speech.includes(keyword))) {
      console.log("☀️ Detected AFTERNOON medication");
      onMedicationTaken("afternoon");
    } else if (nightKeywords.some(keyword => speech.includes(keyword))) {
      console.log("🌙 Detected NIGHT medication");
      onMedicationTaken("night");
    } else {
      console.log("❌ No time of day detected in:", speech);
      // If no specific time found, show helpful message
      setTimeout(() => {
        alert("I couldn't identify the time of day. Please try saying something like 'I took my morning pill' or 'I took my evening medicine'.");
      }, 1000);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Voice Medication Logging</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {listening && (
            <span className="flex items-center">
              <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              Recording...
            </span>
          )}
        </div>
      </div>
      
      <div className="flex gap-3 mb-4">
        <button
          onClick={startListening}
          disabled={listening}
          className={`flex items-center px-4 py-2 rounded-lg text-white font-medium transition-colors ${
            listening 
              ? "bg-gray-500 cursor-not-allowed" 
              : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          }`}
        >
          <span className="mr-2">🎤</span>
          {listening ? "Listening..." : "Start Voice Logging"}
        </button>
        
        {listening && (
          <button
            onClick={stopListening}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
          >
            Stop
          </button>
        )}
      </div>

      {transcript && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-gray-100">You said:</strong> "{transcript}"
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p className="font-medium mb-2">Try saying:</p>
        <ul className="space-y-1 text-xs">
          <li>• "I took my morning pill"</li>
          <li>• "I took my afternoon medicine"</li>
          <li>• "I took my evening medication"</li>
        </ul>
      </div>
    </div>
  );
};

export default SpeechToTextMedication;
