# 🎤 Oratoria Pro

Coach de oratoria con **IA local** para mejorar tu expresión corporal, eliminar muletillas y dominar el arte de hablar en público.

## ✨ Features

🎥 **Análisis en Tiempo Real**
- Detección de muletillas (español)
- Análisis de gestos con TensorFlow.js
- Detección de postura corporal

🤖 **Feedback Inteligente con IA**
- Ollama local (100% privado, sin costos)
- Recomendaciones personalizadas
- Análisis basado en postura, gestos y voz

📊 **Tres Modos de Práctica**
- **Sesión Completa**: Video + Audio + Análisis IA
- **Memorización**: Aprender discursos con detección de muletillas
- **Cámara**: Análisis de movimiento corporal en tiempo real

## 🚀 Quick Start

### Requisitos
- Node.js 20.19+ o 22.12+
- npm o yarn
- Ollama (descarga gratis: https://ollama.ai)

### Instalación (5 minutos)

1. **Instalar dependencias**
```bash
npm install
```

2. **Instalar Ollama**
```bash
# Opción 1: Automático (Windows)
instalar-ollama.bat

# Opción 2: Manual
# Descargar y ejecutar instalador de https://ollama.ai
ollama pull mistral
```

3. **Iniciar Ollama** (en una terminal)
```bash
ollama serve
```

4. **Iniciar la app** (en otra terminal)
```bash
npm run dev
```

5. **Abrir en navegador**
```
http://localhost:5173
```

## 📖 Documentación

- **[QUICK_START.md](QUICK_START.md)** - Setup rápido
- **[OLLAMA_SETUP.md](OLLAMA_SETUP.md)** - Configuración detallada de Ollama
- **[IA_SETUP.md](IA_SETUP.md)** - Opciones de IA (Ollama, OpenAI, Google, etc.)
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Guía para AI agents

## 🛠️ Desarrollo

```bash
# Dev server
npm run dev

# Build para producción
npm run build

# Previsualizar build
npm run preview

# Linting
npm run lint
```

## 🏗️ Arquitectura

```
React 19 + Vite
├── Speech Recognition API (Muletillas)
├── TensorFlow.js + MediaPipe (Gestos)
└── Ollama Local API (Feedback IA)
```

## 📦 Stack Tecnológico

- **Frontend**: React 19, Vite 7, Tailwind CSS
- **ML**: TensorFlow.js, MediaPipe Pose
- **IA**: Ollama (Mistral, Phi, etc.)
- **UI**: Lucide React icons
- **Idioma**: Español

## 🎯 Casos de Uso

- 🎤 Preparar presentaciones TED
- 📢 Mejorar habilidades de público hablante
- 🎓 Practicar discursos importantes
- 💼 Entrenar para entrevistas

## 🔐 Privacidad

✅ Toda la IA corre localmente en tu PC
✅ Los datos NO se envían a servidores
✅ 100% privado y seguro

## 💰 Costo

✅ **GRATIS** - Ollama local sin costos

## 🤝 Contribuciones

¡Bienvenidas! Abre un issue o PR.

## 📄 Licencia

MIT

---

**Hecho con ❤️ para oradores** 🎤✨
