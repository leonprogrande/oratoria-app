# ðŸŽ¤ Oratoria Pro - Setup RÃ¡pido

## âš¡ Quick Start (5 minutos)

### 1ï¸âƒ£ Instalar Ollama
Ejecuta este archivo en la raÃ­z del proyecto:
```bash
instalar-ollama.bat
```

O manualmente:
- Descargar: https://ollama.ai/download
- Instalar
- En terminal: `ollama pull mistral`

### 2ï¸âƒ£ Iniciar Ollama
Abre una terminal y ejecuta:
```bash
ollama serve
```

VerÃ¡s: `Server listening on 127.0.0.1:11434`

**âš ï¸ MantÃ©n esta terminal abierta mientras usas la app**

### 3ï¸âƒ£ Iniciar la App
En OTRA terminal:
```bash
npm run dev
```

Abre: http://localhost:5173

### 4ï¸âƒ£ Usar la SesiÃ³n Completa
1. Haz clic en la pestaÃ±a **"SesiÃ³n Completa"** (arriba)
2. Haz clic en **"Comenzar SesiÃ³n"**
3. Permite cÃ¡mara + micrÃ³fono
4. **Habla durante 1-2 minutos**
5. Haz clic en **"Terminar GrabaciÃ³n"**
6. **Â¡Espera 2-5 segundos** para el anÃ¡lisis con IA
7. Ver feedback personalizado

---

## ðŸŽ¯ QuÃ© Analiza

âœ… **Muletillas** - Palabras relleno (eh, este, o sea, etc.)
âœ… **Gestos** - Actividad de manos y brazos
âœ… **Postura** - AlineaciÃ³n de cabeza y hombros
âœ… **IA Feedback** - Recomendaciones personalizadas

---

## ðŸ—ï¸ Arquitectura

```
Frontend (React 19 + Vite)
    â†“
    â”œâ”€ Web Speech Recognition API (Local)
    â”œâ”€ TensorFlow.js + MediaPipe Pose (Local)
    â””â”€ Web Audio API (Local)
    â†“
Ollama Local API (http://localhost:11434)
    â†“
AI Models (Mistral, Phi, Neural-Chat, etc.)
```

---

## ðŸ“ Estructura del Proyecto

```
oratoria-app/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ App.jsx                 â† CÃ³digo principal (3 componentes)
â”‚   â”œâ”€â”€ index.css
â”‚   â”œâ”€â”€ constants/
â”‚   â”‚   â””â”€â”€ fillers.js
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â””â”€â”€ handDetection.js
â”‚   â””â”€â”€ main.jsx
â”œâ”€â”€ public/
â”œâ”€â”€ .github/
â”‚   â””â”€â”€ copilot-instructions.md â† GuÃ­a para AI agents
â”œâ”€â”€ OLLAMA_SETUP.md             â† Setup detallado de Ollama
â”œâ”€â”€ IA_SETUP.md                 â† Comparativa de IA options
â”œâ”€â”€ instalar-ollama.bat         â† Script de instalaciÃ³n
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ tailwind.config.js
â”œâ”€â”€ package.json
â””â”€â”€ README.md
```

---

## ðŸ”§ Componentes React

### 1. **SpeechCoachApp** (Root)
- NavaciÃ³n con 3 tabs
- Renderiza el componente activo

### 2. **CombinedSessionMode** (NUEVO)
- SesiÃ³n completa con IA
- Graba video + audio
- Analiza muletillas, gestos, postura
- Genera feedback con Ollama

### 3. **MemorizeMode** (Existente)
- MemorizaciÃ³n de texto
- DetecciÃ³n de muletillas
- AnÃ¡lisis sin IA

### 4. **CameraMode** (Existente)
- AnÃ¡lisis de movimiento
- AnÃ¡lisis de audio
- Feedback bÃ¡sico en tiempo real

---

## ðŸš€ Comandos Ãštiles

