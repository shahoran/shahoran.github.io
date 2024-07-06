$(document).ready(function () {
    let preguntas = [];
    let indicePreguntaActual = 0;
    let restricciones = {fumar: "S", drogas: "S", alcohol: "S", cardiaco: "S", genetica: "S", dieta: "S", deporte: "S", famcancer: "S", famcardiaco: "S"};
    let indice = 0;
    let imc = 0;
    let peso = 0;
    let primera = true;
    let altura = 0;
    let indices = {fumar: 0, atributos: 0, drogas: 0, alcohol: 0, enfermedades: 0, historial: 0, familia: 0, estilo: 0, dieta: 0, deporte: 0, tiemdeporte: 0, dormir: 0};

    preguntas = [
        {
            "pregunta": "¿Cuánto pesas?",
            "tipo": "numero",
            "indice": "atributos",
            "valor": 0
        },
        {
            "pregunta": "¿Cuánto mides?",
            "tipo": "numero",
            "indice": "atributos",
            "respuesta": 4,
            "valor": 0
        },
        {
            "pregunta": "¿Usted fuma o no?",
            "tipo": "restringe",
            "restriccion": "fumar",
            "indice": "fumar",
            "opciones": [
                {"texto": "Si", "valor": 20},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "restriccion": "fumar",
            "pregunta": "¿Cuanto fuma?(por dia)",
            "indice": "fumar",
            "tipo": "opciones",
            "opciones": [
                {"texto": "1", "valor": 10},
                {"texto": "2-5", "valor": 15},
                {"texto": ">6", "valor": 20}
            ]
        },
        {
            "pregunta": "¿Cada cuanto fuma?",
            "tipo": "opciones",
            "restriccion": "fumar",
            "indice": "fumar",
            "opciones": [
                {"texto": "Diario", "valor": 15},
                {"texto": "Semanal", "valor": 5},
                {"texto": "Una vez al mes", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Consume o ha consumido algun tipo de droga?",
            "tipo": "restringe",
            "restriccion": "drogas",
            "indice": "drogas",
            "opciones": [
                {"texto": "Si", "valor": 30},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Qué tipo de droga?",
            "tipo": "opciones",
            "restriccion": "drogas",
            "indice": "drogas",
            "opciones": [
                {"texto": "Sinteticas", "valor": 30},
                {"texto": "Naturales", "valor": 20}
            ]
        },
        {
            "pregunta": "¿Cada cuanto usa drogas?",
            "tipo": "opciones",
            "restriccion": "drogas",
            "indice": "drogas",
            "opciones": [
                {"texto": "Diario", "valor": 30},
                {"texto": "Semanal", "valor": 20},
                {"texto": "Una vez a al mes", "valor": 10},
                {"texto": "Ya no consume droga", "valor": -40}
            ]
        },
        {
            "pregunta": "¿Consume alcohol?",
            "tipo": "restringe",
            "restriccion": "alcohol",
            "indice": "alcohol",
            "opciones": [
                {"texto": "Si", "valor": 10},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Cada cuanto consume alcohol",
            "tipo": "opciones",
            "restriccion": "alcohol",
            "indice": "alcohol",
            "opciones": [
                {"texto": "Diario", "valor": 20},
                {"texto": "Semanal", "valor": 10},
                {"texto": "Una vez al mes", "valor": 5}
            ]
        },
        {
            "pregunta": "¿Cuanto es su consumo de alcohol cuando bebe? (ponga la cantida de vasos)",
            "tipo": "opciones",
            "restriccion": "alcohol",
            "indice": "alcohol",
            "opciones": [
                {"texto": "1-3", "valor": 5},
                {"texto": "4-6", "valor": 10},
                {"texto": "7-10", "valor": 20},
                {"texto": ">10", "valor": 30}
            ]
        },
        {
            "pregunta": "¿Que tipo de bebidas alcoholicas consume?",
            "tipo": "opciones",
            "restriccion": "alcohol",
            "indice": "alcohol",
            "opciones": [
                {"texto": "Cerveza o Vino", "valor": 10},
                {"texto": "Trago Corto", "valor": 20}
            ]
        },

        {
            "pregunta": "¿Tiene diabetes?",
            "tipo": "opciones",
            "indice": "enfermedades",
            "opciones": [
                {"texto": "Si", "valor": 20},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Tiene o ha tenido algun familiar directo con diabetes?",
            "tipo": "opciones",
            "indice": "familia",
            "opciones": [
                {"texto": "Si", "valor": 10},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Tiene cancer?",
            "tipo": "opciones",
            "indice": "enfermedades",
            "opciones": [
                {"texto": "Si", "valor": 30},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Tiene o ha tenido algun familiar directo con cancer?",
            "tipo": "restringe",
            "indice": "familia",
            "restriccion": "famcancer",
            "opciones": [
                {"texto": "Si", "valor": 10},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿El familiar que tuvo cancer, si es que fallecio, fue por el motivo de cancer?",
            "tipo": "opciones",
            "indice": "familia",
            "restriccion": "famcancer",
            "opciones": [
                {"texto": "Si", "valor": 10},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Ha tenido pensamientos suicidas alguna vez?",
            "tipo": "opciones",
            "indice": "enfermedades",
            "opciones": [
                {"texto": "Si", "valor": 20},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Tiene o ha tenido problemas cardiacos?",
            "tipo": "restringe",
            "indice": "enfermedades",
            "restriccion": "cardiaco",
            "opciones": [
                {"texto": "Si", "valor": 30},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Que problema cardiaco tiene o ha tenido?",
            "tipo": "opciones",
            "restriccion": "cardiaco",
            "indice": "enfermedades",
            "opciones": [
                {"texto": "Ataque coronario", "valor": 30},
                {"texto": "Enfermedad cardiaca o arterial", "valor": 20}
            ]
        },
        {
            "pregunta": "¿Tiene algun familiar con un problema cardiaco?",
            "tipo": "restringe",
            "indice": "familia",
            "restriccion": "famcardiaco",
            "opciones": [
                {"texto": "Si", "valor": 10},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿El familiar que tuvo problemas cardiacos, si es que fallecio, fue por el motivo de los problemas cardiacos?",
            "tipo": "opciones",
            "indice": "familia",
            "restriccion": "famcardiaco",
            "opciones": [
                {"texto": "Si", "valor": 10},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Usted ha tenido alguna operación?",
            "tipo": "opciones",
            "indice": "historial",
            "opciones": [
                {"texto": "Si", "valor": 20},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Usted esta vacunado con la mayoria o todas sus vacunas obligatorias?",
            "tipo": "opciones",
            "indice": "historial",
            "opciones": [
                {"texto": "Si", "valor": 0},
                {"texto": "No", "valor": 20}
            ]
        },
        {
            "pregunta": "¿Usted tiene algun problema genetico?",
            "tipo": "restringe",
            "indice": "enfermedades",
            "restriccion": "genetica",
            "opciones": [
                {"texto": "Si", "valor": 20},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "Que tipo de problema genetico tiene?",
            "tipo": "opciones",
            "indice": "enfermedades",
            "restriccion": "genetica",
            "opciones": [
                {"texto": "mutacion", "valor": 20},
                {"texto": "deformidad", "valor": 30}
            ]
        },
        {
            "pregunta": "¿Usted tiene alergias?",
            "tipo": "opciones",
            "opciones": [
                {"texto": "Si", "valor": 10},
                {"texto": "No", "valor": 0}
            ]
        },
        {
            "pregunta": "¿Usted sigue alguna dieta?",
            "tipo": "restringe",
            "indice": "dieta",
            "restriccion": "dieta",
            "obj": "mal",
            "opciones": [
                {"texto": "Si", "valor": 0},
                {"texto": "No", "valor": 10}
            ]
        },
        {
            "pregunta": "¿Qué tipo de dieta sigue?",
            "tipo": "opciones",
            "indice": "dieta",
            "restriccion": "dieta",
            "opciones": [
                {"texto": "Vegetariana", "valor": 0},
                {"texto": "Balanceada", "valor": 0},
                {"texto": "Omnivora", "valor": 10}
            ]
        },
        {
            "pregunta": "¿Usted realiza actividad fisica o deporte?",
            "tipo": "restringe",
            "indice": "deporte",
            "restriccion": "deporte",
            "obj": "mal",
            "opciones": [
                {"texto": "Si", "valor": 0},
                {"texto": "No", "valor": 20}
            ]
        },
        {
            "pregunta": "¿Cada cuanto tiempo realiza actividad fisica o deporte?",
            "tipo": "opciones",
            "indice": "tiemdeporte",
            "restriccion": "deporte",
            "opciones": [
                {"texto": "Todos los dias", "valor": 0},
                {"texto": "1 vez por semana", "valor": 5},
                {"texto": "Muy ocasionalmente", "valor": 10}
            ]
        },
        {
            "pregunta": "¿Cuantas horas duerme al dia?",
            "tipo": "opciones",
            "indice": "dormir",
            "opciones": [
                {"texto": "2-5", "valor": 20},
                {"texto": "6-9", "valor": 0},
                {"texto": "10 a mas", "valor": 10}
            ]
        }
    ];
    mostrarPregunta();


    function mostrarPregunta() {

        if (indicePreguntaActual >= preguntas.length) {
            const contenedor = $('.contenedor');
            contenedor.removeClass('slide-in');
            contenedor.addClass('slide-out');
            setTimeout(() => {
                if (altura > 5) {
                    altura = altura / 100;
                }
                imc = peso / (altura * altura);
                let cadena = "Tu puntaje es <b>" + indice + "</b>eso indica";
                if (indice < 20) {
                    cadena += "<b>Muy Saludable</b>";
                } else if (indice < 40) {
                    cadena += "<b>Saludable</b>";
                } else if (indice < 50) {
                    cadena += "<b>Salud Normal</b>";
                } else if (indice < 80) {
                    cadena += "<b>Salud Baja</b>";
                } else {
                    cadena += "<b>Salud Muy baja</b>";
                }
                cadena += "Indice de masa corporal: <b>" + (Math.round(imc * 100) / 100) + "</b>";
                let cadena2 = "";
                let cantidad = 0;
                if (indices.fumar > 0) {
                    cantidad++;
                    cadena2 += "Se recomienda reducir el consumo de cigarrillos, ya que estos producen cancer.<br>";
                }
                if (indices.drogas > 20) {
                    cantidad++;
                    cadena2 += "Se recomienda no consumir drogas, ya que estas pueden afectar seriamente la salud, incluso provocar la muerte.<br>";
                }
                if (indices.alcohol >= 40) {
                    cantidad++;
                    cadena2 += "Se recomienda bajar su consumo de alcohol, este puede ocasionar graves daños en su higado y cerebro.<br>";
                }
                if (indices.dieta >= 10 && imc >= 25) {
                    cantidad++;
                    cadena2 += "Se recomienda seguir una dieta balanceada, esto puede ayudar a bajar de peso.<br>";
                }
                if (indices.deporte === 20 && imc >= 25) {
                    cantidad++;
                    cadena2 += "Se recomienda realizar ejercicios o actividad fisica para poder bajar de peso.<br>";
                }
                if (indices.deporte === 10 && imc >= 25) {
                    cantidad++;
                    cadena2 += "Se recomienda realizar ejercicios o actividad fisica mas a menudo como una vez por semana al menos para poder bajar de peso.<br>";
                }
                if (indices.dormir > 0) {
                    cantidad++;
                    cadena2 += "Se recomienda dormir entre 6-9 horas para poder tener energia suficiente a lo largo del dia ya que descansos reducidos o excesivos pueden afectar la salud negativamente.<br>";
                }
                if (cadena2 !== "") {
                    if (cantidad >= 6) {
                        cadena += "<b>Recomendaciones:</b><p style='font-size: 12px;'>" + cadena2 + "</p>";
                    } else {
                        cadena += "<b>Recomendaciones:</b>" + cadena2;
                    }
                }
                $('#pregunta').html('Cuestionario completado');
                $('#respuestas').html(cadena);
                $('#siguiente').hide();
                $('#divprogress').hide();
                contenedor.removeClass('slide-out');
                if (primera) {
                    contenedor.show();
                    primera = false;
                }
                contenedor.addClass('slide-in');
            }, 150);
        } else {
            const preguntaActual = preguntas[indicePreguntaActual];
            if (restricciones[preguntaActual.restriccion] !== "N") {

                const contenedor = $('.contenedor');
                contenedor.removeClass('slide-in');
                contenedor.addClass('slide-out');
                setTimeout(() => {
                    $('#pregunta').text(preguntaActual.pregunta);
                    $('#respuestas').empty();
                    if (preguntaActual.tipo === 'opciones') {
                        preguntaActual.opciones.forEach(opcion => {
                            const boton = $('<div></div>')
                                    .text(opcion.texto)
                                    .addClass('respuesta')
                                    .on('click', function () {
                                        indices[preguntaActual.indice] += opcion.valor;
                                        indice += opcion.valor;
                                        indicePreguntaActual++;
                                        mostrarPregunta();
                                    });
                            $('#respuestas').append(boton);
                        });
                        $('#siguiente').hide();
                    }
                    if (preguntaActual.tipo === 'restringe') {
                        preguntaActual.opciones.forEach(opcion => {
                            const boton = $('<div></div>')
                                    .text(opcion.texto)
                                    .addClass('respuesta')
                                    .on('click', function () {
                                        indices[preguntaActual.indice] += opcion.valor;
                                        indice += opcion.valor;
                                        if (opcion.valor === 0 && preguntaActual.obj === undefined) {
                                            restricciones[preguntaActual.restriccion] = "N";
                                        } else if (opcion.valor > 0 && preguntaActual.obj === "mal") {
                                            restricciones[preguntaActual.restriccion] = "N";
                                        }
                                        indicePreguntaActual++;
                                        mostrarPregunta();
                                    });
                            $('#respuestas').append(boton);
                        });
                        $('#siguiente').hide();
                    }
                    if (preguntaActual.tipo === 'numero') {
                        const input = $('<input>')
                                .attr('type', 'number')
                                .addClass('input-respuesta');
                        $('#respuestas').append(input);
                        $('#siguiente').show();

                        $('#siguiente').off('click').on('click', function () {
                            if (input.val() !== "") {
                                if (preguntaActual.pregunta === "¿Cuánto pesas?") {
                                    peso = parseFloat(input.val());
                                } else if (preguntaActual.pregunta === "¿Cuánto mides?") {
                                    altura = parseFloat(input.val());
                                } else {
                                    indice += preguntaActual.valor * parseInt(input.val());
                                }
                                indicePreguntaActual++;
                                mostrarPregunta();
                            }
                        });
                        setTimeout(() => {
                            input.focus();
                        }, 0);
                    }
                    const progreso = ((indicePreguntaActual) / (preguntas.length - 1)) * 100;
                    $('#progress-bar').css('width', `${progreso}%`).attr('aria-valuenow', progreso);
                    contenedor.removeClass('slide-out');
                    if (primera) {
                        contenedor.show();
                        primera = false;
                    }
                    contenedor.addClass('slide-in');
                }, 150);
            } else {
                indicePreguntaActual++;
                mostrarPregunta();
            }
        }
    }
});