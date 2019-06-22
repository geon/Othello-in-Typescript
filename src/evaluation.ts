import {
	play,
	getBestMove,
	GetMoveFunction,
	randomArrayElement,
} from "./othello";

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
		const result = await play(async (board, player, legalMoves) => {
			const getMove = players[player];
			return getMove(board, player, legalMoves);
		});

		if (result.winner === 1) {
			++wins;
		}
	}

	return wins / numMatches;
}

async function main() {
	const getMoveRandom: GetMoveFunction = async (
		_board,
		_player,
		legalMoves,
	) => {
		return randomArrayElement(legalMoves);
	};

	const getMoveMinimax2: GetMoveFunction = async (
		board,
		player,
		legalMoves,
	) => {
		return getBestMove(board, player, legalMoves, 2);
	};

	const players = {
		getMoveMinimax2,
		getMoveRandom,
	};

	const winRate = await winRateOfA(
		players.getMoveMinimax2,
		players.getMoveRandom,
	);

	console.log("Winrate:", winRate);
}

main();
