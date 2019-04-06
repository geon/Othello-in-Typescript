import {
	play,
	getBestMove,
	getLegalMoves,
	Board,
	Player,
	Coord,
} from "./othello";

export async function* generateTrainingData() {
	for (;;) {
		const steps: Array<{ board: Board; player: Player; move: Coord }> = [];

		// Play a match, saving each move.
		const result = await play(async (board, player, legalMoves) => {
			// const movePosition = randomArrayElement(legalMoves);
			const move = getBestMove(board, player, legalMoves, 2);
			steps.push({ board, player, move });
			return move;
		});

		// Ignore draws.
		if (result.winner === undefined) {
			continue;
		}

		for (const step of steps) {
			// TODO: Also rotate and flip the board to all 8 equivalent permutations.

			const legalMoves = getLegalMoves(step.board, step.player);
			if (!legalMoves) {
				throw new Error("Should never happen.");
			}

			// Only generate boards from player 1's POV.
			const normalizedBoard = step.board.map(cell => cell * step.player);

			// In retrospect, we know if this move led to a win or loss.
			const score = step.player === result.winner ? 1 : -1;
			yield { board: normalizedBoard, move: step.move, score };

			// Assume all other moves would have been better/worse.
			for (const move of legalMoves) {
				if (move !== step.move) {
					yield { board: normalizedBoard, move, score: -score };
				}
			}
		}
	}
}

// async function main() {
// 	const generator = generateTrainingData();

// 	for (let i = 0; i < 2; ++i) {
// 		const trainingData = await generator.next();
// 		console.log(trainingData.value.move, trainingData.value.score);
// 	}
// }

// main();
