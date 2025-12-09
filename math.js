document.addEventListener('DOMContentLoaded', () => {
    // === DOM REFERENCES ===
    const mathInput = document.getElementById('math-input');
    const mathPreview = document.getElementById('math-preview');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printMathBtn = document.getElementById('print-math-btn');
    const canvas = document.getElementById('drawing-canvas'); 
    
    // Validar si el canvas existe
    if (!canvas) {
        console.error("Error: Elemento 'drawing-canvas' no encontrado.");
        return;
    }
    const ctx = canvas.getContext('2d');
    let renderTimer;

    // ===========================================
    // SISTEMA DE HISTORIAL DE DIBUJO
    // ===========================================
    let drawHistory = [];
    let historyStep = -1;
    let tool = null;
    let drawing = false;
    let startX, startY;

    const saveDrawState = () => {
        historyStep++;
        if (historyStep < drawHistory.length) drawHistory.length = historyStep;
        // Solo guardar si hay algo en el canvas (o si es el primer paso)
        if (historyStep === 0 || drawHistory.length > 0) {
             drawHistory.push(canvas.toDataURL());
        }
    };

    const restoreDrawState = (step) => {
         if (step >= -1 && step < drawHistory.length) {
            historyStep = step;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (historyStep >= 0) {
                 let img = new Image();
                 img.src = drawHistory[historyStep];
                 img.onload = () => {
                     ctx.drawImage(img, 0, 0);
                     saveCanvasToStorage();
                 };
            } else {
                 saveCanvasToStorage(); // Guardar canvas vacío
            }
         }
    };


    window.undoDraw = () => {
        if (historyStep > 0) {
            restoreDrawState(historyStep - 1);
        } else if (historyStep === 0) {
            restoreDrawState(-1);
        }
    };

    window.redoDraw = () => {
        if (historyStep < drawHistory.length - 1) {
             restoreDrawState(historyStep + 1);
        }
    };

    // ===========================================
    // NUEVAS FUNCIONES DE APOYO
    // ===========================================
    window.insertBreak = () => {
        window.insertMath(' \\\\ \n ');
    };

    window.insertTextNode = () => {
        window.insertMath(`\\text{ Resultado: } `);
    };

    // REVERTIDO: Rellena automáticamente con 0
    window.insertSelectedFormula = () => {
        const select = document.getElementById('quick-formula-select');
        if (select && select.value) {
            const formula = select.value.replace(/\?/g, '0');
            window.insertMath(formula);
            select.selectedIndex = 0;
        }
    };

    // ===========================================
    // RENDERIZADO MEJORADO
    // ===========================================
    const renderMath = () => {
        if (window.MathJax && mathInput && mathPreview) {
            let rawContent = mathInput.innerText.replace(/\u00a0/g, ' ').trim();
            if (rawContent === "") {
                mathPreview.textContent = "";
            } else {
                // Usa $$ para display mode y \begin{aligned} para permitir múltiples líneas
                mathPreview.textContent = `$$ \\begin{aligned} ${rawContent} \\end{aligned} $$`;
            }
            if (typeof window.MathJax.typesetPromise === 'function') {
                window.MathJax.typesetPromise([mathPreview])
                    .then(() => syncCanvasSize()) // CRÍTICO: Sincroniza DESPUÉS del renderizado
                    .catch((err) => console.log("Error MathJax:", err));
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

    // REVERTIDO: Genera matriz binaria (1 y 0) automáticamente
    window.insertDynamicMatrix = () => {
        const rows = document.getElementById('matrix-rows')?.value || 2;
        const cols = document.getElementById('matrix-cols')?.value || 2;
        let latex = '\\begin{pmatrix} ';
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                latex += ((i + j) % 2 === 0) ? '1' : '0';
                if (j < cols - 1) latex += ' & ';
            }
            if (i < rows - 1) latex += ' \\\\ ';
        }
        latex += ' \\end{pmatrix} ';
        window.insertMath(latex);
    };

    window.insertMath = (symbol) => {
        if (mathInput) {
            mathInput.focus();
            document.execCommand('insertText', false, symbol);
            triggerAutoRender();
        }
    };

    // ===========================================
    // SISTEMA DE DIBUJO
    // ===========================================

    window.setTool = (t) => { 
        const buttons = document.querySelectorAll('.tool-btn');
        if (tool === t) { tool = null; } else { tool = t; }
        buttons.forEach(btn => {
            btn.classList.remove('active-tool');
            // Usamos startsWith para hacer el match más robusto
            if (tool && btn.getAttribute('onclick')?.startsWith(`window.setTool('${tool}'`)) {
                btn.classList.add('active-tool');
            }
        });
    };

    /**
     * CRÍTICO: Sincroniza el tamaño del canvas con el contenido MathJax.
     * Exportada a window para ser llamada por MathJax y el evento beforeprint.
     */
    const syncCanvasSize = () => {
        if (mathPreview && canvas) {
            const tempImg = canvas.toDataURL();
            
            // Usamos scrollWidth/scrollHeight para capturar el tamaño completo de la fórmula
            canvas.width = mathPreview.scrollWidth || mathPreview.offsetWidth; 
            canvas.height = mathPreview.scrollHeight || mathPreview.offsetHeight;
            
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = tempImg;
        }
    };
    window.syncCanvasSize = syncCanvasSize; // Exportada para el evento beforeprint

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // CRÍTICO: Corrige la posición del dibujo en pantallas de alta densidad/zoom
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
        
        // Aseguramos que el evento de toque finalice correctamente
        const finalEvent = e.changedTouches ? e.changedTouches[0] : e;
        const pos = getPos(finalEvent);
        
        // Redibujar la forma final (línea/flecha)
        if (tool === 'line' || tool === 'arrow') {
            ctx.strokeStyle = document.getElementById('colorPicker')?.value || '#673ab7';
            ctx.globalAlpha = 1.0; ctx.lineWidth = 2;
            ctx.beginPath(); 
            ctx.moveTo(startX, startY); 
            ctx.lineTo(pos.x, pos.y);
            
            if (tool === 'arrow') {
                const angle = Math.atan2(pos.y - startY, pos.x - startX);
                drawArrowHead(angle, pos.x, pos.y);
            }
            ctx.stroke();
        }
        
        drawing = false; 
        saveDrawState(); 
        saveCanvasToStorage(); 
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', stopDraw);
    canvas.addEventListener('touchcancel', stopDraw); // Manejo de cancelación de toque

    window.clearCanvas = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        localStorage.removeItem('canvasStorage');
        drawHistory = [];
        historyStep = -1;
    };

    const saveToStorage = () => { if(mathInput) localStorage.setItem('mathStorage', mathInput.innerText); };
    const saveCanvasToStorage = () => { localStorage.setItem('canvasStorage', canvas.toDataURL()); };

    const loadFromStorage = () => {
        const savedText = localStorage.getItem('mathStorage');
        if (savedText && mathInput) { mathInput.innerText = savedText; renderMath(); }
        const savedImg = localStorage.getItem('canvasStorage');
        if (savedImg) { 
            const img = new Image(); 
            img.onload = () => { 
                // CRÍTICO: Un pequeño delay para dar tiempo a MathJax/CSS antes de dibujar
                setTimeout(() => { 
                    syncCanvasSize(); 
                    ctx.drawImage(img, 0, 0); 
                    // Aseguramos que el estado inicial se guarde en el historial
                    saveDrawState(); 
                }, 800); 
            }; 
            img.src = savedImg; 
        } else {
             // Si no hay imagen guardada, sincroniza el tamaño de todas formas.
            setTimeout(syncCanvasSize, 500);
        }
    };

    if(undoBtn) undoBtn.onclick = () => { 
        if(tool) { window.undoDraw(); } 
        else { mathInput.focus(); document.execCommand('undo'); triggerAutoRender(); }
    };
    if(redoBtn) redoBtn.onclick = () => { 
        if(tool) { window.redoDraw(); }
        else { mathInput.focus(); document.execCommand('redo'); triggerAutoRender(); }
    };
    
    if(clearBtn) clearBtn.onclick = () => { 
        if(confirm("¿Limpiar todo?")) { mathInput.innerText = ''; window.clearCanvas(); localStorage.removeItem('mathStorage'); renderMath(); } 
    };
    
    // CRÍTICO: Solución de Impresión/Alineación
    if(printMathBtn) printMathBtn.onclick = () => { 
        renderMath(); // Asegura el último renderizado de la fórmula
        window.syncCanvasSize(); // Sincroniza el canvas al tamaño final
        window.print(); // Ejecuta la impresión directamente
    };
    
    // CRÍTICO: Evento de Impresión para Sincronización
    window.addEventListener('beforeprint', window.syncCanvasSize);


    loadFromStorage();
    if(mathInput) mathInput.addEventListener('input', triggerAutoRender);
    
    // Ejecutar una sincronización inicial después de la carga para asegurar dimensiones correctas
    window.addEventListener('resize', syncCanvasSize);
    setTimeout(syncCanvasSize, 50);
});

// ===========================================
// FUNCIONES DE ESTILO DE RESULTADO
// ===========================================
window.boxResult = () => {
    window.insertMath(`\\boxed{ Resultado } `);
};
window.boldResult = () => {
    window.insertMath(`\\mathbf{ Resultado } `);
};
window.colorResult = () => {
    window.insertMath(`\\color{blue}{ Resultado } `);
};
