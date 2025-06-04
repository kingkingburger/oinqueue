import clsx from "clsx";

interface DottedSeparator {
	className?: string;
	color?: string;
	height?: string;
	dotSize?: string;
	gapSize?: string;
	direction?: "horizontal" | "vertical";
}

export const DottedSeparator = ({
	className,
	color = "#d4d4d8",
	height = "2px",
	dotSize = "2px",
	gapSize = "6px",
	direction = "horizontal",
}: DottedSeparator) => {
	const isHorizontal = direction === "horizontal";

	return (
		<div
			className={clsx(
				isHorizontal
					? "w-full flex items-center"
					: "h-full flex flex-col items-center",
				className,
			)}
		>
			<div
				className={isHorizontal ? "flex-grow" : "flex-grow-0"}
				style={{
					width: isHorizontal ? "100%" : height,
					height: isHorizontal ? height : "100",
					backgroundImage: `radial-gradient(circle, ${color} 25%, transparent 25%)`,
					backgroundSize: isHorizontal
						? `${Number.parseInt(dotSize) + Number.parseInt(gapSize)}px ${height}`
						: `${height} ${Number.parseInt(dotSize) + Number.parseInt(gapSize)}px`,
					backgroundRepeat: isHorizontal ? "repeat-x" : "repeat-y",
					backgroundPosition: "center",
				}}
			/>
		</div>
	);
};
