import { Coord, coordToIndex } from "./coord";
import { makeGetMoveNeuralNet } from "./make-players";
import { getTfModel } from "./models-node";
import { models } from "./models";
import { play, GameStatePlaying, Cell } from "./othello";
import * as tf from "@tensorflow/tfjs-node";

export async function* generateTrainingData(
	model: tf.LayersModel,
): AsyncIterableIterator<{
	readonly board: ReadonlyArray<Cell>;
	readonly scores: ReadonlyArray<number>;
}> {
	for (;;) {
		// Create a player to generate data from the same model being trained.
		const nnPlayer = makeGetMoveNeuralNet(model);

		const steps: Array<{
			readonly gameState: GameStatePlaying;
			readonly move: Coord;
		}> = [];

		// Play a match, saving each move.
		const result = await play(async (gameState) => {
			// const movePosition = randomArrayElement(legalMoves);
			// const move = getBestMove(gameState, miniMax(2, heuristicScore));
			const move = await nnPlayer(gameState);
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
	const model = models._8_hidden;

	let tfModel = await getTfModel(model);

	const generator = generateTrainingData(tfModel);

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

		const info = await tfModel.fit(data, labels, {
			epochs: 100,
			batchSize,
		});

		console.log("Accuracy", info.history.acc);

		await tfModel.save(model.path);
	}
}

main();
