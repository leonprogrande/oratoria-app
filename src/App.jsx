import React, { useState, useEffect, useRef } from 'react';
import { Mic, Video, Play, Square, RefreshCcw, BookOpen, Activity, Volume2, AlertCircle, CheckCircle, Hand, AlertTriangle } from 'lucide-react';

const SpeechCoachApp = () => {
  const [activeTab, setActiveTab] = useState('memorize'); // 'memorize' or 'camera'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Mic className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent">
            Oratoria Pro
          </h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('memorize')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'memorize' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <BookOpen size={16} /> Memorización
            </span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'camera' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Video size={16} /> Cámara y Gestos
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {activeTab === 'memorize' ? <MemorizeMode /> : <CameraMode />}
      </main>
    </div>
  );
};

// --- MODO MEMORIZACIÓN ---

const MemorizeMode = () => {
  const [text, setText] = useState('');
  const [step, setStep] = useState('input'); // input, memorizing, recording, results
  const [timer, setTimer] = useState(30);
  const [transcript, setTranscript] = useState(''); // Texto finalizado
  const [interimTranscript, setInterimTranscript] = useState(''); // Texto en proceso
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null); // Nuevo estado para errores
  const [fillerStats, setFillerStats] = useState({ count: 0, found: [] });
  
  // Reconocimiento de voz setup
  const recognitionRef = useRef(null);

   useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + ' ';
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }

        if (finalChunk) {
            setTranscript(prev => prev + finalChunk);
        }
        setInterimTranscript(interimChunk);
        setError(null);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setError("Acceso al micrófono denegado. Por favor verifica los permisos del navegador (icono de candado en la barra de dirección).");
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Silencio normal, no mostrar error
        } else if (event.error === 'network') {
           setError("Error de red. El reconocimiento de voz necesita internet.");
        } else {
          setError(`Error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        // Simplemente marcar como no escuchando - el estado de React lo maneja stopRecording()
        console.log("Speech recognition ended");
      };

    } else {
      setError("Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome o Edge.");
    }
  }, []);

  useEffect(() => {
    let interval;
    if (step === 'memorizing' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (step === 'memorizing' && timer === 0) {
      setStep('recording');
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const startMemorizing = () => {
    if (!text.trim()) return;
    setTimer(Math.max(10, Math.ceil(text.split(' ').length / 2))); // Tiempo dinámico
    setError(null);
    setStep('memorizing');
  };

  const startRecording = () => {
    setStep('recording');
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setIsListening(true);
    try {
        recognitionRef.current?.abort(); // Stop any previous instance
        recognitionRef.current?.start();
    } catch (e) {
        console.error(e);
    }
  };

  const stopRecording = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
    // Combinamos lo que ya se guardó con lo que estaba en el "buffer" (interim) al momento de parar
    const fullText = transcript + interimTranscript;
    analyzeSpeech(fullText);
    setTranscript(fullText); // Actualizamos el transcript final para mostrarlo en resultados
    setStep('results');
  };

  const analyzeSpeech = (speechText) => {
    const fillers = ['eh', 'em', 'mm', 'este', 'o sea', 'bueno', 'tipo', 'sabes', 'literal', 'digamos', 'básicamente', 'mhm'];
    const words = speechText.toLowerCase().split(/\s+/);
    const foundFillers = words.filter(word => fillers.includes(word.replace(/[^a-záéíóúñ]/g, '')));
    
    setFillerStats({
      count: foundFillers.length,
      found: foundFillers
    });
  };

  const reset = () => {
    setStep('input');
    setTranscript('');
    setInterimTranscript('');
    setTimer(30);
    setError(null);
  };

  const getWordCount = (str) => {
    const cleanStr = str.trim();
    if (!cleanStr) return 0;
    return cleanStr.split(/\s+/).length;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto">
      {step === 'input' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Paso 1: Tu Guion</h2>
            <p className="text-slate-500">Pega el párrafo que quieres practicar. Te daremos tiempo para leerlo.</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2 border border-red-200">
                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                <p>{error}</p>
            </div>
          )}

          <textarea
            className="w-full h-48 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-lg"
            placeholder="Escribe o pega tu discurso aquí..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={startMemorizing}
            disabled={!text.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={20} /> Comenzar Práctica
          </button>
        </div>
      )}

      {step === 'memorizing' && (
        <div className="text-center space-y-8 py-10">
          <h2 className="text-3xl font-bold text-indigo-600">Memoriza el texto</h2>
          <div className="text-6xl font-mono font-bold text-slate-800">{timer}s</div>
          <p className="text-lg text-slate-600 bg-slate-50 p-6 rounded-lg border border-slate-100 italic">
            "{text}"
          </p>
          <button onClick={startRecording} className="text-indigo-600 hover:underline">
            Saltar tiempo y empezar a hablar
          </button>
        </div>
      )}

      {step === 'recording' && (
        <div className="text-center space-y-8 py-10">
          <div className="relative inline-block">
            {isListening ? (
                 <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
            ) : null}
            <div className={`p-6 rounded-full relative z-10 transition-colors ${isListening ? 'bg-red-100' : 'bg-slate-100'}`}>
              <Mic className={`w-12 h-12 ${isListening ? 'text-red-600' : 'text-slate-400'}`} />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
                {isListening ? "Te estamos escuchando..." : "Micrófono en pausa"}
            </h2>
            <p className="text-slate-500 mt-2">Recita tu discurso con claridad.</p>
          </div>

          {error && (
            <div className="max-w-md mx-auto bg-red-50 text-red-700 p-3 rounded-lg flex items-center justify-center gap-2 border border-red-200 text-sm">
                <AlertTriangle size={16} />
                {error}
            </div>
          )}
          
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 relative overflow-hidden group">
            <p className="text-lg text-slate-400 filter blur-sm group-hover:blur-none transition-all duration-300 select-none">
              {text}
            </p>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
              <span className="bg-white/80 px-3 py-1 rounded text-sm text-slate-500 font-medium">Pasa el mouse para ver una pista</span>
            </div>
          </div>

          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Square size={20} fill="currentColor" /> Terminar
          </button>
          
          <div className="text-left bg-slate-100 p-4 rounded mt-4 h-32 overflow-y-auto border border-slate-200">
            <p className="text-xs text-slate-500 mb-1 sticky top-0 bg-slate-100 pb-1">Transcripción en vivo:</p>
            <p className="text-slate-700 text-lg leading-relaxed">
                {transcript}
                <span className="text-slate-400 italic">{interimTranscript}</span>
            </p>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-8">
          <div className="text-center border-b border-slate-100 pb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Resultados de tu Sesión</h2>
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-red-600 font-medium mb-1">Muletillas Detectadas</p>
                    <p className="text-4xl font-bold text-red-700">{fillerStats.count}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <p className="text-green-600 font-medium mb-1">Palabras Totales</p>
                    <p className="text-4xl font-bold text-green-700">{getWordCount(transcript)}</p>
                </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700">Análisis del Discurso:</h3>
            
            {/* Mensaje de error si no hay audio */}
            {!transcript.trim() ? (
                <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 text-center">
                    <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
                    <p className="text-amber-800 font-semibold mb-1">No se detectó audio</p>
                    <p className="text-amber-700 text-sm">
                        Es posible que el navegador haya bloqueado el micrófono. 
                        Asegúrate de permitir el acceso cuando el navegador te lo pregunte, 
                        o revisa el icono de "candado" o "cámara" en la barra de dirección.
                    </p>
                </div>
            ) : (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-lg leading-relaxed">
                {transcript.split(' ').map((word, idx) => {
                    const cleanWord = word.toLowerCase().replace(/[^a-záéíóúñ]/g, '');
                    const isFiller = ['eh', 'em', 'mm', 'este', 'o sea', 'bueno', 'tipo', 'sabes'].includes(cleanWord);
                    return (
                    <span key={idx} className={isFiller ? "bg-red-200 text-red-800 px-1 rounded mx-0.5 font-bold inline-block" : "mx-0.5 inline-block"}>
                        {word}
                    </span>
                    );
                })}
                </div>
            )}
            
            {transcript.trim() && (
                fillerStats.count > 0 ? (
                    <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg text-amber-800 border border-amber-100">
                        <AlertCircle className="shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-semibold">Consejo para mejorar:</p>
                            <p className="text-sm mt-1">
                                Notamos que usas mucho "{fillerStats.found[0] || 'muletillas'}". Intenta hacer una pausa silenciosa en lugar de llenar el espacio con sonido. El silencio es poderoso en la oratoria.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start gap-3 bg-indigo-50 p-4 rounded-lg text-indigo-800 border border-indigo-100">
                        <CheckCircle className="shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-semibold">¡Excelente fluidez!</p>
                            <p className="text-sm mt-1">
                            {getWordCount(transcript) > 5 
                                ? "No detectamos muletillas obvias. Tu discurso fluye muy bien." 
                                : "El discurso fue muy corto para detectar patrones. ¡Intenta hablar un poco más!"}
                            </p>
                        </div>
                    </div>
                )
            )}
          </div>

          <button
            onClick={reset}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} /> Practicar otro texto
          </button>
        </div>
      )}
    </div>
  );
};

// --- MODO CÁMARA (SIMULACIÓN DE ANÁLISIS) ---

const CameraMode = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // Para análisis de movimiento
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [motionLevel, setMotionLevel] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastImageDataRef = useRef(null);

  // Iniciar Cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true 
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      // Esperar a que el video esté listo antes de continuar
      await new Promise(resolve => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          resolve();
        };
      });
      
      setIsActive(true);
      setFeedback(['Calibrando análisis corporal...', 'Escuchando tono de voz...']);
      
      // Iniciar después de que el video está listo
      setupAudioAnalysis(stream);
      analyzeLoop();

    } catch (err) {
      console.error(err);
      if (err.name === 'NotAllowedError') {
        alert("Acceso denegado. Revisa los permisos de cámara en la barra de dirección (icono de candado).");
      } else if (err.name === 'NotFoundError') {
        alert("No se encontró cámara en tu dispositivo.");
      } else {
        alert("Error al acceder a la cámara: " + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsActive(false);
    setMotionLevel(0);
    setAudioLevel(0);
  };

  // Configurar análisis de audio
  const setupAudioAnalysis = (stream) => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    source.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    analyserRef.current.fftSize = 2048;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const getAudioLevel = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      setAudioLevel(average);
      requestAnimationFrame(getAudioLevel);
    };

    getAudioLevel();
  };

  // Bucle de análisis
  const analyzeLoop = () => {
    if (!isActive) return;
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const video = videoRef.current;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let motion = 0;
      let total = 0;

      // Comparar con el último frame para detectar movimiento
      if (lastImageDataRef.current) {
        const lastData = lastImageDataRef.current.data;
        for (let i = 0; i < data.length; i += 4) {
          const diff = Math.abs(data[i] - lastData[i]) + Math.abs(data[i + 1] - lastData[i + 1]) + Math.abs(data[i + 2] - lastData[i + 2]);
          motion += diff;
          total += 255 * 3; // Máximo posible por pixel (R+G+B)
        }
      }

      lastImageDataRef.current = imageData;

      // Calcular nivel de movimiento (0 a 100)
      const motionPercentage = (motion / total) * 100;
      setMotionLevel(motionPercentage);

      // Feedback básico
      if (motionPercentage > 10) {
        setFeedback(prev => [...prev, "Movimiento detectado"]);
      } else {
        setFeedback(prev => prev.filter(msg => msg !== "Movimiento detectado"));
      }
    }

    animationFrameRef.current = requestAnimationFrame(analyzeLoop);
  };

  // Generar Feedback basado en métricas cada 2 segundos
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
        const newFeedback = [];
        
        // Lógica de Movimiento
        if (motionLevel > 40) {
            newFeedback.push("⚠️ Mucho movimiento: Intenta anclar tus pies al suelo.");
            newFeedback.push("✋ Tus manos se mueven muy rápido, úsalas deliberadamente.");
        } else if (motionLevel < 5) {
            newFeedback.push("⚠️ Demasiado estático: Relaja los hombros.");
            newFeedback.push("👋 Usa tus manos para enfatizar puntos clave.");
        } else {
            newFeedback.push("✅ Buen control corporal.");
        }

        // Lógica de Audio
        if (audioLevel > 50) {
            newFeedback.push("🗣️ ¡Buena proyección de voz!");
        } else if (audioLevel < 10) {
            newFeedback.push("📢 Sube el volumen, no se te escucha bien.");
        } else {
            newFeedback.push("ℹ️ Intenta variar tu entonación para no sonar monótono.");
        }

        setFeedback(newFeedback);
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Modo Cámara</h2>
        <p className="text-slate-500 text-sm">
          Practica tu discurso frente a la cámara. Recibirás análisis en tiempo real sobre tu{" "}
          <span className="font-semibold text-slate-800">movimiento</span> y{" "}
          <span className="font-semibold text-slate-800">entonación</span>.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <video
            ref={videoRef}
            className="w-full rounded-lg border border-slate-200"
            autoPlay
            muted
          ></video>
        </div>
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            className="w-full h-64 rounded-lg border border-slate-200"
          ></canvas>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={isActive ? stopCamera : startCamera}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isActive ? (
            <>
              <Square size={18} /> Detener Análisis
            </>
          ) : (
            <>
              <Play size={18} /> Iniciar Práctica
            </>
          )}
        </button>
      </div>

      {/* Feedback y métricas */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Feedback en Tiempo Real</h3>
        <div className="space-y-2">
          {feedback.length === 0 ? (
            <p className="text-slate-500 text-sm">Sin análisis aún. Inicia la práctica para recibir feedback.</p>
          ) : (
            feedback.map((msg, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Hand className="text-indigo-600 w-5 h-5 shrink-0" />
                <p className="text-slate-700">{msg}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeechCoachApp;