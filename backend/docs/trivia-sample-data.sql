-- Datos de ejemplo para trivias: sets, preguntas y opciones
-- Requiere tener aplicado docs/trivia-schema.sql previamente

-- SETS (insértalos con IDs determinísticos para referenciar preguntas)
insert into public.trivia_sets (id, title, description, topic, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'Fundamentos de Sostenibilidad', 'Conceptos clave y pilares del desarrollo sostenible.', 'Sostenibilidad', true),
  ('22222222-2222-2222-2222-222222222222', 'Cambio Climático', 'Causas, efectos y acciones frente al cambio climático.', 'Clima', true),
  ('33333333-3333-3333-3333-333333333333', 'Consumo Responsable', 'Hábitos de consumo, economía circular y residuos.', 'Consumo', true),
  ('44444444-4444-4444-4444-444444444444', 'Energías Renovables', 'Fuentes, retos y almacenamiento de energías limpias.', 'Energía', true)
on conflict (id) do nothing;

-- PREGUNTAS (IDs determinísticos para enlazar opciones) --------------------
-- Set 1: Fundamentos de Sostenibilidad (S1)
insert into public.trivia_questions (id, set_id, prompt, topic, difficulty, is_active) values
  ('11111111-1111-1111-1111-000000000001', '11111111-1111-1111-1111-111111111111', '¿Qué es el desarrollo sostenible?', 'Sostenibilidad', 'Beginner', true),
  ('11111111-1111-1111-1111-000000000002', '11111111-1111-1111-1111-111111111111', '¿Cuántos Objetivos de Desarrollo Sostenible (ODS) existen?', 'Sostenibilidad', 'Beginner', true),
  ('11111111-1111-1111-1111-000000000003', '11111111-1111-1111-1111-111111111111', 'La economía circular busca principalmente…', 'Sostenibilidad', 'Intermediate', true),
  ('11111111-1111-1111-1111-000000000004', '11111111-1111-1111-1111-111111111111', 'La huella ecológica mide…', 'Sostenibilidad', 'Intermediate', true),
  ('11111111-1111-1111-1111-000000000005', '11111111-1111-1111-1111-111111111111', 'Una acción diaria sostenible es…', 'Sostenibilidad', 'Beginner', true)
on conflict (id) do nothing;

-- Set 2: Cambio Climático (S2)
insert into public.trivia_questions (id, set_id, prompt, topic, difficulty, is_active) values
  ('22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-222222222222', 'Principal gas de efecto invernadero emitido por actividades humanas:', 'Clima', 'Beginner', true),
  ('22222222-2222-2222-2222-000000000002', '22222222-2222-2222-2222-222222222222', 'El objetivo de 1.5°C del Acuerdo de París busca…', 'Clima', 'Intermediate', true),
  ('22222222-2222-2222-2222-000000000003', '22222222-2222-2222-2222-222222222222', 'Mitigación del cambio climático significa…', 'Clima', 'Beginner', true),
  ('22222222-2222-2222-2222-000000000004', '22222222-2222-2222-2222-222222222222', 'El IPCC es…', 'Clima', 'Beginner', true),
  ('22222222-2222-2222-2222-000000000005', '22222222-2222-2222-2222-222222222222', '¿Cuál es un impacto esperado del cambio climático?', 'Clima', 'Intermediate', true)
on conflict (id) do nothing;

-- Set 3: Consumo Responsable (S3)
insert into public.trivia_questions (id, set_id, prompt, topic, difficulty, is_active) values
  ('33333333-3333-3333-3333-000000000001', '33333333-3333-3333-3333-333333333333', 'La etiqueta energética en electrodomésticos sirve para…', 'Consumo', 'Beginner', true),
  ('33333333-3333-3333-3333-000000000002', '33333333-3333-3333-3333-333333333333', '“Fast fashion” se relaciona con…', 'Consumo', 'Intermediate', true),
  ('33333333-3333-3333-3333-000000000003', '33333333-3333-3333-3333-333333333333', 'La huella de carbono es…', 'Consumo', 'Beginner', true),
  ('33333333-3333-3333-3333-000000000004', '33333333-3333-3333-3333-333333333333', 'Las 3R significan…', 'Consumo', 'Beginner', true),
  ('33333333-3333-3333-3333-000000000005', '33333333-3333-3333-3333-333333333333', 'Una compra responsable es aquella que…', 'Consumo', 'Intermediate', true)
on conflict (id) do nothing;

-- Set 4: Energías Renovables (S4)
insert into public.trivia_questions (id, set_id, prompt, topic, difficulty, is_active) values
  ('44444444-4444-4444-4444-000000000001', '44444444-4444-4444-4444-444444444444', 'Son fuentes de energía renovable:', 'Energía', 'Beginner', true),
  ('44444444-4444-4444-4444-000000000002', '44444444-4444-4444-4444-444444444444', 'El “factor de capacidad” de una planta eólica/solar es…', 'Energía', 'Intermediate', true),
  ('44444444-4444-4444-4444-000000000003', '44444444-4444-4444-4444-444444444444', 'La intermitencia en solar/eólica implica…', 'Energía', 'Intermediate', true),
  ('44444444-4444-4444-4444-000000000004', '44444444-4444-4444-4444-444444444444', 'El almacenamiento con baterías permite…', 'Energía', 'Intermediate', true),
  ('44444444-4444-4444-4444-000000000005', '44444444-4444-4444-4444-444444444444', 'Una ventaja de las renovables es…', 'Energía', 'Beginner', true)
on conflict (id) do nothing;

-- OPCIONES ---------------------------------------------------------------
-- Para cada pregunta se crean 4 opciones (una correcta)

-- S1 Q1
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000001', 'Satisfacer necesidades presentes sin comprometer las futuras', true, 'Equilibrio entre economía, sociedad y ambiente.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000001', 'Crecimiento económico por sobre cualquier otro factor', false, 'El desarrollo sostenible considera múltiples dimensiones.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000001', 'Solo conservación ambiental', false, 'Incluye también equidad social y viabilidad económica.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000001', 'Producción ilimitada de recursos', false, 'Los recursos son finitos, se requiere gestión responsable.');

-- S1 Q2
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000002', '17', true, 'Son 17 ODS establecidos por la ONU.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000002', '12', false, 'Respuesta incorrecta.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000002', '20', false, 'Respuesta incorrecta.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000002', '8', false, 'Respuesta incorrecta.');

-- S1 Q3
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000003', 'Mantener materiales en uso y reducir residuos', true, 'Cerrar ciclos y diseñar para reutilización/reciclaje.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000003', 'Maximizar extracción de recursos vírgenes', false, 'Se busca lo contrario: reducir uso de recursos vírgenes.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000003', 'Aumentar la obsolescencia programada', false, 'Se promueve durabilidad y reparabilidad.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000003', 'Enfocarse solo en reciclaje', false, 'También reuso, reparación, remanufactura, etc.');

-- S1 Q4
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000004', 'La demanda humana sobre los ecosistemas', true, 'Compara consumo de recursos con capacidad de regeneración.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000004', 'Cantidad de residuos peligrosos', false, 'Más amplia que solo residuos peligrosos.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000004', 'Nivel de biodiversidad de un país', false, 'No es el objetivo de esta métrica.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000004', 'Riesgo sísmico de una región', false, 'No relacionado.');

-- S1 Q5
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000005', 'Reducir el consumo de energía en casa', true, 'Pequeñas acciones diarias tienen gran impacto.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000005', 'Dejar luces encendidas al salir', false, 'Incrementa consumo innecesario.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000005', 'Usar agua sin control', false, 'El uso responsable del agua es clave.'),
  (gen_random_uuid(), '11111111-1111-1111-1111-000000000005', 'Tirar residuos reciclables al general', false, 'Separar y reciclar es preferible.');

-- S2 Q1
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000001', 'Dióxido de carbono (CO2)', true, 'Principal GEI de origen antropogénico.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000001', 'Vapor de agua', false, 'No es el foco de emisiones humanas directas.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000001', 'Oxígeno', false, 'No es un GEI.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000001', 'Ozono troposférico', false, 'No es el principal emitido por actividades humanas.');

-- S2 Q2
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000002', 'Limitar el calentamiento a 1.5°C respecto a niveles preindustriales', true, 'Meta clave del Acuerdo de París.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000002', 'Mantener temperaturas actuales sin cambios', false, 'La temperatura ya aumentó ~1.1°C.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000002', 'Reducir solo la contaminación del aire local', false, 'Se enfoca en GEI globales.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000002', 'Aumentar el uso de combustibles fósiles', false, 'Contradice la meta.');

-- S2 Q3
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000003', 'Reducir las emisiones de GEI', true, 'Mitigación = reducir causa; Adaptación = gestionar impactos.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000003', 'Prepararse para eventos extremos', false, 'Eso es adaptación, no mitigación.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000003', 'Aumentar el uso de carbón', false, 'Emisiones más altas.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000003', 'Reducir la biodiversidad', false, 'No relacionado.');

