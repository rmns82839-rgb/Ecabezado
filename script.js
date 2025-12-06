document.addEventListener('DOMContentLoaded', () => {
    // Definiciones de elementos
    const participantsList = document.getElementById('participants-list');
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const printBtn = document.getElementById('print-btn');
    
    // Definiciones de la Barra de Herramientas
    const editorArea = document.getElementById('editor-area');
    const selectAllBtn = document.getElementById('select-all-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const clearContentBtn = document.getElementById('clear-content-btn');


    // ===========================================
    // LÓGICA DE PARTICIPANTES DINÁMICOS
    // ===========================================
    
    const addParticipantInput = () => {
        const participantWrapper = document.createElement('div');
        participantWrapper.classList.add('participant-input');

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nombre del Integrante';
        input.name = 'participante';

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'x';
        removeBtn.classList.add('modern-btn');
        // Estilos para el botón de eliminar
        removeBtn.style.cssText = 'background-color: #dc3545; margin-left: 5px; padding: 5px 10px; font-size: 0.9em;';

        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            participantsList.removeChild(participantWrapper);
        });
        
        participantWrapper.appendChild(input);
        participantWrapper.appendChild(removeBtn);
        participantsList.appendChild(participantWrapper);
    };

    // Inicializar con un campo de participante
    addParticipantInput();

    // Evento para añadir participante
    addParticipantBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addParticipantInput();
    });

    // ===========================================
    // LÓGICA DE LA BARRA DE HERRAMIENTAS
    // ===========================================

    // Seleccionar todo
    selectAllBtn.addEventListener('click', () => {
        editorArea.focus();
        document.execCommand('selectAll', false, null);
    });

    // Deshacer (Undo)
    undoBtn.addEventListener('click', () => {
        document.execCommand('undo', false, null);
    });

    // Rehacer (Redo)
    redoBtn.addEventListener('click', () => {
        document.execCommand('redo', false, null);
    });

    // Borrar Contenido (limpia todo el editor)
    clearContentBtn.addEventListener('click', () => {
        if (confirm("⚠️ ¿Estás seguro de que deseas borrar TODO el contenido del trabajo? Esta acción es difícil de deshacer.")) {
            editorArea.innerHTML = ''; 
            editorArea.focus(); 
        }
    });

    // ===========================================
    // LÓGICA DE IMPRESIÓN
    // ===========================================
    
    printBtn.addEventListener('click', () => {
        // La función window.print() abre el diálogo de impresión nativo.
        // El usuario debe seleccionar "Guardar como PDF" en su sistema.
        window.print();
    });
});
