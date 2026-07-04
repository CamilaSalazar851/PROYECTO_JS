Proyecto de Inventario Acme con Javacript

Camila Valentina Salazar Castañeda 

Datos para ingresar al sistema:
ID: 1092391561
Clave:1234


1. FLUJO PRINCIPAL DE NAVEGACIÓN Y ACCESO
El punto de entrada obligatorio del sistema es la pantalla de acceso.

* [login.html] -> Renderiza un formulario de autenticación limpio y centrado.
  Pide el "Número de Identificación" y la "Contraseña". Enlaza a 'styles.css'.
  
* [login.js] -> Captura el evento 'submit' del formulario.
  - Realiza una petición GET asíncrona (fetch) a la base de datos de Firebase:
    https://stock-flow-354d0-default-rtdb.firebaseio.com/usuarios.json
  - Recorre el objeto JSON recibido para validar si la identificación y la
    contraseña coinciden con algún registro.
  - Si coinciden: Guarda en el sessionStorage las llaves ('login': 'True') y 
    ('usuarioActivo': datos del usuario) y redirige a 'usuarios.html'.
  - Si fallan: Muestra una alerta de credenciales incorrectas.

2. GESTIÓN DE INVENTARIO Y RECETAS
Módulo encargado de registrar la existencia física de materias primas y
de estructurar la composición de los productos finales.

* [inventario.html] -> Contiene el formulario principal con los campos: 
  Nombre, Selector de Tipo, Cantidad Inicial y Precio. 
  - Aloja de forma oculta la sección dinámicamente rellenable de 'Receta'.
  - Cuenta con un cuadro de búsqueda en tiempo real (#input-buscar).
  - Define un contenedor vacío (#contenedor-tabla-componente) donde se 
    inyectará la tabla de registros.

* [inventario.js] -> Controla toda la reactividad del inventario.
  - Al cambiar el selector de tipo: Si es "Sí (Producto Terminado)", bloquea 
    el campo de cantidad inicial en 0 (ya que se generará únicamente mediante
    órdenes de producción) y despliega la interfaz de recetas.
  - Carga los insumos en la receta: Filtra los productos guardados localmente
    cuya propiedad 'productoTerminado' sea "no" para listarlos como fila con
    un input numérico para definir la cantidad requerida por unidad.
  - Búsqueda en tiempo real: Escucha el evento 'keyup' del buscador filtrando 
    de forma inmediata por Nombre o ID sin recargar la página.
  - Persistencia y generación de códigos: Al guardar, si es un registro nuevo,
    cuenta los elementos en Firebase para autogenerar códigos correlativos 
    como 'MAT_001' o 'PROD_001'. Guarda usando el método 'PUT' en la URL
    específica del código para evitar duplicados. Soporta edición y eliminación.

3. MÓDULO DE PRODUCCIÓN
Encargado de transformar las materias primas en productos listos, validando 
las existencias en el almacén.

* [produccion.html] -> Muestra un formulario de órdenes de producción.
  - Tiene un selector para elegir el producto que se desea fabricar.
  - Una caja de alerta visual (#vista-receta) que muestra la lista de insumos 
    necesarios por unidad.
  - Un campo numérico para ingresar cuántas unidades se van a fabricar.

* [produccion.js] -> Lógica de descuento inteligente.
  - Al cargar la página, descarga los productos desde Firebase y llena el 
    selector únicamente con aquellos artículos que sean terminados y posean 
    una fórmula válida.
  - Al seleccionar un producto, muestra visualmente sus ingredientes.
  - Al procesar la fabricación, multiplica la cantidad deseada por la porción
    de cada ingrediente de la receta y lo compara con el stock actual en la 
    base de datos.
  - Si falta algún ingrediente, frena la operación y muestra un reporte detallado
    con las unidades exactas que faltan en el almacén.
  - Si hay stock suficiente, descuenta las porciones de cada materia prima de
    forma individual y le suma la cantidad producida al producto terminado por 
    medio de peticiones HTTP PUT directas al nodo de stock en Firebase.

4. ADMINISTRACIÓN DE USUARIOS
Sección destinada al control del equipo de trabajo y optimización de código
mediante el uso de Web Components.

* [usuarios.html] -> Panel con el formulario para registrar empleados (ID,
  Nombre Completo, Cargo, Contraseña y Confirmación). Contiene un div vacío
  (#contenedor-tabla) destinado a renderizar el componente de la tabla.

* [usuario.js] -> Realiza operaciones de lectura, creación, actualización 
  (PUT/POST) y borrado (DELETE) de cuentas en la ruta '/usuarios.json'. 
  Instancia el Web Component pasándole los datos descargados de los usuarios.

* [componentes.js] -> Define una clase extendida de 'HTMLElement' registrada
  como <mi-tabla>. Automatiza el renderizado de cualquier conjunto de datos 
  enviados en formato de columnas y filas. Emite eventos personalizados
  ('editar-fila' y 'eliminar-fila') para que los scripts de cada página los
  capturen y ejecuten sus respectivas peticiones a Firebase.

5. IDENTIDAD VISUAL INTEGRADA
* [styles.css] -> Hoja de estilos global centralizada y compartida.
  - Define variables globales (:root) para colores institucionales (azul, 
    verde de éxito, rojo de alerta) y espaciados estandarizados.
  - Estiliza los formularios con un sistema de rejilla adaptable (Grid CSS)
    que homogeneiza el comportamiento de campos de texto y botones en los
    módulos de inventario, usuarios y producción.
  - Controla el desbordamiento de las listas de insumos mediante un contenedor
    con altura máxima fija y barra de desplazamiento vertical interna.