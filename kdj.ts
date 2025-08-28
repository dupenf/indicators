interface OHLC {
    open:number;
    high: number;
    low: number;
    close: number;
    time: string;
}

/**
 * 计算 KDJ 指标
 * @param data OHLC 数据数组 [{high, low, close}, ...]
 * @param n RSV周期，默认 9
 * @param kPeriod K平滑参数，默认 3
 * @param dPeriod D平滑参数，默认 3
 * @returns KDJ 数组（与 data 等长，前期不足的部分返回 NaN）
 */
export default function calcKDJ(data: OHLC[], n: number = 9, kPeriod: number = 3, dPeriod: number = 3) {
    const k_ret: {time:string,value:number}[] = [];
    const d_ret: {time:string,value:number}[] = [];
    const j_ret: {time:string,value:number}[] = [];

    let kPrev = 50; // K 初始值
    let dPrev = 50; // D 初始值

    for (let i = 0; i < data.length; i++) {
        if (i < n - 1) {            
            continue;
        }

        const window = data.slice(i - n + 1, i + 1);
        const highN = Math.max(...window.map(d => d.high));
        const lowN = Math.min(...window.map(d => d.low));
        const close = data[i].close;

        const rsv = highN === lowN ? 0 : ((close - lowN) / (highN - lowN)) * 100;

        const k = (1 - 1 / kPeriod) * kPrev + (1 / kPeriod) * rsv;
        const d = (1 - 1 / dPeriod) * dPrev + (1 / dPeriod) * k;
        const j = 3 * k - 2 * d;

        const time  = data[i].time;
        k_ret.push({time,value:k});
        d_ret.push({time,value:d});
        j_ret.push({time,value:j});

        kPrev = k;
        dPrev = d;
    }

    return {k:k_ret,d:d_ret,j:j_ret};
}
