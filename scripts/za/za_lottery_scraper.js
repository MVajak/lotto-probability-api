// South Africa Lottery Scraper v5
// Supports: ZA_DAILY_LOTTO, ZA_LOTTO, ZA_POWERBALL
//
// Usage: Navigate to results page for a year and run this script in browser console
// https://za.lottonumbers.com/daily-lotto/results/YEAR
// https://za.lottonumbers.com/lotto/results/YEAR
// https://za.lottonumbers.com/powerball/results/YEAR
//
// Output structure:
// {
//   draws: [
//     {
//       date: "2025-12-31",
//       results: [
//         { mainNumbers: [...], winClass: 1 },        // main draw
//         { mainNumbers: [...], winClass: 2 }         // plus draw
//       ]
//     }
//   ]
// }
//
// Note: winClass is null when only one result exists for that draw date.
//
(function() {
  var pageUrl = window.location.href;
  var lotteryType = 'UNKNOWN';
  
  if (pageUrl.indexOf('/daily-lotto/') !== -1) lotteryType = 'DAILY_LOTTO';
  else if (pageUrl.indexOf('/lotto/') !== -1) lotteryType = 'LOTTO';
  else if (pageUrl.indexOf('/powerball/') !== -1) lotteryType = 'POWERBALL';
  
  if (lotteryType === 'UNKNOWN') {
    alert('Unknown lottery type. Please navigate to a valid SA lottery results page.');
    return;
  }
  
  var months = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  
  var draws = [];
  
  // Select ALL table rows, not just those with winnerRow class
  var rows = document.querySelectorAll('table tbody tr');
  rows.forEach(function(row) {
    var dateCell = row.querySelector('td.date-row');
    var ballsCell = row.querySelector('td.balls-row');
    if (!dateCell || !ballsCell) return;
    
    var dateText = dateCell.innerText.trim();
    var parts = dateText.split(' ');
    if (parts.length < 3) return;
    
    var day = parseInt(parts[0]);
    var monthStr = parts[1];
    var year = parseInt(parts[2]);
    var month = months[monthStr];
    
    if (!month || !day || !year) return;
    
    var dateStr = year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    
    var draw = { date: dateStr, results: [] };
    
    if (lotteryType === 'DAILY_LOTTO') {
      var hasPlusDraw = ballsCell.querySelector('ul.balls.dl-plus') !== null;
      
      // Main Daily Lotto
      var mainList = ballsCell.querySelector('ul.balls:not(.dl-plus)');
      if (mainList) {
        var mainNumbers = [];
        mainList.querySelectorAll('li.ball').forEach(function(li) {
          var num = parseInt(li.textContent.trim());
          if (!isNaN(num)) mainNumbers.push(num);
        });
        if (mainNumbers.length > 0) {
          var result = { mainNumbers: mainNumbers };
          result.winClass = hasPlusDraw ? 1 : null;
          draw.results.push(result);
        }
      }
      
      // Daily Lotto Plus
      var plusList = ballsCell.querySelector('ul.balls.dl-plus');
      if (plusList) {
        var plusNumbers = [];
        plusList.querySelectorAll('li.ball').forEach(function(li) {
          var num = parseInt(li.textContent.trim());
          if (!isNaN(num)) plusNumbers.push(num);
        });
        if (plusNumbers.length > 0) {
          draw.results.push({ mainNumbers: plusNumbers, winClass: 2 });
        }
      }
    }
    else if (lotteryType === 'LOTTO') {
      var mainList = ballsCell.querySelector('ul.balls.lotto-main') || ballsCell.querySelector('ul.balls');
      if (mainList) {
        var mainNumbers = [], bonusBall = null;
        mainList.querySelectorAll('li.ball').forEach(function(li) {
          var num = parseInt(li.textContent.trim());
          if (isNaN(num)) return;
          if (li.className.indexOf('bonus-ball') !== -1) bonusBall = num;
          else mainNumbers.push(num);
        });
        if (mainNumbers.length > 0) {
          var result = { mainNumbers: mainNumbers, winClass: 1 };
          if (bonusBall !== null) result.bonusBall = bonusBall;
          draw.results.push(result);
        }
      }
      
      var plus1List = ballsCell.querySelector('ul.balls.plus-1');
      if (plus1List) {
        var nums = [], bonus = null;
        plus1List.querySelectorAll('li.ball').forEach(function(li) {
          var num = parseInt(li.textContent.trim());
          if (isNaN(num)) return;
          if (li.className.indexOf('bonus-ball') !== -1) bonus = num;
          else nums.push(num);
        });
        if (nums.length > 0) {
          var result = { mainNumbers: nums, winClass: 2 };
          if (bonus !== null) result.bonusBall = bonus;
          draw.results.push(result);
        }
      }
      
      var plus2List = ballsCell.querySelector('ul.balls.plus-2');
      if (plus2List) {
        var nums = [], bonus = null;
        plus2List.querySelectorAll('li.ball').forEach(function(li) {
          var num = parseInt(li.textContent.trim());
          if (isNaN(num)) return;
          if (li.className.indexOf('bonus-ball') !== -1) bonus = num;
          else nums.push(num);
        });
        if (nums.length > 0) {
          var result = { mainNumbers: nums, winClass: 3 };
          if (bonus !== null) result.bonusBall = bonus;
          draw.results.push(result);
        }
      }
    }
    else if (lotteryType === 'POWERBALL') {
      var allLists = ballsCell.querySelectorAll('ul.balls');
      allLists.forEach(function(list, index) {
        var isPbPlus = list.className.indexOf('pb-plus') !== -1;
        var numbers = [], powerball = null;
        list.querySelectorAll('li.ball').forEach(function(li) {
          var num = parseInt(li.textContent.trim());
          if (isNaN(num)) return;
          if (li.className.indexOf('powerball') !== -1) powerball = num;
          else numbers.push(num);
        });
        if (numbers.length === 0) return;
        var result = { mainNumbers: numbers };
        if (powerball !== null) result.powerball = powerball;
        if (isPbPlus) {
          result.winClass = 2;
        } else if (index === 0) {
          result.winClass = 1;
        }
        draw.results.push(result);
      });
    }
    
    if (draw.results.length > 0) {
      draws.push(draw);
    }
  });
  
  var detectedYear = draws.length > 0 ? draws[0].date.substring(0, 4) : new Date().getFullYear().toString();
  
  var lotteryId = 'ZA_' + lotteryType;
  var output = { lotteryId: lotteryId, year: detectedYear, count: draws.length, draws: draws };
  
  var totalResults = draws.reduce(function(sum, d) { return sum + d.results.length; }, 0);
  var alertMsg = lotteryId + ': ' + draws.length + ' draws, ' + totalResults + ' results';
  
  var jsonStr = JSON.stringify(output);
  
  var ta = document.createElement('textarea');
  ta.value = jsonStr;
  ta.style.cssText = 'position:fixed;top:10px;left:10px;width:90%;height:300px;z-index:99999;font-size:12px;';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  
  alert('Done! ' + alertMsg);
  
  setTimeout(function() { ta.remove(); }, 30000);
  
  return output;
})();