document.addEventListener('DOMContentLoaded', () => {
    const participantsList = document.getElementById('participants-list');
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const printBtn = document.getElementById('print-btn');

    // Función para añadir un campo de participante
    const addParticipantInput = () => {
        // 1. Crear el contenedor del participante
        const participantWrapper = document.createElement('div');
        participantWrapper.classList.add('participant-input');

        // 2. Crear el input
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nombre del Integrante';
        input.name = 'participante';

        // 3. Crear el botón de eliminar
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'x';
        removeBtn.classList.add('modern-btn');
        removeBtn.style.backgroundColor = '#dc3545'; // Rojo para eliminar
        removeBtn.style.marginLeft = '5px';
        removeBtn.style.padding = '5px 10px';

        // Lógica para eliminar el input
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Evita que el botón haga algo inesperado
            participantsList.removeChild(participantWrapper);
        });
        
        // 4. Adjuntar elementos
        participantWrapper.appendChild(input);
        participantWrapper.appendChild(removeBtn);
        participantsList.appendChild(participantWrapper);
    };

    // Añadir el primer input al cargar
    addParticipantInput();

    // Evento para el botón de añadir participante
    addParticipantBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el botón intente enviar un formulario
        addParticipantInput();
    });

    // Evento para el botón de imprimir
    printBtn.addEventListener('click', () => {
        // window.print() abre el diálogo de impresión nativo del navegador.
        // El navegador permite seleccionar 'Guardar como PDF'
        window.print();
    });
});
