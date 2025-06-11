import * as fs from "node:fs/promises";
import path from "node:path";
import { getMatchInfo } from "@/lib/riotApi/getMatchInfo";
import { getMatchList } from "@/lib/riotApi/getMatchList";
import { getRiotSummonerInfo } from "@/lib/riotApi/getRiotSummonerInfo";
import type { MatchInfoResponse } from "@/lib/riotApi/type/matchInfoResponse";

// =============================================================================
// Types & Constants
// =============================================================================

/**
 * Raw match data structure for file storage
 * Uses arrays for JSON serialization compatibility
 */
interface MatchData {
	readonly matchIds: readonly string[];
	readonly matchInfos: readonly MatchInfoResponse[];
	readonly lastUpdated: string;
}

/**
 * In-memory cached match data structure
 * Uses Set for O(1) lookup performance on match ID checks
 */
interface CachedMatchData {
	readonly matchIds: ReadonlySet<string>;
	readonly matchInfos: readonly MatchInfoResponse[];
	readonly lastUpdated: string | null;
}

/**
 * Configuration for match data operations
 */
interface MatchDataConfig {
	readonly dataDir: string;
	readonly puuid: string;
	readonly requestCount: number;
}

/**
 * Result type for match data operations
 * Follows functional programming principles with explicit success/error states
 */
type Result<T, E = Error> =
	| { readonly success: true; readonly data: T }
	| { readonly success: false; readonly error: E };

// Data directory path - computed once at module level
const DATA_DIR = path.join(process.cwd(), "data");

// =============================================================================
// Pure Utility Functions
// =============================================================================

/**
 * Creates file path for storing match data
 * Pure function - same input always produces same output
 */
const createMatchDataFilePath = (puuid: string): string =>
	path.join(DATA_DIR, `${puuid}_match_data.json`);

/**
 * Transforms raw match data to cached format
 * Converts array to Set for efficient lookups
 */
const transformToCachedData = (rawData: MatchData): CachedMatchData => ({
	matchIds: new Set(rawData.matchIds),
	matchInfos: rawData.matchInfos,
	lastUpdated: rawData.lastUpdated,
});

/**
 * Creates empty cached data structure
 * Used as fallback when no existing data is found
 */
const createEmptyCachedData = (): CachedMatchData => ({
	matchIds: new Set(),
	matchInfos: [],
	lastUpdated: null,
});

/**
 * Sorts match infos by game creation time (newest first)
 * Pure function - doesn't mutate input array
 */
const sortMatchInfosByCreationTime = (
	matchInfos: readonly MatchInfoResponse[],
): readonly MatchInfoResponse[] =>
	[...matchInfos].sort((a, b) => b.info.gameCreation - a.info.gameCreation);

/**
 * Filters out already cached match IDs
 * Returns only new match IDs that need to be fetched
 */
const filterNewMatchIds = (
	allMatchIds: readonly string[],
	cachedMatchIds: ReadonlySet<string>,
): readonly string[] => allMatchIds.filter((id) => !cachedMatchIds.has(id));

/**
 * Merges new and existing match data
 * Combines arrays while maintaining immutability
 */
const mergeMatchData = (
	newMatchInfos: readonly MatchInfoResponse[],
	existingMatchInfos: readonly MatchInfoResponse[],
): readonly MatchInfoResponse[] => [...newMatchInfos, ...existingMatchInfos];

/**
 * Creates updated match IDs set
 * Combines new and existing match IDs
 */
const createUpdatedMatchIds = (
	newMatchIds: readonly string[],
	existingMatchIds: ReadonlySet<string>,
): ReadonlySet<string> => new Set([...newMatchIds, ...existingMatchIds]);

/**
 * Transforms cached data to storage format
 * Converts Set back to array for JSON serialization
 */
