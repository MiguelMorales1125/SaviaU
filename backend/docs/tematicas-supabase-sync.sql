-- Temáticas: sincroniza el contenido de "deep_dive" con lo que consume el backend.
-- Ejecuta este script en el editor SQL de Supabase una sola vez.

alter table if exists tematicas_resources add column if not exists deep_dive text;

update tematicas_resources set deep_dive = $$
Arranca con un tablero tipo kanban que separa fuentes fijas, móviles y fugas ocultas; cada columna describe sensores sugeridos, responsables y frecuencia de medición. El kit trae ejemplos de universidades tropicales con presupuestos ajustados, para que adaptes factores de emisión y no dependas de bases europeas.

Una vez recopilados los datos, la guía propone tres escenarios de reducción con gráficos sencillos para socializar con directivos. Se incluye un apartado de storytelling para traducir toneladas de CO₂ en equivalentes entendibles, además de un checklist de compras públicas sostenibles que evita que el inventario quede solo en un PDF.
$$ where id = 'inventario-carbono';

update tematicas_resources set deep_dive = $$
El tour inicia en un campus panameño que instaló sensores LORA para mapear puntos calientes; las visualizaciones muestran cómo se priorizaron techos fríos y ventilación cruzada. Luego aterriza en Quito, donde se combinó una microrred solar con programas de microbecas para estudiantes que monitorean el rendimiento. Finalmente, conocerás un laboratorio mexicano que usa algoritmos sencillos en Raspberry Pi para apagar cargas fantasmas por la noche.

Cada capítulo termina con hojas de cálculo descargables, plantillas de pitch financiero y recomendaciones de proveedores verificados. También se incluyen scripts de comunicación interna para incentivar hábitos energéticos en residencias estudiantiles.
$$ where id = 'laboratorio-energia';

update tematicas_resources set deep_dive = $$
El kit abre con guías para identificar audiencias específicas y diseñar mensajes empáticos según su nivel de ansiedad climática. Propone plantillas de carruseles para Instagram, guiones cortos para video vertical y un paquete de stickers imprimibles para señalizar acciones concretas en campus.

Además, incluye ejemplos de campañas exitosas en español, un mini glosario para traducir términos técnicos, ejercicios de escucha activa y pautas para facilitar conversaciones difíciles durante ferias ambientales. Cierra con una hoja de evaluación para medir impacto narrativo.
$$ where id = 'kit-comunicacion-climatica';

update tematicas_resources set deep_dive = $$
Comienza con un escáner que reconoce espacios grises en el campus y sugiere especies nativas para convertirlos en microhábitats. Los retos semanales desbloquean filtros AR para documentar la llegada de polinizadores y compartir métricas de néctar en redes sociales.

Un tablero colaborativo permite cargar fotos geolocalizadas, comparar floraciones y planear celebraciones estacionales. También aprenderás a diseñar estaciones de observación accesibles y a negociar mantenimiento con el área de infraestructura.
$$ where id = 'ruta-poliniza';

update tematicas_resources set deep_dive = $$
El microcurso explica cómo construir micrófonos con materiales accesibles y calibrarlos usando aplicaciones gratuitas. Incluye un flujo de trabajo para subir los audios a plataformas abiertas, etiquetar especies y generar mapas de calor acústicos que sirven como indicadores de bienestar ecosistémico.

Se complementa con guiones para organizar caminatas nocturnas de escucha, protocolos de ética para no alterar fauna y un módulo para traducir hallazgos en infografías que puedan presentar ante rectorías o municipalidades.
$$ where id = 'bioindicadores-sonoros';

update tematicas_resources set deep_dive = $$
El laboratorio resume técnicas de bioingeniería blanda como fajinadas vivas, bombas de semilla y biochar artesanal. Cada ficha detalla materiales, tiempos de implantación y cómo monitorear humedad del suelo con sensores caseros.

También encontrarás guías para reclutar voluntarios, asignar roles creativos y documentar los avances con fotografía comparativa. Se añaden recomendaciones para dialogar con comunidades vecinas y asegurar el mantenimiento post proyecto.
$$ where id = 'laboratorio-restauracion';

update tematicas_resources set deep_dive = $$
La serie muestra paso a paso cómo desmontar uniformes en paneles modulares, teñirlos con pigmentos naturales y ensamblar productos con cierres recuperados. Cada episodio cierra con consejos de comercialización local y modelos de costos que incluyen pagos justos a voluntarios.

Se añade una guía para montar pop-ups circulares dentro del campus, estrategias para involucrar a diseñadores industriales y un toolkit para visibilizar el impacto económico-social de cada colección.
$$ where id = 'atelier-upcycling';

update tematicas_resources set deep_dive = $$
El canvas está dividido en nueve bloques con preguntas gatillo para mapear flujos de materiales, socios aliados y beneficios culturales. La audio-guía te acompaña con ejemplos reales para llenar cada sección en sesiones colaborativas de 45 minutos.

Incluye dinámicas para prototipar servicios en cartón, un termómetro de madurez circular y plantillas de métricas regenerativas que pueden integrarse a OKRs estudiantiles.
$$ where id = 'canvas-circular';

update tematicas_resources set deep_dive = $$
La expedición reúne más de 20 recetas basadas en residuos agrícolas comunes como café, cacao o piña. Cada ficha explica la proporción ideal de glicerina, espesantes naturales y métodos de secado para lograr diferentes texturas.

También aprenderás a crear módulos expositivos modulares, a documentar el proceso con fichas técnicas y a plantear alianzas con cafeterías del campus para asegurar materia prima constante.
$$ where id = 'expedicion-biomateriales';

update tematicas_resources set deep_dive = $$
El mapa describe cómo reusar celulares con pantallas dañadas como nodos IoT conectados a red Wi-Fi comunitaria. Se incluyen diagramas de flujo para validar los datos con laboratorios aliados, además de protocolos para emitir alertas coordinadas con ciudadanía y entes regulatorios.

Se suman plantillas de reportes mensuales, un módulo de diplomacia comunitaria para compartir hallazgos en asambleas y recomendaciones para gamificar el monitoreo con insignias digitales.
$$ where id = 'mapa-sensores';

update tematicas_resources set deep_dive = $$
El recetario organiza proyectos por nivel de complejidad, desde macetas filtrantes hasta biodigestores compactos. Cada receta detalla cómo calcular el volumen de lluvia captada, seleccionar especies filtrantes y narrar historias que conecten a las familias con el ciclo del agua.

Incluye scripts para recorridos educativos, plantillas para paneles interpretativos y sugerencias para financiar el mantenimiento mediante apadrinamientos vecinales.
$$ where id = 'cocina-humedales';

update tematicas_resources set deep_dive = $$
La simulación incluye un dossier con mapas 3D, fichas de actores y gatillos narrativos para tensionar la discusión. Se proponen rondas de negociación cronometradas, herramientas para diseñar acuerdos compartidos y formatos de bitácora para evaluar habilidades socioemocionales.

Al finalizar, se facilita una guía para transferir las lecciones aprendidas a casos reales de cuencas locales, integrando mecanismos de cooperación entre escuelas, municipios y comunidades indígenas.
$$ where id = 'diplomacia-joven';
