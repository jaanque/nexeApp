-- Sample Data for Promotions Table
-- Safely inserts promotions for existing restaurants using dynamic IDs

-- Promotion 1: Uses the FIRST restaurant in the database
INSERT INTO public.promotions (restaurant_id, title, description, discount_percent, start_date, end_date, active)
SELECT id, '2x1 en Hamburguesas', 'Compra una hamburguesa clásica y llévate la segunda gratis todos los martes.', 50, NOW(), NOW() + INTERVAL '30 days', TRUE
FROM public.restaurants ORDER BY id ASC LIMIT 1 OFFSET 0;

-- Promotion 2: Uses the SECOND restaurant in the database
INSERT INTO public.promotions (restaurant_id, title, description, discount_percent, start_date, end_date, active)
SELECT id, 'Envío Gratis', 'Disfruta de envío gratuito en pedidos superiores a $200.', 0, NOW(), NOW() + INTERVAL '15 days', TRUE
FROM public.restaurants ORDER BY id ASC LIMIT 1 OFFSET 1;

-- Promotion 3: Uses the THIRD restaurant in the database
INSERT INTO public.promotions (restaurant_id, title, description, discount_percent, start_date, end_date, active)
SELECT id, 'Descuento Familiar', '20% de descuento en todos los combos familiares para compartir.', 20, NOW(), NOW() + INTERVAL '60 days', TRUE
FROM public.restaurants ORDER BY id ASC LIMIT 1 OFFSET 2;

-- Promotion 4: Uses the FOURTH restaurant in the database (or the first if only 3 exist)
INSERT INTO public.promotions (restaurant_id, title, description, discount_percent, start_date, end_date, active)
SELECT COALESCE((SELECT id FROM public.restaurants ORDER BY id ASC LIMIT 1 OFFSET 3), (SELECT id FROM public.restaurants ORDER BY id ASC LIMIT 1)),
       'Happy Hour de Sushi', '30% OFF en rolls seleccionados de 18:00 a 20:00 hrs.', 30, NOW(), NOW() + INTERVAL '90 days', TRUE;

-- Promotion 5: Uses the FIFTH restaurant in the database (or the first if only 4 exist)
INSERT INTO public.promotions (restaurant_id, title, description, discount_percent, start_date, end_date, active)
SELECT COALESCE((SELECT id FROM public.restaurants ORDER BY id ASC LIMIT 1 OFFSET 4), (SELECT id FROM public.restaurants ORDER BY id ASC LIMIT 1)),
       'Postre de Regalo', 'Recibe un postre gratis con la compra de cualquier plato principal.', 100, NOW(), NOW() + INTERVAL '45 days', TRUE;

-- Note: If you have no restaurants, please populate the 'restaurants' table first.
