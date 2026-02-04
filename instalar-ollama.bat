@echo off
REM Script para descargar e instalar Ollama automáticamente

echo.
echo ========================================
echo  Instalador de Ollama para Oratoria Pro
echo ========================================
echo.

REM Verificar si Ollama ya está instalado
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    echo ✓ Ollama ya está instalado
    goto download_model
)

echo Descargando Ollama desde https://ollama.ai...
echo.
echo NOTA: Se abrirá tu navegador. Descarga el instalador y ejecútalo.
echo Luego regresa aquí y presiona Enter.
echo.

start https://ollama.ai/download

pause

REM Verificar de nuevo si se instaló
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ Error: Ollama no se instaló correctamente
    echo Intenta instalarlo manualmente desde https://ollama.ai
    pause
    exit /b 1
)

:download_model
echo.
echo ✓ Ollama detectado
echo.
echo Descargando modelo de IA (mistral)...
echo Esto puede tardar 5-10 minutos según tu velocidad de internet.
echo.

ollama pull mistral

if %errorlevel% neq 0 (
    echo ✗ Error descargando modelo
    pause
    exit /b 1
)

echo.
echo ✓ ¡Modelo descargado exitosamente!
echo.
echo ========================================
echo  Iniciar Ollama
echo ========================================
echo.
echo Iniciando Ollama en http://localhost:11434
echo.
echo IMPORTANTE:
echo - Mantén esta ventana ABIERTA mientras usas Oratoria Pro
echo - Abre http://localhost:5173 en tu navegador
echo - Usa la app normalmente
echo.

ollama serve

pause
