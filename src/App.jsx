import React, { useState, useEffect, useRef } from 'react';
import { Mic, Play, Square, RefreshCcw, BookOpen, AlertTriangle, AlertCircle, CheckCircle, Sparkles, Hand } from 'lucide-react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { initializeHands, closeHands, analyzeHandGestures, drawHands } from './utils/handDetection';
import { SPEECH_FILLERS } from './constants/fillers';

const SpeechCoachApp = () => {
  const [activeTab, setActiveTab] = useState('memorize'); // 'combined' or 'memorize'

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
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
          <button
            onClick={() => setActiveTab('combined')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'combined' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={16} /> Sesión Completa
          </button>
          <button
            onClick={() => setActiveTab('memorize')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'memorize' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen size={16} /> Memorización
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {activeTab === 'combined' ? <CombinedSessionMode /> : <MemorizeMode />}
      </main>
    </div>
  );
};

// --- SESIÓN COMBINADA (GRABACIÓN + ANÁLISIS IA) ---

const CombinedSessionMode = () => {
  const [step, setStep] = useState('intro'); // intro, recording, results
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [fillerStats, setFillerStats] = useState({ count: 0, found: [] });
  const [poseStats, setPoseStats] = useState({ posture: 'neutral', gestures: 0, engagement: 0 });
  const [handStats, setHandStats] = useState({ handCount: 0, openPalms: 0, pointingGestures: 0, handActivity: 0 });
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);

  // Referencias
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handCanvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const handsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const poseHistoryRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Inicializar Speech Recognition UNA SOLA VEZ
  useEffect(() => {
    const initSpeechRecognition = () => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('✅ Speech Recognition iniciado correctamente');
          isRecordingRef.current = true;
        };

        recognition.onresult = (event) => {
          console.log('🎯 onresult triggered - Resultados:', event.results.length);
          
          let finalChunk = '';
          let interimChunk = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            console.log('📝 Chunk:', transcript, '| Final:', event.results[i].isFinal);
            if (event.results[i].isFinal) {
              finalChunk += transcript + ' ';
            } else {
              interimChunk += transcript;
            }
          }
          
          if (finalChunk) {
            setTranscript(prev => prev + finalChunk);
            console.log('💾 Guardando final:', finalChunk);
          }
          if (interimChunk) {
            setInterimTranscript(interimChunk);
            console.log('🔄 Interim:', interimChunk);
          }
        };

        recognition.onerror = (event) => {
          console.error('❌ Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError("❌ Acceso al micrófono denegado. Revisa permisos del navegador (icono candado).");
          } else if (event.error === 'network') {
            setError("❌ Error de red. Necesitas conexión a internet.");
          } else if (event.error !== 'no-speech') {
            setError(`❌ Error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          console.log('⏹️ Speech Recognition finalizado');
          isRecordingRef.current = false;
        };

        recognitionRef.current = recognition;
      } else {
        setError("❌ Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.");
      }
    };

    initSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn('Error en cleanup:', e);
        }
      }
    };
  }, []);

  // Cargar Pose Detector
  const initializePoseDetector = async () => {
    try {
      const model = poseDetection.SupportedModels.MoveNet;
      detectorRef.current = await poseDetection.createDetector(model, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
      });
    } catch (err) {
      console.error("Error cargando modelo de poses:", err);
    }
  };

  // Iniciar sesión combinada
  const startSession = async () => {
    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      setFillerStats({ count: 0, found: [] });
      setPoseStats({ posture: 'neutral', gestures: 0, engagement: 0 });
      setHandStats({ handCount: 0, openPalms: 0, pointingGestures: 0, handActivity: 0 });

      // Obtener stream de cámara y audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      streamRef.current = stream;
      
      setStep('recording');
      setRecording(true);

      // Esperar a que el DOM actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      // Asignar stream al video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Esperar a que el video esté listo
        await new Promise((resolve) => {
          const handler = () => {
            videoRef.current.removeEventListener('loadedmetadata', handler);
            videoRef.current.play().catch(err => console.error('Error al reproducir video:', err));
            resolve();
          };
          videoRef.current.addEventListener('loadedmetadata', handler);
        });
      }

      // Inicializar análisis
      isRecordingRef.current = true;
      await initializePoseDetector();
      setupAudioAnalysis(stream);

      // Inicializar MediaPipe Hands
      if (handCanvasRef.current) {
        const onHandResults = (results) => {
          drawHands(handCanvasRef.current, results);
          const gestures = analyzeHandGestures(results);
          setHandStats(gestures);
        };
        handsRef.current = await initializeHands(videoRef.current, onHandResults);
      }

      // INICIAR RECONOCIMIENTO DE VOZ
      if (recognitionRef.current) {
        try {
          console.log('🎤 Sesión Completa: Iniciando reconocimiento de voz...');
          console.log('🔍 recognitionRef existe:', !!recognitionRef.current);
          recognitionRef.current.start();
          console.log('✅ Sesión Completa: start() ejecutado exitosamente');
        } catch (e) {
          console.error('❌ Sesión Completa Error en start():', e.message);
          console.error('❌ Error completo:', e);
          setError(`Error al iniciar micrófono: ${e.message}`);
        }
      } else {
        console.error('❌ Sesión Completa: recognitionRef.current es null');
        setError('Error: micrófono no inicializado');
      }

      // Iniciar análisis de video
      analyzeVideo();
    } catch (err) {
      isRecordingRef.current = false;
      if (err.name === 'NotAllowedError') {
        setError("❌ Acceso denegado. Revisa permisos de cámara/micrófono en el navegador.");
      } else if (err.name === 'NotFoundError') {
        setError("❌ No se encontró cámara o micrófono en tu dispositivo.");
      } else {
        setError("❌ Error: " + err.message);
      }
      console.error('Error completo:', err);
    }
  };

  // Configurar análisis de audio
  const setupAudioAnalysis = (stream) => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    source.connect(analyserRef.current);
  };

  // Analizar video (pose detection)
  const analyzeVideo = async () => {
    if (!recording) return;

    if (detectorRef.current && videoRef.current && canvasRef.current) {
      try {
        const poses = await detectorRef.current.estimatePoses(videoRef.current);
        const pose = poses[0];

        if (pose && pose.keypoints) {
          // Analizar postura
          const leftShoulder = pose.keypoints.find(k => k.name === 'left_shoulder');
          const head = pose.keypoints.find(k => k.name === 'nose');

          // Detectar gestos (movimiento de manos)
          const leftWrist = pose.keypoints.find(k => k.name === 'left_wrist');
          const rightWrist = pose.keypoints.find(k => k.name === 'right_wrist');

          poseHistoryRef.current.push({
            leftWrist: leftWrist?.y,
            rightWrist: rightWrist?.y
          });

          // Mantener historial limitado
          if (poseHistoryRef.current.length > 30) {
            poseHistoryRef.current.shift();
          }

          // Detectar gestos activos (variación en posición de muñecas)
          if (poseHistoryRef.current.length > 5) {
            const recent = poseHistoryRef.current.slice(-5);
            const leftMovement = Math.max(...recent.map(p => p.leftWrist || 0)) - Math.min(...recent.map(p => p.leftWrist || 0));
            const rightMovement = Math.max(...recent.map(p => p.rightWrist || 0)) - Math.min(...recent.map(p => p.rightWrist || 0));

            const gestureActivity = Math.round((leftMovement + rightMovement) / 2);
            setPoseStats(prev => ({ ...prev, gestures: gestureActivity }));
          }

          // Determinar postura
          if (head?.y && leftShoulder?.y) {
            const headShoulder = head.y - leftShoulder.y;
            const postureType = Math.abs(headShoulder) < 20 ? 'excelente' : 'neutral';
            setPoseStats(prev => ({ ...prev, posture: postureType }));
          }
        }

        animationFrameRef.current = requestAnimationFrame(analyzeVideo);
      } catch (err) {
        console.error("Error en análisis de pose:", err);
        animationFrameRef.current = requestAnimationFrame(analyzeVideo);
      }
    } else {
      animationFrameRef.current = requestAnimationFrame(analyzeVideo);
    }
  };

  // Detener sesión y generar análisis
  const stopSession = async () => {
    isRecordingRef.current = false;
    setRecording(false);

    // Detener reconocimiento de voz
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn('Error deteniendo recognition:', e);
      }
    }

    // Detener stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Cancelar animaciones
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    closeHands();

    // Analizar resultados
    const finalTranscript = transcript + interimTranscript;
    analyzeMuletillas(finalTranscript);

    // Generar feedback
    await generateAIFeedback(finalTranscript);

    setStep('results');
  };

  // Contar muletillas
  const analyzeMuletillas = (text) => {
    const words = text.toLowerCase().split(/\s+/);
    const foundFillers = words.filter(word => SPEECH_FILLERS.includes(word.replace(/[^a-záéíóúñ]/g, '')));

    setFillerStats({
      count: foundFillers.length,
      found: [...new Set(foundFillers)]
    });
  };

  // Generar feedback con Ollama (LOCAL, 100% GRATIS)
  const generateAIFeedback = async (speechText) => {
    try {
      setFeedback(["⏳ Generando feedback con IA local Ollama..."]);

      const prompt = `Eres un coach profesional de oratoria. Analiza el siguiente discurso y proporciona feedback constructivo.

TRANSCRIPCIÓN:
"${speechText}"

MÉTRICAS DETECTADAS:
- Muletillas encontradas: ${fillerStats.count}
- Calidad de postura: ${poseStats.posture}
- Actividad de gestos: ${poseStats.gestures}%

Por favor, proporciona EXACTAMENTE 3 consejos específicos y prácticos para mejorar:
1. La eliminación de muletillas
2. La expresión corporal y gestos
3. La fluidez y proyección de voz

Sé directo, constructivo y motivador. Máximo 200 palabras.`;

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral", // Usa 'phi' si quieres más rápido (3B), 'neural-chat' para mejor calidad
          prompt: prompt,
          stream: false,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error("Ollama no está corriendo. Debes iniciar: ollama serve");
      }

      const result = await response.json();
      if (result.response) {
        const feedbackLines = result.response
          .split("\n")
          .filter(line => line.trim().length > 0)
          .slice(0, 5); // Primeras 5 líneas

        setFeedback([
          "🤖 Análisis con Ollama (IA Local)",
          ...feedbackLines.map(line => line.trim())
        ]);
      }
    } catch (err) {
      console.error("Error con Ollama:", err.message);
      setFeedback([
        "⚠️ Ollama no está disponible",
        "Para usar IA local, debes instalar Ollama y ejecutar: ollama serve",
        "Instalación: https://ollama.ai",
        "Luego en terminal: ollama pull mistral && ollama serve"
      ]);
      generateBasicFeedback();
    }
  };

  // Feedback básico si falla IA
  const generateBasicFeedback = () => {
    const tips = [];
    
    if (fillerStats.count > 5) {
      tips.push("⚠️ Muchas muletillas detectadas. Intenta hacer pausas silenciosas en lugar de llenar espacios.");
    } else if (fillerStats.count > 0) {
      tips.push("✓ Buen trabajo, pocas muletillas.");
    }

    if (poseStats.gestures < 10) {
      tips.push("👋 Usa más gestos para enfatizar puntos clave.");
    } else if (poseStats.gestures > 50) {
      tips.push("✋ Muchos movimientos. Intenta gesticular más deliberadamente.");
    }

    if (poseStats.posture === 'excelente') {
      tips.push("🎯 Excelente postura corporal.");
    } else {
      tips.push("📍 Mejora tu postura, mantén la cabeza erguida.");
    }

    setFeedback(tips);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
      {step === 'intro' && (
        <div className="space-y-6 text-center py-12">
          <h2 className="text-3xl font-bold text-slate-800">Sesión de Oratoria Completa</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Grabaremos tu discurso analizando simultáneamente tu voz, gestos y movimiento corporal con IA.
            Recibirás feedback detallado para mejorar tu expresión y eliminación de muletillas.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Mic className="mx-auto text-blue-600 mb-2" size={32} />
              <p className="text-sm font-semibold">Análisis de Voz</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <Hand className="mx-auto text-green-600 mb-2" size={32} />
              <p className="text-sm font-semibold">Detección de Gestos</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <Sparkles className="mx-auto text-purple-600 mb-2" size={32} />
              <p className="text-sm font-semibold">Feedback con IA</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center gap-2">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <button
            onClick={startSession}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <Play size={24} /> Comenzar Sesión
          </button>
        </div>
      )}

      {step === 'recording' && (
        <div className="space-y-6">
          <div className="text-center py-8 space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
              <div className="bg-red-100 p-6 rounded-full relative z-10">
                <Mic className="w-12 h-12 text-red-600 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Grabando...</h2>
            <p className="text-slate-600">Habla con claridad. Analizamos tu voz, postura y gestos de manos.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">VIDEO</p>
              <video
                ref={videoRef}
                className="w-full rounded-lg border-2 border-indigo-600 shadow-lg"
                autoPlay
                muted
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">DETECCIÓN DE MANOS</p>
              <canvas
                ref={handCanvasRef}
                className="w-full rounded-lg border-2 border-green-600 shadow-lg bg-black"
                width={320}
                height={240}
              />
            </div>
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 font-semibold mb-2">TRANSCRIPCIÓN</p>
                <p className="text-sm text-slate-700 h-20 overflow-y-auto">
                  {transcript}
                  <span className="text-slate-400 italic">{interimTranscript}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <p className="text-xs text-blue-600 font-semibold">Muletillas</p>
                  <p className="text-lg font-bold text-blue-700">{fillerStats.count}</p>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <p className="text-xs text-green-600 font-semibold">Manos Detectadas</p>
                  <p className="text-lg font-bold text-green-700">{handStats.handCount}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={stopSession}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Square size={20} fill="currentColor" /> Terminar Grabación
          </button>
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-8">
          <div className="text-center border-b border-slate-100 pb-6">
            <h2 className="text-2xl font-bold text-slate-800">Resultados de tu Sesión</h2>
            <p className="text-slate-600 mt-2">Análisis completado con IA y MediaPipe</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-blue-600 font-semibold mb-1 text-sm">Muletillas</p>
              <p className="text-3xl font-bold text-blue-700">{fillerStats.count}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-green-600 font-semibold mb-1 text-sm">Gestos (Pose)</p>
              <p className="text-3xl font-bold text-green-700">{poseStats.gestures}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <p className="text-purple-600 font-semibold mb-1 text-sm">Palmas Abiertas</p>
              <p className="text-3xl font-bold text-purple-700">{handStats.openPalms}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <p className="text-orange-600 font-semibold mb-1 text-sm">Gestos Apuntar</p>
              <p className="text-3xl font-bold text-orange-700">{handStats.pointingGestures}</p>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200 space-y-3">
            <h3 className="font-semibold text-indigo-900">💡 Feedback con IA para Mejorar:</h3>
            {feedback.map((tip, idx) => (
              <p key={idx} className="text-indigo-800 text-sm leading-relaxed">
                • {tip}
              </p>
            ))}
          </div>

          <button
            onClick={() => {
              setStep('intro');
              setTranscript('');
              setInterimTranscript('');
              setFillerStats({ count: 0, found: [] });
              setPoseStats({ posture: 'neutral', gestures: 0, engagement: 0 });
              setHandStats({ handCount: 0, openPalms: 0, pointingGestures: 0, handActivity: 0 });
              setFeedback([]);
            }}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} /> Nueva Sesión
          </button>
        </div>
      )}
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
  const supportsSpeechRecognition =
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const [error, setError] = useState(
    supportsSpeechRecognition
      ? null
      : "Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome o Edge.",
  );
  const [fillerStats, setFillerStats] = useState({ count: 0, found: [] });
  
  // Reconocimiento de voz setup
  const recognitionRef = useRef(null);

   useEffect(() => {
    if (supportsSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        console.log('🎯 [Memorización] onresult - Resultados:', event.results.length);
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          console.log('📝 [Memorización] Chunk:', chunk, '| Final:', event.results[i].isFinal);
          if (event.results[i].isFinal) {
            finalChunk += chunk + ' ';
          } else {
            interimChunk += chunk;
          }
        }

        if (finalChunk) {
            setTranscript(prev => prev + finalChunk);
            console.log('💾 [Memorización] Guardando final:', finalChunk);
        }
        if (interimChunk) {
          setInterimTranscript(interimChunk);
          console.log('🔄 [Memorización] Interim:', interimChunk);
        }
        setError(null);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('❌ [Memorización] Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          console.error('❌ Permisos denegados');
          setError('❌ Acceso al micrófono denegado. Revisa permisos del navegador (icono candado).');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          console.log('⚠️ Sin detección de voz (silencio normal)');
        } else if (event.error === 'network') {
          console.error('❌ Error de red');
          setError('❌ Error de red. El reconocimiento necesita internet.');
        } else {
          console.error('❌ Otro error:', event.error);
          setError(`❌ Error: ${event.error}`);
        }
      };

      recognitionRef.current.onstart = () => {
        console.log('✅ [Memorización] Speech Recognition iniciado correctamente');
      };

      recognitionRef.current.onend = () => {
        console.log('⏹️ [Memorización] Speech Recognition finalizado');
      };

    }
  }, [supportsSpeechRecognition]);

  useEffect(() => {
    if (step !== 'memorizing') return undefined;

    const interval = setInterval(() => {
      setTimer((currentTimer) => {
        if (currentTimer <= 1) {
          clearInterval(interval);
          setStep('recording');
          return 0;
        }
        return currentTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

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
      console.log('🎤 [Memorización] Iniciando reconocimiento...');
      console.log('🔍 recognitionRef existe:', !!recognitionRef.current);
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
        console.log('✅ [Memorización] start() ejecutado exitosamente');
      } else {
        console.error('❌ [Memorización] recognitionRef es null');
        setError('Error: micrófono no disponible');
      }
    } catch (e) {
        console.error('❌ [Memorización] Error:', e.message);
        console.error('❌ Error completo:', e);
        setError(`Error al iniciar: ${e.message}`);
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
    const words = speechText.toLowerCase().split(/\s+/);
    const foundFillers = words.filter(word => SPEECH_FILLERS.includes(word.replace(/[^a-záéíóúñ]/g, '')));
    
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
                    const isFiller = SPEECH_FILLERS.includes(cleanWord);
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

export default SpeechCoachApp;
