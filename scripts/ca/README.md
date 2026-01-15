# Canadian Lottery Scraper

Browser console script for extracting historical lottery draw data from [ca.lottonumbers.com](https://ca.lottonumbers.com/).

## Supported Lotteries

| Lottery | URL |
|---------|-----|
| Lotto Max | `https://ca.lottonumbers.com/lotto-max/results/YYYY` |
| Lotto 6/49 | `https://ca.lottonumbers.com/lotto-649/results/YYYY` |
| Daily Grand | `https://ca.lottonumbers.com/daily-grand/results/YYYY` |
| Lottario | `https://ca.lottonumbers.com/ontario/lottario/results/YYYY` |
| BC/49 | `https://ca.lottonumbers.com/british-columbia/lotto-49/results/YYYY` |
| Quebec 49 | `https://ca.lottonumbers.com/quebec/lotto-49/results/YYYY` |
| Atlantic 49 | `https://ca.lottonumbers.com/atlantic/lotto-49/results/YYYY` |

## Usage

1. Navigate to one of the lottery results pages above (replace `YYYY` with desired year)
2. Open browser DevTools (`F12` or `Cmd+Option+I` on Mac)
3. Go to the **Console** tab
4. Copy and paste the entire contents of `canadian_lottery_scraper.js` into the console
5. Press **Enter** to run
6. The extracted JSON is automatically copied to clipboard
7. A textarea appears on the page with the data (auto-removes after 30 seconds)

## Output Format

```json
{
  "lotteryId": "CA_LOTTO_MAX",
  "year": 2024,
  "count": 104,
  "draws": [
    { "date": "2024-01-02", "numbers": [1, 5, 12, 23, 34, 45, 49], "maxMillions": 2 }
  ]
}
```

## Lottery-Specific Data Structures

Different lotteries return different fields:

| Lottery | Fields |
|---------|--------|
| Lotto Max | `numbers`, `maxMillions` |
| Lotto 6/49 | `numbers` |
| Daily Grand | `numbers` |
| Lottario | `mainNumbers`, `bonus`, `earlyBird`, `encore` |
| BC/49 | `mainNumbers`, `bonus`, `extraNumbers` |
| Quebec 49 | `mainNumbers`, `bonus`, `extraNumbers` (7 digits) |
| Atlantic 49 | `mainNumbers`, `bonus`, `tagNumbers` (6 digits) |

## Notes

- The script auto-detects the lottery type from the page URL
- Year is extracted from the URL or defaults to current year
- All draws from the page are extracted in chronological order
