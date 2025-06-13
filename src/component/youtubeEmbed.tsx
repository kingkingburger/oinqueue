// YouTube 컴포넌트 생성
interface YouTubeEmbedProps {
	videoId?: string;
	title?: string;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
	videoId,
	title,
}) => (
	<div className="">
		<iframe
			className="rounded-lg"
			src={`https://www.youtube.com/embed/${videoId}`}
			title={title}
			frameBorder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowFullScreen
		/>
	</div>
);
