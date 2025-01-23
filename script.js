document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.addEventListener('click', handleTabClick));

    document.getElementById('todayBtn').addEventListener('click', showToday);
    document.getElementById('tomorrowBtn').addEventListener('click', showTomorrow);
    document.getElementById('nextBtn').addEventListener('click', showNext);
    document.getElementById('allBtn').addEventListener('click', showAllGames);

    // Cargar la primera liga (Bundesliga) por defecto
    loadCSV('Bundesliga.csv');
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
    const today = new Date();
    const leagueMatches = rows.slice(1).map(row => {
        const columns = row.split(',');
        if (columns.length >= 4) {
            const [local, visitante, fecha, hora] = columns.map(col => col?.trim() || '');
            if (local && visitante && fecha && hora) {
                const formattedDate = formatDate(fecha);
                const matchDate = new Date(formattedDate);
                if (matchDate >= today) {
                    return { local, visitante, fecha: formattedDate, hora };
                }
            }
        }
        return null;
    }).filter(match => match !== null);
    
    matches[league] = leagueMatches; // Almacena los partidos de cada liga
    displayMatches(league, leagueMatches); // Mostrar los partidos de la liga cargada
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

function showToday() {
    const today = getFormattedDate(new Date());
    const todayMatches = getAllMatchesForDate(today);
    displayMatchesForDate(todayMatches);
}

function showTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedTomorrow = getFormattedDate(tomorrow);
    const tomorrowMatches = getAllMatchesForDate(formattedTomorrow);
    displayMatchesForDate(tomorrowMatches);
}

function showNext() {
    const today = new Date();
    const nextMatches = getNextMatches(today, 5);
    displayMatchesForDate(nextMatches);
}

function showAllGames() {
    const today = getFormattedDate(new Date()); // Obtener la fecha de hoy
    const tomorrow = getFormattedDate(new Date(new Date().setDate(new Date().getDate() + 1))); // Obtener la fecha de mañana

    const allMatches = [
        ...getAllMatchesForDate(today),   // Obtener los partidos de hoy
        ...getAllMatchesForDate(tomorrow) // Obtener los partidos de mañana
        
    ];

    displayMatchesForDate(allMatches); // Mostrar los partidos de hoy y mañana
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
