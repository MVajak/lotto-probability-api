// UK 49s Lottery Scraper v1
// Supports: UK_49S_LUNCHTIME, UK_49S_TEATIME
//
// Usage: Navigate to past-results page and run this script in browser console
// https://uk.lottonumbers.com/uk49s-lunchtime/past-results
// https://uk.lottonumbers.com/uk49s-teatime/past-results
//
(function() {
  var results = [];
  var pageUrl = window.location.href;
  
  var lotteryId = 'UNKNOWN';
  if (pageUrl.indexOf('/uk49s-lunchtime/') !== -1) lotteryId = 'UK_49S_LUNCHTIME';
  else if (pageUrl.indexOf('/uk49s-teatime/') !== -1) lotteryId = 'UK_49S_TEATIME';
  
  var months = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  
  var rows = document.querySelectorAll('table tr');
  rows.forEach(function(row) {
    var dateCell = row.querySelector('td.date-row');
    var ballsCell = row.querySelector('td.balls-row');
    if (!dateCell || !ballsCell) return;
    
    // Parse date like "Friday 16th January 2026"
    var dateText = dateCell.innerText.trim();
    var parts = dateText.split(' ');
    // parts = ["Friday", "16th", "January", "2026"]
    if (parts.length < 4) return;
    
    var day = parseInt(parts[1]); // "16th" -> 16
    var monthStr = parts[2];
    var year = parseInt(parts[3]);
    var month = months[monthStr];
    
    if (!month || !day || !year) return;
    
    var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    
    var ballList = ballsCell.querySelector('ul.balls');
    if (!ballList) return;
    
    var mainNumbers = [];
    var bonusBall = null;
    
    var allBalls = ballList.querySelectorAll('li.ball');
    allBalls.forEach(function(li) {
      var num = parseInt(li.textContent.trim());
      if (isNaN(num)) return;
      var cls = li.className;
      
      if (cls.indexOf('bonus-ball') !== -1) {
        bonusBall = num;
      } else {
        mainNumbers.push(num);
      }
    });
    
    if (mainNumbers.length === 0) return;
    
    var draw = { date: dateStr, mainNumbers: mainNumbers };
    
    if (bonusBall !== null) {
      draw.bonusBall = bonusBall;
    }
    
    results.push(draw);
  });
  
  var detectedYear = results.length > 0 ? results[0].date.substring(0, 4) : new Date().getFullYear().toString();
  
  var output = { lotteryId: lotteryId, year: detectedYear, count: results.length, draws: results };
  var jsonStr = JSON.stringify(output);
  
  var ta = document.createElement('textarea');
  ta.value = jsonStr;
  ta.style.cssText = 'position:fixed;top:10px;left:10px;width:90%;height:300px;z-index:99999;font-size:12px;';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  
  alert('Done! ' + results.length + ' draws extracted for ' + lotteryId);
  
  setTimeout(function() { ta.remove(); }, 30000);
  
  return output;
})();