const transformToStorageData = (
	matchIds: ReadonlySet<string>,
	matchInfos: readonly MatchInfoResponse[],
): MatchData => ({
	matchIds: Array.from(matchIds),
	matchInfos: sortMatchInfosByCreationTime(matchInfos),
	lastUpdated: new Date().toISOString(),
});

// =============================================================================
// IO Operations (Side Effects Isolated)
// =============================================================================

/**
 * Ensures data directory exists
 * Side effect: Creates directory if it doesn't exist
 */
const ensureDataDirectory = async (): Promise<Result<void>> => {
	try {
		await fs.access(DATA_DIR);
		return { success: true, data: undefined };
	} catch {
		try {
			await fs.mkdir(DATA_DIR, { recursive: true });
			return { success: true, data: undefined };
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error
						: new Error("Failed to create directory"),
			};
		}
	}
};

/**
 * Reads match data from file system
 * Side effect: File system read operation
 */
const readMatchDataFromFile = async (
	filePath: string,
): Promise<Result<MatchData>> => {
	try {
		const fileContent = await fs.readFile(filePath, "utf8");
		const parsedData: MatchData = JSON.parse(fileContent);
		return { success: true, data: parsedData };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error : new Error("Failed to read match data"),
		};
	}
};

/**
 * Writes match data to file system
 * Side effect: File system write operation
 */
const writeMatchDataToFile = async (
	filePath: string,
	data: MatchData,
): Promise<Result<void>> => {
	try {
		await fs.writeFile(filePath, JSON.stringify(data, null, 2));
		return { success: true, data: undefined };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error
					: new Error("Failed to write match data"),
		};
	}
};

/**
 * Fetches multiple match infos concurrently
 * Side effect: API calls to Riot Games
 */
const fetchMatchInfosConcurrently = async (
	matchIds: readonly string[],
): Promise<Result<readonly MatchInfoResponse[]>> => {
	try {
		// Use Promise.all for concurrent execution
		// More efficient than sequential fetching
		const matchInfos = await Promise.all(
			matchIds.map((id) => getMatchInfo(id)),
		);
		return { success: true, data: matchInfos };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error
					: new Error("Failed to fetch match infos"),
		};
	}
};

// =============================================================================
// High-Level Operations (Composing Pure Functions with IO)
// =============================================================================

/**
 * Loads existing match data from storage
 * Combines IO operation with pure data transformation
 */
const loadExistingMatchData = async (
	puuid: string,
): Promise<CachedMatchData> => {
	// Ensure directory exists before attempting to read
	const dirResult = await ensureDataDirectory();
	if (!dirResult.success) {
		console.warn("Failed to ensure data directory:", dirResult.error.message);
		return createEmptyCachedData();
	}

	const filePath = createMatchDataFilePath(puuid);
	const fileResult = await readMatchDataFromFile(filePath);

	// Transform successful result or return empty data on failure
	return fileResult.success
		? transformToCachedData(fileResult.data)
		: createEmptyCachedData();
};

/**
 * Saves match data to storage
 * Combines pure data transformation with IO operation
 */
const saveMatchData = async (
	puuid: string,
	matchIds: ReadonlySet<string>,
	matchInfos: readonly MatchInfoResponse[],
): Promise<Result<void>> => {
	// Ensure directory exists before attempting to write
	const dirResult = await ensureDataDirectory();
	if (!dirResult.success) {
		return dirResult;
	}

	// Transform data to storage format (pure operation)
	const storageData = transformToStorageData(matchIds, matchInfos);

	// Write to file (side effect)
	const filePath = createMatchDataFilePath(puuid);
	return writeMatchDataToFile(filePath, storageData);
};

/**
 * Processes new match IDs by fetching their details
 * Handles the case where there are no new matches to fetch
 */
const processNewMatches = async (
	newMatchIds: readonly string[],
): Promise<Result<readonly MatchInfoResponse[]>> => {
	// Early return for empty array - avoid unnecessary API calls
	if (newMatchIds.length === 0) {
		return { success: true, data: [] };
	}

	return fetchMatchInfosConcurrently(newMatchIds);
};

