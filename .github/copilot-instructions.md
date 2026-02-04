# Oratoria Pro - AI Agent Instructions

## Project Overview
**Oratoria Pro** is a React + Vite speech coaching web application that helps users improve their public speaking skills through two interactive modes: text memorization with speech recognition and real-time gesture/audio analysis via webcam.

### Tech Stack
- **Frontend Framework**: React 19 with Hooks (no TypeScript)
- **Build Tool**: Vite 7.2 with HMR
- **Styling**: Tailwind CSS 3.4 + PostCSS
- **UI Icons**: Lucide React 0.56
- **Browser APIs**: Web Speech Recognition API, Web Audio API, Canvas API
- **Language**: Spanish (`es-ES`)

---

## Architecture & Component Structure

### Main Components (Single App.jsx file)

1. **SpeechCoachApp** (Root component)
   - Tab-based navigation between modes
   - Manages `activeTab` state ('memorize' or 'camera')
   - Sticky header with mode switcher

2. **MemorizeMode** (Lines 56-363)
   - **Step States**: 'input' → 'memorizing' → 'recording' → 'results'
   - **Key Features**:
     - Text input with dynamic timer based on word count
     - Web Speech Recognition API integration (Spanish language)
     - Real-time transcript display (final + interim text)
     - Filler word detection (muletillas): 'eh', 'em', 'mm', 'este', 'o sea', 'bueno', etc.
     - Error handling for microphone permissions
   - **Data Flow**: User text → Memorization phase → Live recording → Analysis → Results display

3. **CameraMode** (Lines 368-597)
   - **Dual Stream Analysis**:
     - **Video Analysis**: Frame-by-frame pixel comparison for motion detection (canvas-based)
     - **Audio Analysis**: Web Audio API frequency data analysis for volume/tone
   - **Real-time Feedback**: Generated every 2 seconds based on thresholds
   - **References**: `videoRef`, `canvasRef` for rendering; `audioContextRef`, `analyserRef` for sound analysis

---

## Critical Developer Workflows

### Development Server
```bash
npm run dev  # Vite dev server on http://localhost:5173 with HMR
```

### Building
```bash
npm run build   # Vite production build → dist/
npm run preview # Serve dist locally
```

### Code Quality
```bash
npm run lint  # ESLint validation (eslint.config.js)
```

### Key Configuration Files
- **vite.config.js**: React plugin only (minimal setup)
- **tailwind.config.js**: Includes `index.html` + `src/**/*.{js,jsx,ts,tsx}`
- **postcss.config.js**: Tailwind CSS processing
- **eslint.config.js**: ESLint rules (includes react-hooks plugin)

---

## Project-Specific Patterns & Conventions

### 1. **State Management Pattern**
- **No Redux/Context**: All state is local component state using `useState()`
- **No Redux**: Simple enough for direct state management
- Example from MemorizeMode:
  ```jsx
  const [step, setStep] = useState('input');
  const [transcript, setTranscript] = useState('');
  const [fillerStats, setFillerStats] = useState({ count: 0, found: [] });
  ```

### 2. **Browser API Usage with useRef**
- **useRef Patterns**: Used for:
  - Speech Recognition API: `recognitionRef.current = new SpeechRecognition()`
  - Canvas drawing: `canvasRef.current.getContext('2d')`
  - Media streams: `streamRef.current = stream`
  - Audio analysis: `audioContextRef.current = new AudioContext()`
  - Animation frames: `animationFrameRef.current = requestAnimationFrame(...)`

### 3. **Filler Word Detection Algorithm**
- Located in `analyzeSpeech()` function (MemorizeMode, lines ~162-170)
- Simple word-matching approach (case-insensitive, punctuation stripped)
- Hardcoded filler list in `fillers` array (can be moved to config)
- Highlights matched fillers in red during results display

### 4. **Motion Detection via Canvas**
- Uses pixel-by-pixel RGB comparison between consecutive frames
- Formula: `diff = |R1-R2| + |G1-G2| + |B1-B2|` per pixel
- Normalized to 0-100% scale
- Threshold-based feedback: >40% = excessive motion, <5% = too static

### 5. **Audio Level Analysis**
- Web Audio API: `analyser.getByteFrequencyData()`
- Averaged frequency bins to get overall volume level (0-255 range)
- Feedback thresholds: >50 (good projection), <10 (low volume)

### 6. **Error Handling for Permissions**
- Speech API: Catches `NotAllowedError`, `network`, `no-speech`
- Camera API: Catches `NotAllowedError`, `NotFoundError`
- User-friendly Spanish error messages with guidance
- All errors displayed in red alert boxes with `AlertTriangle` icon

