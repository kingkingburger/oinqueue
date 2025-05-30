export default function IssueBar() {
	return (
		<div className="w-full bg-red-600 text-white p-3 flex items-center justify-between text-sm fixed bottom-0 left-0 right-0">
			<div className="flex items-center">
				{/* <ExclamationTriangleIcon className="h-5 w-5 mr-2" /> */}{" "}
				{/* 아이콘 예시 */}
				<span className="font-semibold mr-2">1 Issue</span>
				<span>Fix it to continue</span>{" "}
				{/* "Fix it to continue" or similar text */}
			</div>
			<button className="p-1 rounded-full hover:bg-red-700">
				{/*<XMarkIcon className="h-4 w-4" /> /!* XMarkIcon for close *!/*/}
			</button>
		</div>
	);
}

// Note: If you use @heroicons/react, install it:
// npm install @heroicons/react
// or yarn add @heroicons/react
