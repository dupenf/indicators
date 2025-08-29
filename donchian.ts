/**
 * Donchian Channel (唐奇安通道) for Candle[] input
 *
 * 输入： Candle[] { time, open, high, low, close }
 * 输出： { upper, middle, lower }，每个都是 { time, value }[]，可直接用于 Lightweight Charts
 */
/**
 * 计算唐奇安通道
 * @param candles Candle[]，必须有 time, high, low
 * @param period 窗口期，默认20
 */
export default function calculateDonchianSeries(
    candles: { time: string, open: number, high: number, low: number, close: number }[],
    period = 20
): {upper:{time:string,value:number}[],middle:{time:string,value:number}[],lower:{time:string,value:number}[]} {
    const n = candles.length;
    const upper: {time:string,value:number}[] = [];
    const middle: {time:string,value:number}[] = [];
    const lower: {time:string,value:number}[] = [];

    if (n === 0) {
        return { upper, middle, lower };
    }

    for (let i = 0; i < n; i++) {
        if (i >= period - 1) {
            let highest = -Infinity;
            let lowest = Infinity;

            // 找最近 period 根K线的最高/最低
            for (let j = i - period + 1; j <= i; j++) {
                highest = Math.max(highest, candles[j].high);
                lowest = Math.min(lowest, candles[j].low);
            }

            const mid = (highest + lowest) / 2;

            upper.push({ time: candles[i].time, value: highest });
            middle.push({ time: candles[i].time, value: mid });
            lower.push({ time: candles[i].time, value: lowest });
        } else {
            // 不足 period 时，用 NaN 占位（可在绘图时过滤掉）
            // upper.push({ time: candles[i].time, value: NaN });
            // middle.push({ time: candles[i].time, value: NaN });
            // lower.push({ time: candles[i].time, value: NaN });
        }
    }

    return { upper, middle, lower };
}

/* -------------------------
   Example usage:

import { calculateDonchianSeries } from './donchian';

const candles = [
  { time: 1, open: 10, high: 12, low: 9, close: 11 },
  { time: 2, open: 11, high: 13, low: 10, close: 12 },
  ...
];

const dc = calculateDonchianSeries(candles, 20);

// 在 lightweight-charts 中直接用：
// chart.addLineSeries({ color: 'red' }).setData(dc.upper)
// chart.addLineSeries({ color: 'blue' }).setData(dc.middle)
// chart.addLineSeries({ color: 'green' }).setData(dc.lower)

------------------------- */
