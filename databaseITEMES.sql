-- Insert generic non-food items into the items table
-- These items are linked to the first available locale for demonstration purposes.

INSERT INTO items (name, description, price_euros, discount_percentage, image_url, restaurant_id, category_id)
SELECT
    'Mochila Urbana NEXE',
    'Diseño minimalista y resistente al agua. Compartimento acolchado para laptop de hasta 15 pulgadas. Ideal para el día a día en la ciudad.',
    49.99,
    0,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80',
    (SELECT id FROM locales LIMIT 1),
    (SELECT id FROM categories LIMIT 1)
UNION ALL
SELECT
    'Auriculares Noise Cancelling',
    'Sumérgete en tu música con la mejor cancelación de ruido activa del mercado. Hasta 30 horas de autonomía y carga rápida via USB-C.',
    79.99,
    10,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80',
    (SELECT id FROM locales LIMIT 1),
    (SELECT id FROM categories LIMIT 1)
UNION ALL
SELECT
    'Funda iPhone 15 Pro Max',
    'Protección de grado militar con acabado suave al tacto. Compatible con carga inalámbrica MagSafe. Disponible en varios colores.',
    14.99,
    0,
    'https://images.unsplash.com/photo-1603351154351-5cf233081c3d?auto=format&fit=crop&q=80',
    (SELECT id FROM locales LIMIT 1),
    (SELECT id FROM categories LIMIT 1)
UNION ALL
SELECT
    'Smartwatch Series 9',
    'Monitorización avanzada de salud, GPS integrado y resistencia al agua hasta 50 metros. Tu compañero perfecto para el fitness.',
    249.99,
    5,
    'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80',
    (SELECT id FROM locales LIMIT 1),
    (SELECT id FROM categories LIMIT 1);
