// RSI (Relative Strength Index，相对强弱指标) 的计算方法是：

// rsi.ts
/**
 * RSI (Relative Strength Index) 指标
 *
 * 输出三条线：
 *  - rsi: 实际计算的 RSI 曲线
 *  - upper: 上轨线（默认70）
 *  - lower: 下轨线（默认30）
 */

// export type Time = number | string;

// export interface Candle {
//   time: Time;
//   open?: number;
//   high?: number;
//   low?: number;
//   close: number;
// }

// export interface LinePoint {
//   time: Time;
//   value: number;
// }

// export interface RSIResult {
//   rsi: LinePoint[];
//   upper: LinePoint[];
//   lower: LinePoint[];
// }

/**
 * 计算 RSI
 * @param candles 输入K线数组
 * @param period 窗口期（默认14）
 * @param upperLevel 上轨阈值（默认70）
 * @param lowerLevel 下轨阈值（默认30）
 */
export function calculateRSI(
  candles: {time:string,close:number,open:number,high:number,low:number}[],
  period = 14,
  upperLevel = 70,
  lowerLevel = 30
): {upper:{time:string,value:number}[],middle:{time:string,value:number}[],lower:{time:string,value:number}[]} {
  const n = candles.length;
  const upper: {time:string,value:number}[] = [];
  const middle: {time:string,value:number}[] = [];
  const lower: {time:string,value:number}[] = [];

  if (n === 0) return { upper, middle, lower };
  if (period <= 0) throw new Error("period must be > 0");

  let gains = 0;
  let losses = 0;

  // 初始化第一个 period
  for (let i = 1; i <= period && i < n; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff; // diff < 0
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // 前 period-1 个点没有 RSI
//   for (let i = 0; i < period; i++) {
//     upper.push({ time: candles[i].time, value: upperLevel });
//     lower.push({ time: candles[i].time, value: lowerLevel });
//   }

  // 第一个 RSI
  if (n >= period) {
    let rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    let rsiValue = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    middle.push({ time: candles[period].time, value: rsiValue });
    upper.push({ time: candles[period].time, value: upperLevel });
    lower.push({ time: candles[period].time, value: lowerLevel });
  }

  // 后续 RSI
  for (let i = period + 1; i < n; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    const rsiValue = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

    middle.push({ time: candles[i].time, value: rsiValue });
    upper.push({ time: candles[i].time, value: upperLevel });
    lower.push({ time: candles[i].time, value: lowerLevel });
  }

  return { upper, middle, lower };
}

/* -------------------------
   Example usage:

import { calculateRSI } from './rsi';

const candles = [
  { time: 1, close: 44 },
  { time: 2, close: 46 },
  { time: 3, close: 43 },
  ...
];

const { upper, middle, lower } = calculateRSI(candles, 14);

// 绘图：
// chart.addLineSeries({ color: 'purple' }).setData(rsi);
// chart.addLineSeries({ color: 'red' }).setData(upper);
// chart.addLineSeries({ color: 'green' }).setData(lower);

------------------------- */
