-- IE_DAILY_MILLION and IE_DAILY_MILLION_PLUS Data Import
-- Total draws: 12 days x 4 draws = 48 draws
-- Date range: 2026-01-01 to 2026-01-12
-- Format: 6 numbers (1-39) + Bonus (1-39)
-- Schedule: Daily at 14:00 and 21:00 Irish time

BEGIN;

CREATE TEMP TABLE temp_draws (
    draw_uuid UUID DEFAULT uuid_generate_v4(),
    draw_date TIMESTAMPTZ NOT NULL,
    draw_label VARCHAR(255) NOT NULL,
    game_type_name VARCHAR(255) NOT NULL,
    winning_number VARCHAR(255) NOT NULL,
    sec_winning_number VARCHAR(255) NOT NULL
);

INSERT INTO temp_draws (draw_date, draw_label, game_type_name, winning_number, sec_winning_number) VALUES
    ('2026-01-12 14:00:00+00'::timestamptz, '2026-01-12-14:00', 'IE_DAILY_MILLION', '3,12,20,23,25,35', '19'),
    ('2026-01-12 14:00:00+00'::timestamptz, '2026-01-12-14:00', 'IE_DAILY_MILLION_PLUS', '1,6,9,12,25,29', '17'),
    ('2026-01-12 21:00:00+00'::timestamptz, '2026-01-12-21:00', 'IE_DAILY_MILLION', '4,22,23,32,36,37', '1'),
    ('2026-01-12 21:00:00+00'::timestamptz, '2026-01-12-21:00', 'IE_DAILY_MILLION_PLUS', '7,9,11,15,18,32', '30'),
    ('2026-01-11 14:00:00+00'::timestamptz, '2026-01-11-14:00', 'IE_DAILY_MILLION', '2,4,8,15,26,36', '35'),
    ('2026-01-11 14:00:00+00'::timestamptz, '2026-01-11-14:00', 'IE_DAILY_MILLION_PLUS', '3,8,9,12,38,39', '30'),
    ('2026-01-11 21:00:00+00'::timestamptz, '2026-01-11-21:00', 'IE_DAILY_MILLION', '4,5,10,16,25,30', '11'),
    ('2026-01-11 21:00:00+00'::timestamptz, '2026-01-11-21:00', 'IE_DAILY_MILLION_PLUS', '9,14,24,31,35,37', '25'),
    ('2026-01-10 14:00:00+00'::timestamptz, '2026-01-10-14:00', 'IE_DAILY_MILLION', '16,21,23,25,35,36', '10'),
    ('2026-01-10 14:00:00+00'::timestamptz, '2026-01-10-14:00', 'IE_DAILY_MILLION_PLUS', '5,8,9,17,24,37', '18'),
    ('2026-01-10 21:00:00+00'::timestamptz, '2026-01-10-21:00', 'IE_DAILY_MILLION', '2,4,5,7,20,36', '14'),
    ('2026-01-10 21:00:00+00'::timestamptz, '2026-01-10-21:00', 'IE_DAILY_MILLION_PLUS', '3,8,12,17,21,39', '18'),
    ('2026-01-09 14:00:00+00'::timestamptz, '2026-01-09-14:00', 'IE_DAILY_MILLION', '17,18,23,30,33,38', '19'),
    ('2026-01-09 14:00:00+00'::timestamptz, '2026-01-09-14:00', 'IE_DAILY_MILLION_PLUS', '2,6,7,12,28,33', '8'),
    ('2026-01-09 21:00:00+00'::timestamptz, '2026-01-09-21:00', 'IE_DAILY_MILLION', '13,20,23,25,34,39', '22'),
    ('2026-01-09 21:00:00+00'::timestamptz, '2026-01-09-21:00', 'IE_DAILY_MILLION_PLUS', '2,5,11,14,22,32', '38'),
    ('2026-01-08 14:00:00+00'::timestamptz, '2026-01-08-14:00', 'IE_DAILY_MILLION', '5,15,20,21,29,35', '30'),
    ('2026-01-08 14:00:00+00'::timestamptz, '2026-01-08-14:00', 'IE_DAILY_MILLION_PLUS', '7,8,11,19,25,26', '24'),
    ('2026-01-08 21:00:00+00'::timestamptz, '2026-01-08-21:00', 'IE_DAILY_MILLION', '4,15,29,33,35,39', '30'),
    ('2026-01-08 21:00:00+00'::timestamptz, '2026-01-08-21:00', 'IE_DAILY_MILLION_PLUS', '4,15,22,28,33,38', '16'),
    ('2026-01-07 14:00:00+00'::timestamptz, '2026-01-07-14:00', 'IE_DAILY_MILLION', '1,4,5,22,30,37', '32'),
    ('2026-01-07 14:00:00+00'::timestamptz, '2026-01-07-14:00', 'IE_DAILY_MILLION_PLUS', '11,15,17,25,29,31', '10'),
    ('2026-01-07 21:00:00+00'::timestamptz, '2026-01-07-21:00', 'IE_DAILY_MILLION', '1,5,18,23,33,39', '36'),
    ('2026-01-07 21:00:00+00'::timestamptz, '2026-01-07-21:00', 'IE_DAILY_MILLION_PLUS', '8,13,17,25,27,37', '15'),
    ('2026-01-06 14:00:00+00'::timestamptz, '2026-01-06-14:00', 'IE_DAILY_MILLION', '2,3,14,18,19,35', '23'),
    ('2026-01-06 14:00:00+00'::timestamptz, '2026-01-06-14:00', 'IE_DAILY_MILLION_PLUS', '1,11,15,21,34,37', '9'),
    ('2026-01-06 21:00:00+00'::timestamptz, '2026-01-06-21:00', 'IE_DAILY_MILLION', '5,6,17,21,23,36', '34'),
    ('2026-01-06 21:00:00+00'::timestamptz, '2026-01-06-21:00', 'IE_DAILY_MILLION_PLUS', '9,22,23,27,34,35', '3'),
    ('2026-01-05 14:00:00+00'::timestamptz, '2026-01-05-14:00', 'IE_DAILY_MILLION', '1,4,5,6,25,29', '15'),
    ('2026-01-05 14:00:00+00'::timestamptz, '2026-01-05-14:00', 'IE_DAILY_MILLION_PLUS', '15,25,26,27,33,37', '22'),
    ('2026-01-05 21:00:00+00'::timestamptz, '2026-01-05-21:00', 'IE_DAILY_MILLION', '7,14,20,26,34,37', '13'),
    ('2026-01-05 21:00:00+00'::timestamptz, '2026-01-05-21:00', 'IE_DAILY_MILLION_PLUS', '6,19,27,29,36,38', '12'),
    ('2026-01-04 14:00:00+00'::timestamptz, '2026-01-04-14:00', 'IE_DAILY_MILLION', '1,9,20,29,35,36', '39'),
    ('2026-01-04 14:00:00+00'::timestamptz, '2026-01-04-14:00', 'IE_DAILY_MILLION_PLUS', '1,10,14,23,36,38', '18'),
    ('2026-01-04 21:00:00+00'::timestamptz, '2026-01-04-21:00', 'IE_DAILY_MILLION', '2,8,11,16,20,21', '38'),
    ('2026-01-04 21:00:00+00'::timestamptz, '2026-01-04-21:00', 'IE_DAILY_MILLION_PLUS', '1,3,9,12,18,37', '24'),
    ('2026-01-03 14:00:00+00'::timestamptz, '2026-01-03-14:00', 'IE_DAILY_MILLION', '1,5,15,25,32,34', '37'),
    ('2026-01-03 14:00:00+00'::timestamptz, '2026-01-03-14:00', 'IE_DAILY_MILLION_PLUS', '3,5,13,14,18,31', '25'),
    ('2026-01-03 21:00:00+00'::timestamptz, '2026-01-03-21:00', 'IE_DAILY_MILLION', '8,10,16,24,25,27', '21'),
    ('2026-01-03 21:00:00+00'::timestamptz, '2026-01-03-21:00', 'IE_DAILY_MILLION_PLUS', '6,23,24,31,34,36', '10'),
    ('2026-01-02 14:00:00+00'::timestamptz, '2026-01-02-14:00', 'IE_DAILY_MILLION', '3,7,14,16,26,35', '28'),
    ('2026-01-02 14:00:00+00'::timestamptz, '2026-01-02-14:00', 'IE_DAILY_MILLION_PLUS', '1,5,26,31,33,39', '22'),
    ('2026-01-02 21:00:00+00'::timestamptz, '2026-01-02-21:00', 'IE_DAILY_MILLION', '1,4,18,24,32,33', '3'),
    ('2026-01-02 21:00:00+00'::timestamptz, '2026-01-02-21:00', 'IE_DAILY_MILLION_PLUS', '10,27,30,31,32,36', '25'),
    ('2026-01-01 14:00:00+00'::timestamptz, '2026-01-01-14:00', 'IE_DAILY_MILLION', '6,8,22,26,29,34', '7'),
    ('2026-01-01 14:00:00+00'::timestamptz, '2026-01-01-14:00', 'IE_DAILY_MILLION_PLUS', '2,8,13,19,25,30', '23'),
    ('2026-01-01 21:00:00+00'::timestamptz, '2026-01-01-21:00', 'IE_DAILY_MILLION', '8,10,13,18,22,35', '15'),
    ('2026-01-01 21:00:00+00'::timestamptz, '2026-01-01-21:00', 'IE_DAILY_MILLION_PLUS', '1,4,7,30,32,39', '8');

INSERT INTO lotto_draw (id, draw_date, draw_label, external_draw_id, game_type_name, created_at, updated_at)
SELECT draw_uuid, draw_date, draw_label, NULL, game_type_name, NOW(), NOW()
FROM temp_draws;

INSERT INTO lotto_draw_result (draw_id, win_class, winning_number, sec_winning_number, created_at, updated_at)
SELECT draw_uuid, NULL, winning_number, sec_winning_number, NOW(), NOW()
FROM temp_draws;

DROP TABLE temp_draws;

COMMIT;