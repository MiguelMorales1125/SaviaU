-- Datos de ejemplo: 5 preguntas (Beginner, Intermediate, Advanced)
-- Ejecuta esto en el SQL Editor de Supabase después de crear el esquema (docs/diagnostic-schema.sql)

begin;

-- Elimina versiones previas de estas preguntas por prompt para evitar duplicados al re-ejecutar
with targets as (
  select id from public.diagnostic_questions where prompt in (
    '¿Cuál es el gas de efecto invernadero más abundante?',
    '¿Cuál práctica reduce la huella de carbono en el hogar?',
    '¿Qué indica la etiqueta energética A+++?',
    '¿Cuál es el orden correcto en la jerarquía de gestión de residuos?',
    'La disminución de polinizadores afecta principalmente a...'
  )
)
delete from public.diagnostic_options where question_id in (select id from targets);

delete from public.diagnostic_questions where prompt in (
  '¿Cuál es el gas de efecto invernadero más abundante?',
  '¿Cuál práctica reduce la huella de carbono en el hogar?',
  '¿Qué indica la etiqueta energética A+++?',
  '¿Cuál es el orden correcto en la jerarquía de gestión de residuos?',
  'La disminución de polinizadores afecta principalmente a...'
);

-- Inserta preguntas
insert into public.diagnostic_questions (prompt, topic, difficulty, is_active) values
('¿Cuál es el gas de efecto invernadero más abundante?', 'Clima', 'Beginner', true),
('¿Cuál práctica reduce la huella de carbono en el hogar?', 'Consumo', 'Beginner', true),
('¿Qué indica la etiqueta energética A+++?', 'Energía', 'Intermediate', true),
('¿Cuál es el orden correcto en la jerarquía de gestión de residuos?', 'Residuos', 'Intermediate', true),
('La disminución de polinizadores afecta principalmente a...', 'Biodiversidad', 'Advanced', true);

-- Inserta opciones (una correcta por pregunta)
insert into public.diagnostic_options (question_id, text, is_correct)
select q.id, o.text, o.is_correct
from (
  values
  -- P1: Clima (Beginner)
  ('¿Cuál es el gas de efecto invernadero más abundante?', 'Vapor de agua', true),
  ('¿Cuál es el gas de efecto invernadero más abundante?', 'Dióxido de carbono (CO2)', false),
  ('¿Cuál es el gas de efecto invernadero más abundante?', 'Metano (CH4)', false),
  ('¿Cuál es el gas de efecto invernadero más abundante?', 'Óxido nitroso (N2O)', false),

  -- P2: Consumo (Beginner)
  ('¿Cuál práctica reduce la huella de carbono en el hogar?', 'Apagar luces y usar focos LED', true),
  ('¿Cuál práctica reduce la huella de carbono en el hogar?', 'Dejar cargadores siempre conectados', false),
  ('¿Cuál práctica reduce la huella de carbono en el hogar?', 'Usar calefacción al máximo todo el día', false),
  ('¿Cuál práctica reduce la huella de carbono en el hogar?', 'Abrir el refrigerador innecesariamente', false),

  -- P3: Energía (Intermediate)
  ('¿Qué indica la etiqueta energética A+++?', 'Máxima eficiencia energética del equipo', true),
  ('¿Qué indica la etiqueta energética A+++?', 'Que el equipo es el más barato', false),
  ('¿Qué indica la etiqueta energética A+++?', 'Que consume más energía que A+', false),
  ('¿Qué indica la etiqueta energética A+++?', 'Que no necesita mantenimiento', false),

  -- P4: Residuos (Intermediate)
  ('¿Cuál es el orden correcto en la jerarquía de gestión de residuos?', 'Reducir, Reutilizar, Reciclar', true),
  ('¿Cuál es el orden correcto en la jerarquía de gestión de residuos?', 'Reciclar, Reutilizar, Reducir', false),
  ('¿Cuál es el orden correcto en la jerarquía de gestión de residuos?', 'Reutilizar, Reciclar, Reducir', false),
  ('¿Cuál es el orden correcto en la jerarquía de gestión de residuos?', 'Enterrar, Incinerar, Reciclar', false),

  -- P5: Biodiversidad (Advanced)
  ('La disminución de polinizadores afecta principalmente a...', 'La reproducción de plantas con flor (angiospermas)', true),
  ('La disminución de polinizadores afecta principalmente a...', 'La generación de energía eólica', false),
  ('La disminución de polinizadores afecta principalmente a...', 'La evaporación del agua en océanos', false),
  ('La disminución de polinizadores afecta principalmente a...', 'La formación de rocas ígneas', false)
) as o(prompt, text, is_correct)
join public.diagnostic_questions q on q.prompt = o.prompt;

commit;