-- S2 Q4
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000004', 'Panel intergubernamental de expertos sobre cambio climático', true, 'IPCC por sus siglas en inglés.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000004', 'Un tratado comercial', false, 'No es un tratado.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000004', 'Una ONG local', false, 'Es un organismo científico internacional.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000004', 'Una empresa de energías', false, 'No es una empresa.');

-- S2 Q5
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000005', 'Aumento en frecuencia e intensidad de olas de calor', true, 'Uno de los impactos esperados.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000005', 'Disminución de eventos extremos', false, 'Ocurre lo contrario.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000005', 'Disminución del nivel del mar', false, 'Se espera aumento.'),
  (gen_random_uuid(), '22222222-2222-2222-2222-000000000005', 'Aumento de glaciares', false, 'Retroceden con el calentamiento.');

-- S3 Q1
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000001', 'Informar sobre eficiencia energética', true, 'Permite comparar consumo de energía.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000001', 'Mejorar el diseño estético', false, 'No es el propósito.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000001', 'Aumentar el precio de venta', false, 'Tampoco.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000001', 'Reducir la garantía del producto', false, 'No aplica.');

-- S3 Q2
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000002', 'Producción rápida de prendas de corta vida útil', true, 'Implica alto impacto y descarte frecuente.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000002', 'Ropa hecha a medida y duradera', false, 'Es lo contrario.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000002', 'Textiles 100% reciclados siempre', false, 'No necesariamente.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000002', 'Producción artesanal de baja escala', false, 'No describe fast fashion.');

-- S3 Q3
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000003', 'La cantidad de GEI emitidos (CO2e) por actividades', true, 'Medido como CO2 equivalente.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000003', 'La cantidad de residuos sólidos', false, 'No es huella de carbono.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000003', 'La huella hídrica del producto', false, 'Es otro indicador.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000003', 'El costo monetario de la compra', false, 'No equivale a huella de carbono.');

-- S3 Q4
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000004', 'Reducir, Reutilizar, Reciclar', true, 'Priorizando reducción y reuso antes que reciclaje.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000004', 'Reciclar, Reusar, Reponer', false, 'Secuencia incorrecta.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000004', 'Resistir, Rechazar, Reusar', false, 'Difiere del estándar 3R.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000004', 'Refrescar, Rehacer, Reusar', false, 'No corresponde.');

-- S3 Q5
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000005', 'Considera necesidad, durabilidad y reparación del producto', true, 'Compra informada y responsable.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000005', 'Se guía solo por ofertas', false, 'Precio no es el único criterio.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000005', 'Ignora etiquetas y garantías', false, 'Es mejor revisarlas.'),
  (gen_random_uuid(), '33333333-3333-3333-3333-000000000005', 'Compra impulsiva', false, 'Mejor planificar.');

-- S4 Q1
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000001', 'Solar, eólica, hidráulica, geotérmica', true, 'Principales fuentes renovables.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000001', 'Carbón, petróleo, gas', false, 'Son fósiles.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000001', 'Nuclear, carbón, eólica', false, 'Nuclear no es renovable.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000001', 'Biomasa, carbón, gas', false, 'Carbón/gas no son renovables.');

-- S4 Q2
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000002', 'Relación entre energía generada real y máxima teórica', true, 'Indicador de aprovechamiento.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000002', 'Velocidad del viento promedio', false, 'Puede influir pero no define el factor.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000002', 'Energía almacenada en baterías', false, 'No define el factor.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000002', 'Costo nivelado de la energía', false, 'Otro indicador (LCOE).');

-- S4 Q3
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000003', 'Variabilidad de generación según recurso', true, 'Depende del sol/viento disponible.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000003', 'Energía constante 24/7', false, 'No aplica a solar/eólica.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000003', 'Mayor estabilidad que nuclear', false, 'No corresponde.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000003', 'Reducción de demanda pico', false, 'No describe intermitencia.');

-- S4 Q4
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000004', 'Gestionar intermitencia y desplazar consumo', true, 'Permite balancear oferta-demanda.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000004', 'Reducir eficiencia de la red', false, 'Es al revés.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000004', 'Aumentar pérdidas técnicas', false, 'No es el objetivo.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000004', 'Eliminar necesidad de redes eléctricas', false, 'No elimina las redes.');

-- S4 Q5
insert into public.trivia_options (id, question_id, text, is_correct, explanation) values
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000005', 'Bajas emisiones y diversificación de la matriz', true, 'Clave para descarbonizar.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000005', 'Altas emisiones y dependencia fósil', false, 'Contradictorio.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000005', 'Costos invariables siempre altos', false, 'Costos han bajado notablemente.'),
  (gen_random_uuid(), '44444444-4444-4444-4444-000000000005', 'Imposibilidad de integrar a la red', false, 'Se integran con adecuada planificación.');

