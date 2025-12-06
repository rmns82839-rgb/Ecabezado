// =================================================================
// CÓDIGO ACTUALIZADO PARA 'script.js'
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // ===========================================
    // DEFINICIONES DE ELEMENTOS
    // ===========================================
    
    // Contenedores
    const pagesContainer = document.getElementById('pages-container');
    const participantsList = document.getElementById('participants-list');

    // Botones Principales
    const addPageBtn = document.getElementById('add-page-btn');
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const printBtn = document.getElementById('print-btn');
    
    // Barra de Herramientas
    const selectAllBtn = document.getElementById('select-all-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearContentBtn = document.getElementById('clear-content-btn');

    // Encabezado (para persistencia)
    const headerFields = [
        document.getElementById('header-taller'),
        document.getElementById('header-fecha'),
        document.getElementById('header-materia'),
        document.getElementById('header-carrera'),
        document.getElementById('header-sede'),
        document.getElementById('header-jornada')
    ].filter(el => el != null); 
    
    // ===========================================
    // FUNCIONES DE PERSISTENCIA (localStorage)
    // ===========================================
    
    const saveContent = () => {
        // 1. Guardar el contenido de CADA página
        const pagesData = Array.from(pagesContainer.querySelectorAll('.editable-content')).map(contentDiv => contentDiv.innerHTML);
        localStorage.setItem('pagesData', JSON.stringify(pagesData));
        
        // 2. Guardar los campos del encabezado
        headerFields.forEach(field => {
            localStorage.setItem(`header-${field.id}`, field.value);
        });
        
        // 3. Guardar participantes
        const participantNames = Array.from(participantsList.querySelectorAll('input[type="text"]')).map(input => input.value);
        localStorage.setItem('participants', JSON.stringify(participantNames));
    };

    const loadContent = () => {
        // 1. Cargar los campos del encabezado
        headerFields.forEach(field => {
            const savedValue = localStorage.getItem(`header-${field.id}`);
            if (savedValue) {
                field.value = savedValue;
            }
        });
        
        // 2. Cargar participantes
        const savedParticipants = JSON.parse(localStorage.getItem('participants'));
        if (savedParticipants && savedParticipants.length > 0) {
            participantsList.innerHTML = ''; 
            savedParticipants.forEach(name => {
                addParticipantInput(name);
            });
        } else {
            addParticipantInput("");
        }

        // 3. Cargar contenido de las páginas
        const savedPagesData = JSON.parse(localStorage.getItem('pagesData'));
        if (savedPagesData && savedPagesData.length > 0) {
            pagesContainer.innerHTML = '';
            savedPagesData.forEach(htmlContent => {
                addPage(htmlContent); // Recrear la página con el contenido guardado
            });
        } else {
            addPage(); // Si no hay datos guardados, crear una página inicial
        }
    };

    // ===========================================
    // LÓGICA DE PÁGINAS Y BORRADO SELECTIVO
    // ===========================================
    
    const addPage = (initialHtml = "") => {
        const pageBlock = document.createElement('div');
        pageBlock.className = 'page-block';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'editable-content';
        contentDiv.contentEditable = true;
        contentDiv.setAttribute('placeholder', 'Escribe o pega aquí el contenido de esta sección/página...');
        contentDiv.innerHTML = initialHtml;
        
        // Asignar evento de guardado
        contentDiv.addEventListener('input', saveContent);

        // Botón de borrar esta página (Borrado Selectivo)
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '❌ Borrar Página';
        deleteBtn.className = 'delete-page-btn';
        
        deleteBtn.addEventListener('click', () => {
            if (confirm("¿Seguro que deseas borrar esta sección/página?")) {
                pagesContainer.removeChild(pageBlock);
                saveContent();
            }
        });

        pageBlock.appendChild(deleteBtn);
        pageBlock.appendChild(contentDiv);
        pagesContainer.appendChild(pageBlock);

        // Enfocar la nueva página si no es una carga inicial
        if (initialHtml === "") {
            contentDiv.focus();
        }
    };
    
    addPageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addPage();
        saveContent();
    });

    // ===========================================
    // LÓGICA DE PARTICIPANTES Y BOTONES
    // ===========================================
    
    const addParticipantInput = (initialValue = "") => {
        const participantWrapper = document.createElement('div');
        participantWrapper.classList.add('participant-input');

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nombre del Integrante';
        input.name = 'participante';
        input.value = initialValue; 
        input.addEventListener('input', saveContent); 
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'x';
        removeBtn.classList.add('modern-btn');
        removeBtn.style.cssText = 'background-color: #dc3545; margin-left: 5px; padding: 5px 10px; font-size: 0.9em;';

        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            participantsList.removeChild(participantWrapper);
            saveContent(); 
        });
        
        participantWrapper.appendChild(input);
        participantWrapper.appendChild(removeBtn);
        participantsList.appendChild(participantWrapper);
    };

    addParticipantBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addParticipantInput();
        saveContent();
    });
    
    headerFields.forEach(field => {
        field.addEventListener('input', saveContent);
    });
    
    // ===========================================
    // LÓGICA DE LA BARRA DE HERRAMIENTAS (¡ARREGLADO!)
    // ===========================================
    
    // Función genérica para ejecutar comandos de edición
    const executeCommand = (command) => {
        // Ejecuta el comando en el elemento que tiene el foco
        document.execCommand(command, false, null);
    };

    selectAllBtn.addEventListener('click', () => {
        executeCommand('selectAll');
    });

    undoBtn.addEventListener('click', () => {
        executeCommand('undo');
    });

    redoBtn.addEventListener('click', () => {
        executeCommand('redo');
    });

    clearContentBtn.addEventListener('click', () => {
        if (confirm("⚠️ ¿Estás seguro de que deseas borrar TODOS los bloques de contenido?")) {
            pagesContainer.innerHTML = ''; 
            addPage(); // Deja una página inicial vacía
            saveContent(); 
        }
    });

    // ===========================================
    // LÓGICA DE IMPRESIÓN Y CARGA INICIAL
    // ===========================================
    
    printBtn.addEventListener('click', () => {
        window.print();
    });
    
    // Cargar todos los datos guardados al iniciar
    loadContent(); 
});
