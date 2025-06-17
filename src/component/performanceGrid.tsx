import type React from "react";

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

export const PerformanceGrid: React.FC<Props> = ({ metrics }) => {
	const groupedMap = metrics.reduce<Map<string, Metric[]>>((map, m) => {
		const name = m.summonerName;
		if (!map.has(name)) {
			map.set(name, []);
		}
		map.get(name)?.push(m);
		return map;
	}, new Map());

	return (
		<div className="inline-flex p-4 text-gray-800">
			{Array.from(groupedMap.entries()).map(([summonerName, groupMetrics]) => (
				<div key={summonerName} className="bg-white p-6 rounded-2xl shadow-md">
					{/* 소환사 이름 */}
					<h2 className="text-center text-2xl font-semibold mb-4">
						{summonerName}
					</h2>

					{/* 항상 2열 그리드: 데스크탑도 모바일처럼 */}
					<div className="grid grid-cols-2 gap-4">
						{groupMetrics.map((m) => (
							<div
								key={m.key}
								className={`
                    flex flex-col items-center justify-center p-4
                    bg-gray-50 rounded-xl
                    ${
											m.highlight
												? "ring-2 ring-rose-400/60 shadow-lg"
												: "shadow-sm"
										}
                  `}
							>
								<span className="text-2xl font-bold">{m.value}</span>
								<span className="text-sm text-muted-foreground">{m.label}</span>
								{m.note && (
									<span className="text-xs text-muted-foreground mt-1">
										{m.note}
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
};
