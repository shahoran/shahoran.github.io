$(document).ready(async function () {

function getDailyCacheKey() {
    const today = new Date();
    return today.toISOString().slice(0, 10); // "2025-12-07"
}
function getDailyURL(path) {
    return `${path}?v=${getDailyCacheKey()}`;
}




    // --- Obtener ID desde la URL (igual que ya tenías) ---
    const params = new URLSearchParams(window.location.search);
    const pjId = params.get("id");
    if (!pjId) return;

    // --- Decide si cargas characters.json completo o archivo por personaje ---
    // Recomendación: usar archivos por personaje: /chaos/data/characters/{id}.json
    // permite archivos más grandes y cambios sin recargar TODO el listado.
    // Fallback si no existe archivo individual, intenta characters.json.

    let pjData;
    let neutralsJson;
    try {
        pjData = await $.getJSON(getDailyURL(`/chaos/data/characters/${pjId}.json`));
        neutralsJson = await $.getJSON(getDailyURL(`/chaos/data/neutrals.json`));
        FragmentsJson = await $.getJSON(getDailyURL(`/chaos/data/fragments.json`));
    } catch (e) {
        // fallback: characters.json
        const all = await $.getJSON(getDailyURL("/chaos/data/characters.json"));
        pjData = all[pjId];
    }
    if (!pjData) return;

    // --- POBLAR DATOS BÁSICOS ---
    $("#pj-nombre").text(pjData.name || "—");
    $("#pj-img").attr("src", pjData.img ? "/chaos/img/pjsbanner/" + pjData.img : "/chaos/img/placeholder.png");
    //$("#pj-clase").text(pjData.class || "");
    $("#pj-clase-icon").attr("src", pjData.class ? "/chaos/img/icons/" + pjData.class + ".png" : "");
    //$("#pj-elemento").text(pjData.element || "");
    $("#pj-elemento-icon").attr("src", pjData.element ? "/chaos/img/icons/" + pjData.element + ".png" : "");
    $("#pj-faccion").text(pjData.faction || "");
    let stars = "";
    for (let i = 0; i < pjData.rarity; i++) {
        stars += "★";
    }
    $("#pj-rango").text(stars || "—");

    // --- EVENTOS PESTAÑAS ---
    $("#pj-tabs button").on("click", function () {
        const target = $(this).data("target");
        // activar botón
        $("#pj-tabs button").removeClass("active");
        $(this).addClass("active");
        // mostrar contenido
        $(".pj-tab-content").addClass("d-none");
        $("#" + target).removeClass("d-none");
        // opcional: si la sección tiene render lazy, llamarla
        if (target === "tab-cartas") renderCartas(pjData);
        if (target === "tab-builds") renderBuilds(pjData);
        if (target === "tab-epifanias") renderEpifanias(pjData);
        if (target === "tab-copiar") renderCopy(pjData);
        if (target === "tab-neutral") renderNeutrals(pjData, neutralsJson);
        if (target === "tab-fragmentos") renderFragments(pjData, FragmentsJson);
        if (target === "tab-potenciales") renderPotencial(pjData);
        // etc: otros renderizadores
    });

    // Vista compacto / detallado
    $("#view-compact").on("click", function () { $("#character-detail-container").addClass("view-compact"); $("#view-detailed").removeClass("active"); $(this).addClass("active"); });
    $("#view-detailed").on("click", function () { $("#character-detail-container").removeClass("view-compact"); $("#view-compact").removeClass("active"); $(this).addClass("active"); });

    // copiar link
    $("#btn-copy-link").on("click", function () {
        navigator.clipboard?.writeText(window.location.href);
        $(this).text("Link copiado").prop("disabled", true);
        setTimeout(() => $(this).text("Copiar link").prop("disabled", false), 1200);
    });

    // ver json raw (solo para desarrollo)
    $("#btn-open-json").on("click", function () {
        const w = window.open("", "_blank");
        w.document.write("<pre>" + JSON.stringify(pjData, null, 2) + "</pre>");
    });

    // Render inicial: cartas (por defecto)
    renderCartas(pjData);
    // ----------------------------------------------------------------
    // RENDERIZADORES (ejemplos base — después los puedes ampliar)
    function renderCartas(data) {
        const $list = $("#cartas-list").empty();
        if (!data.cards || data.cards.length === 0) {
            $list.append(`<div class="col-12"><p class="text-muted">No hay cartas definidas.</p></div>`);
            return;
        }
        data.cards.forEach(card => {
            const html = `
        <div class="col-3 col-md-3 col-lg-3 mb-2">
          <div class="card-cartita">
            <img src="/chaos/img/cards/${card.img || 'default.png'}" alt="${card.name}" style="width:75%;object-fit:cover;border-radius:4px;">
            <div class="mt-2">
              <strong>${card.name}</strong>
              <div class="small text-muted">${card.type || ''}${card.basic ? "/Basic" : ""}</div>
            </div>
          </div>
        </div>`;
            $list.append(html);
        });
    }
    // Ejemplo renderizador Epifanias
    // (similar a cartas, pero con estructura más compleja)
    // ----------------------------------------------------------------
    function renderEpifanias(data) {
        const $container = $("#epifanias-list").empty();
        const epifanias = data.epiphanies || [];
        const cards = data.cards || [];

        if (!epifanias.length) {
            $container.append(`<p class="text-muted">Este personaje no tiene epifanías registradas.</p>`);
            return;
        }

        epifanias.forEach(epi => {
            const cardInfo = cards.find(c => c.id === epi.cardId);

            const $card = $(`
            <div class="epifania-card mb-4 p-3 d-flex align-items-start gap-4">

                <!-- IZQUIERDA: CARTA BASE + NOMBRE -->
                <div class="epifania-base text-center">
                    <img class="epifania-card-base" src="/chaos/img/cards/${cardInfo?.img}">
                    <div class="epifania-base-name mt-2">
                        ${cardInfo?.name}
                    </div>
                </div>

                <!-- DERECHA: LISTA DE EPIFANÍAS -->
                <div class="epifania-row d-flex flex-wrap gap-3"></div>

            </div>
        `);

            const $optRow = $card.find(".epifania-row");

            epi.options.forEach(op => {
                const $op = $(`
                <div class="epifania-option ${op.best ? "epifania-best" : ""}">
                    <img src="/chaos/img/epiphanies/${op.img}" class="epifania-epicard-img">
                    <div class="epifania-name">
                        ${op.best ? '<span class="badge bg-danger ms-1" data-i18n="recomendada">' + t("recomendada") + '</span>' : ''}
                    </div>
                </div>
            `);

                $optRow.append($op);
            });

            $container.append($card);
        });
    }



    // Ejemplo renderizador Copy
    // ----------------------------------------------------------------
    function renderCopy(data) {
        const $container = $("#copy-list").empty();
        const copyList = data.copy || [];
        const cards = data.cards || [];
        const epifanias = data.epiphanies || [];

        if (!copyList.length) {
            $container.append(`<p class="text-muted">Este personaje no tiene cartas recomendadas para copiar.</p>`);
            return;
        }

        copyList.forEach(copyItem => {
            const cardInfo = cards.find(c => c.id === copyItem.cardId);

            const $block = $(`
            <div class="copy-block">
                <div class="copy-row">

                    <!-- IZQUIERDA: carta base -->
                    <div class="epifania-base text-center">
                        <img class="epifania-card-base" src="/chaos/img/cards/${cardInfo?.img}">
                        <div class="epifania-base-name mt-2">
                            ${cardInfo?.name}
                        </div>
                    </div>

                    <!-- DERECHA: pilas de epifanías copiadas -->
                    <div class="copy-grid"></div>

                </div>
            </div>
        `);

            const $grid = $block.find(".copy-grid");

            (copyItem.options || []).forEach(op => {

                // Buscar epifanía correspondiente
                const epiPack = epifanias.find(e => e.cardId === copyItem.cardId);
                const epiInfo = epiPack?.options.find(e => e.id === op.epiphanyId);

                // Crear la pila
                const $stack = $(`<div class="copy-stack"></div>`);

                // Imagen principal (epifanía recomendada)
                const $mainImg = $(`
                <img 
                    src="/chaos/img/epiphanies/${epiInfo?.img}" 
                    class="">
            `);

                $stack.append($mainImg);

                // Duplicados (más grandes)
                for (let i = 1; i <= op.copies; i++) {
                    const offset = i * 12; // pila más marcada
                    const $dup = $(`
                    <img 
                        src="/chaos/img/epiphanies/${epiInfo?.img}"
                        class="copy-duplicate "
                        style="top:${offset}px; left:${offset}px; z-index:${i};">
                `);
                    $stack.append($dup);
                }

                const $label = $(`
                <div class="copy-label mb-1 text-center">
                    <span class="badge bg-primary ms-1">${op.copies + ' <span data-i18n="copias">' + t("copias") + "</span></span>"} ${op.best ? '<span class="badge bg-danger ms-1" data-i18n="recomendada">' + t("recomendada") + '</span>' : ""}
                </div>
            `);

                const $stackContainer = $("<div>").append($label).append($stack);

                $grid.append($stackContainer);
            });

            $container.append($block);
        });
    }


    // Ejemplo renderizador Neutrales
    // ----------------------------------------------------------------
    function renderNeutrals(data, neutralsjson) {
        console.log(neutralsjson);
        const $container = $("#neutral-list").empty();

        const neutrals = data.neutrals || [];

        if (!neutrals.length) {
            $container.append(`<p class="text-muted">Este personaje no tiene cartas neutrales recomendadas.</p>`);
            return;
        }

        // Contenedor general con estilo similar a epifanías
        const $row = $(`
        <div class="neutrals-card mb-4 p-3 d-flex flex-wrap gap-3"></div>
    `);

        neutrals.forEach(id => {
            const card = neutralsjson[id];
            if (!card) return;

            const $card = $(`
            <div class="neutral-option text-center">
                <img src="/chaos/img/neutrals/${card.img}" class="epifania-epicard-img">
                <div class="neutral-name mt-1">${card.name}</div>
            </div>
        `);

            $row.append($card);
        });

        $container.append($row);
    }

    // Ejemplo renderizador fragmentos
    // ----------------------------------------------------------------
    function renderFragments(data, fragmentsJson) {
        const $container = $("#fragmentos-list").empty();

        const fragmentGroups = data.fragments || [];

        if (!fragmentGroups.length) {
            $container.append(`<p class="text-muted">Este personaje no tiene fragmentos recomendados.</p>`);
            return;
        }

        fragmentGroups.forEach(group => {

            // Título de la combinación
            const $title = $(`
            <div class="fw-bold text-capitalize">
                ${group.name}
            </div>
        `);

            $container.append($title);

            // Contenedor de la fila de fragmentos
            const $row = $(`
            <div class="fragments-card mb-1 p-3 d-flex flex-wrap gap-2"></div>
        `);

            group.sets.forEach(fId => {
                const fragment = fragmentsJson[fId];
                if (!fragment) return;

                const $frag = $(`
                <div class="fragment-option text-center"
                     data-bs-toggle="tooltip"
                     data-bs-placement="bottom"
                     title="${fragment.effect}">

                    <img src="/chaos/img/fragments/${fragment.img}" class="fragment-img">

                    <div class="fragment-name mt-1">${fragment.name}</div>
                    <div class="fragment-sub small text-muted">${fragment.pieces} <span data-i18n='piezas'>${t("piezas")}</span></div>
                </div>
            `);

                $row.append($frag);
            });

            $container.append($row);
        });

        // Inicializar tooltips Bootstrap
        const tooltipTriggerList = [].slice.call(
            document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
    }




    //-- POTENCIALES ---
    // ----------------------------------------------------------------
    // Ejemplo renderizador potencial
    function renderPotencial(data) {
        const potentials = data.potentials || [];

        $(".node").each(function () {
            const pid = $(this).data("pid");
            const pot = potentials[pid];
            if (!pot) return;
            let recomendado="";
            if(pot.priority===0){
                console.log(t("lowpriority"));
                recomendado='<b data-i18n="lowpriority">'+t("lowpriority")+"</b>"
            }else if(pot.priority===1){
                recomendado='<b data-i18n="opcional">'+t("opcional")+"</b>"
            }else if(pot.priority===2){
                recomendado='<b data-i18n="highpriority">'+t("highpriority")+"</b>";
            }
            const tooltipHtml = `
            ${recomendado}<br>
            ${pot.description}`;

            $(this)
                .attr("data-bs-toggle", "tooltip")
                .attr("data-bs-html", "true")
                .attr("data-bs-theme", "dark")
                .attr("title", tooltipHtml);

            $(this).addClass("priority-" + pot.priority);

            // Cambiar icono según prioridad (si existe)
            const img = $(this).find(".node-icon img");
            if (img.length) {
                let src = "potencial0";
                if (pot.priority === 0) {
                    if (pid === 1 || pid === 4 || pid === 8 || pid === 9) {
                        src = "potencialno";
                    } else {
                        src = "potencial0recortado";
                    }
                } else {
                    if (pid === 1 || pid === 4 || pid === 8 || pid === 9) {
                        src = "potencialsi";
                    } else {
                        src = "potencial10recortado";
                    }
                }
                img.attr("src", `/chaos/img/icons/${src}.png`);
            }
        });

        // Reset para evitar duplicados
        $("[data-bs-toggle='tooltip']").each(function () {
            const instance = bootstrap.Tooltip.getInstance(this);
            if (instance) instance.dispose();
        });

        // Crear tooltips exactamente abajo
        $("[data-bs-toggle='tooltip']").each(function () {
            new bootstrap.Tooltip(this, {
                html: true,
                placement: "bottom",
                fallbackPlacements: [] // evita movimiento automático
            });
        });
    }







    function renderBuilds(data) {
        const $b = $("#builds-list").empty();
        if (!data.builds || data.builds.length === 0) {
            $b.append(`<p class="text-muted">No hay builds configuradas.</p>`);
            return;
        }
        data.builds.forEach((build, i) => {
            const card = $(`
        <div class="card mb-2">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h5 class="mb-1">${build.name || 'Build ' + (i + 1)}</h5>
                <div class="small text-muted">${build.role || ''} • ${build.playstyle || ''}</div>
              </div>
              <div>
                <button class="btn btn-sm btn-outline-primary btn-copy-build" data-index="${i}">Copiar recomendación</button>
              </div>
            </div>
            <p class="mt-2 mb-1">${build.description || ''}</p>
            <div class="small text-muted">Equipo recomendado: ${(build.recommended_team || []).join(", ")}</div>
          </div>
        </div>
      `);
            $b.append(card);
        });

        // Ejemplo acción copiar build (genera texto para copiar)
        $(".btn-copy-build").on("click", function () {
            const idx = $(this).data("index");
            const b = data.builds[idx];
            const txt = `Build: ${b.name}\nRole: ${b.role}\nRecomendado: ${(b.recommended_team || []).join(", ")}\nNotas: ${b.notes || ''}`;
            navigator.clipboard?.writeText(txt);
            $(this).text("Copiado").prop("disabled", true);
            setTimeout(() => $(this).text("Copiar recomendación").prop("disabled", false), 1200);
        });
    }

});