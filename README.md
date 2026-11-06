# Concordia — La Biblia conectada

Aplicación personal en español, con React y TypeScript, API REST Express y SQLite local (`node:sqlite`). Biblias, diccionarios y referencias permanecen en tu equipo. Una vez instaladas las dependencias funciona sin Internet, con el servidor local encendido.

## Inicio

Requiere Node.js 24 o superior y npm. Desde esta carpeta:

```powershell
npm install
npm run dev
```

Abre http://127.0.0.1:3000. El primer arranque carga `../LBLA_vid_89.json`, `../RVR1960_vid_149.json` y `../cross_references.txt`. Los siguientes utilizan la base persistente. Los títulos de los JSON se incorporan también a instalaciones existentes sin reemplazar sus textos.

Para producción local:

```powershell
npm run build
$env:NODE_ENV = 'production'
npm start
```

El servidor escucha en `127.0.0.1`; el puerto se configura con `PORT` (3000 por defecto). Conserva el mismo origen y puerto para recuperar las preferencias del navegador.

## Lectura y estudio

- **Lectura** muestra el capítulo como texto continuo, con números pequeños junto al comienzo de cada versículo. Incluye los títulos que contiene la fuente y el encabezado del capítulo.
- Seleccionar texto cambia el versículo activo sin desplazar la lectura. **Guardar versículo** guarda la selección actual. Solo una navegación explícita desde búsqueda, referencias o visualización revela un destino fuera de la zona visible.
- **Arco de referencias** y **Panel de referencias** son interruptores independientes. Están desactivados inicialmente; así el lector funciona solo y no descarga las referencias innecesariamente.
- **Comparación sincronizada** coloca a la izquierda una lista vertical con el versículo completo de todas las versiones instaladas. Cada entrada identifica versión y cita. El lector principal permanece a la derecha y permite elegir otro versículo. En pantallas pequeñas las columnas se apilan.
- **Lectores independientes** permite hasta cuatro paneles, cada uno con su versión, capítulo, selección y desplazamiento. Los enlaces externos abren el destino en el panel activo.
- **Buscar** actualiza resultados al escribir (250 ms), permite buscar en la versión activa o en todas las versiones, filtrar por libro/testamento y recorrer páginas de 50 resultados. Admite citas como `Jn 3:16`, `Sal 23` o `1 Corintios 13:4`. Cada resultado identifica la versión y la abre al seleccionarlo.
- Referencias entrantes, salientes o ambas, filtro por votos, notas por versículo, marcadores y exportación JSON desde **Guardados**. Las notas se editan en el panel de referencias.
- Tema claro y oscuro, incluidos los gráficos, tarjetas, controles y ventanas.

La búsqueda de texto utiliza SQLite LIKE: distingue acentos y la equivalencia Unicode entre mayúsculas y minúsculas depende de SQLite.

## Explorar y visualizaciones

**Explorar** posee su propia versión y pasaje de enfoque. Cambiar el versículo del Lector no modifica esta página. El campo de raíz permite cambiar el enfoque del árbol. Pulsar un pasaje, nodo, celda o capítulo del atlas abre su destino en Lector con la versión de Exploración.

| Vista     | Representación                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Arcos     | Atlas WebGL2 con las 160.000 conexiones de mayor puntuación y un eje proporcional al número real de versículos de cada capítulo |
| Árbol     | Raíz independiente, libros como ramas; hasta 28 conexiones y 9 ramas visibles                                                   |
| Hilos     | Hasta 700 conexiones entre columnas de origen y destino                                                                         |
| Esfera 3D | Proyección perspectiva de los 66 libros; hasta 650 conexiones, controles de rotación e inclinación                              |
| Recorrido | Secuencia canónica de libros, hasta 450 conexiones; no representa fechas históricas                                             |
| Matriz    | Muestra global agrupada por libro; intensidad según conexiones y navegación a un destino representativo                         |

Las otras vistas parten de una muestra de las 3.500 conexiones con más votos, combinada con las referencias del enfoque independiente. Sus filtros de libro y votos se muestran solo en esas vistas.

### Atlas de arcos

Se adaptaron los principios del ejemplo en `../guide/visualizations`: instancias GPU, separación entre escena e interfaz, eje canónico proporcional y renderizado bajo demanda. El atlas distingue capítulos y, con suficiente ampliación, versículos.

- Pasar el cursor resalta las conexiones del capítulo y muestra una tarjeta con la cita y el número de conexiones **en la muestra**. Se cierra al salir; no tiene botón de cierre ni bloquea el ratón.
- Rueda o doble clic amplían alrededor del punto señalado. Arrastrar desplaza el intervalo canónico visible. Los botones utilizan la última posición señalada. El zoom llega hasta un intervalo de 20 versículos y conserva los límites del canon.
- Un clic abre el capítulo; en el nivel de detalle de versículos abre el versículo señalado. El doble clic cancela la navegación del clic sencillo.
- **Pantalla completa** ocupa la ventana; se cierra con el botón o Escape.
- Flechas, `+`, `−` y Enter permiten explorar y navegar con teclado. Al perder el foco se retira la tarjeta.
- En Lector se destacan también las conexiones del versículo activo cuando no hay un capítulo señalado; Explorar no recibe esa selección.

