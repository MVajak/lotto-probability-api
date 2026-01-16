// Australian Lottery Scraper v1
// Supports: AU_POWERBALL, AU_SATURDAY_LOTTO, AU_OZ_LOTTO, AU_SET_FOR_LIFE, 
//           AU_WEEKDAY_WINDFALL, AU_CASH3, AU_SUPER66, AU_LOTTO_STRIKE
// 
// Page structure:
// - Main numbers in first <ul class="balls"> with <li class="ball ball ...">
// - Powerball in second <ul> with <li class="ball powerball ...">  
// - Supplementary balls in second <ul> with <li class="ball supplementary ...">
// - Bonus balls in second <ul> with <li class="ball bonus-ball ...">
// - Digit games (Cash 3, Super 66) have <li class="ball number-part-XX ...">
//
// Usage: Navigate to archive page (e.g., https://au.lottonumbers.com/powerball/results/2024-archive)
//        and run this script in browser console.
//
(function() {
  const results = [];
  const pageUrl = window.location.href;
  
  // Detect lottery type from URL
  let lotteryId = 'UNKNOWN';
  if (pageUrl.includes('/powerball/')) lotteryId = 'AU_POWERBALL';
  else if (pageUrl.includes('/saturday-lotto/')) lotteryId = 'AU_SATURDAY_LOTTO';
  else if (pageUrl.includes('/oz-lotto/')) lotteryId = 'AU_OZ_LOTTO';
  else if (pageUrl.includes('/set-for-life/')) lotteryId = 'AU_SET_FOR_LIFE';
  else if (pageUrl.includes('/weekday-windfall/')) lotteryId = 'AU_WEEKDAY_WINDFALL';
  else if (pageUrl.includes('/cash-3/')) lotteryId = 'AU_CASH3';
  else if (pageUrl.includes('/super66/')) lotteryId = 'AU_SUPER66';
  else if (pageUrl.includes('/lotto-strike/')) lotteryId = 'AU_LOTTO_STRIKE';
  
  // Extract year from URL
  const yearMatch = pageUrl.match(/(\d{4})-archive/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  
  // Month name to number mapping
  const months = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  
  // Newline character for splitting (avoid special char issues)
  const newlineChar = String.fromCharCode(10);
  
  // Process each table row
  document.querySelectorAll('table tr').forEach(row => {
    const dateCell = row.querySelector('td.date-row');
    const ballsCell = row.querySelector('td.balls-row');
    
    // Skip header rows or month separator rows
    if (!dateCell || !ballsCell) return;
    
    // Parse date from cell: "Draw 1,493\nThursday 26 December 2024"
    const dateText = dateCell.innerText;
    const lines = dateText.split(newlineChar);
    
    // Extract draw number from first line (e.g., "Draw 1,493")
    const drawLine = lines[0] || '';
    const drawParts = drawLine.replace(/,/g, '').split(' ');
    const drawNumber = drawParts.length >= 2 ? parseInt(drawParts[1]) : null;
    
    // Extract date from second line (e.g., "Thursday 26 December 2024")
    const dateLine = lines[1] || lines[0] || '';
    const dateParts = dateLine.trim().split(' ');
    
    // Handle formats: "Thursday 26 December 2024" or "26 December 2024"
    let day, monthName, yr;
    if (dateParts.length >= 4) {
      day = parseInt(dateParts[1]);
      monthName = dateParts[2];
      yr = parseInt(dateParts[3]);
    } else if (dateParts.length >= 3) {
      day = parseInt(dateParts[0]);
      monthName = dateParts[1];
      yr = parseInt(dateParts[2]);
    } else {
      return;
    }
    
    const month = months[monthName];
    if (!month || !day || !yr) return;
    
    const dateStr = yr + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    
    // Get all ball lists
    const ballLists = ballsCell.querySelectorAll('ul.balls');
    if (ballLists.length === 0) return;
    
    // Extract main numbers from first list
    const mainNumbers = [];
    ballLists[0].querySelectorAll('li.ball').forEach(li => {
      const num = parseInt(li.textContent.trim());
      if (!isNaN(num)) mainNumbers.push(num);
    });
    
    if (mainNumbers.length === 0) return;
    
    // Build result object based on lottery type
    const draw = { date: dateStr };
    if (drawNumber) draw.drawNumber = drawNumber;
    
    // ===== DIGIT GAMES (Cash 3, Super 66) - store as digits array =====
    if (lotteryId === 'AU_CASH3' || lotteryId === 'AU_SUPER66') {
      draw.digits = mainNumbers;
      results.push(draw);
      return;
    }
    
    // ===== LOTTO STRIKE - store as numbers (order matters) =====
    if (lotteryId === 'AU_LOTTO_STRIKE') {
      draw.numbers = mainNumbers;
      results.push(draw);
      return;
    }
    
    // ===== Other lotteries: mainNumbers + secondary balls =====
    draw.mainNumbers = mainNumbers;
    
    // Extract secondary numbers from second list (if present)
    if (ballLists.length > 1) {
      const secondList = ballLists[1];
      
      // Powerball
      const pbBall = secondList.querySelector('li.ball.powerball');
      if (pbBall) {
        draw.powerball = parseInt(pbBall.textContent.trim());
      }
      
      // Supplementary balls (Saturday Lotto, Oz Lotto, Weekday Windfall)
      const suppBalls = secondList.querySelectorAll('li.ball.supplementary');
      if (suppBalls.length > 0) {
        draw.supplementary = Array.from(suppBalls).map(li => parseInt(li.textContent.trim()));
      }
      
      // Bonus balls (Set for Life)
      const bonusBalls = secondList.querySelectorAll('li.ball.bonus-ball');
      if (bonusBalls.length > 0) {
        draw.bonusBalls = Array.from(bonusBalls).map(li => parseInt(li.textContent.trim()));
      }
    }
    
    results.push(draw);
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
  
  alert('✅ ' + results.length + ' draws extracted and COPIED!' + 
        '\n\nLottery: ' + lotteryId + 
        '\nYear: ' + year + 
        '\n\nTextarea also shown on page - press Ctrl+C if needed.' +
        '\n\nClose this alert and paste to Claude.');
  
  // Remove textarea after 30 seconds
  setTimeout(function() { ta.remove(); }, 30000);
  
  return output;
})();