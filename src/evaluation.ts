import { play, GetMoveFunction, heuristicScore, getBestMove } from "./othello";
import { miniMax } from "./miniMax";
import { randomArrayElement } from "./fp";

async function winRateOfA(
	a: GetMoveFunction,
	b: GetMoveFunction,
): Promise<number> {
	const players = {
		"1": a,
		"-1": b,
	};
	const numMatches = 1000;
	let wins = 0;
	for (let i = 0; i < numMatches; ++i) {
		if (!(i % 10)) {
			console.log(`matches played: ${i}/${numMatches}`);
		}

		const result = await play(async (gameState) => {
			const getMove = players[gameState.player];
			return getMove(gameState);
		});

		if (result.winner === 1) {
			++wins;
		}
	}

	return wins / numMatches;
}

async function main() {
	const getMoveRandom: GetMoveFunction = async (
		//
		gameState,
	) => {
		if (gameState.type !== "playing") {
			throw new Error("Missing legalMoves.");
		}

		return randomArrayElement(gameState.legalMoves);
	};

	const getMoveMinimax3: GetMoveFunction = async (
		//
		gameState,
	) => {
		return getBestMove(gameState, miniMax(3, heuristicScore));
	};

	const players = {
		getMoveMinimax3,
		getMoveRandom,
	};

	const winRate = await winRateOfA(
		players.getMoveMinimax3,
		players.getMoveRandom,
	);

	console.log("Winrate:", winRate);
}

main();
