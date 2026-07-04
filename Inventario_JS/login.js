const form = document.querySelector("#form-login");

form.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const identificacionInput = document.querySelector("#identificacion").value.trim();
    const claveInput = document.querySelector("#clave").value;

    const user = await validateUser(identificacionInput, claveInput);

    if (user !== null) {
        alert(`¡Bienvenido al sistema, ${user.nombre}!`);
        sessionStorage.setItem("login", "True");
        sessionStorage.setItem("usuarioActivo", JSON.stringify(user));

        window.location.href = "usuarios.html";
        return;
    }

    alert("Número de identificación o contraseña incorrectos.");
});

async function validateUser(userId, userPassword) {
    try {
        const res = await fetch("https://stock-flow-354d0-default-rtdb.firebaseio.com/usuarios.json");
        const datos = await res.json();

        if (!datos) return null;

        for (const id in datos) {
            const usuario = datos[id];
            
            if (usuario.identificacion === userId && usuario.password === userPassword) {
                return usuario;
            }
        }
        
        return null; 
    } catch (err) {
        console.error("Error en la autenticación:", err);
        return null;
    }
}