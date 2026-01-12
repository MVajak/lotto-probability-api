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
        // Remap to: dm_2pm, dmp_2pm, dm_9pm, dmp_9pm
        results.push({
          date: currentDate,
          dm_2pm: currentSets[0],   // Daily Million 2pm
          dmp_2pm: currentSets[2],  // Daily Million Plus 2pm
          dm_9pm: currentSets[1],   // Daily Million 9pm
          dmp_9pm: currentSets[3]   // Daily Million Plus 9pm
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