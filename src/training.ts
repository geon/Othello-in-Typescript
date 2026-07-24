import { Coord, coordToIndex } from "./coord";
import { miniMax } from "./miniMax";
import {
	play,
	GameStatePlaying,
	Cell,
	getBestMove,
	heuristicScore,
} from "./othello";
import * as tf from "@tensorflow/tfjs-node";

export async function* generateTrainingData(): AsyncIterableIterator<{
	board: ReadonlyArray<Cell>;
	scores: ReadonlyArray<number>;
}> {
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

			// Illegal moves are zeroed.
			const scores = normalizedBoard.map((_) => 0);
			for (const legalMove of step.gameState.legalMoves) {
				// Assume all other moves would have been better/worse.
				scores[coordToIndex(legalMove)] = -score;
			}
			scores[coordToIndex(step.move)] = score;
			yield { board: normalizedBoard, scores };
		}
	}
}

async function main() {
	const modelUri = "file://./models/1-hidden";

	let model: tf.LayersModel;
	try {
		model = await tf.loadLayersModel(modelUri);
	} catch (error) {
		model = tf.sequential({
			layers: [
				tf.layers.dense({ units: 64, activation: "tanh", inputShape: [64] }),
				tf.layers.dense({ units: 64, activation: "tanh" }),
				tf.layers.dense({ units: 64, activation: "tanh" }),
			],
		});

		model.compile({
			optimizer: "adam",
			loss: "meanSquaredError",
			metrics: ["accuracy"],
		});
	}

	const generator = generateTrainingData();

	const batchSize = 1000;
	for (;;) {
		const trainingData = [];
		for (let i = 0; i < batchSize; ++i) {
			const result = await generator.next();
			if (result.done) {
				throw new Error("Should never return.");
			}
			trainingData.push(result.value);
		}

		const data = tf.tensor(
			trainingData.map((boardAnsScore) => boardAnsScore.board),
			[batchSize, 64],
		);
		const labels = tf.tensor(
			trainingData.map((boardAnsScore) => boardAnsScore.scores),
			[batchSize, 64],
		);

		const info = await model.fit(data, labels, {
			epochs: 100,
			batchSize,
		});

		console.log("Accuracy", info.history.acc);

		await model.save(modelUri);
	}
}

main();
