$(document).ready(async function () {

    function getDailyCacheKey() {
        const today = new Date();
        return today.toISOString().slice(0, 10); // "2025-12-07"
    }
    function getDailyURL(path) {
        return `${path}?v=${getDailyCacheKey()}`;
    }



    function initTooltips() {

        // 1. Eliminar tooltips antiguos
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
            const instance = bootstrap.Tooltip.getInstance(el);
            if (instance) {
                instance.dispose();
            }
        });

        // 2. Crear los nuevos
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
            new bootstrap.Tooltip(el, {
                placement: 'bottom',
                fallbackPlacements: ['right', 'left', 'bottom'], // sin top
                boundary: 'window',
                container: 'body'
            });
        });
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
        parnersJson = await $.getJSON(getDailyURL(`/chaos/data/partners.json`));
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
        if (target === "tab-equipos") renderTeams(pjData);
        if (target === "tab-partners") renderPartners(pjData, parnersJson);
        if (target === "tab-removal") renderRemovalPriorities(pjData);
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
            <div class="copy-block mb-4 p-3 d-flex align-items-start gap-4">

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
        <div class="epifania-option ${op.best ? "epifania-best" : ""}"
            data-bs-toggle="tooltip"
            data-bs-html="true"
            data-bs-placement="bottom"
            title="
                <b data-i18n='${op.notes}'>${t(op.notes)}</b><br>
            ">
            <img src="/chaos/img/epiphanies/${op.img}" class="epifania-epicard-img">

            <div class="epifania-name">
                ${op.best
                        ? `<span class="badge bg-danger ms-1" data-i18n="recomendada">${t("recomendada")}</span>`
                        : `<span class="badge bg-secondary ms-1" data-i18n="opcional">${t("opcional")}</span>`
                    }
            </div>
        </div>
    `);

                $optRow.append($op);
            });

            $container.append($card);
        });
        initTooltips()
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
                    <span class="badge bg-primary ms-1">${op.copies + ' <span data-i18n="copias">' + t("copias") + "</span></span>"}
                    ${op.best ? '<span class="badge bg-danger ms-1" data-i18n="recomendada">' + t("recomendada") + '</span>' : '<span class="badge bg-secondary ms-1" data-i18n="opcional">' + t("opcional") + '</span>'}
                </div>
            `);
                const $stackContainer = $(`
                    <div class="copy-card-container"
                    data-bs-toggle="tooltip"
                    data-bs-html="true"
                    data-bs-placement="bottom"
                    title="<b>${t(epiInfo.notes)}</b>">
                    </div>
                    `);
                $stackContainer.append($label).append($stack);

                $grid.append($stackContainer);
            });

            $container.append($block);
        });
        initTooltips()
    }


    // Ejemplo renderizador Neutrales
    // ----------------------------------------------------------------
    function renderNeutrals(data, neutralsjson) {
        console.log(neutralsjson);
        const $container = $("#neutral-list").empty();

        const neutrals = data.neutrals || [];

        if (!neutrals.length) {
            $container.append(`<p class="text-muted">${t("Este personaje no tiene cartas neutrales recomendadas")}</p>`);
            return;
        }

        // Contenedor general con estilo similar a epifanías
        const $row = $(`
        <div class="neutrals-card copy-block mb-4 p-3 d-flex flex-wrap gap-3"></div>
    `);

        neutrals.forEach(n => {
            const card = neutralsjson[n.id];
            if (!card) return;

            const badge = n.best
                ? `<span class="badge bg-danger ms-1" data-i18n="recomendada">${t("recomendada")}</span>`
                : `<span class="badge bg-secondary ms-1" data-i18n="opcional">${t("opcional")}</span>`;

            const $card = $(`
            <div class="neutral-option text-center">
                <img src="/chaos/img/neutrals/${card.img}" class="epifania-epicard-img">
                <div class="neutral-name mt-1">
                    ${card.name} ${badge}
                </div>
            </div>
        `);

            $row.append($card);
        });

        $container.append($row);
    }

    // Ejemplo renderizador fragmentos
    // ----------------------------------------------------------------
    async function renderFragments(data, fragmentsJson) {
        const $container = $("#fragmentos-list").empty();

        const fragmentGroups = data.fragments || [];

        if (!fragmentGroups.length) {
            $container.append(`<p class="text-muted">Este personaje no tiene fragmentos recomendados.</p>`);
            return;
        }

        fragmentGroups.forEach(group => {

            // Contenedor de la fila principal + alternativas
            const $contenedorset = $(`<div class="copy-block" style="width:100%"></div>`)

            // Título del set
            $contenedorset.append(`
            <div class="fw-bold text-capitalize mb-1" data-i18n="${group.name}">
                ${t(group.name)}
            </div>
        `);


            const $wrapper = $(`<div class="d-flex fragment-row gap-3"></div>`);

            // --- PRIMARIO ---
            const $main = $(`<div class="flex-grow-1"></div>`);
            const $mainRow = $(`<div class="fragments-card mb-1 p-3 d-flex flex-wrap gap-2"></div>`);

            group.sets.forEach(fId => {
                const fragment = fragmentsJson[fId];
                if (!fragment) return;

                $mainRow.append(`
                <div class="fragment-option text-center"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title="${fragment.effect}">
                    
                    <img src="/chaos/img/fragments/${fragment.img}" class="fragment-img">
                    <div class="fragment-name mt-1">${fragment.name}</div>
                    <div class="fragment-sub small text-muted">${fragment.pieces} <span data-i18n='piezas'>${t("piezas")}</span></div>
                </div>
            `);
            });

            $main.append(`<div class="small fw-bold text-primary mb-1" data-i18n="setprincipal">${t("setprincipal")}</div>`);
            $main.append($mainRow);
            $wrapper.append($main);

            // --- SECUNDARIOS / SUB ---
            if (group.sub && group.sub.length) {
                const $sub = $(`<div class="sub-column"></div>`);
                const $subRow = $(`<div class="fragments-card mb-1 p-3 d-flex flex-wrap gap-2"></div>`);

                group.sub.forEach(fId => {
                    const fragment = fragmentsJson[fId];
                    if (!fragment) return;

                    $subRow.append(`
                    <div class="fragment-option text-center optional-fragment"
                         data-bs-toggle="tooltip"
                         data-bs-placement="bottom"
                         title="${fragment.effect}">

                        <img src="/chaos/img/fragments/${fragment.img}" class="fragment-img">
                        <div class="fragment-name mt-1">${fragment.name}</div>
                        <div class="fragment-sub small text-muted">${fragment.pieces} <span data-i18n='piezas'>${t("piezas")}</span></div>
                    </div>
                `);
                });

                $sub.append(`
                <div class="small fw-bold text-warning mb-1" data-i18n="alternative">
                    ${t("alternative")}
                </div>
            `);
                $sub.append($subRow);

                $wrapper.append($sub);
            }

            $contenedorset.append($wrapper);
            $container.append($contenedorset);
        });

        // inicializar tooltips
        initTooltips()
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
            let recomendado = "";
            if (pot.priority === 0) {
                console.log(t("lowpriority"));
                recomendado = '<b data-i18n="lowpriority">' + t("lowpriority") + "</b>"
            } else if (pot.priority === 1) {
                recomendado = '<b data-i18n="opcional">' + t("opcional") + "</b>"
            } else if (pot.priority === 2) {
                recomendado = '<b data-i18n="highpriority">' + t("highpriority") + "</b>";
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

        initTooltips();
    }







    //-- TEAMS ---
    // ----------------------------------------------------------------
    // Ejemplo renderizador TEAMS
    async function renderTeams(data) {
        console.log(data);
        const $container = $("#teams-list").empty();
        const basePjData = data; // personaje actual

        const pjCache = {}; // cache para evitar requests repetidas

        async function getPjData(id) {
            if (id === 0) return basePjData;
            if (pjCache[id]) return pjCache[id];

            const json = await $.getJSON(`/chaos/data/characters/${id}.json`);
            pjCache[id] = json;
            return json;
        }

        for (const team of data.teams) {


            const $teamBox = $(`
<div class="copy-block mb-4 p-3 border rounded">
    <h4 class="fw-bold mb-3" data-i18n="${team.name}">${t(team.name)}</h4>

    <div class="d-flex gap-4">

        <!-- IZQUIERDA -->
        <div class="team-pjs d-flex flex-column gap-2"></div>

        <!-- DERECHA -->
        <div class="flex-grow-1">

            <!-- TÍTULO + AYUDA -->
            <div class="d-flex align-items-center gap-2 mb-2">
                <h6 class="m-0 text-warning" data-i18n="team_epifanias">${t("team_epifanias")}</h6>
                <i class="bi bi-question-circle-fill text-white epi-help-icon"
                    style="font-size: 1.1rem; cursor: pointer; text-shadow: 0 0 4px rgba(0,0,0,0.6);"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    data-bs-html="true"
                    title="
                        <b data-i18n='team_recom_best_epi'>
                            ${t("team_recom_best_epi")}
                        </b>
                    ">
                </i>
            </div>

            <!-- CONTENEDOR DE EPIFANÍAS -->
            <div class="team-epiphanies d-flex flex-wrap gap-3 align-content-start"></div>

        </div>
    </div>
</div>
`);



            const $pjCol = $teamBox.find(".team-pjs");
            const $epiContainer = $teamBox.find(".team-epiphanies");

            // ---------------------------------------------------
            // 1. Mostrar personajes → vertical
            // ---------------------------------------------------

            // PJ 0 (personaje actual)
            $pjCol.append(`
    <img class="team-pj-icon"
         src="/chaos/img/pjs/${basePjData.img}"
         title="<b>${basePjData.name}</b>"
         data-bs-toggle="tooltip"
         data-bs-html="true">
`);


            // Otros personajes
            for (const pjId of team.pjs) {
                const pjData = await getPjData(pjId);

                $pjCol.append(`
        <img class="team-pj-icon"
             src="/chaos/img/pjs/${pjData.img}"
             title="<b>${pjData.name}</b>"
             data-bs-toggle="tooltip"
             data-bs-html="true">
    `);
            }

            // ---------------------------------------------------
            // 2. Epifanías optimizadas (sin recargar JSON)
            // ---------------------------------------------------

            for (const item of team.bestepiphanies) {

                const pjData = await getPjData(item.pj);

                // Buscar carta
                const card = pjData.cards.find(c => c.id === item.card);
                if (!card) continue;

                // Buscar epifanía
                const epiGroup = pjData.epiphanies.find(e => e.cardId === item.card);
                if (!epiGroup) continue;

                const epi = epiGroup.options.find(e => e.id === item.epi);
                if (!epi) continue;

                // Render solo la epifanía
                $epiContainer.append(`
    <div class="team-epi-option text-center">
        <img 
            src="/chaos/img/epiphanies/${epi.img}" 
            class="team-epi-img"
            title="<b>${pjData.name}</b><br><p data-i18n='${epi.notes}'>${t(epi.notes)}</p>"
            data-bs-toggle="tooltip"
            data-bs-html="true"
            data-bs-theme="dark">
    </div>
`);
            }

            $container.append($teamBox);

            initTooltips()
        }
    }






    //--------------------------------------------------------------------------------
    //-- PARTNERS --
    function renderPartners(data, partnersJson) {
        console.log(partnersJson);
        const $container = $("#partners-list").empty();

        const partners = data.partners || [];

        if (!partners.length) {
            $container.append(`<p class="text-muted">Este personaje no tiene partners recomendados.</p>`);
            return;
        }

        const $row = $(`
        <div class="partners-card copy-block mb-4 p-3 d-flex flex-wrap gap-3"></div>
    `);

        partners.forEach(id => {
            const partner = partnersJson[id];
            if (!partner) return;

            // Tooltip HTML
            const tooltipHtml = `
            <b>${partner.name}</b><br>
            ${partner.pasive}<br><br>
            <b>EGO SKILL</b><br>
            ${partner.Ego}
        `;

            const $card = $(`
            <div class="partner-option text-center neutral-option">
                <img src="/chaos/img/partners/${partner.img}" 
                     class="epifania-epicard-img partner-img">
                <div class="partner-name mt-1">${partner.name}</div>
            </div>
        `);

            // Activar tooltip estilo Bootstrap
            $card.attr("data-bs-toggle", "tooltip")
                .attr("data-bs-html", "true")
                .attr("data-bs-theme", "dark")
                .attr("data-bs-custom-class", "tooltip-partner")
                .attr("title", tooltipHtml);

            $row.append($card);
        });

        $container.append($row);

        // Inicializar tooltips nuevos
        initTooltips()
    }




    //-------------------------BORRAR CARTAS------------------------------------------
    function renderRemovalPriorities(data) {
        const $container = $("#removal-list").empty();

        const cards = data.cards || [];
        const removal = data.removal || [];

        if (!removal.length) {
            $container.append(`<p class="text-muted">Este personaje no tiene cartas para remover.</p>`);
            return;
        }

        // Contenedor principal con un solo bloque
        const $block = $(`
        <div class="copy-block mb-4 p-3 d-flex flex-wrap gap-3 align-items-start"></div>
    `);

        removal.forEach(rem => {
            const cardInfo = cards.find(c => c.id === rem.cardId);
            if (!cardInfo) return;

            const $card = $(`
            <div class="epifania-option ${rem.best ? "epifania-best" : ""}"
                style="width: 110px; text-align: center;"
                data-bs-toggle="tooltip"
                data-bs-html="true"
                data-bs-placement="bottom"
                title="<b>${cardInfo.name || ""}</b>">

                <img src="/chaos/img/cards/${cardInfo.img}" 
                     class="epifania-card-base" 
                     style="width:100%; border-radius:12px;">

                <div class="epifania-name mt-1" style="font-size:0.85rem;">
                    ${cardInfo.name}
                </div>

                <div class="mt-1">
                    ${rem.best
                    ? `<span class="badge bg-danger" data-i18n="recomendada">${t("recomendada")}</span>`
                    : `<span class="badge bg-secondary" data-i18n="opcional">${t("opcional")}</span>`
                }
                </div>
            </div>
        `);

            $block.append($card);
        });

        $container.append($block);
        initTooltips();
    }
});