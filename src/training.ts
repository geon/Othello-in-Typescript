import { getModelRunner, makeGetMoveNeuralNet } from "./make-players";
import { getTfModel } from "./models-node";
import { models } from "./models";
import { play, Board, makeGameState, getPieceBalance } from "./othello";
import * as tf from "@tensorflow/tfjs-node";
import { getMirrorPermutations, invertBoard } from "./board-permutations";
import { miniMax } from "./miniMax";

export async function createTrainingDataBoards(
	model: tf.LayersModel,
): Promise<Board[]> {
	// Create a player to generate data from the same model being trained.
	const nnPlayer = makeGetMoveNeuralNet(model);

	const boards: Array<Board> = [];

	// Play a match, saving each move.
	const result = await play(async (gameState) => {
		const move = await nnPlayer(gameState);
		boards.push(gameState.board);
		return move;
	});

	// Also save the game-over state.
	boards.push(result.board);

	return boards;
}

function getBoardsFromBothPovs(boards: readonly Board[]) {
	return [boards, boards.map(invertBoard)].flat();
}

async function createTrainingDataScores(
	boards: readonly Board[],
	model: tf.LayersModel,
) {
	const scores = boards.map((board, i) => {
		if (!(i % 10)) {
			console.log(`scored boards: ${i}/${boards.length}`);
		}

		const gameState = makeGameState({
			board,
			player: 1,
		});

		const score =
			gameState.type === "game-over"
				? // If it is a known win or loss, use it.
					Math.sign(getPieceBalance(gameState))
				: // TODO: Revise the convention for depth. 2 = eval moves one level deep. Should be 1.
					miniMax(2, getModelRunner(model))(gameState);

		return score;
	});

	return scores;
}

type BoardScore = {
	readonly board: Board;
	readonly score: number;
};

async function getTrainingDataBoardScores(model: tf.LayersModel) {
	const boards = getBoardsFromBothPovs(await createTrainingDataBoards(model));
	const scores = await createTrainingDataScores(boards, model);

	return boards.flatMap((unMirroredBoard, index) => {
		const score = scores[index]!;
		const permutations = getMirrorPermutations(unMirroredBoard);
		return permutations.map(
			(board): BoardScore => ({
				board,
				score,
			}),
		);
	});
}

async function main() {
	const model = models._8_hidden;

	for (let count = 0; ; ++count) {
		console.log(`count: ${count}`);
		const tfModel = await getTfModel(model);

		const trainingData = await getTrainingDataBoardScores(tfModel);

		const data = tf.tensor(
			trainingData.map((boardAndScore) => boardAndScore.board),
			[trainingData.length, 64],
		);
		const labels = tf.tensor(
			trainingData.map((boardAndScore) => boardAndScore.score),
			[trainingData.length, 1],
		);

		const info = await tfModel.fit(data, labels, {
			epochs: Math.ceil(trainingData.length / 100),
			batchSize: trainingData.length,
		});

		const firstAccuracy = info.history.acc?.[0]! as number;
		const lastAccuracy = info.history.acc?.[
			info.history.acc?.length - 1
		]! as number;
		console.log("Accuracy", lastAccuracy, lastAccuracy - firstAccuracy);

		await tfModel.save(model.path);
	}
}

main();
