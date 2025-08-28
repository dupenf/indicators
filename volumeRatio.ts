export class VolumeRatioCalculator {
    /**
     * 计算日量比
     * 定义：当日成交总量 ÷ 过去N日平均成交总量
     */
    static dayRatio1(todayVolume: number, pastDaysVolumes: number[]): number {
        if (todayVolume < 0) return NaN;
        if (!Array.isArray(pastDaysVolumes) || pastDaysVolumes.length === 0) return NaN;

        const validVolumes = pastDaysVolumes.filter(v => v > 0);
        if (validVolumes.length === 0) return NaN;

        const avgVolume = validVolumes.reduce((a, b) => a + b, 0) / validVolumes.length;
        if (avgVolume === 0) return NaN;

        return todayVolume / avgVolume;
    }



    /**
     * 计算分钟量比（同一时刻累计量对比，推荐）
     * 定义：当日开市至当前分钟累计量 ÷ 过去N日在同一时刻的平均累计量
     */
    static minuteRatioSameTime(todayMinuteVols: number[], pastDaysMinuteVols: number[][]): number {
        if (!Array.isArray(todayMinuteVols) || todayMinuteVols.length === 0) return NaN;
        if (!Array.isArray(pastDaysMinuteVols) || pastDaysMinuteVols.length === 0) return NaN;

        const t = todayMinuteVols.length;
        const todayCum = todayMinuteVols.slice(0, t).reduce((a, b) => a + (b || 0), 0);

        let validDays = 0;
        let sumCumAtT = 0;

        for (const day of pastDaysMinuteVols) {
            if (Array.isArray(day) && day.length >= t) {
                const cum = day.slice(0, t).reduce((a, b) => a + (b || 0), 0);
                sumCumAtT += cum;
                validDays++;
            }
        }

        if (validDays === 0) return NaN;
        const avgCumAtT = sumCumAtT / validDays;
        if (avgCumAtT === 0) return NaN;

        return todayCum / avgCumAtT;
    }

    /**
     * 计算分钟量比（简化口径）
     * 定义：当日“开市至今的每分钟平均量” ÷ 过去N日“全日每分钟平均量”
     */
    static minuteRatioSimple(
        todayCumVolume: number,
        pastDaysTotalVolumes: number[],
        minutesElapsed: number,
        fullDayMinutes: number = 240
    ): number {
        if (!Array.isArray(pastDaysTotalVolumes) || pastDaysTotalVolumes.length === 0) return NaN;
        if (minutesElapsed <= 0 || fullDayMinutes <= 0) return NaN;

        const todayPerMin = todayCumVolume / minutesElapsed;
        const avgPerMinPast =
            (pastDaysTotalVolumes.reduce((a, b) => a + (b || 0), 0) / pastDaysTotalVolumes.length) /
            fullDayMinutes;

        if (avgPerMinPast === 0) return NaN;
        return todayPerMin / avgPerMinPast;
    }

    /**
     * 计算 A股从开盘到当前时刻的有效交易分钟数（排除午休）
     * 交易时间：9:30-11:30, 13:00-15:00
     */
    static elapsedTradingMinutesCN(dt: Date): number {
        const minutesOfDay: number = dt.getHours() * 60 + dt.getMinutes();

        const s1 = 9 * 60 + 30;  // 9:30
        const e1 = 11 * 60 + 30; // 11:30
        const s2 = 13 * 60;      // 13:00
        const e2 = 15 * 60;      // 15:00

        if (minutesOfDay < s1) return 0;
        if (minutesOfDay >= e2) return 240;

        let mins = 0;

        if (minutesOfDay <= e1) {
            mins += Math.max(0, minutesOfDay - s1);
            return mins;
        } else {
            mins += (e1 - s1); // 上午 120 分钟
        }

        if (minutesOfDay <= s2) return mins; // 午休
        if (minutesOfDay <= e2) {
            mins += Math.max(0, minutesOfDay - s2);
        } else {
            mins += (e2 - s2);
        }

        return Math.min(240, Math.max(0, mins));
    }
}

// /* ========== 使用示例 ========== */
// function testCalculator() {
//     // 日量比
//     const todayVol = 1.8e8;
//     const past5Days = [1.5e8, 2.0e8, 1.7e8, 1.6e8, 2.1e8];
//     console.log("日量比:", VolumeRatioCalculator.dayRatio(todayVol, past5Days).toFixed(2));

//     // 分钟量比（同一时刻）
//     const todayMinuteVols = [1000, 800, 900, 1200];
//     const day1 = new Array(240).fill(900);
//     const day2 = new Array(240).fill(850);
//     const day3 = new Array(240).fill(920);
//     console.log(
//         "分钟量比(同一时刻):",
//         VolumeRatioCalculator.minuteRatioSameTime(todayMinuteVols, [day1, day2, day3]).toFixed(2)
//     );

//     // 分钟量比（简化口径）
//     const now = new Date();
//     const mins = VolumeRatioCalculator.elapsedTradingMinutesCN(now);
//     const todayCum = 1.2e7;
//     const pastTotals = [2.3e7, 2.1e7, 2.5e7, 2.2e7, 2.4e7];
//     console.log(
//         "分钟量比(简化):",
//         VolumeRatioCalculator.minuteRatioSimple(todayCum, pastTotals, mins, 240).toFixed(2)
//     );
// }


export default function dayRatio(frameData: { volume: number[], time: string[] }, window: number): { time: string, value: number }[] {
    if (!Array.isArray(frameData.volume) || frameData.volume.length === 0 || window <= 0) {
        return [];
    }
    const ratios: { time: string, value: number }[] = [];
    for (let i = 0; i < frameData.volume.length; i++) {
        if (i < window) {
            ratios.push({ time: frameData.time[i], value: 0 }); // 前 window 天无法计算
            continue;
        }
        const past = frameData.volume.slice(i - window, i); // 过去N天
        const avg = past.reduce((a, b) => a + b, 0) / window;
        ratios.push({ time: frameData.time[i], value: avg === 0 ? 0 : frameData.volume[i] / avg });
    }
    // console.log("00000000000000000000000000000000000000000000000000000000",ratios);
    return ratios;
}