// =================================================================
// CÓDIGO MEJORADO PARA 'script.js' - OPTIMIZADO Y COMPLETO
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ===========================================
    // DEFINICIONES DE ELEMENTOS
    // ===========================================
    const pagesContainer = document.getElementById('pages-container');
    const participantsList = document.getElementById('participants-list');
    const introArea = document.getElementById('intro-area');

    // Contenedores para Arrastre y Acordeón
    const toolbar = document.getElementById('toolbar');
    const dragHandle = document.getElementById('drag-handle');

    // Botones Principales
    const addPageBtn = document.getElementById('add-page-btn');
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const printBtn = document.getElementById('print-btn');
    const clearContentBtn = document.getElementById('clear-content-btn');

    // Barra de Herramientas
    const selectAllBtn = document.getElementById('select-all-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const imgBtn = document.getElementById('img-btn');
    const colorPicker = document.getElementById('color-picker');
    const fileInput = document.getElementById('file-input');

    // Botones de Alineación
    const alignLeftBtn = document.getElementById('align-left-btn');
    const alignCenterBtn = document.getElementById('align-center-btn');
    const alignRightBtn = document.getElementById('align-right-btn');
    
    // Botón Limpiar Espacios (🧹)
    const cleanSpacesBtn = document.getElementById('clean-spaces-btn');

    // Encabezado
    const headerFields = [
        document.getElementById('header-taller'),
        document.getElementById('header-fecha'),
        document.getElementById('header-materia'),
        document.getElementById('header-carrera'),
        document.getElementById('header-sede'),
        document.getElementById('header-jornada')
    ].filter(el => el != null);

    // ===========================================
    // LÓGICA DE ARRASTRE (DRAGGABLE)
    // ===========================================
    let isDragging = false;
    let offsetX, offsetY;

    const startDrag = (e) => {
        isDragging = true;
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        offsetX = clientX - toolbar.offsetLeft;
        offsetY = clientY - toolbar.offsetTop;
        
        toolbar.style.transition = 'none'; 
    };

    const doDrag = (e) => {
        if (!isDragging) return;
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        toolbar.style.left = `${clientX - offsetX}px`;
        toolbar.style.top = `${clientY - offsetY}px`;
    };

    const stopDrag = () => {
        isDragging = false;
        toolbar.style.transition = 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    };

    dragHandle.addEventListener('mousedown', startDrag);
    dragHandle.addEventListener('touchstart', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('touchmove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);

    // ===========================================
    // LÓGICA DE SCROLL LATERAL
    // ===========================================
    const scrollContainer = document.querySelector('.accordion-scroll-container');
    if(scrollContainer) {
        scrollContainer.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            scrollContainer.scrollLeft += evt.deltaY;
        });
    }

    // ===========================================
    // FUNCIONES DE PERSISTENCIA
    // ===========================================
    const saveContent = () => {
        const pagesData = Array.from(pagesContainer.querySelectorAll('.editable-content')).map(div => div.innerHTML);
        localStorage.setItem('pagesData', JSON.stringify(pagesData));
        headerFields.forEach(field => {
            localStorage.setItem(`header-${field.id}`, field.value);
        });
        const participantNames = Array.from(participantsList.querySelectorAll('input[type="text"]')).map(input => input.value);
        localStorage.setItem('participants', JSON.stringify(participantNames));
        if (introArea) {
            localStorage.setItem('introContent', introArea.innerHTML);
        }
    };

    const loadContent = () => {
        headerFields.forEach(field => {
            const savedValue = localStorage.getItem(`header-${field.id}`);
            if (savedValue) field.value = savedValue;
        });
        const savedParticipants = JSON.parse(localStorage.getItem('participants'));
        if (savedParticipants && savedParticipants.length > 0) {
            participantsList.innerHTML = '';
            savedParticipants.forEach(name => addParticipantInput(name));
        } else {
            addParticipantInput("");
        }
        const savedPagesData = JSON.parse(localStorage.getItem('pagesData'));
        if (savedPagesData && savedPagesData.length > 0) {
            pagesContainer.innerHTML = '';
            savedPagesData.forEach(htmlContent => addPage(htmlContent));
        } else {
            addPage();
        }
        if (introArea) {
            const savedIntro = localStorage.getItem('introContent');
            if (savedIntro) introArea.innerHTML = savedIntro;
        }
    };

    // ===========================================
    // LÓGICA DE PÁGINAS
    // ===========================================
    const addPage = (initialHtml = "") => {
        const pageBlock = document.createElement('div');
        pageBlock.className = 'page-block';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'editable-content';
        contentDiv.contentEditable = true;
        contentDiv.setAttribute('placeholder', 'Escribe o pega aquí el contenido...');
        contentDiv.innerHTML = initialHtml;
        contentDiv.addEventListener('input', saveContent);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️';
        deleteBtn.className = 'delete-page-btn';
        deleteBtn.addEventListener('click', () => {
            if (confirm("¿Borrar esta sección?")) {
                pageBlock.remove();
                saveContent();
            }
        });
        pageBlock.appendChild(deleteBtn);
        pageBlock.appendChild(contentDiv);
        pagesContainer.appendChild(pageBlock);
        if (initialHtml === "") contentDiv.focus();
    };

    addPageBtn.addEventListener('click', () => {
        addPage();
        saveContent();
    });

    // ===========================================
    // LÓGICA DE PARTICIPANTES
    // ===========================================
    const addParticipantInput = (initialValue = "") => {
        const participantWrapper = document.createElement('div');
        participantWrapper.classList.add('participant-input');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nombre del Integrante';
        input.value = initialValue;
        input.addEventListener('input', saveContent);
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'x';
        removeBtn.classList.add('modern-btn');
        removeBtn.style.cssText = 'background-color: #dc3545; margin-left: 5px; padding: 5px 10px;';
        removeBtn.addEventListener('click', () => {
            participantWrapper.remove();
            saveContent();
        });
        participantWrapper.appendChild(input);
        participantWrapper.appendChild(removeBtn);
        participantsList.appendChild(participantWrapper);
    };

    addParticipantBtn.addEventListener('click', () => {
        addParticipantInput();
        saveContent();
    });

    // ===========================================
    // BARRA DE HERRAMIENTAS (FORMATO Y ALINEACIÓN)
    // ===========================================
    const execute = (cmd, val = null) => {
        document.execCommand(cmd, false, val);
        saveContent();
    };

    if (boldBtn) boldBtn.addEventListener('click', () => execute('bold'));
    if (italicBtn) italicBtn.addEventListener('click', () => execute('italic'));
    if (undoBtn) undoBtn.addEventListener('click', () => execute('undo'));
    if (redoBtn) redoBtn.addEventListener('click', () => execute('redo'));
    if (selectAllBtn) selectAllBtn.addEventListener('click', () => execute('selectAll'));

    // Botones de alineación
    if (alignLeftBtn) alignLeftBtn.addEventListener('click', () => execute('justifyLeft'));
    if (alignCenterBtn) alignCenterBtn.addEventListener('click', () => execute('justifyCenter'));
    if (alignRightBtn) alignRightBtn.addEventListener('click', () => execute('justifyRight'));

    // Color de texto
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => execute('foreColor', e.target.value));
    }

    // --- MEJORA: LIMPIEZA DE ESPACIOS Y SALTOS DE LÍNEA MEJORADA (🧹) ---
    if (cleanSpacesBtn) {
        cleanSpacesBtn.addEventListener('click', () => {
            const selection = window.getSelection();
            let editableElement = null;

            if (selection.rangeCount > 0) {
                // Intentamos encontrar el bloque donde está el cursor
                editableElement = selection.anchorNode.parentElement.closest('.editable-content');
            }

            // Si no hay bloque seleccionado, limpiamos todos
            const blocks = editableElement ? [editableElement] : document.querySelectorAll('.editable-content');

            blocks.forEach(block => {
                let html = block.innerHTML;

                // 1. Limpiar múltiples espacios seguidos y espacios HTML (&nbsp;)
                html = html.replace(/&nbsp;/g, ' '); 
                html = html.replace(/\s\s+/g, ' '); 

                // 2. Limpiar saltos de línea excesivos (<br>) seguidos de espacios
                // Busca 2 o más etiquetas <br> (con posibles espacios entre ellas) y deja solo una
                html = html.replace(/(<br\s*\/?>[\s\t\n]*){2,}/gi, '<br>');

                // 3. Limpiar párrafos vacíos múltiples generados por Enter
                // Busca bloques <p><br></p> repetidos y los unifica
                html = html.replace(/(<p[^>]*>[\s\t\n]*<br\s*\/?>[\s\t\n]*<\/p>[\s\t\n]*){2,}/gi, '<p><br></p>');

                block.innerHTML = html;
            });

            saveContent();
            alert("Párrafos y saltos de línea organizados.");
        });
    }

    // Inserción de Imágenes
    if (imgBtn) imgBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imgHtml = `<img src="${e.target.result}" style="width: 300px; display: block; margin: 10px auto; border-radius: 8px;">`;
                    execute('insertHTML', imgHtml);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    clearContentBtn.addEventListener('click', () => {
        if (confirm("⚠️ ¿Borrar TODOS los datos y el trabajo?")) {
            localStorage.clear();
            location.reload();
        }
    });

    // ===========================================
    // INICIO
    // ===========================================
    printBtn.addEventListener('click', () => window.print());
    headerFields.forEach(f => f.addEventListener('input', saveContent));
    if (introArea) introArea.addEventListener('input', saveContent);

    loadContent();
});
