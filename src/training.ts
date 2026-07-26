import { makeGetMoveNeuralNet } from "./make-players";
import { getTfModel } from "./models-node";
import { models } from "./models";
import {
	play,
	Cell,
	doMove,
	makeGameState,
	GameState,
	Board,
	Player,
} from "./othello";
import * as tf from "@tensorflow/tfjs-node";
import { checkedAccess } from "./checked-access";
import { sum } from "./fp";

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

			// If it is a known win or loss, use it.
			if (step.type === "game-over") {
				yield normalizeBoardScore(
					{
						board: step.board,
						score: result.winner ?? 0,
					},
					step.player,
				);
				continue;
			}

			const legalMoveScores = step.legalMoves
				.map((legalMove) => doMove(step, legalMove))
				.map(({ board }) =>
					checkedAccess(
						(
							model.predict(tf.tensor([board], [1, 64])) as tf.Tensor
						).dataSync(),
						0,
					),
				);

			const score = sum(legalMoveScores) / legalMoveScores.length;

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
