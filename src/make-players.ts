import * as tf from "@tensorflow/tfjs";
import { checkedAccess } from "./checked-access";
import {
	doMove,
	getBestMove,
	GetMoveFunction,
	heuristicScore,
} from "./othello";
import { randomArrayElement } from "./fp";
import { miniMax } from "./miniMax";

export function makeGetMoveNeuralNet(model: tf.LayersModel): GetMoveFunction {
	return async (gameState) => {
		// tf.multinomial requires >1 elements.
		if (gameState.legalMoves.length === 1) {
			return checkedAccess(gameState.legalMoves, 0);
		}

		const gameStatesAfterMoves = gameState.legalMoves.map((legalMove) =>
			doMove(gameState, legalMove),
		);

		const legalMoveScores = gameStatesAfterMoves
			.map(({ board }) =>
				checkedAccess(
					(
						model.predict(
							tf.tensor(
								[board.map((cell) => cell * gameState.player)],
								[1, 64],
							),
						) as tf.Tensor
					).dataSync(),
					0,
				),
			)
			.map((score) => (isNaN(score) ? 0 : score));

		console.log(legalMoveScores);

		const temperature = 0.01;
		const index = checkedAccess(
			tf
				.multinomial(tf.tensor1d(legalMoveScores).div(temperature), 1)
				.dataSync(),
			0,
		);

		return checkedAccess(gameState.legalMoves, index);
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
