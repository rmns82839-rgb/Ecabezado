document.addEventListener('DOMContentLoaded', () => {
    const mathInput = document.getElementById('math-input');
    const mathPreview = document.getElementById('math-preview');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printMathBtn = document.getElementById('print-math-btn');

    let renderTimer;

    // ===========================================
    // RENDERIZADO AUTOMÁTICO (Original)
    // ===========================================
    const renderMath = () => {
        if (window.MathJax && mathInput && mathPreview) {
            mathPreview.textContent = mathInput.innerText;
            window.MathJax.typesetPromise([mathPreview])
                .then(() => syncCanvasSize()) // Ajustar canvas después de renderizar
                .catch((err) => console.log("Error MathJax:", err));
        }
    };

    const triggerAutoRender = () => {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(() => {
            renderMath();
            saveToStorage(); 
        }, 300); 
    };

    // ===========================================
    // LÓGICA DE MATRICES NXN DINÁMICAS (Original)
    // ===========================================
    window.insertDynamicMatrix = () => {
        const rows = document.getElementById('matrix-rows').value;
        const cols = document.getElementById('matrix-cols').value;
        let latex = '\\begin{pmatrix} ';
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                latex += '0';
                if (j < cols - 1) latex += ' & ';
            }
            if (i < rows - 1) latex += ' \\\\ ';
        }
        latex += ' \\end{pmatrix} ';
        insertMath(latex);
    };

    // ===========================================
    // BOTONES TECLADO (Original)
    // ===========================================
    window.insertMath = (symbol) => {
        if (mathInput) {
            mathInput.focus();
            document.execCommand('insertText', false, ` $${symbol}$ `);
            triggerAutoRender();
        }
    };

    // ===========================================
    // MEJORA: SISTEMA DE DIBUJO (Lápiz, Resaltador, etc.)
    // ===========================================
    const canvas = document.getElementById('drawingCanvas');
    if (!canvas) return; // Seguridad si no existe en el HTML
    const ctx = canvas.getContext('2d');
    let drawing = false, tool = 'pen', startX, startY;

    const syncCanvasSize = () => {
        if (mathPreview && canvas) {
            canvas.width = mathPreview.offsetWidth;
            canvas.height = mathPreview.offsetHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    };

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => {
        drawing = true;
        const pos = getPos(e);
        startX = pos.x; startY = pos.y;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        if (e.type === 'touchstart') e.preventDefault();
    };

    const draw = (e) => {
        if (!drawing) return;
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
        if (tool === 'line' || tool === 'arrow') {
            const pos = getPos(e.changedTouches ? e.changedTouches[0] : e);
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
            if (tool === 'arrow') {
                const angle = Math.atan2(pos.y - startY, pos.x - startX);
                ctx.lineTo(pos.x - 10 * Math.cos(angle - Math.PI/6), pos.y - 10 * Math.sin(angle - Math.PI/6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - 10 * Math.cos(angle + Math.PI/6), pos.y - 10 * Math.sin(angle + Math.PI/6));
            }
            ctx.stroke();
        }
        drawing = false;
    };

    // Listeners de dibujo (Mouse + Touch)
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', stopDraw);

    window.setTool = (t) => { tool = t; };
    window.clearCanvas = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ===========================================
    // ASIGNACIÓN DE EVENTOS (Original)
    // ===========================================
    if(mathInput) {
        mathInput.addEventListener('input', triggerAutoRender);
        mathInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    }
    if(undoBtn) undoBtn.addEventListener('click', () => { mathInput.focus(); document.execCommand('undo'); triggerAutoRender(); });
    if(redoBtn) redoBtn.addEventListener('click', () => { mathInput.focus(); document.execCommand('redo'); triggerAutoRender(); });
    if(clearBtn) clearBtn.addEventListener('click', () => { if(confirm("¿Limpiar?")) { mathInput.innerText = ''; localStorage.removeItem('mathStorage'); renderMath(); } });
    if(printMathBtn) printMathBtn.addEventListener('click', () => { renderMath(); setTimeout(() => window.print(), 500); });

    // ===========================================
    // PERSISTENCIA (Original)
    // ===========================================
    const saveToStorage = () => { if(mathInput) localStorage.setItem('mathStorage', mathInput.innerText); }
    const loadFromStorage = () => {
        const saved = localStorage.getItem('mathStorage');
        if (saved && mathInput) {
            mathInput.innerText = saved;
            renderMath();
        }
    };

    loadFromStorage();
    syncCanvasSize();
});

// Mantener persistencia de Pages/Headers (Original)
document.addEventListener('input', (e) => {
    const pagesContainer = document.getElementById('pages-container');
    if (pagesContainer) localStorage.setItem('documentContent', pagesContainer.innerHTML);
    const taller = document.getElementById('header-taller'), materia = document.getElementById('header-materia');
    if (taller && materia) localStorage.setItem('headerData', JSON.stringify({ taller: taller.value, materia: materia.value }));
});

window.addEventListener('load', () => {
    const savedContent = localStorage.getItem('documentContent'), savedHeader = localStorage.getItem('headerData');
    if (savedContent && document.getElementById('pages-container')) document.getElementById('pages-container').innerHTML = savedContent;
    if (savedHeader) {
        const data = JSON.parse(savedHeader);
        if (document.getElementById('header-taller')) document.getElementById('header-taller').value = data.taller || '';
        if (document.getElementById('header-materia')) document.getElementById('header-materia').value = data.materia || '';
    }
});

window.insertSelectedFormula = () => {
    const select = document.getElementById('quick-formula-select');
    if (select && select.value !== "") {
        insertMath(select.value);
        select.selectedIndex = 0;
    }
};
