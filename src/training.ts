import { getModelRunner, makeGetMoveNeuralNet } from "./make-players";
import { getTfModel } from "./models-node";
import { models } from "./models";
import { play, Board, makeGameState, getPieceBalance } from "./othello";
import * as tf from "@tensorflow/tfjs-node";
import { readFileSync, writeFileSync } from "fs";
import { getMirrorPermutations, invertBoard } from "./board-permutations";
import { miniMax } from "./miniMax";

export async function* generateTrainingDataBoards(
	model: tf.LayersModel,
): AsyncIterableIterator<Board> {
	for (;;) {
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

		for (const board of boards) {
			yield board;
		}
	}
}

const batchSize = 1000000;
const trainingDataBoardsPath = "training-data-boards.json";
const trainingDataScoresPath = "training-data-scores.json";

function loadTrainingDataBoards() {
	try {
		const boards: readonly Board[] = JSON.parse(
			readFileSync(trainingDataBoardsPath, { encoding: "utf8" }),
		);
		return boards;
	} catch {
		return undefined;
	}
}

async function createTrainingDataBoards(model: tf.LayersModel) {
	const generator = generateTrainingDataBoards(model);

	// The boards are inversed and mirrored, yielding 16x the original amount.
	const numBoards = Math.floor(batchSize / 16);
	const boards: Board[] = [];
	for (let i = 0; i < numBoards; ++i) {
		if (!(i % 1000)) {
			console.log(`generated boards: ${i}/${numBoards}`);
		}

		const result = await generator.next();
		if (result.done) {
			throw new Error("Should never return.");
		}
		boards.push(result.value);
	}

	writeFileSync(
		trainingDataBoardsPath,
		`[\n${boards.map((sample) => JSON.stringify(sample)).join(",\n")}\n]\n`,
	);

	return boards;
}

async function getTrainingDataBoards(model: tf.LayersModel) {
	return loadTrainingDataBoards() ?? (await createTrainingDataBoards(model));
}

function loadTrainingDataScores() {
	try {
		const scores: readonly number[] = JSON.parse(
			readFileSync(trainingDataScoresPath, { encoding: "utf8" }),
		);
		return scores;
	} catch {
		return undefined;
	}
}

function getBoardsFromBothPovs(boards: readonly Board[]) {
	return [boards, boards.map(invertBoard)].flat();
}

async function createTrainingDataScores(
	boards: readonly Board[],
	model: tf.LayersModel,
) {
	const scores = boards.map((board, i) => {
		if (!(i % 1000)) {
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

	writeFileSync(trainingDataScoresPath, `[\n${scores.join(",\n")}\n]\n`);

	return scores;
}

async function getTrainingDataScores(
	boards: readonly Board[],
	model: tf.LayersModel,
) {
	return (
		loadTrainingDataScores() ?? (await createTrainingDataScores(boards, model))
	);
}

type BoardScore = {
	readonly board: Board;
	readonly score: number;
};

async function getTrainingDataBoardScores(model: tf.LayersModel) {
	const boards = getBoardsFromBothPovs(await getTrainingDataBoards(model));
	const scores = await getTrainingDataScores(boards, model);

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
		epochs: 1000,
		batchSize: trainingData.length,
	});

	const firstAccuracy = info.history.acc?.[0]! as number;
	const lastAccuracy = info.history.acc?.[
		info.history.acc?.length - 1
	]! as number;
	console.log("Accuracy", lastAccuracy, lastAccuracy - firstAccuracy);

	await tfModel.save(model.path);
}

main();
