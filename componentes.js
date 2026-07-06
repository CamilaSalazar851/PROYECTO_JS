class Tabla extends HTMLElement {
    constructor() {
        super();
        this.filas = [];
        this.columnas = [];
        this.claves = [];
    }

    setTabla(columnas, claves, filas) {
        this.columnas = columnas;
        this.claves = claves;
        this.filas = filas;
        this.crearTabla();
    }

    crearTabla() {
        let columnasHtml = "";
        this.columnas.forEach(columna => {
            columnasHtml += `<th>${columna}</th>`;
        });
        
        if (this.filas.length > 0) {
            columnasHtml += `<th>Acciones</th>`;
        }

        let filasHtml = "";
        this.filas.forEach((fila, index) => {
            filasHtml += `<tr>`;

            this.claves.forEach(clave => {
                filasHtml += `<td>${fila[clave] !== undefined ? fila[clave] : ''}</td>`;
            });
            
            const idRegistro = fila.codigo || fila.id; 
            filasHtml += `
                <td>
                    <button class="btn-editar" data-id="${idRegistro}" data-index="${index}">Editar</button>
                    <button class="btn-eliminar" data-id="${idRegistro}" data-index="${index}">Eliminar</button>
                </td>
            `;
            filasHtml += `</tr>`;
        });

        this.innerHTML = `
            <table>
                <thead>
                    <tr>
                        ${columnasHtml}
                    </tr>
                </thead>
                <tbody>
                    ${this.filas.length === 0 
                        ? `<tr><td colspan="${this.columnas.length + 1}">No hay registros disponibles</td></tr>` 
                        : filasHtml
                    }
                </tbody>
            </table>
        `;

        this.conectarEventos();
    }

    conectarEventos() {
        this.querySelectorAll('.btn-editar').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const index = e.target.getAttribute('data-index');
                const datosFila = this.filas[index];

                this.dispatchEvent(new CustomEvent('editar-fila', {
                    detail: { id, datos: datosFila }
                }));
            });
        });

        this.querySelectorAll('.btn-eliminar').forEach(boton => {
            boton.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                
                this.dispatchEvent(new CustomEvent('eliminar-fila', {
                    detail: { id }
                }));
            });
        });
    }
}

customElements.define("mi-tabla", Tabla);