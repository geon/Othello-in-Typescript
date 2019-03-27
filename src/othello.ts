export type Board = ReadonlyArray<number>;

// List-format:
//  Every list is a number[64] where the first element tells how long the list is.
//  For example, the first list generated will be: {4, 19, 29, 34, 44, ... }, where the rest of the list is irrelevant.

// Player-format & the heuristicScores-values:
//  The number's named player can only be 1 or -1. to switch player I use a unary minus.

// Offsets for the 8 directions. upp-left, upp, upp-right, ..., down-right. The order doesn't really matter.
const offSets = [-9, -8, -7, -1, 1, 7, 8, 9];

export function getLegalMoves(
	board: Board,
	player: number,
): number[] | undefined {
	// Loop through all squares to find legal moves and add them to the list.
	const legalMoves = [];
	for (let i = 0; i <= 63; i++) {
		if (moveIsLegal(i, board, player)) {
			legalMoves.push(i);
		}
	}

	if (!legalMoves.length) {
		return undefined;
	}

	return legalMoves;
}

export function moveIsLegal(
	position: number,
	board: Board,
	player: number,
): boolean {
	// We may only put pieces in empty squares.
	if (board[position]) {
		return false;
	}

	// Test every direction.
	for (const offSet of offSets) {
		if (!stepIsLegal(position, offSet)) {
			// Skip this direction if one may not step there.
			continue;
		}

		// Start steping one square from position.
		let currentPosition = position + offSet;
		let stepsMoved = 0;

		// Take a step in direction as long as it is legal (we may not step out of the board) and the pices belongs to opponent (-player).
		while (
			board[currentPosition] == -player &&
			stepIsLegal(currentPosition, offSet)
		) {
			// Step to the next square in direction.
			currentPosition += offSet;
			stepsMoved++;
		}

		if (stepsMoved > 0 && board[currentPosition] == player) {
			// We have found a comlete row.
			return true;
		}
	}

	// If no legal move is found in either direction, this move is illegal.
	return false;
}

function stepIsLegal(position: number, offSet: number): boolean {
	// Take care of left, ...
	if (position % 8 == 0 && (offSet == -9 || offSet == -1 || offSet == 7)) {
		return false;
	}
	// ... right, ...
	if (position % 8 == 7 && (offSet == -7 || offSet == 1 || offSet == 9)) {
		return false;
	}
	// ... upper, ...
	if (Math.floor(position / 8) == 0 && offSet < 0 && offSet != -1) {
		return false;
	}
	// ... and lower edge.
	if (Math.floor(position / 8) == 7 && offSet > 0 && offSet != 1) {
		return false;
	}

	// The step is not illegal, return true.
	return true;
}

export function getBestMove(
	board: Board,
	player: number,
	// 0 = easy, 1 = normal, 3 = hard, 4 = very hard.
	legalMoves: number[],
	smartness: number = 4,
): number {
	let score = -Infinity;
	let bestScore = -Infinity;
	let bestMove = legalMoves[0];

	for (const legalMove of legalMoves) {
		const newBoard = move(legalMove, board, player);

		const moveListOpponent = getLegalMoves(board, -player);
		if (!moveListOpponent) {
			throw new Error("Bug! The code does not handle this.");
		}
		score = -miniMax(newBoard, -player, moveListOpponent, smartness);

		if (score > bestScore) {
			bestScore = score;
			bestMove = legalMove;
		}
	}

	return bestMove;
}

// TODO: Return ReadonlyArray<{move: number, score: number}>. and remove getBestMove.
function miniMax(
	board: Board,
	player: number,
	moveListPlayer: number[],
	searchDepth: number,
): number {
	// Try the moves and return the best score.
	let bestScore = -Infinity;
	for (const movePosition of moveListPlayer) {
		const newBoard = move(movePosition, board, player);

		const moveListOpponent = getLegalMoves(board, -player);

		let score: number;
		if (searchDepth <= 1) {
			// The max depth is reached. Use simple heuristics.
			score =
				heuristicScore(newBoard, player) +
				moveListPlayer.length -
				(moveListOpponent ? moveListOpponent.length : 0);
		} else {
			if (moveListOpponent) {
				// Switch player.
				score = -miniMax(newBoard, -player, moveListOpponent, searchDepth - 1);
			} else {
				// The opponent has no legal moves, so don't switch player.
				const newMoveListPlayer = getLegalMoves(board, -player);
				if (newMoveListPlayer) {
					// The player can move again.
					score = miniMax(newBoard, player, newMoveListPlayer, searchDepth - 1);
				} else {
					// Noone can move. Game over.

					// Count the pieces.
					let playerCount = 0;
					let opponentCount = 0;
					for (const piece of board) {
						if (piece == player) {
							playerCount++;
						} else if (piece == -player) {
							opponentCount++;
						}
					}
					// Reward the winner.
					if (playerCount > opponentCount) {
						return Infinity;
					} else if (playerCount < opponentCount) {
						return -Infinity;
					} else {
						return 0;
					}
				}
			}
		}

		if (score > bestScore) {
			bestScore = score;
		}
	}

	return bestScore;
}

//  The heuristicScores-values describes how valuable the pieces on these positions are.
const heuristicScores = [
	...[8, -4, 6, 4, 4, 6, -4, 8],
	...[-4, -4, 0, 0, 0, 0, -4, -4],
	...[6, 0, 2, 2, 2, 2, 0, 6],
	...[4, 0, 2, 1, 1, 2, 0, 4],
	...[4, 0, 2, 1, 1, 2, 0, 4],
	...[6, 0, 2, 2, 2, 2, 0, 6],
	...[-4, -4, 0, 0, 0, 0, -4, -4],
	...[8, -4, 6, 4, 4, 6, -4, 8],
];

function heuristicScore(board: Board, player: number): number {
	let score = 0;

	// Reward the player if he has more (weighted) pieces than the opponent.
	for (let i = 0; i < 64; ++i) {
		score += heuristicScores[i] * player * board[i];
	}

	return score;
}

// Make shure you MAY move before you call this function.
export function move(position: number, board: Board, player: number): Board {
	const newBoard = [...board];
	newBoard[position] = player;

	for (const offSet of offSets) {
		// Skip this direction if one may not step there.
		if (!stepIsLegal(position, offSet)) {
			continue;
		}

		// Start steping one square from position.
		let currentPosition = position + offSet;

		let stepsMoved = 0;
		while (
			newBoard[currentPosition] == -player &&
			stepIsLegal(currentPosition, offSet)
		) {
			currentPosition += offSet;
			stepsMoved++;
		}

		// If we found a row:
		if (stepsMoved > 0 && newBoard[currentPosition] == player) {
			// Flip
			for (; stepsMoved > 0; stepsMoved--) {
				currentPosition -= offSet;
				newBoard[currentPosition] = player;
			}
		}
	}

	return newBoard;
}
