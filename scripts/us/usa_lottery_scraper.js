// USA Lottery Scraper v1
// Supports: US_LOTTO_AMERICA, US_LUCKY_FOR_LIFE, US_CA_SUPERLOTTO, US_NY_LOTTO, US_TX_LOTTO
//
// Usage: Navigate to past-numbers page and run this script in browser console
//
(function() {
  var results = [];
  var pageUrl = window.location.href;
  
  var lotteryId = 'UNKNOWN';
  if (pageUrl.indexOf('/lotto-america/') !== -1) lotteryId = 'US_LOTTO_AMERICA';
  else if (pageUrl.indexOf('/lucky-for-life/') !== -1) lotteryId = 'US_LUCKY_FOR_LIFE';
  else if (pageUrl.indexOf('/california-superlotto/') !== -1) lotteryId = 'US_CA_SUPERLOTTO';
  else if (pageUrl.indexOf('/new-york-lotto/') !== -1) lotteryId = 'US_NY_LOTTO';
  else if (pageUrl.indexOf('/lotto-texas/') !== -1) lotteryId = 'US_TX_LOTTO';
  
  var months = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  
  var rows = document.querySelectorAll('table tr');
  rows.forEach(function(row) {
    var dateCell = row.querySelector('td.date-row');
    var ballsCell = row.querySelector('td.balls-row');
    if (!dateCell || !ballsCell) return;
    
    var dateText = dateCell.innerText.trim();
    var parts = dateText.split(' ');
    if (parts.length < 4) return;
    
    var monthStr = parts[1];
    var day = parseInt(parts[2]);
    var year = parseInt(parts[3]);
    var month = months[monthStr];
    
    if (!month || !day || !year) return;
    
    var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    
    var ballList = ballsCell.querySelector('ul.balls');
    if (!ballList) return;
    
    var mainNumbers = [];
    var starBall = null;
    var luckyBall = null;
    var megaBall = null;
    var bonusBall = null;
    
    var allBalls = ballList.querySelectorAll('li.ball');
    allBalls.forEach(function(li) {
      var num = parseInt(li.textContent.trim());
      if (isNaN(num)) return;
      var cls = li.className;
      
      if (cls.indexOf('star-ball') !== -1) {
        starBall = num;
      } else if (cls.indexOf('lucky-ball') !== -1) {
        luckyBall = num;
      } else if (cls.indexOf('mega-ball') !== -1) {
        megaBall = num;
      } else if (cls.indexOf('bonus-ball') !== -1) {
        bonusBall = num;
      } else if (cls.indexOf('all-star-bonus') === -1) {
        mainNumbers.push(num);
      }
    });
    
    if (mainNumbers.length === 0) return;
    
    var draw = { date: dateStr, mainNumbers: mainNumbers };
    
    if (lotteryId === 'US_LOTTO_AMERICA' && starBall !== null) {
      draw.starBall = starBall;
    } else if (lotteryId === 'US_LUCKY_FOR_LIFE' && luckyBall !== null) {
      draw.luckyBall = luckyBall;
    } else if (lotteryId === 'US_CA_SUPERLOTTO' && megaBall !== null) {
      draw.megaBall = megaBall;
    } else if (lotteryId === 'US_NY_LOTTO' && bonusBall !== null) {
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
