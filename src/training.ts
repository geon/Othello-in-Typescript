import { getModelRunner, makeGetMoveNeuralNet } from "./make-players";
import { getTfModel } from "./models-node";
import { models } from "./models";
import { play, Cell, makeGameState, GameState, Board, Player } from "./othello";
import * as tf from "@tensorflow/tfjs-node";
import { miniMax } from "./miniMax";

type BoardScore = {
	readonly board: Board;
	readonly score: number;
};

function normalizeBoardScore(
	boardScore: BoardScore,
	player: Player,
): BoardScore {
	// Only generate boards from player 1's POV.
	let normalizedBoard = boardScore.board.map((cell) => (cell * player) as Cell);
	return {
		board: normalizedBoard,
		score: boardScore.score * player,
	};
}

export async function* generateTrainingData(
	model: tf.LayersModel,
): AsyncIterableIterator<BoardScore> {
	for (;;) {
		// Create a player to generate data from the same model being trained.
		const nnPlayer = makeGetMoveNeuralNet(model);

		const steps: Array<GameState> = [];

		// Play a match, saving each move.
		const result = await play(async (gameState) => {
			const move = await nnPlayer(gameState);
			steps.push(gameState);
			return move;
		});

		// Also save the game-over state.
		steps.push(
			makeGameState({
				board: result.board,
				// In ties, players don't matter.
				player: result.winner ?? 1,
			}),
		);

		for (const step of steps) {
			// TODO: Also rotate and flip the board to all 8 equivalent permutations.

			const score =
				step.type === "game-over"
					? // If it is a known win or loss, use it.
						step.player * (result.winner ?? 0)
					: // TODO: Revise the convention for depth. 2 = eval moves one level deep. Should be 1.
						miniMax(2, getModelRunner(model))(step);

			yield normalizeBoardScore(
				{
					board: step.board,
					score,
				},
				step.player,
			);
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
			trainingData.map((boardAnsScore) => boardAnsScore.score),
			[batchSize, 1],
		);

		const info = await tfModel.fit(data, labels, {
			epochs: 100,
			batchSize,
		});

		const firstAccuracy = info.history.acc?.[0]! as number;
		const lastAccuracy = info.history.acc?.[
			info.history.acc?.length - 1
		]! as number;
		console.log(
			"Accuracy",
			lastAccuracy.toFixed(5),
			(lastAccuracy - firstAccuracy).toFixed(5),
		);

		await tfModel.save(model.path);
	}
}

main();
