# 🚀 Configuración de Ollama Local

## Paso 1: Descargar e Instalar Ollama

1. **Windows**: Descargar desde https://ollama.ai/download
2. Ejecutar el instalador
3. Reiniciar la computadora

## Paso 2: Descargar un Modelo de IA

Abre **PowerShell o Terminal** y ejecuta UNA de estas opciones:

### Opción A: Mistral (RECOMENDADO - Balance de velocidad y calidad)
```bash
ollama pull mistral
```
- Tamaño: ~4.1 GB
- Velocidad: Rápido (~2-3 seg por respuesta)
- Calidad: Excelente

### Opción B: Phi (MÁS RÁPIDO - para PCs lentas)
```bash
ollama pull phi
```
- Tamaño: ~2.6 GB
- Velocidad: Ultra rápido (~1 seg)
- Calidad: Buena

### Opción C: Neural Chat (MEJOR PARA CONVERSACIÓN)
```bash
ollama pull neural-chat
```
- Tamaño: ~4 GB
- Velocidad: Medio (~2 seg)
- Calidad: Muy buena para chat

### Opción D: Llama2 (MÁS POTENTE)
```bash
ollama pull llama2
```
- Tamaño: ~3.8 GB
- Velocidad: Medio (~3 seg)
- Calidad: Excelente

---

## Paso 3: Ejecutar Ollama

En una terminal nueva, ejecuta:

```bash
ollama serve
```

Deberías ver:
```
2024-02-04 16:00:00 INFO Server listening on 127.0.0.1:11434
```

⚠️ **IMPORTANTE**: Deja esta ventana abierta mientras uses la app.

---

## Paso 4: Probar la App

1. Abre http://localhost:5173
2. Ve a "Sesión Completa"
3. Haz clic en "Comenzar Sesión"
4. Habla durante 1-2 minutos
5. Haz clic en "Terminar Grabación"
6. **¡Espera 2-5 segundos** para que Ollama procese
7. Verás el feedback generado por IA

---

## 🔧 Cambiar de Modelo

Si quieres usar otro modelo, edita esta línea en `App.jsx` (línea ~123):

```javascript
body: JSON.stringify({
  model: "mistral",  // ← Cambia "mistral" por "phi", "neural-chat", etc.
  prompt: prompt,
  stream: false,
  temperature: 0.7,
}),
```

---

## 📊 Comparación de Modelos

| Modelo | Tamaño | Velocidad | Calidad | RAM Mínima |
|--------|--------|-----------|---------|-----------|
| **phi** | 2.6 GB | ⚡⚡⚡ | ⭐⭐⭐ | 4 GB |
| **mistral** | 4.1 GB | ⚡⚡ | ⭐⭐⭐⭐ | 8 GB |
| **neural-chat** | 4 GB | ⚡⚡ | ⭐⭐⭐⭐ | 8 GB |
| **llama2** | 3.8 GB | ⚡ | ⭐⭐⭐⭐⭐ | 8 GB |

---

## ❓ Solucionar Problemas

### Error: "Ollama no está disponible"

**Solución**:
1. Asegúrate de que ejecutaste `ollama serve` en otra terminal
2. Abre http://localhost:11434 en el navegador - debería mostrar "Ollama is running"
3. Si no funciona, reinicia Ollama

### Muy lento

**Opciones**:
- Cambia a modelo `phi` (más rápido)
- Reduce `temperature` a 0.5 en el código
- Cierra otras aplicaciones

### Errores de memoria

**Solución**:
- Usa modelo `phi` (más ligero)
- Aumenta RAM disponible
- Cierra navegador y otras apps

---

## 🎯 Ventajas de Ollama

✅ **100% Gratis** - Sin costos de API
✅ **Privado** - Los datos no salen tu PC
✅ **Rápido** - Respuestas locales sin latencia de red
✅ **Sin Internet** - Funciona offline
✅ **Flexible** - Cambia modelos fácilmente

---

## 📝 Próximas Actualizaciones

Puedes ajustar el prompt en `App.jsx` para mejorar la calidad del feedback. Ejemplo:

```javascript
const prompt = `Eres un coach profesional de oratoria especializado en TED talks...
[tu prompt personalizado aquí]`;
```

---

## 🚀 ¡Listo!

Ya tienes IA local completamente funcional. Disfruta del análisis de oratoria con IA sin costos. 🎉
