import * as tf from "@tensorflow/tfjs";
import { checkedAccess } from "./checked-access";
import { getBestMove, GetMoveFunction, heuristicScore } from "./othello";
import { coordToIndex } from "./coord";
import { randomArrayElement } from "./fp";
import { miniMax } from "./miniMax";

export function makeGetMoveNeuralNet(model: tf.LayersModel): GetMoveFunction {
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

export const getMoveRandom: GetMoveFunction = async ({ legalMoves }) => {
	return randomArrayElement(legalMoves);
};

export const getMoveMinimax1: GetMoveFunction = async (gameState) => {
	return getBestMove(gameState, miniMax(1, heuristicScore));
};

export const getMoveMinimax2: GetMoveFunction = async (gameState) => {
	return getBestMove(gameState, miniMax(2, heuristicScore));
};

export const getMoveMinimax3: GetMoveFunction = async (gameState) => {
	return getBestMove(gameState, miniMax(3, heuristicScore));
};
