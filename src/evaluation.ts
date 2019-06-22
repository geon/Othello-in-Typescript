import {
	play,
	getBestMove,
	GetMoveFunction,
	randomArrayElement,
	coordToIndex,
} from "./othello";
import * as tf from "@tensorflow/tfjs-node";

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

	function makeGetMoveNeuralNet(model: tf.LayersModel): GetMoveFunction {
		return async (board, player, legalMoves) => {
			const scores = await (model.predict(
				tf.tensor([board.map(cell => cell * player)], [1, 64]),
			) as tf.Tensor).dataSync();

			let move = legalMoves[0];
			let score = -Infinity;
			for (const currentMove of legalMoves) {
				const index = coordToIndex(currentMove);
				const currentScore = scores[index];
				if (currentScore > score) {
					score = currentScore;
					move = currentMove;
				}
			}

			return move;
		};
	}

	const getMoveNeuralNet1Hidden = makeGetMoveNeuralNet(
		await tf.loadLayersModel("file://./models/1-hidden/model.json"),
	);

	const players = {
		getMoveMinimax2,
		getMoveRandom,
		getMoveNeuralNet1Hidden,
	};

	const winRate = await winRateOfA(
		players.getMoveNeuralNet1Hidden,
		players.getMoveRandom,
	);

	console.log("Winrate:", winRate);
}

main();
