import TodayBarchart from "@/components/items/chart/today-barchart";
import TrendedLineChart from "@/components/items/chart/trend-linechart";
import ProgressBarChart from "@/components/items/chart/progress-barchart";
import WalkingBarChart from "@/components/items/chart/walking-barchart";
import ExerciseBarchart from "@/components/items/chart/exercise-barchart";
import ExerciseRadialBarchart from "@/components/items/chart/exercise-radialbarchart";
import EnergyBarchart from "@/components/items/chart/energy-barchart";
import TimeAreachart from "@/components/items/chart/time-areachart";

export default function Dashboard() {
    return (
        <div
            className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6
            {/*p-6 sm:flex-row sm:p-8*/}
            ">
            <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-[22rem] lg:grid-cols-1 xl:max-w-[25rem]">
                {/*<TodayBarchart/>
                <TrendedLineChart/>*/}
                <ProgressBarChart/>
                <WalkingBarChart/>
                <ExerciseBarchart/>
                <ExerciseRadialBarchart/>
                <EnergyBarchart/>
                <TimeAreachart/>
            </div>
        </div>
    )

}