/**
 * Updates match data with new information
 * Combines new data with existing data and saves to storage
 */
const updateMatchData = async (
	puuid: string,
	newMatchIds: readonly string[],
	newMatchInfos: readonly MatchInfoResponse[],
	existingData: CachedMatchData,
): Promise<Result<readonly MatchInfoResponse[]>> => {
	// Pure operations - merge data
	const updatedMatchInfos = mergeMatchData(
		newMatchInfos,
		existingData.matchInfos,
	);
	const updatedMatchIds = createUpdatedMatchIds(
		newMatchIds,
		existingData.matchIds,
	);

	// Side effect - save to storage
	const saveResult = await saveMatchData(
		puuid,
		updatedMatchIds,
		updatedMatchInfos,
	);

	if (!saveResult.success) {
		return saveResult;
	}

	return { success: true, data: updatedMatchInfos };
};

// =============================================================================
// Main Public API
// =============================================================================

/**
 * Retrieves cached match information with automatic updates
 *
 * This function implements a sophisticated caching strategy:
 * 1. Loads existing cached data from local storage
 * 2. Fetches the latest match list from Riot API
 * 3. Identifies new matches that aren't in cache
 * 4. Fetches details for new matches only (API efficiency)
 * 5. Merges new data with existing cache
 * 6. Saves updated cache for future use
 * 7. Returns complete match information
 *
 * @param mainGameName - Riot Games account name
 * @param mainTagName - Riot Games account tag
 * @param requestCount - Number of recent matches to consider (default: 50)
 * @returns Promise resolving to array of match information
 *
 * @example
 * ```typescript
 * const matches = await getCachedMatchInfos("SummonerName", "TAG", 20);
 * console.log(`Found ${matches.length} matches`);
 * ```
 */
export const getCachedMatchInfos = async (
	mainGameName: string,
	mainTagName: string,
	requestCount = 50,
): Promise<readonly MatchInfoResponse[]> => {
	try {
		// Step 1: Get player's PUUID (required for match API calls)
		const { puuid } = await getRiotSummonerInfo(mainGameName, mainTagName);

		// Step 2: Load existing cached data (pure function after IO)
		const existingData = await loadExistingMatchData(puuid);

		// Step 3: Fetch latest match IDs from Riot API
		const allMatchIds = await getMatchList({ puuid, count: requestCount });

		// Step 4: Identify new matches (pure function)
		const newMatchIds = filterNewMatchIds(allMatchIds, existingData.matchIds);

		// Step 5: Process new matches (fetch details if any exist)
		const newMatchInfosResult = await processNewMatches(newMatchIds);

		if (!newMatchInfosResult.success) {
			console.error(
				"Failed to fetch new match infos:",
				newMatchInfosResult.error.message,
			);
			// Return existing data on API failure
			return existingData.matchInfos;
		}

		const newMatchInfos = newMatchInfosResult.data;

		// Step 6: Update cache if we have new data
		if (newMatchIds.length > 0) {
			const updateResult = await updateMatchData(
				puuid,
				newMatchIds,
				newMatchInfos,
				existingData,
			);

			if (!updateResult.success) {
				console.error(
					"Failed to update match data:",
					updateResult.error.message,
				);
				// Continue with in-memory merge even if save failed
			}

			// Return updated data whether save succeeded or failed
			return updateResult.success
				? updateResult.data
				: mergeMatchData(newMatchInfos, existingData.matchInfos);
		}

		// Step 7: Return existing data if no new matches found
		return existingData.matchInfos;
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		console.error("Error in getCachedMatchInfos:", errorMessage);

		// Fallback: attempt to return any existing cached data
		try {
			const { puuid } = await getRiotSummonerInfo(mainGameName, mainTagName);
			const fallbackData = await loadExistingMatchData(puuid);
			return fallbackData.matchInfos;
		} catch {
			// Ultimate fallback: return empty array
			return [];
		}
	}
};
