document.addEventListener('DOMContentLoaded', () => {
    const mathInput = document.getElementById('math-input');
    const mathPreview = document.getElementById('math-preview');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printMathBtn = document.getElementById('print-math-btn');
    let renderTimer;

    // ===========================================
    // SISTEMA DE HISTORIAL DE DIBUJO
    // ===========================================
    let drawHistory = [];
    let historyStep = -1;

    const saveDrawState = () => {
        historyStep++;
        if (historyStep < drawHistory.length) drawHistory.length = historyStep;
        drawHistory.push(canvas.toDataURL());
    };

    window.undoDraw = () => {
        if (historyStep > 0) {
            historyStep--;
            let img = new Image();
            img.src = drawHistory[historyStep];
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
        } else if (historyStep === 0) {
            historyStep = -1;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    window.redoDraw = () => {
        if (historyStep < drawHistory.length - 1) {
            historyStep++;
            let img = new Image();
            img.src = drawHistory[historyStep];
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
            };
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
                mathPreview.textContent = `$$ \\begin{aligned} ${rawContent} \\end{aligned} $$`;
            }
            if (typeof window.MathJax.typesetPromise === 'function') {
                window.MathJax.typesetPromise([mathPreview])
                    .then(() => syncCanvasSize())
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
        const rows = document.getElementById('matrix-rows').value;
        const cols = document.getElementById('matrix-cols').value;
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
    const canvas = document.getElementById('drawing-canvas'); 
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let tool = null; 
    let startX, startY;

    window.setTool = (t) => { 
        const buttons = document.querySelectorAll('.tool-btn');
        if (tool === t) { tool = null; } else { tool = t; }
        buttons.forEach(btn => {
            btn.classList.remove('active-tool');
            if (tool && btn.getAttribute('onclick').includes(`'${tool}'`)) {
                btn.classList.add('active-tool');
            }
        });
    };

    const syncCanvasSize = () => {
        if (mathPreview && canvas) {
            const tempImg = canvas.toDataURL();
            canvas.width = mathPreview.scrollWidth;
            canvas.height = mathPreview.scrollHeight;
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = tempImg;
        }
    };

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { 
            x: (clientX - rect.left) * (canvas.width / rect.width), 
            y: (clientY - rect.top) * (canvas.height / rect.height) 
        };
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
        const pos = getPos(e.changedTouches ? e.changedTouches[0] : e);
        if (tool === 'line' || tool === 'arrow') {
            ctx.strokeStyle = document.getElementById('colorPicker')?.value || '#673ab7';
            ctx.globalAlpha = 1.0; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y);
            if (tool === 'arrow') {
                const angle = Math.atan2(pos.y - startY, pos.x - startX);
                const headLen = 10;
                ctx.lineTo(pos.x - headLen * Math.cos(angle - Math.PI/6), pos.y - headLen * Math.sin(angle - Math.PI/6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen * Math.cos(angle + Math.PI/6), pos.y - headLen * Math.sin(angle + Math.PI/6));
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
                setTimeout(() => { syncCanvasSize(); ctx.drawImage(img, 0, 0); saveDrawState(); }, 1000); 
            }; 
            img.src = savedImg; 
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
    if(printMathBtn) printMathBtn.onclick = () => { renderMath(); setTimeout(() => window.print(), 500); };

    loadFromStorage();
    if(mathInput) mathInput.addEventListener('input', triggerAutoRender);
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
