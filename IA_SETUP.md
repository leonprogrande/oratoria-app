# Configuración de IA - Oratoria Pro

## 🎯 Arquitectura de IA Implementada

### 1. **Pose Detection - Detección de Gestos (LOCAL, GRATIS)**
- **Librería**: TensorFlow.js + MediaPipe Pose
- **Modelo**: MoveNet (SINGLEPOSE_LIGHTNING)
- **Ventajas**:
  - ✅ Funciona 100% local (sin servidor)
  - ✅ Sin costos
  - ✅ Privado - los datos no salen del navegador
  - ✅ Rápido (~30ms por frame)

**Qué detecta**:
- Posición de hombros y cabeza (postura)
- Movimiento de manos/muñecas (gestos)
- Historial de 30 frames para detectar patrones de movimiento

**Métricas generadas**:
- `posture`: 'excelente' o 'neutral' según alineación
- `gestures`: Porcentaje de actividad de gestos (0-100%)

---

### 2. **Speech Recognition - Detección de Muletillas (LOCAL, GRATIS)**
- **API**: Web Speech Recognition (nativa del navegador)
- **Idioma**: Español (es-ES)
- **Ventajas**:
  - ✅ 100% gratis (API del navegador)
  - ✅ Sin servidor
  - ✅ Privado

**Qué detecta**:
- Transcripción en tiempo real
- Palabras muletilla: 'eh', 'em', 'mm', 'este', 'o sea', 'bueno', 'tipo', 'sabes', 'literal', 'digamos', 'básicamente', 'mhm'

---

### 3. **Feedback con IA - Análisis Generativo (GRATUITO CON LÍMITES)**

#### Opción Actual: Hugging Face (FREE TIER)
```javascript
// En CombinedSessionMode.jsx
const generateAIFeedback = async (speechText) => {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
    {
      headers: {
        Authorization: `Bearer hf_xxxx`, // Tu token aquí
      },
      method: "POST",
      body: JSON.stringify({ 
        inputs: `Analiza este discurso: "${speechText}". 
                Muletillas: ${fillerStats.count}. 
                Postura: ${poseStats.posture}. 
                Gestos: ${poseStats.gestures}%.
                Dame 3 consejos para mejorar.`
      }),
    }
  );
  // ...
};
```

**Limitaciones del FREE TIER**:
- ⏱️ ~30 segundo delay en respuesta
- 📊 Límite de ~10-15 requests por mes (muy bajo)
- 🔒 Requiere token de Hugging Face

**Token Hugging Face GRATIS**:
1. Ir a https://huggingface.co/join
2. Crear cuenta (gratis)
3. Ir a https://huggingface.co/settings/tokens
4. Crear un token
5. Reemplazar en App.jsx:
```javascript
Authorization: `Bearer tu_token_aqui`
```

---

## 💰 Opciones de IA (Comparativa de Costos)

### Opción 1: Hugging Face Inference API (RECOMENDADO PARA EMPEZAR)
- **Costo**: GRATIS (con límites)
- **Setup**: Requiere token gratis
- **Latencia**: 20-30 segundos
- **Modelos disponibles**: Mistral, LLaMA, etc.
- **Privacidad**: Datos van a servidores Hugging Face

**Ventaja**: Pruebas gratis, fácil de configurar

---

### Opción 2: Ollama Local (MEJOR A LARGO PLAZO)
- **Costo**: GRATIS
- **Setup**: Descargar Ollama + modelo
- **Latencia**: 5-10 segundos (local)
- **Privacidad**: 100% local
- **Requisitos**: ~8GB RAM mínimo

**Instalación**:
```bash
# 1. Descargar desde https://ollama.ai
# 2. Instalar Ollama
# 3. En terminal:
ollama pull mistral  # o phi, neural-chat, etc.
ollama serve

# 4. En App.jsx, cambiar endpoint:
const response = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  body: JSON.stringify({
    model: "mistral",
    prompt: "Tu prompt aquí",
    stream: false
  })
});
```

**Modelos recomendados**:
- `mistral`: 7B - Fast, buena calidad
- `phi`: 2.7B - Ultra rápido
- `neural-chat`: 7B - Optimizado para chat
- `openchat`: 3.5B - Ligero

---

### Opción 3: OpenAI (PAGADO PERO MÁS INTELIGENTE)
- **Costo**: $0.002 por 1K tokens (~$0.01 por sesión)
- **Latencia**: 1-2 segundos
- **Calidad**: Excelente

**Setup**:
```javascript
const generateAIFeedback = async (speechText) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer sk-...`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Analiza mi discurso: "${speechText}". Muletillas: ${fillerStats.count}...`
      }]
    })
  });
};
```