### 7. **Styling Conventions**
- **Tailwind-first**: No custom CSS except in `App.css` (minimal)
- **Color scheme**: Indigo primary (`indigo-600`, `indigo-700`), slate neutrals
- **Responsive**: `md:` breakpoint for layout shifts (flex direction in CameraMode)
- **States**: Conditional classes for active/hover/disabled states on buttons
- **Animations**: Pulse animation for recording indicator (`animate-ping`)

### 8. **Internationalization Note**
- **Spanish language locked**: `lang: 'es-ES'` in Speech Recognition API
- **UI text**: Spanish labels (Memorización, Cámara y Gestos, etc.)
- **Error messages**: Spanish with specific browser permission guidance

### 9. **Ollama Local AI Integration**
- **Location**: `CombinedSessionMode.jsx`, `generateAIFeedback()` function (~line 123)
- **Endpoint**: `http://localhost:11434/api/generate`
- **Default model**: `mistral` (can be changed to `phi`, `neural-chat`, `llama2`)
- **Flow**: 
  1. User completes recording
  2. Transcript + stats sent to Ollama
  3. Ollama generates coaching feedback locally
  4. Results displayed (2-5 second latency)
- **Error handling**: If Ollama unavailable, falls back to `generateBasicFeedback()`
- **Configuration**: Edit `model` field in line ~130 to change AI model
- **Requirements**: Ollama must be running (`ollama serve`) in separate terminal

---

## Integration Points & Data Flows

### Web Speech Recognition API Integration
```
User Text → startMemorizing() → Timer Countdown → startRecording()
→ Recognition onresult event (final + interim) → setTranscript() 
→ stopRecording() → analyzeSpeech() → Results Display
```

### Combined Session: Video + Audio + AI Analysis
```
startSession() → getUserMedia(video + audio)
  ↓
  ├─ Speech Recognition → Detects muletillas in real-time
  ├─ Pose Detection (TensorFlow) → Analyzes gestures locally
  └─ Audio Analysis → Measures volume/projection
  ↓
stopSession() 
  ↓
  ├─ Analyzes filler statistics
  ├─ Calls Ollama local API (http://localhost:11434)
  └─ Generates AI feedback
  ↓
Results Display (metrics + AI recommendations)
```

### Ollama Integration (Local AI)
- **Endpoint**: `http://localhost:11434/api/generate`
- **Model**: Mistral 7B (configurable to Phi, LLaMA, etc.)
- **Flow**: Speech transcript → Ollama prompt → AI feedback
- **Latency**: 2-5 seconds (local, no network)
- **Cost**: FREE (runs locally on user's machine)

### Permission Handling
- **Microphone**: Required for both modes (Speech Recognition + Camera audio)
- **Camera**: Required for Camera mode and Combined mode
- **Error recovery**: No retry logic; user must revisit settings or reload

---

## Common Modifications & Extension Points

### Adding New Filler Words
- Location: `MemorizeMode`, `analyzeSpeech()` function
- Modify the `fillers` array to include additional words
- Example: Add 'patalmente', 'capaz' for Argentine Spanish

### Adjusting Analysis Thresholds
- **Motion level**: Lines in `useEffect` of CameraMode (~lines 490+)
- **Audio level**: Thresholds in feedback generation interval
- Current thresholds: Motion >40% or <5%, Audio >50 or <10

### Changing Language
- Update `recognitionRef.current.lang = 'es-ES'` to other BCP 47 codes
- Update all Spanish UI strings and error messages

### Performance Optimization Points
- Canvas rendering runs on every `requestAnimationFrame` → consider frame skipping
- Feedback regeneration every 2 seconds → adjustable interval
- Large transcript strings → consider virtualization if needed

---

## Testing Considerations

### Manual Testing Checklist
- [ ] Speech Recognition: Works with and without microphone permissions
- [ ] Filler detection: Highlights Spanish fillers correctly
- [ ] Camera mode: Real-time feedback generates without lag
- [ ] Error states: All permission errors display Spanish guidance
- [ ] Mobile: Responsive layout (camera view stacks vertically)
- [ ] Browser compatibility: Chrome/Edge (Speech API + Canvas + Web Audio)

### Browser Compatibility
- ✅ Chrome/Edge: Full support
- ⚠️ Firefox: Limited Speech API support
- ❌ Safari: Partial Web Audio API support

---

## Future Enhancement Roadmap

1. **Component Extraction**: Split App.jsx into separate files (MemorizeMode.jsx, CameraMode.jsx)
2. **IA Integration**: TensorFlow.js for pose detection or Hugging Face for emotion analysis
3. **Persistence**: Local storage for saved sessions or cloud sync
4. **Desktop App**: Electron or Tauri wrapper for standalone executable
5. **Metrics Export**: PDF reports of practice sessions with graphs
