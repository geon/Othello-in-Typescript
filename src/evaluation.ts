import { play, GetMoveFunction, heuristicScore, getBestMove } from "./othello";
import { miniMax } from "./miniMax";
import { randomArrayElement } from "./fp";
import * as tf from "@tensorflow/tfjs-node";
import { coordToIndex } from "./coord";
import { checkedAccess } from "./checked-access";

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
		const result = await play(async (gameState) => {
			const getMove = players[gameState.player];
			return getMove(gameState);
		});

		if (result.winner === 1) {
			++wins;
		}
	}

	return wins / numMatches;
}

async function main() {
	const getMoveRandom: GetMoveFunction = async (
		//
		gameState,
	) => {
		if (gameState.type !== "playing") {
			throw new Error("Missing legalMoves.");
		}

		return randomArrayElement(gameState.legalMoves);
	};

	const getMoveMinimax2: GetMoveFunction = async (
		//
		gameState,
	) => {
		return getBestMove(gameState, miniMax(2, heuristicScore));
	};

	function makeGetMoveNeuralNet(model: tf.LayersModel): GetMoveFunction {
		return async ({ board, player, legalMoves }) => {
			const scores = await (
				model.predict(
					tf.tensor([board.map((cell) => cell * player)], [1, 64]),
				) as tf.Tensor
			).dataSync();

			let move = checkedAccess(legalMoves, 0);
			let score = -Infinity;
			for (const currentMove of legalMoves) {
				const index = coordToIndex(currentMove);
				const currentScore = checkedAccess(scores, index);
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

	const getMoveNeuralNet8Hidden = makeGetMoveNeuralNet(
		await tf.loadLayersModel("file://./models/8-hidden/model.json"),
	);

	const players = {
		getMoveMinimax2,
		getMoveRandom,
		getMoveNeuralNet1Hidden,
		getMoveNeuralNet8Hidden,
	};

	const winRate = await winRateOfA(
		players.getMoveNeuralNet8Hidden,
		players.getMoveRandom,
	);

	console.log("Winrate:", winRate);
}

main();
