export function convertToNumbers(numericStrings: string | null): number[] {
  if (!numericStrings || numericStrings.trim() === '') {
    return [];
  }

  return numericStrings.split(',').reduce<number[]>((acc, val) => {
    if (val.trim() === '') {
      return acc;
    }

    const num = Number(val);
    if (!isNaN(num)) {
      acc.push(num);
    }
    return acc;
  }, []);
}