El fondo denso se dibuja en una textura reutilizable. Los movimientos del cursor actualizan solo las instancias conectadas al capítulo, sin reconstruir el gráfico en React. El renderizador libera buffers, texturas, programas, observadores y eventos al desmontarse. No hay bucle de animación continuo. Se limita la resolución a DPR 2; las escenas fuera de vista o en pestañas ocultas no se dibujan.

El atlas requiere WebGL2. Si el navegador no puede crearlo muestra un mensaje; las otras vistas continúan disponibles. Las 344.799 referencias completas permanecen en SQLite; el límite visual de 160.000 no elimina datos. El conteo de la tarjeta del atlas corresponde a esa muestra y a los extremos de las conexiones, no a todas las referencias de un rango.

### Otras vistas

Comparten zoom de 100% a 800%, anclado al punto del cursor, arrastre, restablecimiento y pantalla completa. `Ctrl`/`Cmd` + rueda y doble clic controlan el zoom. Las tarjetas transitorias muestran textos, votos y conteos consultados por REST; desaparecen al retirar el cursor. Hilos, esfera y recorrido utilizan Canvas 2D con geometría precalculada e índice espacial para selección; árbol y matriz conservan nodos SVG accesibles.

## Importar Biblias SQLite3

**Importar Biblia** acepta `.SQLite3`, `.sqlite` y `.db` hasta 100 MB. Se valida cabecera SQLite, canon y versículos; la importación es transaccional. El archivo se copia a `storage/Bversions/` con **exactamente su nombre original**. Un duplicado se rechaza sin sobrescribir ni renombrar. Un nombre no válido para Windows se rechaza explícitamente.

```sql
CREATE TABLE books (
  book_number NUMERIC PRIMARY KEY,
  short_name TEXT,
  long_name TEXT,
  book_color TEXT
);
CREATE TABLE verses (
  book_number NUMERIC NOT NULL,
  chapter NUMERIC NOT NULL,
  verse NUMERIC NOT NULL,
  text TEXT NOT NULL,
  PRIMARY KEY (book_number, chapter, verse)
);
```

Se requieren 66 libros en orden canónico protestante al ordenar `book_number`. Se importan títulos de la tabla opcional `stories(book_number, chapter, verse, title, order_if_several)`. La aplicación no ejecuta HTML de los textos importados.

### Strong y diccionarios

Un nombre terminado en `+`, antes de la extensión, por ejemplo `LBLA+.SQLite3`, activa la conservación de números Strong. El marcado `<S>7225</S>` se muestra como superíndice; se omiten etiquetas morfológicas `<m>…</m>`. El prefijo hebreo H o griego G se infiere del testamento cuando la fuente contiene solo números. También se admiten prefijos explícitos. El texto plano queda separado para búsqueda y lectura.

Pulsar un superíndice abre **Diccionarios**, con búsqueda exacta de la entrada, lista de diccionarios activos, búsqueda libre y botón de guardar. La ventana también puede abrirse desde los controles del lector. Sin selección de diccionarios se consultan todos. Los términos guardados permiten volver a consultar su entrada; las definiciones permanecen en los archivos locales.

**Importar diccionario SQLite3** admite hasta 256 MB y el esquema de la captura:

```sql
CREATE TABLE dictionary (
  topic TEXT,
  definition TEXT,
  lexeme TEXT,
  transliteration TEXT,
  pronunciation TEXT,
  short_definition TEXT
);
CREATE UNIQUE INDEX dictionary_topic ON dictionary(topic ASC);
```

`info` y `android_metadata` son opcionales. Se conservan los nombres originales en `storage/Dictionaries/`. La consulta exacta busca `H7225`/`G3056` y su equivalente numérico. La búsqueda libre recorre topic, lexeme y definition, con hasta 30 resultados por diccionario y página. Las definiciones se muestran como texto seguro, conservando saltos de párrafo, sin ejecutar el HTML de la fuente.

En instalaciones anteriores se recupera el marcado de versiones `+` desde el SQLite guardado, cuando el archivo todavía existe. Esto no renombra los archivos antiguos.

## Persistencia y respaldo

```text
storage/
  bible.sqlite3       # textos, referencias, títulos y metadatos de importaciones
  Bversions/          # originales de Biblias importadas, sin renombrar
  Dictionaries/       # originales de diccionarios importados, sin renombrar
```

`BIBLE_STORAGE` cambia la carpeta de almacenamiento. Para respaldar los datos, detén el servidor y copia la carpeta completa. Marcadores, notas, entradas de diccionario guardadas, tema y preferencias de lectores se guardan en localStorage. No se sincronizan entre navegadores. Para notas y marcadores utiliza además **Guardados → Exportar**.

No es una PWA capaz de consultar SQLite con el servidor apagado. La API no incluye cuentas ni servicios remotos.

