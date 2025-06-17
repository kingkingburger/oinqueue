"use client";

import type React from "react";
import { useMemo } from "react";

interface Metric {
	key: string;
	summonerName: string;
	value: number | string;
	label: string;
	note?: string;
	highlight?: boolean;
}

interface Props {
	metrics: Metric[];
}

/**
 * PerformanceGrid
 *  - 각 소환사별로 Metric 을 그룹화하여 카드 형태로 표시합니다.
 *  - metric 이 많아져도 자동으로 래핑되는 CSS Grid( auto‑fill,minmax )를 사용합니다.
 *  - highlight 가 true 인 항목은 ring 과 shadow 로 강조합니다.
 */
export const PerformanceGrid: React.FC<Props> = ({ metrics }) => {
	// 소환사 이름 기준으로 Metric 배열을 그룹화 (메모이제이션으로 렌더 최적화)
	const groupedMap = useMemo(() => {
		return metrics.reduce<Map<string, Metric[]>>((map, metric) => {
			const summonerName = metric.summonerName;
			if (!map.has(summonerName)) {
				map.set(summonerName, []);
			}
			map.get(summonerName)?.push(metric);
			return map;
		}, new Map());
	}, [metrics]);

	return (
		<div className="flex flex-wrap gap-6 p-4 text-gray-800">
			{Array.from(groupedMap.entries()).map(([summonerName, groupMetrics]) => (
				<section
					key={summonerName}
					className="flex-grow basis-80 bg-white p-6 rounded-2xl shadow-md"
				>
					{/* 소환사 이름 */}
					<h2 className="text-center text-xl font-semibold mb-6">
						{summonerName}
					</h2>

					{/* 가변 폭 그리드: metric 개수가 늘어나도 자동 줄바꿈 */}
					<div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))]">
						{groupMetrics.map((m) => (
							<article
								key={m.key}
								className={`flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl ${
									m.highlight
										? "ring-2 ring-rose-400/60 shadow-lg"
										: "shadow-sm"
								}`}
							>
								<span className="text-lg font-bold">{m.value}</span>
								<span className="text-sm text-muted-foreground">{m.label}</span>
								{m.note && (
									<span className="text-xs text-muted-foreground mt-0.5">
										{m.note}
									</span>
								)}
							</article>
						))}
					</div>
				</section>
			))}
		</div>
	);
};
