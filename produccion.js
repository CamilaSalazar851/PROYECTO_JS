const BASE_URL = "https://stock-flow-354d0-default-rtdb.firebaseio.com";
const API_URL = `${BASE_URL}/productos`;
const PRODUCCIONES_URL = `${BASE_URL}/producciones`;
const formProduccion = document.getElementById("form-produccion");
const selectProducto = document.getElementById("select-producto-terminado");
const txtCantidad = document.getElementById("cantidad-producir");
const vistaReceta = document.getElementById("vista-receta");
const listaInsumos = document.getElementById("lista-insumos-unidades");

let productosBD = {};

document.addEventListener("DOMContentLoaded", async () => {
    if (sessionStorage.getItem("login") !== "True") {
        window.location.href = "login.html";
        return;
    }

    await cargarProductos();
    
    selectProducto.addEventListener("change", mostrarRecetaItem);
});

async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}.json`);
        productosBD = await res.json() || {};

        selectProducto.innerHTML = '<option value="">-- Seleccione un Producto --</option>';

        Object.keys(productosBD).forEach(codigo => {
            const prod = productosBD[codigo];
    
            if (prod.esTerminado && prod.formula) {
                const opt = document.createElement("option");
                opt.value = prod.codigo;
                opt.textContent = `${prod.nombre} (${prod.codigo})`;
                selectProducto.appendChild(opt);
            }
        });
    } catch (error) {
        console.error("Error al cargar productos en producción:", error);
    }
}

function mostrarRecetaItem() {
    const codigoSelect = selectProducto.value;
    if (!codigoSelect || !productosBD[codigoSelect]) {
        vistaReceta.style.display = "none";
        return;
    }

    const producto = productosBD[codigoSelect];
    listaInsumos.innerHTML = "";
    
    Object.keys(producto.formula).forEach(mpCodigo => {
        const nombreMP = productosBD[mpCodigo] ? productosBD[mpCodigo].nombre : mpCodigo;
        const li = document.createElement("li");
        li.textContent = `${nombreMP}: ${producto.formula[mpCodigo]} por unidad.`;
        listaInsumos.appendChild(li);
    });

    vistaReceta.style.display = "block";
}

async function registrarProduccion(codigoPT, productoTerminado, cantidadAProducir, formula) {
    const fechaActual = new Date();

    const materiasPrimasConsumidas = Object.keys(formula).map(mpCodigo => {
        const materiaPrima = productosBD[mpCodigo] || {};
        return {
            codigo: mpCodigo,
            nombre: materiaPrima.nombre || mpCodigo,
            cantidadConsumida: formula[mpCodigo] * cantidadAProducir
        };
    });

    const registro = {
        fecha: fechaActual.toISOString().slice(0, 10),
        anio: fechaActual.getFullYear(),
        mes: fechaActual.getMonth() + 1,
        productoCodigo: codigoPT,
        productoNombre: productoTerminado.nombre,
        cantidadProducida: cantidadAProducir,
        materiasPrimas: materiasPrimasConsumidas
    };

    try {
        await fetch(`${PRODUCCIONES_URL}.json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registro)
        });
    } catch (error) {
        console.error("Error al registrar la producción:", error);
    }
}

formProduccion.addEventListener("submit", async (e) => {
    e.preventDefault();

    const codigoPT = selectProducto.value;
    const cantidadAProducir = parseInt(txtCantidad.value);

    if (!codigoPT || isNaN(cantidadAProducir) || cantidadAProducir <= 0) {
        alert("Seleccione un producto y cantidad válidos.");
        return;
    }

    try {
        const resFiltro = await fetch(`${API_URL}.json`);
        productosBD = await resFiltro.json() || {};

        const productoTerminado = productosBD[codigoPT];
        const formula = productoTerminado.formula;

        let sePuedeProducir = true;
        let reporteFaltantes = "";

        Object.keys(formula).forEach(mpCodigo => {
            const cantidadRequeridaPorUnidad = formula[mpCodigo];
            const cantidadTotalNecesaria = cantidadRequeridaPorUnidad * cantidadAProducir;
            
            const materiaPrimaActual = productosBD[mpCodigo];
            const stockMateriaActual = materiaPrimaActual ? (materiaPrimaActual.stock || 0) : 0;

            if (stockMateriaActual < cantidadTotalNecesaria) {
                sePuedeProducir = false;
                const nombreMP = materiaPrimaActual ? materiaPrimaActual.nombre : mpCodigo;
                reporteFaltantes += `\n- ${nombreMP}: Falta(n) ${cantidadTotalNecesaria - stockMateriaActual} unidades (Stock actual: ${stockMateriaActual}).`;
            }
        });

        if (!sePuedeProducir) {
            alert(`No hay suficiente materia prima en Planta Macondo para fabricar ${cantidadAProducir} unidades de ${productoTerminado.nombre}.${reporteFaltantes}`);
            return;
        }

        for (const mpCodigo of Object.keys(formula)) {
            const cantidadTotalNecesaria = formula[mpCodigo] * cantidadAProducir;
            const nuevoStockMP = productosBD[mpCodigo].stock - cantidadTotalNecesaria;

            await fetch(`${API_URL}/${mpCodigo}/stock.json`, {
                method: "PUT",
                body: JSON.stringify(nuevoStockMP)
            });
        }

        const nuevoStockPT = (productoTerminado.stock || 0) + cantidadAProducir;
        await fetch(`${API_URL}/${codigoPT}/stock.json`, {
            method: "PUT",
            body: JSON.stringify(nuevoStockPT)
        });

        await registrarProduccion(codigoPT, productoTerminado, cantidadAProducir, formula);

        alert(`¡Producción exitosa! Se fabricaron ${cantidadAProducir} unidades de ${productoTerminado.nombre}.\nLas materias primas han sido descontadas correctamente del almacén.`);
        
        formProduccion.reset();
        vistaReceta.style.display = "none";
        await cargarProductos(); 

    } catch (error) {
        console.error("Error en el proceso de producción:", error);
        alert("Ocurrió un error al procesar la producción.");
    }
});