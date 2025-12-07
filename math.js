document.addEventListener('DOMContentLoaded', () => {
    // ===========================================
    // DEFINICIONES DE ELEMENTOS
    // ===========================================
    const mathInput = document.getElementById('math-input');
    const mathPreview = document.getElementById('math-preview');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printMathBtn = document.getElementById('print-math-btn'); // Nuevo: Botón de impresión

    let renderTimer;

    // ===========================================
    // RENDERIZADO AUTOMÁTICO (Original + Mejorado)
    // ===========================================
    const renderMath = () => {
        if (window.MathJax && mathInput && mathPreview) {
            // Sincronizar texto del editor a la vista previa
            mathPreview.innerHTML = mathInput.innerText;
            
            // Llamar a MathJax para procesar
            window.MathJax.typesetPromise([mathPreview])
                .then(() => console.log("Renderizado Exitoso"))
                .catch((err) => console.log("Error MathJax:", err));
        }
    };

    const triggerAutoRender = () => {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(() => {
            renderMath();
            saveToStorage();
        }, 500); 
    };

    // ===========================================
    // LÓGICA DE MATRICES NXN DINÁMICAS (Nuevo)
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
            document.execCommand('insertText', false, ' $' + symbol + '$ ');
            triggerAutoRender();
        }
    };

    // ===========================================
    // ASIGNACIÓN DE EVENTOS CON SEGURIDAD (Original)
    // ===========================================
    if(mathInput) {
        mathInput.addEventListener('input', triggerAutoRender);
    }

    if(undoBtn) {
        undoBtn.addEventListener('click', () => {
            document.execCommand('undo');
            triggerAutoRender();
        });
    }

    if(redoBtn) {
        redoBtn.addEventListener('click', () => {
            document.execCommand('redo');
            triggerAutoRender();
        });
    }

    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(confirm("¿Limpiar toda la hoja milimetrada?")) {
                mathInput.innerHTML = '';
                mathPreview.innerHTML = '';
                localStorage.removeItem('mathStorage');
            }
        });
    }

    // Lógica para botón de impresión
    if(printMathBtn) {
        printMathBtn.addEventListener('click', () => {
            renderMath();
            setTimeout(() => window.print(), 300);
        });
    }

    // ===========================================
    // PERSISTENCIA (Original + Mejorado)
    // ===========================================
    const saveToStorage = () => {
        if(mathInput) {
            localStorage.setItem('mathStorage', mathInput.innerHTML);
        }
    }

    const loadFromStorage = () => {
        const saved = localStorage.getItem('mathStorage');
        if (saved && mathInput) {
            mathInput.innerHTML = saved;
            // Asegurar que el preview cargue antes de renderizar
            mathPreview.innerHTML = mathInput.innerText;
            setTimeout(renderMath, 1000);
        }
    };

    loadFromStorage();
});
// Guardar contenido al escribir
document.addEventListener('input', () => {
    const content = document.getElementById('pages-container').innerHTML;
    const headerData = {
        taller: document.getElementById('header-taller').value,
        materia: document.getElementById('header-materia').value
        // Añade aquí los demás campos del header
    };
    localStorage.setItem('documentContent', content);
    localStorage.setItem('headerData', JSON.stringify(headerData));
});

// Recuperar contenido al cargar la página
window.addEventListener('load', () => {
    const savedContent = localStorage.getItem('documentContent');
    const savedHeader = JSON.parse(localStorage.getItem('headerData'));
    
    if (savedContent) {
        document.getElementById('pages-container').innerHTML = savedContent;
    }
    if (savedHeader) {
        document.getElementById('header-taller').value = savedHeader.taller || '';
        document.getElementById('header-materia').value = savedHeader.materia || '';
    }
});
