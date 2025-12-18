let CHARACTERS = {};        // datos del JSON
let CHARACTERS_STATE = {}; // estado cliente (true / false)
function cargarEstadoPersonajes() {
    const data = localStorage.getItem("automizer_chaos");
    if (!data) return;

    const desactivados = JSON.parse(data);

    desactivados.forEach(id => {
        if (CHARACTERS_STATE[id] !== undefined) {
            CHARACTERS_STATE[id] = false;
        }
    });
}
function guardarEstadoPersonajes() {
    const desactivados = Object.keys(CHARACTERS_STATE)
        .filter(id => !CHARACTERS_STATE[id])
        .map(Number);

    localStorage.setItem("automizer_chaos", JSON.stringify(desactivados));
}
async function cargarPersonajesData() {
    CHARACTERS = await $.getJSON(getDailyURL("/chaos/data/characters.json")?getDailyURL("/chaos/data/characters.json"):"/chaos/data/characters.json");

    // inicializar estado (todos activos)
    for (const id in CHARACTERS) {
        CHARACTERS_STATE[id] = true;
    }

    cargarEstadoPersonajes();
    renderPersonajes();
}

// Mostrar / ocultar personajes
$("#btnMostrarPjs").on("click", function () {
    $("#contenedor-personajes").addClass("d-flex").toggleClass("d-none");
    const isHidden = $("#contenedor-personajes").hasClass("d-none");
    $(this).text(isHidden ? t("show_characters") : t("hide_characters"));
});

// ====== CARGA DE PERSONAJES ======
function renderPersonajes() {
    const cont = $("#contenedor-personajes");
    cont.empty();

    for (const id in CHARACTERS) {
        const pj = CHARACTERS[id];
        const activo = CHARACTERS_STATE[id];

        const nombre = pj.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

        const div = $(`
            <div class="personaje-box seleccionado" data-id="${id}">
                <img src="/chaos/img/pjs/${pj.img}">
                <div class="check-marca">${activo ? "✔" : "X"}</div>
                <div class="text-center mt-1">${nombre}</div>
            </div>
        `);

        div.on("click", function () {
            togglePersonaje(id, $(this));
        });

        cont.append(div);
    }
}

// ====== TOGGLE SELECCIÓN ======
function togglePersonaje(id, elemento) {
    CHARACTERS_STATE[id] = !CHARACTERS_STATE[id];

    elemento
        .find(".check-marca")
        .text(CHARACTERS_STATE[id] ? "✔" : "X");

    guardarEstadoPersonajes();
}
function mostrarEquipo(equipo) {
    let html = `<div class="equipo-container" style="display:flex; gap:20px;">`;

    equipo.forEach(p => {
        const nombre = p.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

        html += `
            <div style="text-align:center;" class="personaje-box elegido">
                <img src="/chaos/img/pjs/${p.img}">
                <div style="margin-top:5px;">${nombre}</div>
            </div>
        `;
    });

    html += `</div>`;

    $("#resultado_texto").show();
    $("#result").html(html);
}
function generateFacilRandomizer() {
    const supports = [];
    const otros = [];

    for (const id in CHARACTERS) {
        // estado cliente
        if (!CHARACTERS_STATE[id]) continue;

        const pj = CHARACTERS[id];

        if (pj.class === "controller") {
            supports.push({ id, ...pj });
        } else {
            otros.push({ id, ...pj });
        }
    }

    if (supports.length < 1) {
        $("#result").html(
            `<p data-i18n="no_support">${t("no_support")}</p>`
        );
        return;
    }

    const support = supports[Math.floor(Math.random() * supports.length)];

    const disponibles = otros.filter(p => p.id !== support.id);

    if (disponibles.length < 2) {
        $("#result").html(
            `<p data-i18n="no_personajes_suficientes">${t("no_personajes_suficientes")}</p>`
        );
        return;
    }

    const mezclados = disponibles.sort(() => Math.random() - 0.5);

    mostrarEquipo([support, mezclados[0], mezclados[1]]);
}
function generateFullRandom() {
    const activos = [];

    for (const id in CHARACTERS) {
        if (!CHARACTERS_STATE[id]) continue;

        activos.push({ id, ...CHARACTERS[id] });
    }

    if (activos.length < 3) {
        $("#result").html(
            `<p data-i18n="no_personajes_suficientes">${t("no_personajes_suficientes")}</p>`
        );
        return;
    }

    const mezclados = activos.sort(() => Math.random() - 0.5);

    mostrarEquipo([mezclados[0], mezclados[1], mezclados[2]]);
}
function generateRandomizer() {
    const modo = localStorage.getItem("automizer_modo") || "facil";

    if (modo === "nightmare") {
        return generateFullRandom();
    } else if (modo === "facil") {
        return generateFacilRandomizer();
    }
}

$("#btnGenerar").on("click", function () {
    generateRandomizer();
});

$("#dificultad").on("change", function () {
    localStorage.setItem("automizer_modo", $(this).val());
});


// Cargar al inicio
$(document).ready(async function () {
    await cargarPersonajesData();

    const modo = localStorage.getItem("automizer_modo") || "facil";
    $("#dificultad").val(modo);

});