document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.addEventListener('click', handleTabClick));

    document.getElementById('todayBtn').addEventListener('click', showToday);
    document.getElementById('tomorrowBtn').addEventListener('click', showTomorrow);

    setActiveTab(tabs[0]); // Marca la primera pestaña como activa
});

let matches = {}; // Almacena los datos cargados de las ligas (por liga)

function handleTabClick(event) {
    const league = event.target.getAttribute('data-league');
    const fileName = `${league}.csv`;
    loadCSV(fileName, league);
    setActiveTab(event.target); // Marca la pestaña seleccionada
}

function setActiveTab(selectedTab) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active')); // Remover la clase 'active' de todas las pestañas
    selectedTab.classList.add('active'); // Agregar la clase 'active' a la pestaña seleccionada
}

function loadCSV(fileName, league) {
    fetch(fileName)
        .then(response => response.text())
        .then(data => parseCSV(data, league))
        .catch(error => console.error('Error al cargar el archivo CSV:', error));
}

function parseCSV(data, league) {
    const rows = data.split('\n');
    const today = getFormattedDate(new Date()); // Formato 'YYYY-MM-DD'

    const leagueMatches = rows.slice(1).map(row => {
        const columns = row.split(',');
        if (columns.length >= 4) {
            const [local, visitante, fecha, hora] = columns.map(col => col?.trim() || '');
            const formattedDate = formatDate(fecha);

            // Incluimos los partidos cuya fecha es igual o posterior a hoy
            if (formattedDate >= today) {
                return { local, visitante, fecha: formattedDate, hora };
            }
        }
        return null;
    }).filter(match => match !== null);

    matches[league] = leagueMatches; // Guardamos los partidos por liga
    displayMatches(league, leagueMatches); // Mostramos los partidos cargados
}

function formatDate(dateString) {
    const parts = dateString.split('.');
    if (parts.length >= 2) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = new Date().getFullYear();
        return `${year}-${month}-${day}`;
    }
    return '';
}

function displayMatches(league, data) {
    const tableBody = document.getElementById('resultsTable').querySelector('tbody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No hay partidos disponibles.</td></tr>';
        return;
    }

    const now = new Date(); // Fecha y hora actual

    const today = Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(now); // Fecha actual (YYYY-MM-DD)

    data.forEach(match => {
        // Crear fecha y hora del partido
        const matchTimeParts = match.hora.split(':'); // Dividir hora
        const matchDateTime = new Date(`${match.fecha}T${match.hora}:00-06:00`); // Fecha completa en UTC-6

        // Comparaciones detalladas
        const isToday = match.fecha === today;
        const isPast = isToday && matchDateTime.getTime() < now.getTime(); // Comparar tiempos
        const isFuture = isToday && matchDateTime.getTime() > now.getTime(); // Comparar tiempos

        // Determinar el color de la celda de hora
        let cellStyle = 'transparent';
        if (isToday) {
            if (isPast) {
                cellStyle = '#FFB6B6'; // Amarillo para partidos pasados
            } else if (isFuture) {
                cellStyle = 'lightgreen'; // Verde para partidos futuros
            }
        }

        const row = `<tr>
            <td>${match.local}</td>
            <td>${match.visitante}</td>
            <td>${match.fecha}</td>
            <td style="background-color: ${cellStyle};">${match.hora}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

function showToday() {
    const now = new Date(); // Fecha y hora actual
    const today = getFormattedDate(now); // Fecha actual en formato YYYY-MM-DD

    // Obtener y ordenar partidos por hora
    const todayMatches = getAllMatchesForDate(today);
    todayMatches.sort((a, b) => {
        const timeA = new Date(`${today}T${a.hora}:00-06:00`);
        const timeB = new Date(`${today}T${b.hora}:00-06:00`);
        return timeA - timeB; // Ordenar por hora ascendente
    });

    // Mostrar partidos con colores según su estado
    displayMatchesForDate(todayMatches, now);
}

// Función para obtener los partidos de una fecha específica
function getAllMatchesForDate(date) {
    return matches.filter(match => match.fecha === date);
}

// Función para obtener la fecha en formato YYYY-MM-DD
function getFormattedDate(date) {
    return date.toISOString().split('T')[0];
}

function showTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Incrementa la fecha al día siguiente
    const formattedTomorrow = getFormattedDate(tomorrow); // Formatea la fecha como YYYY-MM-DD

    // Obtener y ordenar partidos por hora
    const tomorrowMatches = getAllMatchesForDate(formattedTomorrow);
    tomorrowMatches.sort((a, b) => {
        const timeA = new Date(`${formattedTomorrow}T${a.hora}:00-06:00`);
        const timeB = new Date(`${formattedTomorrow}T${b.hora}:00-06:00`);
        return timeA - timeB; // Ordenar por hora ascendente
    });

    // Mostrar los partidos ordenados
    displayMatchesForDate(tomorrowMatches);
}

function getAllMatchesForDate(date) {
    let matchesForDate = [];
    for (const league in matches) {
        matchesForDate = [...matchesForDate, ...matches[league].filter(match => match.fecha === date)];
    }
    return matchesForDate;
}

function displayMatchesForDate(data) {
    const tableBody = document.getElementById('resultsTable').querySelector('tbody');
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No hay partidos disponibles para esta fecha.</td></tr>';
        return;
    }
    data.forEach(match => {
        const row = `<tr>
            <td>${match.local}</td>
            <td>${match.visitante}</td>
            <td>${match.fecha}</td>
            <td>${match.hora}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getNextMatches(startDate, count) {
    const nextMatches = [];
    for (const league in matches) {
        const upcomingMatches = matches[league].filter(match => new Date(match.fecha) >= startDate);
        nextMatches.push(...upcomingMatches.slice(0, count));
    }
    return nextMatches;
}
