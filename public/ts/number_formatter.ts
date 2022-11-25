export { formatNumberCompact };

const numFormatOptions: Intl.NumberFormatOptions = {
    maximumFractionDigits: 1,
}
const numFormatLookup = [
    [1, ''],
    [1e3, 'K'],
    [1e6, 'M'],
    [1e9, 'B'],
] as const;
const formatNumberCompact = (num: number): string =>
{
    const [val, suffix] =
        num < 1e3 ? numFormatLookup[0]
        : num < 1e6 ? numFormatLookup[1]
        : num < 1e9 ? numFormatLookup[2]
        : num < 1e12 ? numFormatLookup[3]
        : numFormatLookup[0];

    const baseNum = (num / val);

    return val === 1
        ? baseNum.toFixed(0)
        : baseNum.toLocaleString(undefined, numFormatOptions) + " " + suffix;
}
