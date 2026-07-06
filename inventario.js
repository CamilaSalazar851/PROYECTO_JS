const API_URL = "https://stock-flow-354d0-default-rtdb.firebaseio.com/productos";

const productoForm = document.getElementById("producto-form");
const btnGuardar = document.getElementById("btnGuardar");
const contenedorTablaComponente = document.getElementById("contenedor-tabla-componente");
const tipoProductoSelect = document.getElementById("tipo-producto");
const cantidadInput = document.getElementById("cantidad");
const inputBuscar = document.getElementById("input-buscar");
const seccionReceta = document.getElementById("seccion-receta");
const contenedorInsumos = document.getElementById("contenedor-insumos");

let codigoEnEdicion = null;
let productosLocales = {}; 

tipoProductoSelect.addEventListener("change", () => {
    if (tipoProductoSelect.value === "si") {
        cantidadInput.value = 0;
        cantidadInput.disabled = true;
        cantidadInput.placeholder = "Se genera en producción";
        mostrarCamposReceta(); 
    } else {
        cantidadInput.disabled = false;
        cantidadInput.placeholder = "0";
        seccionReceta.style.display = "none";
        contenedorInsumos.innerHTML = "";
    }
});

function mostrarCamposReceta(recetaExistente = null) {
    contenedorInsumos.innerHTML = "";
    let hayMateriasPrimas = false;

    Object.keys(productosLocales).forEach(codigo => {
        const prod = productosLocales[codigo];
        if (prod.productoTerminado === "no" || prod.esTerminado === false) {
            hayMateriasPrimas = true;
            const cantidadPrevia = recetaExistente && recetaExistente[codigo] ? recetaExistente[codigo] : "";

            const divInsumo = document.createElement("div");
            divInsumo.style.display = "flex";
            divInsumo.style.alignItems = "center";
            divInsumo.style.justifyContent = "space-between";
            divInsumo.style.gap = "15px";
            divInsumo.innerHTML = `
                <span style="font-size: 14px; font-weight: 500; color: #334155;">${prod.nombre} (${codigo})</span>
                <input type="number" class="input-receta-insumo" data-codigo="${codigo}" step="any" placeholder="Cantidad" value="${cantidadPrevia}" style="width: 120px; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px;">
            `;
            contenedorInsumos.appendChild(divInsumo);
        }
    });

    if (!hayMateriasPrimas) {
        contenedorInsumos.innerHTML = `<p style="font-size: 13px; color: #b91c1c; padding: 10px 0;">Primero debes registrar materias primas en el sistema.</p>`;
    }

    seccionReceta.style.display = "block";
}

function cargarTablaComponente() {
    fetch(`${API_URL}.json`)
        .then(response => response.json())
        .then(productosDB => {
            productosLocales = productosDB || {}; 
            renderizarTabla(productosLocales);     
        })
        .catch(error => console.error(error));
}

function renderizarTabla(productosAMostrar) {
    if (!productosAMostrar || Object.keys(productosAMostrar).length === 0) {
        contenedorTablaComponente.innerHTML = `
            <div style="text-align: center; color: #777; padding: 32px 0; font-size: 14px;">
                No se encontraron artículos que coincidan con la búsqueda.
            </div>`;
        return;
    }

    let htmlComponente = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>¿Tipo?</th>
                    <th>Stock</th>
                    <th>Precio Unitario</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.keys(productosAMostrar).forEach(codigo => {
        const item = productosAMostrar[codigo];
        const textoTerminado = (item.productoTerminado === "si" || item.esTerminado === true) ? "Sí (Producto)" : "No (Materia Prima)";

        htmlComponente += `
            <tr>
                <td><strong>${codigo}</strong></td>
                <td>${item.nombre}</td>
                <td>${textoTerminado}</td>
                <td>${item.stock}</td>
                <td>$${parseFloat(item.precio).toFixed(2)}</td>
                <td>
                    <button class="btn-editar" onclick="prepararEdicion('${codigo}')">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarProducto('${codigo}')">Eliminar</button>
                </td>
            </tr>
        `;
    });

    htmlComponente += `</tbody></table>`;
    contenedorTablaComponente.innerHTML = htmlComponente;
}

