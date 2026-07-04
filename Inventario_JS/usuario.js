const API_URL = "https://stock-flow-354d0-default-rtdb.firebaseio.com/usuarios";
const formUsuario = document.getElementById("usuario-from");

let idUsuarioUpdate = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarUsuarios();
});

formUsuario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirmarPassword = document.getElementById("confirmarPassword").value;

  if (password !== confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
  }

  const datosUsuario = {
      identificacion: document.getElementById("identificacion").value,
      nombre: document.getElementById("nombre").value,
      cargo: document.getElementById("cargo").value,
      password: password
  };

  try {
      let url = `${API_URL}.json`;
      let metodo = "POST";

      if (idUsuarioUpdate) {
          url = `${API_URL}/${idUsuarioUpdate}.json`;
          metodo = "PUT"; 
      }

      const respuesta = await fetch(url, {
          method: metodo,
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(datosUsuario)
      });

      if (respuesta.ok) {
          alert(idUsuarioUpdate ? "Usuario actualizado correctamente" : "Usuario registrado correctamente");
          formUsuario.reset();
          idUsuarioUpdate = null; 
          
          formUsuario.querySelector("button[type='submit']").textContent = "Guardar Usuario";
          
          cargarUsuarios();
      }
  } catch (error) {
      console.error("Error al procesar la solicitud:", error);
      alert("Error al conectar con la base de datos");
  }
});

async function descargarUsuarios() {
  try {
      const respuesta = await fetch(`${API_URL}.json`);
      const datos = await respuesta.json();

      if (!datos) return [];

      return Object.keys(datos).map(id => ({
          id,
          ...datos[id]
      }));
  } catch (error) {
      console.error("Error al descargar usuarios:", error);
      return [];
  }
}

async function cargarUsuarios() {
  const contenedorTabla = document.getElementById("contenedorTabla");
  contenedorTabla.innerHTML = "<p>Cargando usuarios...</p>";

  const usuarios = await descargarUsuarios();

  const miTablaComponent = document.createElement("mi-tabla");

  const columnas = ["Nombre", "Identificación", "Cargo"];
  const claves = ["nombre", "identificacion", "cargo"];

  miTablaComponent.setTabla(columnas, claves, usuarios);

  miTablaComponent.addEventListener("editar-fila", (e) => {
      const { id, datos } = e.detail;
      prepararEdicion(id, datos.nombre, datos.identificacion, datos.cargo, datos.password);
  });

  miTablaComponent.addEventListener("eliminar-fila", (e) => {
      const { id } = e.detail;
      eliminarUsuario(id);
  });

  contenedorTabla.innerHTML = "";
  contenedorTabla.appendChild(miTablaComponent);
}

function prepararEdicion(id, nombre, identificacion, cargo, password) {
  document.getElementById("nombre").value = nombre;
  document.getElementById("identificacion").value = identificacion;
  document.getElementById("cargo").value = cargo;
  document.getElementById("password").value = password;
  document.getElementById("confirmarPassword").value = password;

  idUsuarioUpdate = id;

  formUsuario.querySelector("button[type='submit']").textContent = "Actualizar Usuario";
}

async function eliminarUsuario(id) {
  if (!confirm("¿Está seguro de que desea eliminar este usuario?")) return;

  try {
      const respuesta = await fetch(`${API_URL}/${id}.json`, {
          method: "DELETE"
      });

      if (respuesta.ok) {
          alert("Usuario eliminado correctamente");
          cargarUsuarios(); 
      } else {
          alert("No se pudo eliminar el usuario");
      }
  } catch (error) {
      console.error("Error al eliminar:", error);
      alert("Error de red al intentar eliminar");
  }
}