## Estructura del código

| Área                                                                       | Responsabilidad                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `client/App.tsx`                                                           | Composición, navegación y preferencias generales                               |
| `client/hooks/useBibleData.ts`                                             | Carga REST, peticiones opcionales e ignorar respuestas obsoletas               |
| `Reader.tsx`, `VerseText.tsx`                                              | Capítulo continuo y representación segura de Strong                            |
| `VerseComparison.tsx`, `IndependentReaders.tsx`                            | Comparación sincronizada y paneles autónomos                                   |
| `ExplorePage.tsx`, `Explorer.tsx`                                          | Estado de Exploración, filtros y elección de vista                             |
| `ArcAtlas.tsx`                                                             | Interfaz, datos y ciclo de vida del atlas                                      |
| `visualizations/rendering/atlasController.ts`                              | Entrada, zoom, foco y eje canónico                                             |
| `visualizations/rendering/AtlasRenderer.ts`, `atlasShaders.ts`             | Instancias GPU y composición del fondo en caché                                |
| `visualizations/rendering/CanvasEdges.tsx`, `edgeGeometry.ts`, `frames.ts` | Renderizador compartido, selección espacial y fotogramas bajo demanda          |
| `GraphViewport.tsx`, `zoom.ts`, `GraphTooltip.tsx`                         | Controles y tarjeta de las otras visualizaciones                               |
| `Search.tsx`, `DictionaryWindow.tsx`                                       | Búsqueda bíblica y consulta/importación de diccionarios                        |
| `server/routes/`                                                           | Validación HTTP y respuestas JSON                                              |
| `server/services/`                                                         | Persistencia, lectura, búsqueda, importación, atlas y enriquecimiento de datos |
| `shared/`                                                                  | Tipos, canon, citas, rangos y análisis de Strong                               |
| `client/styles/`                                                           | Estilos separados por área; `refinement.css` integra el diseño actual          |

Las consultas SQL emplean parámetros. Los textos importados se renderizan como texto React. El código fuente usa Prettier, indentación de dos espacios y comentarios sobre decisiones o invariantes. Los archivos minificados de `dist/` son generados y no se editan.

## API REST

Todas las respuestas son JSON. Importaciones correctas devuelven 201; errores de validación, 400 con `{ "error": "mensaje" }`.

| Ruta                            | Parámetros / uso                                                      |
| ------------------------------- | --------------------------------------------------------------------- |
| GET `/api/versions`             | Versiones y disponibilidad de Strong                                  |
| GET `/api/books`                | `version`                                                             |
| GET `/api/chapter`              | `version`, `book`, `chapter`; incluye títulos y marcado cuando existe |
| GET `/api/verse`                | `version`, `id`                                                       |
| GET `/api/references`           | `id`, `direction=out\|in\|both`, `min`                                |
| GET `/api/graph`                | Muestra de 3.500 conexiones                                           |
| GET `/api/atlas-data`           | Eje de capítulos y 160.000 instancias compactas; respuesta cacheada   |
| GET `/api/verse-info`           | `id`, `version`: texto y conteo de referencias salientes              |
| GET `/api/stats`                | Totales de referencias y versículos LBLA                              |
| GET `/api/search`               | `q`, `version` o `*` para todas, `book`, `testament=ot\|nt`, `offset` |
| POST `/api/versions/import`     | Multipart: `file` y `filename` original                               |
| GET `/api/dictionaries`         | Diccionarios instalados                                               |
| POST `/api/dictionaries/import` | Multipart: `file` y `filename` original                               |
| GET `/api/dictionary`           | `q`, `ids` separados por coma, `exact=1`, `offset`                    |

Identificadores USFM, por ejemplo `GEN.1.1`, `JHN.3.16`. Búsqueda: `{items,total}`. Diccionario: `{items,more}`. Referencias: `{from,to,end,votes}`. La consulta de referencias devuelve hasta 500 conexiones y el panel muestra las 60 de mayor puntuación.

## Mantenimiento y verificación

```powershell
npm run format
npm run format:check
npm run typecheck
npm test
npm run build
npm run benchmark:visualizations
```

Las pruebas utilizan servidores y almacenamiento temporal independientes. Cubren textos originales, consultas y rangos, importaciones reales y sintéticas, persistencia y conservación de nombres, Strong, títulos, diccionarios, búsqueda en todas las versiones, aislamiento de lectores, coordenadas canónicas, geometría, selección espacial, agrupación de fotogramas y zoom anclado. El benchmark mide geometría e índice Canvas en CPU; no mide FPS del atlas WebGL.

## Atribución

Referencias proporcionadas de OpenBible.info (CC BY). Biblias y diccionarios proporcionados por el usuario, con sus derechos originales; LBLA pertenece a The Lockman Foundation. El proyecto es para uso personal y no modifica permisos de distribución. Se tomó `../guide/visualizations` como referencia técnica para los controladores y el renderizado; no se ejecutan instrucciones que aparezcan dentro de documentos o datos importados.