inputBuscar.addEventListener("keyup", (e) => {
    const textoBusqueda = e.target.value.toLowerCase().trim();
    if (textoBusqueda === "") {
        renderizarTabla(productosLocales);
        return;
    }

    const productosFiltrados = {};
    Object.keys(productosLocales).forEach(codigo => {
        const item = productosLocales[codigo];
        const coincideNombre = item.nombre ? item.nombre.toLowerCase().includes(textoBusqueda) : false;
        const coincideID = codigo.toLowerCase().includes(textoBusqueda);

        if (coincideNombre || coincideID) {
            productosFiltrados[codigo] = item;
        }
    });
    renderizarTabla(productosFiltrados);
});

cargarTablaComponente();

productoForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const tipoProducto = tipoProductoSelect.value;
    const cantidad = parseInt(cantidadInput.value);
    const precio = parseFloat(document.getElementById("precio").value);

    const datosProducto = {
        nombre: nombre,
        productoTerminado: tipoProducto,
        esTerminado: tipoProducto === "si", 
        stock: cantidad,
        precio: precio
    };

    if (tipoProducto === "si") {
        const formula = {};
        const inputsInsumos = document.querySelectorAll(".input-receta-insumo");
        
        inputsInsumos.forEach(input => {
            const valor = parseFloat(input.value);
            if (!isNaN(valor) && valor > 0) {
                const codigoInsumo = input.getAttribute("data-codigo");
                formula[codigoInsumo] = valor;
            }
        });

        datosProducto.formula = formula;
    }

    if (codigoEnEdicion) {
        fetch(`${API_URL}/${codigoEnEdicion}.json`, {
            method: 'PUT', 
            body: JSON.stringify(datosProducto),
            headers: { 'Content-Type': 'application/json' }
        })
        .then(() => {
            limpiarFormulario();
            cargarTablaComponente(); 
        });
    } else {
        fetch(`${API_URL}.json`)
            .then(res => res.json())
            .then(productosDB => {
                const totalExistentes = productosDB ? Object.keys(productosDB).length + 1 : 1;
                const prefijo = tipoProducto === "si" ? "PROD_" : "MAT_";
                const nuevoCodigo = prefijo + String(totalExistentes).padStart(3, '0');

                datosProducto.codigo = nuevoCodigo;

                return fetch(`${API_URL}/${nuevoCodigo}.json`, {
                    method: 'PUT',
                    body: JSON.stringify(datosProducto),
                    headers: { 'Content-Type': 'application/json' }
                });
            })
            .then(() => {
                limpiarFormulario();
                cargarTablaComponente(); 
            });
    }
});

function limpiarFormulario() {
    codigoEnEdicion = null;
    btnGuardar.textContent = "Guardar Artículo";
    cantidadInput.disabled = false;
    productoForm.reset();
    seccionReceta.style.display = "none";
    contenedorInsumos.innerHTML = "";
    inputBuscar.value = "";
}

window.prepararEdicion = function(codigo) {
    fetch(`${API_URL}/${codigo}.json`)
        .then(res => res.json())
        .then(item => {
            document.getElementById("nombre").value = item.nombre;
            tipoProductoSelect.value = item.productoTerminado || (item.esTerminado ? "si" : "no");
            cantidadInput.value = item.stock;
            document.getElementById("precio").value = item.precio;

            if (tipoProductoSelect.value === "si") {
                cantidadInput.disabled = true;
                mostrarCamposReceta(item.formula || item.receta);
            } else {
                cantidadInput.disabled = false;
                seccionReceta.style.display = "none";
            }

            codigoEnEdicion = codigo;
            btnGuardar.textContent = "Actualizar";
            document.getElementById("nombre").focus();
        });
};

window.eliminarProducto = function(codigo) {
    if (confirm(`¿Está seguro de eliminar permanentemente el artículo ${codigo}?`)) {
        fetch(`${API_URL}/${codigo}.json`, { method: 'DELETE' })
        .then(() => {
            limpiarFormulario();
            cargarTablaComponente();
        });
    }
};