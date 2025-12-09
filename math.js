document.addEventListener('DOMContentLoaded', () => {
    // === DOM REFERENCES ===
    const mathInput = document.getElementById('math-input');
    const mathPreview = document.getElementById('math-preview');
    const canvas = document.getElementById('drawing-canvas'); 
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printMathBtn = document.getElementById('print-math-btn');
    
    // Validar si el canvas existe antes de intentar obtener el contexto
    if (!canvas) {
        console.error("Error: Elemento 'drawing-canvas' no encontrado.");
        return;
    }
    const ctx = canvas.getContext('2d');

    // === CONFIGURACIÓN Y ESTADO ===
    let renderTimer;
    let tool = null; 
    let drawHistory = [];
    let historyStep = -1;

    // === DIBUJO Y MANEJO DE HISTORIAL ===
    let drawing = false;
    let startX, startY;

    /**
     * Sincroniza el tamaño del canvas con el contenido MathJax renderizado.
     * CRÍTICO para la alineación correcta en impresión.
     */
    const syncCanvasSize = () => {
        if (mathPreview && canvas) {
            const tempImg = canvas.toDataURL();
            
            // 1. Forzar el tamaño del canvas al tamaño actual del contenido
            canvas.width = mathPreview.scrollWidth || mathPreview.offsetWidth;
            canvas.height = mathPreview.scrollHeight || mathPreview.offsetHeight;
            
            // 2. Redibujar el contenido anterior
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = tempImg;
        }
    };
    window.syncCanvasSize = syncCanvasSize; // Exponer para MathJax y eventos externos

    const saveDrawState = () => {
        if (tool === null) return; // No guardar si no se estaba dibujando activamente
        historyStep++;
        if (historyStep < drawHistory.length) drawHistory.length = historyStep;
        drawHistory.push(canvas.toDataURL());
    };

    const restoreDrawState = (step) => {
        if (step >= 0 && step < drawHistory.length) {
            historyStep = step;
            let img = new Image();
            img.src = drawHistory[historyStep];
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
            saveCanvasToStorage();
        } else if (step === -1) {
            historyStep = -1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveCanvasToStorage();
        }
    };

    window.undoDraw = () => {
        if (historyStep > 0) {
            restoreDrawState(historyStep - 1);
        } else if (historyStep === 0) {
            restoreDrawState(-1); // Limpiar si es el primer paso
        }
    };

    window.redoDraw = () => {
        if (historyStep < drawHistory.length - 1) {
            restoreDrawState(historyStep + 1);
        }
    };

    // === MANEJO DE ENTRADA Y TECLADO ===

    // Función unificada para insertar texto
    window.insertMath = (symbol) => {
        if (mathInput) {
            mathInput.focus();
            document.execCommand('insertText', false, symbol);
            triggerAutoRender();
        }
    };

    // REVERTIDO: Genera matriz binaria (1 y 0) automáticamente
    window.insertDynamicMatrix = () => {
        const rows = document.getElementById('matrix-rows')?.value || 2;
        const cols = document.getElementById('matrix-cols')?.value || 2;
        let latex = '\\begin{pmatrix} ';
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                // Alterna entre 1 y 0 para un ejemplo visual
                latex += ((i + j) % 2 === 0) ? '1' : '0';
                if (j < cols - 1) latex += ' & ';
            }
            if (i < rows - 1) latex += ' \\\\ ';
        }
        latex += ' \\end{pmatrix} ';
        window.insertMath(latex);
    };
    
    // REVERTIDO: Rellena automáticamente con 0
    window.insertSelectedFormula = () => {
        const select = document.getElementById('quick-formula-select');
        if (select && select.value) {
            // Reemplaza el placeholder '?' con '0' o usa el valor tal cual si no hay '?'
            const formula = select.value.replace(/\?/g, '0'); 
            window.insertMath(formula);
            select.selectedIndex = 0;
        }
    };

    // === FUNCIONES DE APOYO (Mantener tus funciones originales) ===
    window.insertBreak = () => { window.insertMath(' \\\\ \n '); };
    window.insertTextNode = () => { window.insertMath(`\\text{ Resultado: } `); };

    // === RENDERIZADO MATHJAX ===
    const renderMath = () => {
        if (window.MathJax && mathInput && mathPreview) {
            let rawContent = mathInput.innerText.replace(/\u00a0/g, ' ').trim();
            // Asegura que el contenido esté dentro del ambiente 'aligned' para múltiples líneas
            mathPreview.textContent = rawContent === "" 
                ? "" 
                : `$$ \\begin{aligned} ${rawContent} \\end{aligned} $$`;

            if (typeof window.MathJax.typesetPromise === 'function') {
                window.MathJax.typesetPromise([mathPreview])
                    .then(() => syncCanvasSize()) // CRÍTICO: Sincroniza DESPUÉS del renderizado
                    .catch((err) => console.error("Error MathJax:", err));
            } else {
                window.MathJax.typeset([mathPreview]);
                syncCanvasSize();
            }
        }
    };

    const triggerAutoRender = () => {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(() => {
            renderMath();
            saveToStorage(); 
        }, 300); 
    };

    // === LÓGICA DE HERRAMIENTAS DE DIBUJO ===

    window.setTool = (t) => { 
        const buttons = document.querySelectorAll('.tool-btn');
        // Alternar la herramienta
        if (tool === t) { tool = null; } else { tool = t; } 
        
        // Actualizar el estado visual de los botones
        buttons.forEach(btn => {
            btn.classList.remove('active-tool');
            if (tool && btn.getAttribute('onclick')?.includes(`'${tool}'`)) {
                btn.classList.add('active-tool');
            }
        });
    };

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        // Soporte unificado para mouse y toque
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // Corrección de escala para monitores de alta densidad (Retina, etc.)
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return { 
            x: (clientX - rect.left) * scaleX, 
            y: (clientY - rect.top) * scaleY
        };
    };
    
    const drawArrowHead = (angle, x, y, headLen = 10) => {
        ctx.lineTo(x - headLen * Math.cos(angle - Math.PI/6), y - headLen * Math.sin(angle - Math.PI/6));
        ctx.moveTo(x, y);
        ctx.lineTo(x - headLen * Math.cos(angle + Math.PI/6), y - headLen * Math.sin(angle + Math.PI/6));
    };

    const startDraw = (e) => {
        if (!tool) return; 
        drawing = true;
        const pos = getPos(e);
        startX = pos.x; startY = pos.y;
        
        // Configuración de pincel
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (e.type === 'touchstart') e.preventDefault();
    };

    const draw = (e) => {
        if (!drawing || !tool) return;
        const pos = getPos(e);
        ctx.strokeStyle = document.getElementById('colorPicker')?.value || '#673ab7';

        if (tool === 'pen' || tool === 'highlighter') {
            ctx.globalAlpha = (tool === 'highlighter') ? 0.3 : 1.0;
            ctx.lineWidth = (tool === 'highlighter') ? 15 : 2;
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
        
        if (e.type === 'touchmove') e.preventDefault();
    };
    
    const stopDraw = (e) => {
        if (!drawing) return;
        const pos = getPos(e.changedTouches ? e.changedTouches[0] : e);

        if (tool === 'line' || tool === 'arrow') {
            // Al dibujar formas, limpiamos el path y redibujamos la línea final
            ctx.strokeStyle = document.getElementById('colorPicker')?.value || '#673ab7';
            ctx.globalAlpha = 1.0; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
            
            if (tool === 'arrow') {
                const angle = Math.atan2(pos.y - startY, pos.x - startX);
                drawArrowHead(angle, pos.x, pos.y);
            }
            ctx.stroke();
        }
        
        // Fin del proceso
        drawing = false; 
        saveDrawState(); 
        saveCanvasToStorage(); 
    };

    // === EVENT LISTENERS DE DIBUJO ===
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', stopDraw);

    window.clearCanvas = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        localStorage.removeItem('canvasStorage');
        drawHistory = [];
        historyStep = -1;
    };

    // === ALMACENAMIENTO LOCAL ===
    const saveToStorage = () => { if(mathInput) localStorage.setItem('mathStorage', mathInput.innerText); };
    const saveCanvasToStorage = () => { localStorage.setItem('canvasStorage', canvas.toDataURL()); };

    const loadFromStorage = () => {
        const savedText = localStorage.getItem('mathStorage');
        if (savedText && mathInput) { mathInput.innerText = savedText; renderMath(); }
        
        const savedImg = localStorage.getItem('canvasStorage');
        if (savedImg) { 
            const img = new Image(); 
            img.onload = () => { 
                // CRÍTICO: Esperar 1 segundo para que MathJax y el CSS carguen completamente 
                // antes de dibujar, evitando desalineaciones al cargar.
                setTimeout(() => { 
                    syncCanvasSize(); 
                    ctx.drawImage(img, 0, 0); 
                    saveDrawState(); 
                }, 1000); 
            }; 
            img.src = savedImg; 
        } else {
             // Si no hay dibujo guardado, sincroniza el tamaño de todas formas.
            setTimeout(syncCanvasSize, 500); 
        }
    };
    
    // === EVENTOS DE UI ===
    
    // Configuración de botones de Deshacer/Rehacer
    if(undoBtn) undoBtn.onclick = () => { 
        if(tool) { window.undoDraw(); } 
        else { mathInput.focus(); document.execCommand('undo'); triggerAutoRender(); }
    };
    if(redoBtn) redoBtn.onclick = () => { 
        if(tool) { window.redoDraw(); }
        else { mathInput.focus(); document.execCommand('redo'); triggerAutoRender(); }
    };
    
    // Configuración de botón Limpiar
    if(clearBtn) clearBtn.onclick = () => { 
        if(confirm("¿Limpiar todo el contenido y dibujo?")) { 
            mathInput.innerText = ''; 
            window.clearCanvas(); 
            localStorage.removeItem('mathStorage'); 
            renderMath(); 
        } 
    };
    
    // Configuración de botón Imprimir (Solución de alineación de Canvas)
    if(printMathBtn) printMathBtn.onclick = () => { 
        renderMath(); 
        // CRÍTICO: Sincronizar justo antes de imprimir
        syncCanvasSize(); 
        // Pequeño retraso para que el navegador procese los cambios de MathJax/Canvas
        setTimeout(() => window.print(), 500); 
    };

    // === INICIALIZACIÓN ===
    loadFromStorage();
    if(mathInput) mathInput.addEventListener('input', triggerAutoRender);

    // CRÍTICO: Evento de impresión para asegurar la alineación final
    window.addEventListener('beforeprint', () => {
        // Doble verificación de sincronización de Canvas/MathJax
        syncCanvasSize();
    });

    // === FUNCIONES DE ESTILO DE RESULTADO ===
    window.boxResult = () => { window.insertMath(`\\boxed{ Resultado } `); };
    window.boldResult = () => { window.insertMath(`\\mathbf{ Resultado } `); };
    window.colorResult = () => { window.insertMath(`\\color{blue}{ Resultado } `); };
});
