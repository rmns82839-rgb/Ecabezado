document.addEventListener('DOMContentLoaded', () => {
    // ===========================================
    // DEFINICIONES DE ELEMENTOS
    // ===========================================
    const mathInput = document.getElementById('math-input');
    const mathPreview = document.getElementById('math-preview');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const printMathBtn = document.getElementById('print-math-btn');

    let renderTimer;

    // ===========================================
    // RENDERIZADO AUTOMÁTICO (Optimizado para Matrices)
    // ===========================================
    const renderMath = () => {
        if (window.MathJax && mathInput && mathPreview) {
            /** * MEJORA CLAVE: Usamos innerHTML para el preview para mantener 
             * la estructura de etiquetas si fuera necesario, o textContent 
             * para evitar que el navegador limpie los saltos de línea \\ 
             */
            mathPreview.innerHTML = mathInput.innerHTML;
            
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
    // LÓGICA DE MATRICES NXN DINÁMICAS
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
    // ASIGNACIÓN DE EVENTOS
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

    if(printMathBtn) {
        printMathBtn.addEventListener('click', () => {
            renderMath();
            setTimeout(() => window.print(), 300);
        });
    }

    // ===========================================
    // PERSISTENCIA MEJORADA (Mantiene filas de matriz)
    // ===========================================
    const saveToStorage = () => {
        if(mathInput) {
            // Guardamos el HTML completo para no perder los saltos de línea \\
            localStorage.setItem('mathStorage', mathInput.innerHTML);
        }
    }

    const loadFromStorage = () => {
        const saved = localStorage.getItem('mathStorage');
        if (saved && mathInput) {
            mathInput.innerHTML = saved;
            // Sincronizamos con el preview usando innerHTML para mantener formato
            mathPreview.innerHTML = saved;
            setTimeout(renderMath, 1000);
        }
    };

    loadFromStorage();
});

// ===========================================
// PERSISTENCIA DEL DOCUMENTO Y HEADER
// ===========================================
document.addEventListener('input', (e) => {
    // Solo actuamos si existen los contenedores principales
    const pagesContainer = document.getElementById('pages-container');
    if (pagesContainer) {
        const content = pagesContainer.innerHTML;
        localStorage.setItem('documentContent', content);
    }

    const taller = document.getElementById('header-taller');
    const materia = document.getElementById('header-materia');

    if (taller && materia) {
        const headerData = {
            taller: taller.value,
            materia: materia.value
        };
        localStorage.setItem('headerData', JSON.stringify(headerData));
    }
});

window.addEventListener('load', () => {
    const savedContent = localStorage.getItem('documentContent');
    const savedHeader = JSON.parse(localStorage.getItem('headerData'));
    
    const pagesContainer = document.getElementById('pages-container');
    if (savedContent && pagesContainer) {
        pagesContainer.innerHTML = savedContent;
    }

    const taller = document.getElementById('header-taller');
    const materia = document.getElementById('header-materia');

    if (savedHeader) {
        if (taller) taller.value = savedHeader.taller || '';
        if (materia) materia.value = savedHeader.materia || '';
    }
});
/**
 * Abre GeoGebra Clásico en Español en una nueva pestaña.
 * Esto evita problemas de compatibilidad con bloqueos de canvas en el navegador.
 */
function openGeoGebra() {
    window.open('https://www.geogebra.org/classic?lang=es', '_blank');
}
window.insertSelectedFormula = () => {
    const select = document.getElementById('quick-formula-select');
    const formula = select.value;
    
    if (formula !== "") {
        // Utilizamos la función insertMath que ya tienes creada
        insertMath(formula);
        
        // Regresamos el selector a la posición inicial
        select.selectedIndex = 0;
    }
};
