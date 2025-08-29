// bollin.ts
/**
 * Bollinger Bands (布林带) for Candle[] input
 * 输入： Candle[]  { time: Time, open, high, low, close }
 * 输出： { upper, middle, lower }，每个都是 { time, value }[]，可直接用于 Lightweight Charts
 */

type Time = number | string; // 轻量图支持 timestamp 或 business day string

interface Candle {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
}


/**
 * 计算布林带
 * @param candles Candle[]，必须有 time 和 close
 * @param period 窗口期，默认20
 * @param stdDevMultiplier 标准差倍数，默认2
 */
export default function calculateBollingerSeries(
    candles: Candle[],
    period = 20,
    stdDevMultiplier = 2
): {upper:any[],middle:any[],lower:any[]} {
    const n = candles.length;
    const upper: any[] = [];
    const middle: any[] = [];
    const lower: any[] = [];

    if (n === 0) {
        return { upper, middle, lower };
    }

    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < n; i++) {
        const x = candles[i].close;
        sum += x;
        sumSq += x * x;

        if (i >= period) {
            // 移除窗口外数据
            const old = candles[i - period].close;
            sum -= old;
            sumSq -= old * old;
        }

        if (i >= period - 1) {
            const mean = sum / period;
            let variance = sumSq / period - mean * mean;
            if (variance < 0 && variance > -1e-12) variance = 0;
            const std = Math.sqrt(Math.max(0, variance));

            const upperVal = mean + stdDevMultiplier * std;
            const lowerVal = mean - stdDevMultiplier * std;

            upper.push({ time: candles[i].time, value: upperVal });
            middle.push({ time: candles[i].time, value: mean });
            lower.push({ time: candles[i].time, value: lowerVal });
        } else {
            // 前 period-1 数据点不完整，push null 占位（可选）
            // upper.push({ time: candles[i].time, value: 0 });
            // middle.push({ time: candles[i].time, value: 0 });
            // lower.push({ time: candles[i].time, value: 0 });
        }
    }

    return { upper, middle, lower };
}

/* -------------------------
   Example usage:

import { calculateBollingerSeries } from './bollin';

const candles = [
  { time: 1, open: 10, high: 12, low: 9, close: 11 },
  { time: 2, open: 11, high: 13, low: 10, close: 12 },
  ...
];

const bb = calculateBollingerSeries(candles, 20, 2);

// 在 Lightweight Charts 里直接用：
// chart.addLineSeries().setData(bb.upper)
// chart.addLineSeries().setData(bb.middle)
// chart.addLineSeries().setData(bb.lower)
------------------------- */
