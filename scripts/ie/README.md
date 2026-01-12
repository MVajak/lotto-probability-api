# Irish Daily Million Data Extraction

Scripts to scrape historical Daily Million and Daily Million Plus lottery results and generate SQL import statements.

## Overview

- **Daily Million**: 6 numbers (1-39) + 1 bonus (1-39), draws at 2pm and 9pm daily
- **Daily Million Plus**: Same format, drawn immediately after each Daily Million draw

## Step 1: Extract Data from Website

Go to the archive page (e.g., `https://irish.national-lottery.com/daily-million/results-archive-2021`) and run this in browser console:

```javascript
(() => {
  const results = [];
  const months = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };
  
  const bodyText = document.body.innerText;
  const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentDate = null;
  let currentSets = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    const dateMatch = line.match(/^(\w+)\s+(\d{1,2})(?:st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/);
    if (dateMatch) {
      if (currentDate && currentSets.length === 4) {
        // Page order: DM 2pm, DM 9pm, DMP 2pm, DMP 9pm
        results.push({
          date: currentDate,
          dm_2pm: currentSets[0],
          dmp_2pm: currentSets[2],
          dm_9pm: currentSets[1],
          dmp_9pm: currentSets[3]
        });
      }
      
      const day = dateMatch[2].padStart(2, '0');
      const month = months[dateMatch[3]];
      const year = dateMatch[4];
      currentDate = `${year}-${month}-${day}`;
      currentSets = [];
      continue;
    }
    
    const numMatch = line.match(/^(\d{1,2})$/);
    if (numMatch && currentDate) {
      const num = parseInt(numMatch[1]);
      if (num >= 1 && num <= 39) {
        let nums = [num];
        let j = i + 1;
        while (nums.length < 7 && j < lines.length) {
          const nextNum = parseInt(lines[j]);
          if (!isNaN(nextNum) && nextNum >= 1 && nextNum <= 39) {
            nums.push(nextNum);
            j++;
          } else {
            break;
          }
        }
        if (nums.length === 7) {
          currentSets.push(nums);
          i = j - 1;
        }
      }
    }
  }
  
  if (currentDate && currentSets.length === 4) {
    results.push({
      date: currentDate,
      dm_2pm: currentSets[0],
      dmp_2pm: currentSets[2],
      dm_9pm: currentSets[1],
      dmp_9pm: currentSets[3]
    });
  }
  
  console.log(JSON.stringify(results.slice(0, 3), null, 2));
  copy(JSON.stringify(results));
  return `Found ${results.length} draws. Data copied to clipboard!`;
})();
```

This copies JSON to clipboard. Save it to a file (e.g., `data_2021.json`).

## Step 2: Generate SQL

```bash
python3 generate_daily_million_sql.py data_2021.json output_2021.sql
```

## Output Format

The script generates SQL using a temp table for bulk insert:

```sql
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
    ('2021-12-31 14:00:00+00'::timestamptz, '2021-12-31-14:00', 'IE_DAILY_MILLION', '8,9,11,13,18,37', '20'),
    ('2021-12-31 14:00:00+00'::timestamptz, '2021-12-31-14:00', 'IE_DAILY_MILLION_PLUS', '7,10,20,31,35,37', '29'),
    ...

INSERT INTO lotto_draw (...) SELECT ... FROM temp_draws;
INSERT INTO lotto_draw_result (...) SELECT ... FROM temp_draws;

DROP TABLE temp_draws;
COMMIT;
```

## JSON Data Structure

```json
{
  "date": "2021-12-31",
  "dm_2pm": [8, 9, 11, 13, 18, 37, 20],
  "dmp_2pm": [7, 10, 20, 31, 35, 37, 29],
  "dm_9pm": [11, 13, 16, 30, 31, 34, 10],
  "dmp_9pm": [4, 7, 10, 15, 20, 33, 8]
}
```

- First 6 numbers = main numbers
- 7th number = bonus

## Game Types

| Key | Game Type | Draw Time |
|-----|-----------|-----------|
| `dm_2pm` | IE_DAILY_MILLION | 14:00 |
| `dm_9pm` | IE_DAILY_MILLION | 21:00 |
| `dmp_2pm` | IE_DAILY_MILLION_PLUS | 14:00 |
| `dmp_9pm` | IE_DAILY_MILLION_PLUS | 21:00 |

## Draw Label Format

`YYYY-MM-DD-HH:MM` (e.g., `2021-12-31-14:00`)
