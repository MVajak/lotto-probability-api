import json
import sys

def generate_sql(json_file, output_file=None):
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    lines = []
    
    # Header
    lines.append(f"""-- IE_DAILY_MILLION and IE_DAILY_MILLION_PLUS Data Import
-- Total draws: {len(data)} days x 4 draws = {len(data) * 4} draws
-- Date range: {data[-1]['date']} to {data[0]['date']}
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

INSERT INTO temp_draws (draw_date, draw_label, game_type_name, winning_number, sec_winning_number) VALUES""")

    # Generate all value rows
    rows = []
    for row in data:
        date = row['date']
        
        # Daily Million 2pm
        nums = row['dm_2pm']
        main = ','.join(str(n) for n in nums[:6])
        bonus = str(nums[6])
        rows.append(f"    ('{date} 14:00:00+00'::timestamptz, '{date}-14:00', 'IE_DAILY_MILLION', '{main}', '{bonus}')")
        
        # Daily Million Plus 2pm
        nums = row['dmp_2pm']
        main = ','.join(str(n) for n in nums[:6])
        bonus = str(nums[6])
        rows.append(f"    ('{date} 14:00:00+00'::timestamptz, '{date}-14:00', 'IE_DAILY_MILLION_PLUS', '{main}', '{bonus}')")
        
        # Daily Million 9pm
        nums = row['dm_9pm']
        main = ','.join(str(n) for n in nums[:6])
        bonus = str(nums[6])
        rows.append(f"    ('{date} 21:00:00+00'::timestamptz, '{date}-21:00', 'IE_DAILY_MILLION', '{main}', '{bonus}')")
        
        # Daily Million Plus 9pm
        nums = row['dmp_9pm']
        main = ','.join(str(n) for n in nums[:6])
        bonus = str(nums[6])
        rows.append(f"    ('{date} 21:00:00+00'::timestamptz, '{date}-21:00', 'IE_DAILY_MILLION_PLUS', '{main}', '{bonus}')")

    # Join rows with commas, last one with semicolon
    for i, r in enumerate(rows):
        if i < len(rows) - 1:
            lines.append(r + ',')
        else:
            lines.append(r + ';')

    # Footer
    lines.append("""
INSERT INTO lotto_draw (id, draw_date, draw_label, external_draw_id, game_type_name, created_at, updated_at)
SELECT draw_uuid, draw_date, draw_label, NULL, game_type_name, NOW(), NOW()
FROM temp_draws;

INSERT INTO lotto_draw_result (draw_id, win_class, winning_number, sec_winning_number, created_at, updated_at)
SELECT draw_uuid, NULL, winning_number, sec_winning_number, NOW(), NOW()
FROM temp_draws;

DROP TABLE temp_draws;

COMMIT;""")

    output = '\n'.join(lines)
    
    if output_file:
        with open(output_file, 'w') as f:
            f.write(output)
        print(f"SQL written to {output_file}")
    else:
        print(output)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python generate_daily_million_sql.py <input.json> [output.sql]")
        sys.exit(1)
    
    json_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    generate_sql(json_file, output_file)