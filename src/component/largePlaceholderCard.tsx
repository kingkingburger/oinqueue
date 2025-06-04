import clsx from "clsx";

interface LargePlaceholderCardProps {
	className?: string;
}

export default function LargePlaceholderCard({
	className,
}: LargePlaceholderCardProps) {
	return (
		<div className={clsx("bg-gray-300 rounded-lg", className)}>
			{/* Content for the card goes here */}
		</div>
	);
}
