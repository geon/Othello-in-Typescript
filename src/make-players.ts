import * as tf from "@tensorflow/tfjs";
import { checkedAccess } from "./checked-access";
import {
	Cell,
	EvaluateBoard,
	getBestMove,
	GetMoveFunction,
	heuristicScore,
} from "./othello";
import { randomArrayElement } from "./fp";
import { miniMax } from "./miniMax";

export function getModelRunner(model: tf.LayersModel): EvaluateBoard {
	return (gameState) => {
		// The model only handles boards from the pl1 pov.
		const normalizedBoard = gameState.board.map(
			(cell) => (cell * gameState.player) as Cell,
		);

		return checkedAccess(
			(
				model.predict(tf.tensor([normalizedBoard], [1, 64])) as tf.Tensor
			).dataSync(),
			0,
		);
	};
}

export function makeGetMoveNeuralNet(model: tf.LayersModel): GetMoveFunction {
	return (gameState) =>
		Promise.resolve(getBestMove(gameState, getModelRunner(model)));
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