```bash
# Desarrollo
npm run dev              # Inicia servidor en http://localhost:5173

# Build
npm run build           # Crea dist/ para producciÃ³n
npm run preview         # Sirve dist/ localmente

# Linting
npm run lint            # Valida cÃ³digo con ESLint

# Ollama
ollama serve            # Inicia API local (puerto 11434)
ollama pull mistral     # Descarga modelo Mistral
ollama pull phi         # Descarga modelo Phi (mÃ¡s rÃ¡pido)
```

---

## ðŸ”Œ Dependencias Principales

```json
{
  "react": "^19.2.0",                           // Framework UI
  "react-dom": "^19.2.0",                       // DOM rendering
  "lucide-react": "^0.563.0",                   // Icons
  "@tensorflow/tfjs": "latest",                 // ML framework
  "@tensorflow-models/pose-detection": "latest", // Pose detection
  "@mediapipe/hands": "latest",                  // Hand detection
  "@mediapipe/camera_utils": "latest"            // Camera helper
}
```

---

## ðŸŽ¨ UI Features

- **Tailwind CSS**: Styling (sin custom CSS)
- **Color scheme**: Indigo primary, slate neutrals
- **Responsive**: Mobile-friendly (`md:` breakpoint)
- **Icons**: Lucide React (24+ icons usados)
- **Animations**: Pulse, ping para feedback visual

---

## ðŸ“Š MÃ©tricas Capturadas

### Por SesiÃ³n:
- `transcript`: Texto completo de lo grabado
- `fillerStats.count`: Total de muletillas
- `fillerStats.found`: Lista de muletillas Ãºnicas
- `poseStats.gestures`: Porcentaje de actividad (0-100%)
- `poseStats.posture`: Calidad de postura ('neutral' o 'excelente')
- `feedback`: Array de consejos de IA

---

## âš™ï¸ ConfiguraciÃ³n

### Cambiar Modelo de Ollama
Edita `App.jsx` lÃ­nea ~130:
```javascript
model: "mistral"  // Cambia a: phi, neural-chat, llama2
```

### Ajustar Temperatura (Creatividad)
```javascript
temperature: 0.7  // 0.0 (determinista) a 1.0 (creativo)
```

### Modificar Muletillas Detectadas
Edita `App.jsx` lÃ­nea ~253 (arreglo `fillers`):
```javascript
const fillers = ['eh', 'em', 'mm', 'este', ...];
```

---

## ðŸ› Troubleshooting

| Problema | SoluciÃ³n |
|----------|----------|
| "Ollama no estÃ¡ disponible" | Ejecuta `ollama serve` en otra terminal |
| CÃ¡mara/micrÃ³fono no funciona | Revisa permisos del navegador (icono candado) |
| Muy lento | Usa modelo `phi` en lugar de `mistral` |
| Errores de memoria | Cierra otras apps, usa `phi` |
| No aparece feedback IA | Espera 5-10 segundos, revisa consola (F12) |

---

## ðŸ“š DocumentaciÃ³n Adicional

- **OLLAMA_SETUP.md** - Setup detallado de Ollama
- **IA_SETUP.md** - Comparativa de opciones de IA
- **.github/copilot-instructions.md** - GuÃ­a para AI agents

---

## ðŸŽ“ PrÃ³ximas Features

- [ ] Guardar sesiones en localStorage
- [ ] Exportar resultados como PDF
- [ ] AnÃ¡lisis de emociones
- [ ] Comparar sesiones anteriores
- [ ] VersiÃ³n de escritorio (Electron/Tauri)

---

## ðŸ“„ Licencia

MIT - Libre para uso personal y comercial

---

## ðŸ¤ Contribuciones

Â¡Bienvenido contribuir! Abre un issue o PR en GitHub.

---

**Hecho con â¤ï¸ para oradores que quieren mejorar** ðŸŽ¤âœ¨

