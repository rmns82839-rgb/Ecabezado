// graficador.js

// 1. Inicializar Tablero (Forzamos dimensiones exactas)
let board = JXG.JSXGraph.initBoard('box', {
    boundingbox: [-10, 10, 10, -10], 
    axis: true, 
    showCopyright: false, 
    grid: true,
    pan: { enabled: true, needShift: false },
    zoom: { wheel: true },
    keepaspectratio: true // Mantiene los puntos en su lugar correcto
});

let pointsArray = []; 
let myLine = null; 

// 2. Añadir Puntos (Posicionamiento Exacto)
function addPoint() {
    const xInput = document.getElementById('ptX');
    const yInput = document.getElementById('ptY');
    const x = parseFloat(xInput.value);
    const y = parseFloat(yInput.value);
    
    if (!isNaN(x) && !isNaN(y)) {
        // Creamos el punto y forzamos el renderizado inmediato
        let p = board.create('point', [x, y], { 
            name: `(${x},${y})`, 
            size: 4, 
            color: '#ff5722', 
            strokeColor: '#fff', 
            fixed: false 
        });
        
        pointsArray.push(p);
        
        // Actualizamos la línea si ya existe
        if (myLine) board.update();
        
        // Limpiamos inputs para el siguiente
        xInput.value = '';
        yInput.value = '';
        xInput.focus();
    } else {
        alert("Ingresa números válidos.");
    }
}

// 3. Unión de Puntos Interactiva
function toggleLine() {
    if (pointsArray.length < 2) {
        alert("Añade al menos 2 puntos.");
        return;
    }
    
    if (myLine) {
        board.removeObject(myLine);
        myLine = null;
    } else {
        myLine = board.create('curve', [
            function(t) { 
                let p1 = Math.floor(t); let p2 = Math.ceil(t);
                if (p2 >= pointsArray.length) return pointsArray[pointsArray.length-1].X();
                return pointsArray[p1].X() + (t - p1) * (pointsArray[p2].X() - pointsArray[p1].X());
            },
            function(t) {
                let p1 = Math.floor(t); let p2 = Math.ceil(t);
                if (p2 >= pointsArray.length) return pointsArray[pointsArray.length-1].Y();
                return pointsArray[p1].Y() + (t - p1) * (pointsArray[p2].Y() - pointsArray[p1].Y());
            },
            0, function() { return pointsArray.length - 1; }
        ], { strokeColor: '#ff9800', strokeWidth: 3 });
    }
}

// 4. Captura de Imagen (Motor Reforzado)
function captureBoard() {
    try {
        // Capturamos el plano como imagen de alta calidad
        const imgURL = board.renderer.canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        
        downloadLink.href = imgURL;
        downloadLink.download = "grafico_idamar_pro.png";
        
        // Añadimos al documento para simular clic real y evitar bloqueos
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (e) {
        console.error("Error en captura:", e);
        alert("Tu navegador bloqueó la captura automática. Por favor, usa el botón IMPRIMIR PDF.");
    }
}

// 5. Graficar Funciones
function captureBoard() {
    try {
        const canvas = document.querySelector('#box canvas');
        if (canvas) {
            // Convertimos a imagen
            const imgData = canvas.toDataURL("image/png");
            
            // Creamos un enlace invisible
            const link = document.createElement('a');
            link.href = imgData;
            link.download = 'grafico_idamar_v1.png';
            
            // Forzamos el clic para que el navegador lo entienda como descarga manual
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("No se detectó el área de dibujo. Intenta con el botón PDF.");
        }
    } catch (e) {
        console.error(e);
        alert("Bloqueo del navegador detectado. Por favor, toma una captura de pantalla manual o usa el botón PDF.");
    }
}

// 6. Limpiar Tablero
function resetBoard() {
    JXG.JSXGraph.freeBoard(board);
    pointsArray = [];
    myLine = null;
    board = JXG.JSXGraph.initBoard('box', {
        boundingbox: [-10, 10, 10, -10], axis: true, showCopyright: false, grid: true
    });
}