---

### Opción 4: Google Generative AI (GRATIS)
- **Costo**: GRATIS (tier gratuito: 60 requests/min)
- **Latencia**: 2-3 segundos
- **Setup**: Requiere API key gratuita

```javascript
const generateAIFeedback = async (speechText) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY`,
    {
      method: "POST",
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analiza este discurso: "${speechText}"...`
          }]
        }]
      })
    }
  );
};
```

---

## 🚀 Implementación Actual (CombinedSessionMode)

### Flujo de la Sesión:

```
1. Usuario hace clic en "Comenzar Sesión"
   ↓
2. Solicita permisos de cámara + micrófono
   ↓
3. Inicia 3 análisis simultáneos:
   - Speech Recognition → Detecta muletillas
   - Pose Detection → Detecta gestos en tiempo real
   - Audio Level → Detecta proyección de voz
   ↓
4. Usuario habla durante ~2 minutos (configurable)
   ↓
5. Al hacer clic "Terminar Grabación":
   - Procesa transcripción completa
   - Analiza estadísticas finales de muletillas
   - Llama a Hugging Face para feedback con IA
   ↓
6. Muestra resultados:
   - Cantidad de muletillas
   - Actividad de gestos
   - Calidad de postura
   - Feedback generado por IA
```

---

## 🔧 Cómo Cambiar a Otra IA

### Para usar Ollama Local:

**Paso 1: Reemplazar función generateAIFeedback**
```javascript
const generateAIFeedback = async (speechText) => {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      body: JSON.stringify({
        model: "mistral",
        prompt: `Eres un coach de oratoria. Analiza este discurso y proporciona 3 consejos específicos.
        
Transcripción: "${speechText}"
Muletillas: ${fillerStats.count}
Postura: ${poseStats.posture}
Gestos: ${poseStats.gestures}%

Proporciona feedback constructivo y práctico.`,
        stream: false
      })
    });

    const result = await response.json();
    setFeedback(["🤖 Análisis con IA Local", result.response]);
  } catch (err) {
    console.error(err);
    generateBasicFeedback(); // Fallback
  }
};
```

### Para usar Google Generative AI:

**Paso 1: Obtener API key gratis**
- Ir a https://ai.google.dev
- Clic en "Get API Key"
- Copiar la clave

**Paso 2: Reemplazar función**
```javascript
const generateAIFeedback = async (speechText) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Coach de oratoria: Analiza este discurso...
              Discurso: "${speechText}"...`
            }]
          }]
        })
      }
    );

    const result = await response.json();
    const feedback = result.candidates[0].content.parts[0].text;
    setFeedback(["🤖 Análisis con Gemini", feedback]);
  } catch (err) {
    generateBasicFeedback();
  }
};
```

---

## 📊 Recomendación Según Caso de Uso

| Caso | Opción | Razón |
|------|--------|-------|
| **Prototipo/Testing** | Hugging Face Free | Gratis, fácil setup |
| **Producción Local** | Ollama | 100% privado, sin costos |
| **Máxima Calidad** | OpenAI GPT-4 | Mejor análisis, pero pagado |
| **Balance** | Google Gemini Free | Buena calidad, gratis, rápido |

---

## 🔐 Variables de Entorno (.env)

Crea archivo `.env` en la raíz del proyecto:

```env
VITE_HUGGING_FACE_TOKEN=hf_xxxxxxxxxxxx
VITE_GOOGLE_API_KEY=AIzaSy_xxxxxxxxxxxx
VITE_OPENAI_KEY=sk-xxxxxxxxxxxx
```

Luego en App.jsx:
```javascript
const HF_TOKEN = import.meta.env.VITE_HUGGING_FACE_TOKEN;
```

---

## ⚠️ Notas Importantes

1. **Privacidad**: 
   - Pose Detection: 100% local
   - Speech Recognition: 100% local
   - Feedback IA: Depende del proveedor elegido

2. **Costos**:
   - Versión actual: ~$0 (Hugging Face free tier)
   - Si excedes límite: ~$0.01 por sesión (OpenAI)

3. **Latencia**:
   - Pose + Speech: Instantáneo
   - Feedback IA: 1-30 segundos (según proveedor)

4. **Error Handling**:
   - Si falla IA, automáticamente usa feedback básico (generado localmente)
   - No rompe la app

---

## 🎓 Siguientes Pasos

1. ✅ Obtener token Hugging Face gratis (5 min)
2. ✅ Reemplazar token en App.jsx
3. ✅ Probar sesión completa
4. 📝 Evaluar latencia y calidad del feedback
5. 🔄 Cambiar a Ollama o Google Gemini si es necesario
