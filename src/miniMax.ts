import { randomArrayElement } from "./fp";
import {
	Board,
	Player,
	Coord,
	move,
	getBestScore,
	getLegalMoves,
	getOpponent,
	heuristicScore,
} from "./othello";

export function getBestMove(
	board: Board,
	player: Player,
	// 0 = easy, 1 = normal, 3 = hard, 4 = very hard.
	legalMoves: ReadonlyArray<Coord>,
	smartness: number = 4,
): Coord {
	const scoredMoves = miniMax(board, player, legalMoves, smartness);

	let bestScore = -Infinity;
	let bestMoves = [legalMoves[0]];

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
	board: Board,
	player: Player,
	moveListPlayer: ReadonlyArray<Coord>,
	searchDepth: number,
): ReadonlyArray<{ readonly move: Coord; readonly score: number }> {
	// Try the moves and score them.
	return moveListPlayer.map((movePosition) => {
		const newBoard = move(movePosition, board, player);
		const score = evaluateBoard(newBoard, player, searchDepth);
		return {
			move: movePosition,
			score,
		};
	});
}

export function evaluateBoard(
	board: Board,
	player: Player,
	searchDepth: number,
): number {
	const moveListOpponent = getLegalMoves(board, getOpponent(player));

	if (searchDepth <= 1) {
		// The max depth is reached. Use simple heuristics.
		const moveListPlayer = getLegalMoves(board, player);
		return (
			heuristicScore(board, player) +
			(moveListPlayer ? moveListPlayer.length : 0) -
			(moveListOpponent ? moveListOpponent.length : 0)
		);
	}

	if (moveListOpponent) {
		// Switch player.
		return -getBestScore(
			miniMax(board, getOpponent(player), moveListOpponent, searchDepth - 1),
		);
	}

	{
		// The opponent has no legal moves, so don't switch player.
		const moveListPlayer = getLegalMoves(board, getOpponent(player));
		if (moveListPlayer) {
			// The player can move again.
			return getBestScore(
				miniMax(board, player, moveListPlayer, searchDepth - 1),
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
