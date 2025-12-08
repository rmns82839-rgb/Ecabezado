document.addEventListener('DOMContentLoaded', () => {
    const mathInput = document.getElementById('math-input');
    const mathPreview = document.getElementById('math-preview');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printMathBtn = document.getElementById('print-math-btn');
    const exportImgBtn = document.getElementById('export-img-btn');
    let renderTimer;

    // ===========================================
    // MEJORA: INSERTAR DESDE DESPLEGABLE
    // ===========================================
    window.insertSelectedFormula = () => {
        const select = document.getElementById('quick-formula-select');
        if (select && select.value) {
            // Inserta en el editor
            window.insertMath(select.value);
            // Regresa el select a la opción inicial
            select.selectedIndex = 0;
        }
    };

    // ===========================================
    // RENDERIZADO EXCLUSIVO (Papel Milimetrado)
    // ===========================================
    const renderMath = () => {
        if (window.MathJax && mathInput && mathPreview) {
            // Sincroniza el texto plano del editor a la vista previa
            mathPreview.textContent = mathInput.innerText;
            
            // Le pide a MathJax que procese SOLO la vista previa
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

    // ===========================================
    // LÓGICA DE MATRICES NXN (Mantenida)
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
        window.insertMath(latex);
    };

    // ===========================================
    // BOTONES TECLADO (Mejorado para solo texto plano)
    // ===========================================
    window.insertMath = (symbol) => {
        if (mathInput) {
            mathInput.focus();
            // Se inserta como texto plano para no renderizar en el editor
            document.execCommand('insertText', false, ` $${symbol}$ `);
            triggerAutoRender();
        }
    };

    // ===========================================
    // SISTEMA DE DIBUJO (Mantenido)
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
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            };
            img.src = tempImg;
        }
    };

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => {
        if (!tool) return; 
        drawing = true;
        const pos = getPos(e);
        startX = pos.x; startY = pos.y;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
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

    const stopDraw = () => {
        drawing = false;
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
    };

    // ===========================================
    // PERSISTENCIA
    // ===========================================
    const saveToStorage = () => { if(mathInput) localStorage.setItem('mathStorage', mathInput.innerText); };
    const saveCanvasToStorage = () => { localStorage.setItem('canvasStorage', canvas.toDataURL()); };

    const loadFromStorage = () => {
        const savedText = localStorage.getItem('mathStorage');
        if (savedText && mathInput) { 
            mathInput.innerText = savedText; 
            setTimeout(renderMath, 800); 
        }
        const savedImg = localStorage.getItem('canvasStorage');
        if (savedImg) { 
            const img = new Image(); 
            img.onload = () => ctx.drawImage(img, 0, 0); 
            img.src = savedImg; 
        }
    };

    // ===========================================
    // EVENTOS DE BOTONES
    // ===========================================
    if(undoBtn) undoBtn.addEventListener('click', () => { mathInput.focus(); document.execCommand('undo'); triggerAutoRender(); });
    if(redoBtn) redoBtn.addEventListener('click', () => { mathInput.focus(); document.execCommand('redo'); triggerAutoRender(); });
    if(clearBtn) clearBtn.addEventListener('click', () => { 
        if(confirm("¿Limpiar todo?")) { 
            mathInput.innerText = ''; 
            window.clearCanvas(); 
            localStorage.removeItem('mathStorage'); 
            renderMath(); 
        } 
    });
    if(printMathBtn) printMathBtn.addEventListener('click', () => { 
        renderMath(); 
        setTimeout(() => window.print(), 500); 
    });

    loadFromStorage();
    if(mathInput) mathInput.addEventListener('input', triggerAutoRender);
});
