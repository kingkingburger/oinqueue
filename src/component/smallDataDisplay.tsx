interface SmallDataDisplayProps {
	percentage: number;
}

export default function SmallDataDisplay({
	percentage,
}: SmallDataDisplayProps) {
	return (
		<div className="bg-limeGreen h-16 w-16 flex items-center justify-center rounded-md text-darkBackground font-bold text-sm">
			{percentage}%
		</div>
	);
}
