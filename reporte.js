const BASE_URL = "https://stock-flow-354d0-default-rtdb.firebaseio.com";
const PRODUCCIONES_URL = `${BASE_URL}/producciones`;

const formReporte = document.getElementById("form-reporte");
const selectAnio = document.getElementById("select-anio");
const selectMes = document.getElementById("select-mes");
const contenedorTablaReporte = document.getElementById("contenedor-tabla-reporte");

document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("login") !== "True") {
        window.location.href = "index.html";
        return;
    }

    inicializarSelectAnio();
});

function inicializarSelectAnio() {
    const anioActual = new Date().getFullYear();
    selectAnio.innerHTML = "";

    for (let anio = anioActual; anio >= anioActual - 4; anio--) {
        const opt = document.createElement("option");
        opt.value = anio;
        opt.textContent = anio;
        selectAnio.appendChild(opt);
    }
}

formReporte.addEventListener("submit", async (e) => {
    e.preventDefault();

    const anioSeleccionado = parseInt(selectAnio.value);
    const mesSeleccionado = parseInt(selectMes.value);

    await generarReporte(anioSeleccionado, mesSeleccionado);
});

async function generarReporte(anio, mes) {
    contenedorTablaReporte.innerHTML = `<p style="color:#64748b; padding: 12px 0;">Cargando reporte...</p>`;

    try {
        const res = await fetch(`${PRODUCCIONES_URL}.json`);
        const producciones = await res.json() || {};

        const consumoPorMateria = {};

        Object.values(producciones).forEach(registro => {
            if (registro.anio === anio && registro.mes === mes && Array.isArray(registro.materiasPrimas)) {
                registro.materiasPrimas.forEach(mp => {
                    if (!consumoPorMateria[mp.codigo]) {
                        consumoPorMateria[mp.codigo] = {
                            codigo: mp.codigo,
                            nombre: mp.nombre,
                            cantidad: 0,
                            fechas: new Set()
                        };
                    }
                    consumoPorMateria[mp.codigo].cantidad += mp.cantidadConsumida;
                    consumoPorMateria[mp.codigo].fechas.add(registro.fecha);
                });
            }
        });

        renderizarReporte(consumoPorMateria);
    } catch (error) {
        console.error("Error al generar el reporte:", error);
        contenedorTablaReporte.innerHTML = `<p style="color:#b91c1c; padding: 12px 0;">Ocurrió un error al generar el reporte.</p>`;
    }
}

function renderizarReporte(consumoPorMateria) {
    const codigos = Object.keys(consumoPorMateria);

    if (codigos.length === 0) {
        contenedorTablaReporte.innerHTML = `
            <div style="text-align: center; color: #777; padding: 32px 0; font-size: 14px;">
                No se registró consumo de materia prima en el período seleccionado.
            </div>`;
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Cantidad Consumida</th>
                    <th>Fecha(s) de Consumo</th>
                </tr>
            </thead>
            <tbody>
    `;

    codigos.forEach(codigo => {
        const item = consumoPorMateria[codigo];
        const fechasOrdenadas = Array.from(item.fechas).sort().join(", ");
        html += `
            <tr>
                <td><strong>${item.codigo}</strong></td>
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>${fechasOrdenadas}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    contenedorTablaReporte.innerHTML = html;
}
