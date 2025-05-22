// Prefijo que se usará como palabra clave para activar comandos
const ordenPrefijo = "Siri"; // Define el prefijo que el usuario debe decir para activar los comandos.


// Espera a que el contenido del DOM esté completamente cargado antes de ejecutar el script
document.addEventListener("DOMContentLoaded", () => {
  // Se obtienen los elementos del DOM que se utilizarán en el script
  const startBtn = document.getElementById("startBtn"); // Botón para iniciar el reconocimiento de voz
  const outputText = document.getElementById("outputText"); // Elemento donde se mostrarán los comandos reconocidos
  const msgText = document.getElementById("msgText"); // Elemento donde se mostrarán mensajes adicionales

  // Mensaje inicial que indica al usuario que debe decir el prefijo para dar una orden
  outputText.innerHTML = `Di ${ordenPrefijo} para dar una orden`;

  let recognition; // Variable para almacenar la instancia de reconocimiento de voz
  let stoppedManually = false; // Bandera para indicar si el reconocimiento se detuvo manualmente

  // Verificar compatibilidad del navegador con la API de reconocimiento de voz
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition(); // Crear una nueva instancia de reconocimiento de voz
    recognition.continuous = true; // Configurar el reconocimiento para que sea continuo
    recognition.lang = "es-ES"; // Establecer el idioma a español (España)
  } else {
    // Si el navegador no es compatible, se muestra un mensaje de alerta y se termina el script
    alert("Tu navegador no soporta reconocimiento de voz.");
    return; // Termina la ejecución si no es compatible
  }

  // Evento para iniciar el reconocimiento al hacer doble clic en el botón
  startBtn.addEventListener("dblclick", () => {
    stoppedManually = false; // Reiniciar la bandera de detención manual
    recognition.start(); // Iniciar el reconocimiento de voz
    startBtn.disabled = true; // Deshabilitar el botón para evitar múltiples clics
    outputText.textContent = `Escuchando... Di ${ordenPrefijo} para interactuar.`; // Actualizar el mensaje en pantalla
    msgText.innerHTML = ""; // Limpiar mensajes anteriores
  });

  // Manejar resultados de reconocimiento de voz
  recognition.onresult = (event) => {
    // Obtener el texto reconocido del resultado más reciente y convertirlo a mayúsculas
    let transcript = event.results[event.results.length - 1][0].transcript.trim().toUpperCase();
    console.log("Texto reconocido:", transcript); // Mostrar en la consola el texto reconocido

    // Verificar si el comando comienza con el prefijo definido
    if (transcript.startsWith(ordenPrefijo.toUpperCase())) {
      // Si el prefijo está presente, mostrar el comando reconocido en pantalla
      outputText.innerHTML = `Comando reconocido: "<strong><em>${transcript}</em></strong>"`;
      msgText.innerHTML = "Consultando al asistente..."; // Indicar que se está consultando al asistente

      // Enviar el mensaje al servidor PHP
      fetch("http://34.237.124.14/iot/api-gpt-php-examen/endpoints/chat.php", {
        method: "POST", // Método de la solicitud
        headers: {
          "Content-Type": "application/json", // Tipo de contenido de la solicitud
        },
        body: JSON.stringify({ message: transcript }), // Convertir el mensaje a formato JSON
      })
        .then((response) => response.json()) // Procesar la respuesta en formato JSON
        .then((data) => {
          console.log("Respuesta de la API:", data); // Mostrar en la consola la respuesta de la API
          // Verificar si la respuesta contiene un mensaje
          if (data && data.data && data.data.reply) {
            // Mostrar la respuesta recibida en pantalla
            msgText.innerHTML = `Respuesta: <strong>${data.data.reply.trim()}</strong>`;
          } else {
            // Mensaje en caso de que no se reciba respuesta válida
            msgText.innerHTML = "No se recibió respuesta del servidor.";
          }
        })
        .catch((error) => {
          // Manejo de errores en la conexión con la API
          console.error("Error al conectar con el servidor:", error);
          msgText.innerHTML = "Error al comunicarse con la API."; // Mensaje de error en la interfaz
        });
    } else {
      // Si no se dice el prefijo, mostrar un mensaje solicitando que se inicie con "Siri"
      outputText.innerHTML = "Por favor, comienza con 'Siri'.";
    }

    // Verificar si se incluye la orden para detener el reconocimiento
    if (transcript.includes(ordenPrefijo + " DETENTE")) {
      stoppedManually = true; // Marcar que se detuvo manualmente
      recognition.stop(); // Detener el reconocimiento de voz
      startBtn.disabled = false; // Habilitar el botón nuevamente
      outputText.textContent = "Detenido. Haz doble clic en el botón para iniciar nuevamente."; // Mensaje en pantalla
      msgText.innerHTML = ""; // Limpiar mensajes adicionales
    }
  };

  // Manejo de errores en el reconocimiento de voz
  recognition.onerror = (event) => {
    console.error("Error en el reconocimiento:", event.error); // Mostrar error en la consola
    // Verificar el tipo de error
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      alert("Permiso de micrófono denegado o bloqueado."); // Avisar al usuario sobre el problema de permisos
    } else if (event.error === "network") {
      alert("Problema de conexión a internet."); // Avisar sobre problemas de red
    }
    recognition.stop(); // Detener el reconocimiento
    startBtn.disabled = false; // Habilitar el botón nuevamente
  };

  // Si el reconocimiento se detiene inesperadamente, reiniciar el proceso
  recognition.onend = () => {
    if (!stoppedManually) { // Solo reiniciar si no se detuvo manualmente
      msgText.innerHTML = "El reconocimiento se detuvo inesperadamente.<br>Hablando nuevamente..."; // Mensaje de reinicio
      recognition.start(); // Iniciar nuevamente el reconocimiento
    }
  };
});
