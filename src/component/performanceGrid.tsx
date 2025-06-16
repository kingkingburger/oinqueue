"use client";

import type { Metric } from "@/lib/metrics";

interface Props {
	metrics: Metric[];
}

export const PerformanceGrid: React.FC<Props> = ({ metrics }) => (
	<div className="grid grid-cols-5 gap-2">
		{metrics.map((m) => (
			<div
				key={m.key}
				className={`flex flex-col items-center justify-center p-4 ${
					m.highlight ? "ring-2 ring-rose-400/60 shadow-lg" : ""
				}`}
			>
				<div className="flex flex-col items-center space-y-1 p-0">
					<span className="text-2xl font-bold">{m.value}</span>
					<span className="text-sm text-muted-foreground">{m.label}</span>
					{m.note && (
						<span className="text-xs text-muted-foreground">{m.note}</span>
					)}
				</div>
			</div>
		))}
	</div>
);
