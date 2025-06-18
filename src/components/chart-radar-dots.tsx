"use client";

import { TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	gradeToNumber,
	normalizeValue,
	percentToNumber,
} from "@/lib/indicator/calculateGrade";
import type { Metric } from "@/lib/indicator/metrics";
import type { ChartData } from "@/lib/indicator/types/radarCharData";

const chartData = [
	{ month: "January", desktop: 186 },
	{ month: "February", desktop: 305 },
	{ month: "March", desktop: 237 },
	{ month: "April", desktop: 273 },
	{ month: "May", desktop: 209 },
	{ month: "June", desktop: 214 },
];

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

interface ChartRadarDotsProps {
	groupMetrics: Metric[];
}

export function ChartRadarDots({ groupMetrics }: ChartRadarDotsProps) {
	// 주요 지표만 선별하여 차트 데이터 생성
	const getChartData = (): ChartData[] => {
		const keyMetrics: string[] = [
			"kda_ratio",
			"kill_count",
			"damage_share",
			"death_count",
			"avg_cs",
			"vision_score",
			"solo_kill",
			"team_damage",
			"gold_efficiency",
			"damage_rating",
		];

		return keyMetrics
			.map((key) => {
				const metric = groupMetrics.find((m) => m.key === key);
				if (!metric || typeof metric.value === "number") return null;

				let normalizedValue: number;

				// 등급 형태의 값 처리
				if (["team_damage", "gold_efficiency", "damage_rating"].includes(key)) {
					normalizedValue = gradeToNumber(metric.value);
				}
				// 백분율 형태의 값 처리
				else if (metric.value.includes("%")) {
					normalizedValue = percentToNumber(metric.value);
				}
				// 숫자 형태의 값 처리
				else {
					normalizedValue = normalizeValue(metric.value, key);
				}

				return {
					metric: metric.label,
					value: normalizedValue,
					originalValue: metric.value,
					note: metric.note,
				};
			})
			.filter((item): item is ChartData => item !== null);
	};

	const chartData = getChartData();
	const summonerName = groupMetrics[0]?.summonerName || "Player";
	const winRateMetric = groupMetrics.find((m) => m.key === "win_rate");
	const winRateNote = winRateMetric?.note || "";

	return (
		<Card>
			<CardHeader className="items-center">
				<CardTitle>{summonerName} 플레이어 경기 지표</CardTitle>
			</CardHeader>
			<CardContent className="pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-[400px]"
				>
					<RadarChart
						data={chartData}
						margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
					>
						<ChartTooltip
							cursor={false}
							content={({ active, payload }) => {
								if (active && payload && payload.length) {
									const data = payload[0].payload as ChartData;
									return (
										<div className="bg-white p-3 border rounded shadow-lg">
											<p className="font-semibold">{data.metric}</p>
											<p className="text-blue-600">
												점수: {data.value.toFixed(1)}/100
											</p>
											<p className="text-sm text-gray-600">
												실제값: {data.originalValue}
											</p>
											<p className="text-sm text-gray-500">{data.note}</p>
										</div>
									);
								}
								return null;
							}}
						/>
						<PolarAngleAxis
							dataKey="metric"
							tick={{ fontSize: 12 }}
							className="fill-gray-600"
						/>
						<PolarGrid gridType="polygon" />
						<Radar
							dataKey="value"
							stroke="#3b82f6"
							fill="#3b82f6"
							fillOpacity={0.3}
							strokeWidth={2}
							dot={{
								r: 4,
								fill: "#3b82f6",
								strokeWidth: 2,
								stroke: "#ffffff",
							}}
						/>
					</RadarChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col gap-2 text-sm">
				<div className="flex items-center gap-2 leading-none font-medium">
					{winRateNote || "경기 통계"} <TrendingUp className="h-4 w-4" />
				</div>
				<div className="text-muted-foreground flex items-center gap-2 leading-none">
					각 지표는 0-100 스케일로 정규화되어 표시됩니다
				</div>
			</CardFooter>
		</Card>
	);
}
