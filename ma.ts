 type MaType = 'sma' | 'ema' | 'wma';

 interface MaOptions {
    period: number;
    type?: MaType; // 默认 sma
}

//  interface MaPoint {
//     value: number | null;
// }

/** 简单移动平均 */
function sma(values: number[], period: number): (number | null)[] {
    const out: (number | null)[] = new Array(values.length).fill(null);
    let sum = 0;

    for (let i = 0; i < values.length; i++) {
        sum += values[i];
        if (i >= period) {
            sum -= values[i - period];
        }
        if (i >= period - 1) {
            out[i] = sum / period;
        }
    }
    return out;
}

/** 指数移动平均 */
function ema(values: number[], period: number): (number | null)[] {
    const out: (number | null)[] = new Array(values.length).fill(null);
    if (values.length < period) return out;

    const alpha = 2 / (period + 1);
    // 用 SMA 初始化第一个有效值
    let prev = 0;
    for (let i = 0; i < period; i++) prev += values[i];
    prev /= period;
    out[period - 1] = prev;

    for (let i = period; i < values.length; i++) {
        prev = alpha * values[i] + (1 - alpha) * prev;
        out[i] = prev;
    }
    return out;
}

/** 加权移动平均 */
function wma(values: number[], period: number): (number | null)[] {
    const out: (number | null)[] = new Array(values.length).fill(null);
    const denominator = (period * (period + 1)) / 2;

    for (let i = period - 1; i < values.length; i++) {
        let numerator = 0;
        for (let j = 0; j < period; j++) {
            numerator += values[i - j] * (period - j);
        }
        out[i] = numerator / denominator;
    }
    return out;
}

/**
 * 通用 MA 计算函数
 * @param values 数组 (number[] 或对象数组)
 * @param options { period, type }
 * @param getValue 提取函数 (如果传入对象数组)
 */

// function ma(values: number[], options: MaOptions): MaPoint[];
// function ma<T>(
//     values: T[],
//     options: MaOptions,
//     getValue: (item: T) => number
// ): MaPoint[];

function ma<T>(
    // time:string[],
    values: (number | T)[],
    options: MaOptions,
    getValue?: (item: T) => number
) {
    const { period, type = 'sma' } = options;
    if (period <= 0) throw new Error('MA period must be positive.');

    const nums: number[] = (getValue
        ? (values as T[]).map(getValue)
        : (values as number[])
    ).map(v => {
        const n = Number(v);
        if (!Number.isFinite(n)) throw new Error('Invalid number in data.');
        return n;
    });

    let result: (number | null)[];
    switch (type) {
        case 'ema':
            result = ema(nums, period);
            break;
        case 'wma':
            result = wma(nums, period);
            break;
        case 'sma':
        default:
            result = sma(nums, period);
            break;
    }
    return result;
    // return result.map(v => ({ value: v }));
}


function ma_calc(frameData: { close: number[], time: string[] }, period: number, type: MaType = 'sma') {
    const options: MaOptions = {period,type};
    const d = ma(frameData["close"], options);    
    const result:any[] = [];
    if(d.length === frameData.close.length ){
        d.map((v,i)=>{
            if( v !== null ){
                result.push({time:frameData["time"][i], value:v});
            }
        });
        return result;  
    }
    return [];
}

export default ma_calc;