import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		/*
          15.3 이상에선 new URL(...) 형식을,
          그 전 버전에선 객체 형식을 쓸 수 있어요.
          둘 중 편한 걸 고르면 됩니다.
        */
		remotePatterns: [
			// (A) 최신 문법 – URL 인스턴스
			new URL("https://ddragon.leagueoflegends.com/cdn/**"),

			// (B) 호환 문법 – 객체
			// {
			//     protocol: 'https',
			//     hostname: 'ddragon.leagueoflegends.com',
			//     pathname: '/cdn/**',   // 버전 디렉터리가 바뀌어도 호환
			// },
		],
	},
};

export default nextConfig;
