(function() {
  const results = [];
  const pageUrl = window.location.href;
  
  let lotteryId = 'UNKNOWN';
  if (pageUrl.includes('/lotto-max/')) lotteryId = 'CA_LOTTO_MAX';
  else if (pageUrl.includes('/lotto-649/')) lotteryId = 'CA_LOTTO_649';
  else if (pageUrl.includes('/daily-grand/')) lotteryId = 'CA_DAILY_GRAND';
  else if (pageUrl.includes('/ontario/lottario/')) lotteryId = 'CA_LOTTARIO';
  else if (pageUrl.includes('/british-columbia/lotto-49/')) lotteryId = 'CA_BC49';
  else if (pageUrl.includes('/quebec/lotto-49/')) lotteryId = 'CA_QUEBEC_49';
  else if (pageUrl.includes('/atlantic/lotto-49/')) lotteryId = 'CA_ATLANTIC_49';
  
  const yearMatch = pageUrl.match(/\/(\d{4})$/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear();
  
  const months = {January:1,February:2,March:3,April:4,May:5,June:6,
                  July:7,August:8,September:9,October:10,November:11,December:12};
  
  document.querySelectorAll('table tr').forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) return;
    
    // Parse date - handle <br> between day name and date
    const dateHTML = cells[0].innerHTML.replace(/<br\s*\/?>/gi, ' ');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = dateHTML;
    const dateText = tempDiv.textContent.trim();
    const dateMatch = dateText.match(/(\w+day)?\s*(\w+)\s+(\d+)\s+(\d{4})/i);
    if (!dateMatch) return;
    
    const month = months[dateMatch[2]];
    if (!month) return;
    
    const day = parseInt(dateMatch[3]);
    const yr = parseInt(dateMatch[4]);
    const dateStr = `${yr}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    
    // Helper to extract balls from a cell
    const extractBalls = (cell, excludeBonus = false) => {
      const selector = excludeBonus ? 'li.ball:not(.bonus-ball)' : 'li.ball';
      return Array.from(cell.querySelectorAll(selector)).map(li => parseInt(li.textContent.trim())).filter(n => !isNaN(n));
    };
    
    // Helper to get bonus ball
    const extractBonus = (cell) => {
      const bonus = cell.querySelector('li.bonus-ball');
      return bonus ? parseInt(bonus.textContent.trim()) : null;
    };
    
    // Helper to extract digit sequence (for Encore, Quebec Extra, Atlantic Tag)
    const extractDigitSequence = (cell) => {
      const digits = cell.querySelectorAll('li.ball[class*="number-part"]');
      if (digits.length > 0) {
        return Array.from(digits).map(d => parseInt(d.textContent.trim()));
      }
      // Fallback: just get all balls
      return Array.from(cell.querySelectorAll('li.ball')).map(d => parseInt(d.textContent.trim()));
    };
    
    // ===== LOTTARIO: 3 win classes =====
    if (lotteryId === 'CA_LOTTARIO') {
      const mainNumbers = extractBalls(cells[1], true);
      const bonus = extractBonus(cells[1]);
      if (mainNumbers.length === 0) return;
      
      let earlyBird = [];
      if (cells.length > 2) earlyBird = extractBalls(cells[2]);
      
      let encore = [];
      if (cells.length > 3) encore = extractDigitSequence(cells[3]);
      
      results.push({
        date: dateStr,
        mainNumbers,
        bonus,
        earlyBird,
        encore
      });
    }
    // ===== BC49: 2 win classes (main+bonus, extra) =====
    else if (lotteryId === 'CA_BC49') {
      const mainNumbers = extractBalls(cells[1], true);
      const bonus = extractBonus(cells[1]);
      if (mainNumbers.length === 0) return;
      
      let extraNumbers = [];
      if (cells.length > 2) extraNumbers = extractBalls(cells[2]);
      
      results.push({
        date: dateStr,
        mainNumbers,
        bonus,
        extraNumbers
      });
    }
    // ===== QUEBEC 49: 2 win classes (main+bonus, extra digits) =====
    else if (lotteryId === 'CA_QUEBEC_49') {
      const mainNumbers = extractBalls(cells[1], true);
      const bonus = extractBonus(cells[1]);
      if (mainNumbers.length === 0) return;
      
      let extraNumbers = [];
      if (cells.length > 2) extraNumbers = extractDigitSequence(cells[2]);
      
      results.push({
        date: dateStr,
        mainNumbers,
        bonus,
        extraNumbers
      });
    }
    // ===== ATLANTIC 49: 2 win classes (main+bonus, tag digits) =====
    else if (lotteryId === 'CA_ATLANTIC_49') {
      const mainNumbers = extractBalls(cells[1], true);
      const bonus = extractBonus(cells[1]);
      if (mainNumbers.length === 0) return;
      
      // Cell 3 is Tag Numbers (6 digits) - skip cell 2 (Guaranteed Prize Draw)
      let tagNumbers = [];
      if (cells.length > 3) tagNumbers = extractDigitSequence(cells[3]);
      
      results.push({
        date: dateStr,
        mainNumbers,
        bonus,
        tagNumbers
      });
    }
    // ===== Other lotteries (original logic) =====
    else {
      const numbers = [];
      cells[1].querySelectorAll('ul li').forEach(li => {
        const num = parseInt(li.textContent.trim());
        if (!isNaN(num)) numbers.push(num);
      });
      
      if (numbers.length === 0) {
        const numMatches = cells[1].textContent.match(/\d+/g);
        if (numMatches) numMatches.forEach(n => numbers.push(parseInt(n)));
      }
      
      if (numbers.length === 0) return;
      
      const draw = { date: dateStr, numbers };
      
      // MaxMillions for Lotto Max
      const mmMatch = cells[1].textContent.match(/\+\s*(\d+)\s*MaxMillions/i);
      if (mmMatch) draw.maxMillions = parseInt(mmMatch[1]);
      
      // Raffle code (for some lotteries)
      if (cells.length > 2) {
        const codeMatch = cells[2].textContent.match(/([A-Z]\d{6,}-\d+)/i);
        if (codeMatch) draw.raffleCode = codeMatch[1];
      }
      
      results.push(draw);
    }
  });
  
  const output = { lotteryId, year, count: results.length, draws: results };
  const jsonStr = JSON.stringify(output);
  
  // Create textarea and auto-select for easy copy
  const ta = document.createElement('textarea');
  ta.value = jsonStr;
  ta.style.cssText = 'position:fixed;top:10px;left:10px;width:90%;height:300px;z-index:99999;font-size:12px;';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  
  alert(`✅ ${results.length} draws extracted and COPIED!\n\nLottery: ${lotteryId}\nYear: ${year}\n\nTextarea also shown on page - press Ctrl+C if needed.\n\nClose this alert and paste to Claude.`);
  
  // Remove textarea after 30 seconds
  setTimeout(() => ta.remove(), 30000);
  
  return output;
})();
