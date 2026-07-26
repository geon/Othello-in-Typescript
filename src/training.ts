import { Coord } from "./coord";
import { miniMax } from "./miniMax";
import {
	play,
	GameStatePlaying,
	Cell,
	getBestMove,
	heuristicScore,
} from "./othello";

export async function* generateTrainingData() {
	for (;;) {
		const steps: Array<{
			readonly gameState: GameStatePlaying;
			readonly move: Coord;
		}> = [];

		// Play a match, saving each move.
		const result = await play(async (gameState) => {
			// const movePosition = randomArrayElement(legalMoves);
			const move = getBestMove(gameState, miniMax(2, heuristicScore));
			steps.push({ gameState, move });
			return move;
		});

		// Ignore draws.
		if (result.winner === undefined) {
			continue;
		}

		for (const step of steps) {
			// TODO: Also rotate and flip the board to all 8 equivalent permutations.

			// Only generate boards from player 1's POV.
			const normalizedBoard = step.gameState.board.map(
				(cell) => (cell * step.gameState.player) as Cell,
			);

			// In retrospect, we know if this move led to a win or loss.
			const score = step.gameState.player === result.winner ? 1 : -1;
			yield { board: normalizedBoard, move: step.move, score };

			// Assume all other moves would have been better/worse.
			for (const move of step.gameState.legalMoves) {
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
