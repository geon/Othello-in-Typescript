import { randomArrayElement } from "./fp";
import {
	GameState,
	doMove,
	getBestScore,
	getLegalMoves,
	getOpponent,
	heuristicScore,
	makeGameState,
} from "./othello";
import { Coord } from "./coord";

export function getBestMove(
	gameState: GameState,
	// 0 = easy, 1 = normal, 3 = hard, 4 = very hard.
	smartness: number = 4,
): Coord {
	const scoredMoves = miniMax(gameState, smartness);

	if (!gameState.legalMoves) {
		throw new Error("Missing legalMoves.");
	}

	const firstLegalMove = gameState.legalMoves[0];
	if (!firstLegalMove) {
		throw new Error("Missing firstLegalMove.");
	}

	let bestScore = -Infinity;
	let bestMoves = [firstLegalMove];

	// Keep track of all moves sharing the highest score.
	for (const scoredMove of scoredMoves) {
		if (scoredMove.score > bestScore) {
			bestScore = scoredMove.score;
			bestMoves = [scoredMove.move];
		} else if (scoredMove.score === bestScore) {
			bestMoves.push(scoredMove.move);
		}
	}

	// Randomly pick one of the highest scoring moves.
	return randomArrayElement(bestMoves);
}

export function miniMax(
	gameState: GameState,
	searchDepth: number,
): ReadonlyArray<{ readonly move: Coord; readonly score: number }> {
	if (!gameState.legalMoves) {
		throw new Error("Missing legalMoves.");
	}

	// Try the moves and score them.
	return gameState.legalMoves.map((movePosition) => {
		const newGameState = doMove(gameState, movePosition);
		const score = evaluateBoard(newGameState, searchDepth);
		return {
			move: movePosition,
			score,
		};
	});
}

export function evaluateBoard(
	{ board, player: opponent }: GameState,
	searchDepth: number,
): number {
	const player = getOpponent(opponent);
	const moveListOpponent = getLegalMoves(board, opponent);

	if (searchDepth <= 1) {
		// The max depth is reached. Use simple heuristics.
		const moveListPlayer = getLegalMoves(board, player);
		return (
			heuristicScore(
				makeGameState({
					board,
					player,
				}),
			) +
			(moveListPlayer ? moveListPlayer.length : 0) -
			(moveListOpponent ? moveListOpponent.length : 0)
		);
	}

	if (moveListOpponent) {
		// Switch player.
		return -getBestScore(
			miniMax(
				{
					board,
					player: opponent,
					legalMoves: moveListOpponent,
				},
				searchDepth - 1,
			),
		);
	}

	{
		// The opponent has no legal moves, so don't switch player.
		const moveListPlayer = getLegalMoves(board, opponent);
		if (moveListPlayer) {
			// The player can move again.
			return getBestScore(
				miniMax(
					{
						board,
						player,
						legalMoves: moveListPlayer,
					},
					searchDepth - 1,
				),
			);
		}
	}

	// Noone can move. Game over.
	// Count the pieces.
	let playerCount = 0;
	let opponentCount = 0;
	for (const piece of board) {
		if (piece === player) {
			playerCount++;
		} else if (piece === -player) {
			opponentCount++;
		}
	}
	// Reward the winner.
	if (playerCount > opponentCount) {
		// TODO: Return a high score, plus the piece count, so the AI prioritizes the greatest win, not just any win.
		return Infinity;
	} else if (playerCount < opponentCount) {
		// TODO: Return a LOW score, MINUS the opportunity count, so the AI prioritizes the smartest move, in case the opponent makes a mistake.
		return -Infinity;
	} else {
		return 0;
	}
}
