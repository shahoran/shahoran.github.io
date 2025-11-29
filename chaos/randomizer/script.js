// Variable global
const PERSONAJES = {
    1: { nombre: "haru", activo: true, rol: "dps" },
    2: { nombre: "hugo", activo: true, rol: "dps" },
    3: { nombre: "khalipe", activo: true, rol: "tank" },
    4: { nombre: "amir", activo: true, rol: "tank" },
    5: { nombre: "beryl", activo: true, rol: "dps" },
    6: { nombre: "cassius", activo: true, rol: "support" },
    7: { nombre: "lucas", activo: true, rol: "dps" },
    8: { nombre: "luke", activo: true, rol: "dps" },
    9: { nombre: "magna", activo: true, rol: "tank" },
    10: { nombre: "maribell", activo: true, rol: "tank" },
    11: { nombre: "mei lin", activo: true, rol: "dps" },
    12: { nombre: "mika", activo: true, rol: "support" },
    13: { nombre: "nia", activo: true, rol: "support" },
    14: { nombre: "orlea", activo: true, rol: "support" },
    15: { nombre: "owen", activo: true, rol: "dps" },
    16: { nombre: "rei", activo: true, rol: "support" },
    17: { nombre: "renoa", activo: true, rol: "dps" },
    18: { nombre: "rin", activo: true, rol: "dps" },
    19: { nombre: "selena", activo: true, rol: "dps" },
    20: { nombre: "tressa", activo: true, rol: "dps" },
    21: { nombre: "veronica", activo: true, rol: "dps" },
    22: { nombre: "yuki", activo: true, rol: "dps" },
    23: { nombre: "kayron", activo: true, rol: "dps" },
};
function guardarEstadoPersonajes() {
    const desactivados = [];

    for (const id in PERSONAJES) {
        if (!PERSONAJES[id].activo) {
            desactivados.push(Number(id));
        }
    }

    localStorage.setItem("personajes_desactivados", JSON.stringify(desactivados));
}
function cargarEstadoPersonajes() {
    const data = localStorage.getItem("personajes_desactivados");

    if (!data) return; // si no existe, todo queda activo

    const desactivados = JSON.parse(data);

    desactivados.forEach(id => {
        if (PERSONAJES[id]) {
            PERSONAJES[id].activo = false;
        }
    });
}
// Mostrar / ocultar personajes
$("#btnMostrarPjs").on("click", function () {
    $("#contenedor-personajes").addClass("d-flex").toggleClass("d-none");
    $(this).text(function (i, text) {
        return text === "Mostrar personajes" ? "Ocultar personajes" : "Mostrar personajes";
    });
});

// ====== CARGA DE PERSONAJES ======
function cargarPersonajes() {
    const cont = $("#contenedor-personajes");
    cont.empty();
    for (let id in PERSONAJES) {
        console.log(id);
        let pj = PERSONAJES[id];
        let div = $(`
            <div class="personaje-box seleccionado" data-id="${id}">
                <img src="pjs/${pj.nombre}.png">
                <div class="check-marca">${pj.activo === true ? "✔" : "X"}</div>
                <div class="text-center mt-1">${pj.nombre.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}</div>
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
    PERSONAJES[id].activo = !PERSONAJES[id].activo;
    let check = elemento.find(".check-marca")
    check.text(PERSONAJES[id].activo === true ? "✔" : "X");
    guardarEstadoPersonajes();
}

function generateRandomizer() {
    // 1. Separar supports y no supports
    const supports = [];
    const otros = [];

    for (const id in PERSONAJES) {
        const pj = PERSONAJES[id];
        if (!pj.activo) continue; // si está inactivo, lo salta

        if (pj.rol === "support") supports.push({ id, ...pj });
        else otros.push({ id, ...pj });
    }

    // Validación mínima
    if (supports.length < 1) {
        $("#result").html("<p>No hay supports activos.</p>");
        return;
    }

    // 2. Escoger 1 support aleatorio
    const support = supports[Math.floor(Math.random() * supports.length)];

    // 3. Escoger 2 aleatorios de cualquier rol (excepto el elegido)
    const disponibles = otros.filter(p => p.id !== support.id);

    if (disponibles.length < 2) {
        $("#result").html("<p>No hay suficientes personajes para formar un equipo.</p>");
        return;
    }

    // Mezclar aleatoriamente
    const mezclados = disponibles.sort(() => Math.random() - 0.5);

    // Seleccionar 2
    const p2 = mezclados[0];
    const p3 = mezclados[1];

    // 4. Mostrar resultado
    const equipo = [support, p2, p3];

    let html = `<div class="equipo-container" style="display:flex; gap:20px;">`;

    equipo.forEach(p => {
        const img = `pjs/${p.nombre}.png`;

        html += `
            <div style="text-align:center;" class="personaje-box seleccionado">
                <img src="${img}" style="
                    width:120px;
                    height:120px;
                    border-radius:50%;
                    object-fit:cover;
                    border:3px solid #444;"
                >
                <div class="check-marca">✔</div>
                <div style="margin-top:5px;">${p.nombre.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}</div>
            </div>
        `;
    });

    html += `</div>`;

    $("#result").html(html);
}





$("#btnGenerar").on("click", function () {
    generateRandomizer();
});

// Cargar al inicio
$(document).ready(function () {
    cargarEstadoPersonajes();
    cargarPersonajes();

});
