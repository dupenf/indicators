/**
* MACD calculation in TypeScript
* 
* MACD = EMA(short) - EMA(long)
* Signal = EMA(MACD, signalPeriod)
* Histogram = MACD - Signal
*/

interface MacdOptions {
    short?: number;   // default 12
    long?: number;    // default 26
    signal?: number;  // default 9
}

// interface MacdPoint {
//     macd: number | null;
//     signal: number | null;
//     histogram: number | null;
//     emaShort?: number | null;
//     emaLong?: number | null;
// }

/** Compute simple moving average for the first 'period' items ending at index 'endIdx' (inclusive). */
function sma(window: readonly number[], endIdx: number, period: number): number {
    let sum = 0;
    const start = endIdx - period + 1;
    for (let i = start; i <= endIdx; i++) sum += window[i];
    return sum / period;
}

/** Compute EMA series with SMA seeding. Returns an array with nulls where not enough data. */
function emaSeries(values: readonly number[], period: number): (number | null)[] {
    const out: (number | null)[] = new Array(values.length).fill(null);
    const alpha = 2 / (period + 1);

    if (values.length < period) return out;

    // seed with SMA at index (period-1)
    const seedIdx = period - 1;
    let prev = sma(values, seedIdx, period);
    out[seedIdx] = prev;

    for (let i = seedIdx + 1; i < values.length; i++) {
        const v = values[i];
        prev = alpha * v + (1 - alpha) * prev;
        out[i] = prev;
    }
    return out;
}

/**
 * Calculate MACD for:
 *  - number[] directly, or
 *  - generic T[] with a selector getValue: (item: T) => number
 */
// function macd(values: number[], options?: MacdOptions): MacdPoint[];
// function macd<T>(
//     values: T[],
//     options: MacdOptions | undefined,
//     getValue: (item: T) => number
function macd<T>(
    values: (number | T)[],
    options: MacdOptions = {},
    getValue?: (item: T) => number
) {
    const shortP = options.short ?? 12;
    const longP = options.long ?? 26;
    const signalP = options.signal ?? 9;

    if (shortP <= 0 || longP <= 0 || signalP <= 0) {
        throw new Error("Periods must be positive integers.");
    }
    if (shortP >= longP) {
        throw new Error("short period should be less than long period (e.g., 12 < 26).");
    }

    // Normalize to number[]
    const nums: number[] = (getValue
        ? (values as T[]).map(getValue)
        : (values as number[])
    ).map((v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) throw new Error("Input contains non-finite number.");
        return n;
    });

    // EMA(short) & EMA(long)
    const emaS = emaSeries(nums, shortP);
    const emaL = emaSeries(nums, longP);

    // MACD line (null until both EMAs exist)
    const macdLine: (number | null)[] = nums.map((_, i) =>
        emaS[i] != null && emaL[i] != null ? (emaS[i]! - emaL[i]!) : null
    );

    // Signal line: EMA of MACD (only where MACD exists)
    // To compute EMA with SMA seeding properly on sparse start, we build a compact MACD array
    const firstMacdIdx = macdLine.findIndex((x) => x != null);
    const signalArr: (number | null)[] = new Array(nums.length).fill(null);

    if (firstMacdIdx !== -1) {
        // Build compact MACD values starting from firstMacdIdx
        const compact: number[] = macdLine.slice(firstMacdIdx).map((x) => x as number);

        const sigCompact = emaSeries(compact, signalP);

        // Map back to full length
        for (let k = 0; k < sigCompact.length; k++) {
            const idx = firstMacdIdx + k;
            signalArr[idx] = sigCompact[k];
        }
    }

    // Histogram
    const histogram: (number | null)[] = nums.map((_, i) =>
        macdLine[i] != null && signalArr[i] != null ? (macdLine[i]! - signalArr[i]!) : null
    );


    // Return as MacdPoint[]
    // return nums.map((_, i) => ({
    //     macd: macdLine[i],
    //     signal: signalArr[i],
    //     histogram: histogram[i],
    //     emaShort: emaS[i],
    //     emaLong: emaL[i],
    // }));
    return { macdLine, signalArr, histogram };
}

function macd_calc(frameData: { close: number[], time: string[] }, options: MacdOptions, colors: string[]) {
    const macdData: Array<{time: string, value: number, color: string}> = [];
    const signalData: Array<{time: string, value: number, color: string}> = [];
    const histogramData: Array<{time: string, value: number, color: string}> = [];
    
    const {macdLine,signalArr,histogram} = macd(frameData.close, options);
    
    frameData.close.forEach((_, i) => {
        if (macdLine[i] !== null && signalArr[i] !== null && histogram[i] !== null) {
            const time = frameData.time[i];
            macdData.push({ time, value: macdLine[i], color: colors[0] });
            signalData.push({ time, value: signalArr[i], color: colors[1] });
            histogramData.push({ 
                time, 
                value: histogram[i], 
                color: histogram[i] > 0 ? colors[2] : colors[3] 
            });
        }
    });
    
    return { macdData, signalData, histogramData };
}

export default macd_calc;