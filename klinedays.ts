

function calcKlineDays(open: number[], high: number[], low: number[], close: number[], time: string[], window: number): { time: string, open: number, high: number, low: number, close: number }[] {
    if (!Array.isArray(open) || !Array.isArray(high) || !Array.isArray(low) || !Array.isArray(close) || !Array.isArray(time) || window <= 0) {
        return [];
    }
    const result: { time: string, open: number, high: number, low: number, close: number }[] = [];
    let t_open = 0;
    let t_high = 0;
    let t_low = 99999;
    let t_close = 0;
    let start = 0;
    for (let i = window - 1; i < open.length; i++) {
        if (start === 0) {
            t_close = close[i];
        }
        start = start + 1;
        t_open = open[i];
        t_high = Math.max(t_high, high[i]);
        t_low = Math.min(t_low, low[i]);

        if (start === window) {
            start = 0;
            t_open = 0;
            t_high = 0;
            t_low = 99999;
            t_close = 0;
            result.push({
                time: time[i],
                open: t_open,
                high: t_high,
                low: t_low,
                close: t_close
            });
        }
    }
    return result;
}

export default calcKlineDays;
