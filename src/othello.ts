export type Player = -1 | 1;
export type Cell = Player | 0;
export type Board = ReadonlyArray<Cell>;

export interface Coord {
	readonly x: number;
	readonly y: number;
}

export function indexToCoord(index: number): Coord {
	return { x: index % 8, y: Math.floor(index / 8) };
}

export function coordToIndex(coord: Coord): number {
	return coord.x + coord.y * 8;
}

function addCoord(a: Coord, b: Coord): Coord {
	return { x: a.x + b.x, y: a.y + b.y };
}

function subCoord(a: Coord, b: Coord): Coord {
	return { x: a.x - b.x, y: a.y - b.y };
}

export function coordsAreEqual(a: Coord, b: Coord): boolean {
	return a.x === b.x && a.y === b.y;
}

// List-format:
//  Every list is a number[64] where the first element tells how long the list is.
//  For example, the first list generated will be: {4, 19, 29, 34, 44, ... }, where the rest of the list is irrelevant.

// Player-format & the heuristicScores-values:
//  The number's named player can only be 1 or -1. to switch player I use a unary minus.

// Offsets for the 8 directions. upp-left, upp, upp-right, ..., down-right. The order doesn't really matter.
const offSets: ReadonlyArray<Coord> = [
	{ x: -1, y: -1 },
	{ x: 0, y: -1 },
	{ x: 1, y: -1 },
	{ x: -1, y: 0 },
	{ x: 1, y: 0 },
	{ x: -1, y: 1 },
	{ x: 0, y: 1 },
	{ x: 1, y: 1 },
];

export function getLegalMoves(
	board: Board,
	player: Player,
): ReadonlyArray<Coord> | undefined {
	// Loop through all squares to find legal moves and add them to the list.
	const legalMoves = [];
	for (let i = 0; i <= 63; i++) {
		const position = indexToCoord(i);
		if (moveIsLegal(position, board, player)) {
			legalMoves.push(position);
		}
	}

	if (!legalMoves.length) {
		return undefined;
	}

	return legalMoves;
}

export function moveIsLegal(
	position: Coord,
	board: Board,
	player: Player,
): boolean {
	// We may only put pieces in empty squares.
	if (board[coordToIndex(position)]) {
		return false;
	}

	// Test every direction.
	for (const offSet of offSets) {
		if (!stepIsLegal(position, offSet)) {
			// Skip this direction if one may not step there.
			continue;
		}

		// Start steping one square from position.
		let currentPosition = addCoord(position, offSet);
		let stepsMoved = 0;

		// Take a step in direction as long as it is legal (we may not step out of the board) and the pices belongs to opponent (-player).
		while (
			board[coordToIndex(currentPosition)] == -player &&
			stepIsLegal(currentPosition, offSet)
		) {
			// Step to the next square in direction.
			currentPosition = addCoord(currentPosition, offSet);
			stepsMoved++;
		}

		if (stepsMoved > 0 && board[coordToIndex(currentPosition)] == player) {
			// We have found a comlete row.
			return true;
		}
	}

	// If no legal move is found in either direction, this move is illegal.
	return false;
}

function stepIsLegal(position: Coord, offSet: Coord): boolean {
	// Take care of left, ...
	if (position.x === 0 && offSet.x === -1) {
		return false;
	}
	// ... right, ...
	if (position.x === 7 && offSet.x === 1) {
		return false;
	}
	// ... upper, ...
	if (position.y === 0 && offSet.y === -1) {
		return false;
	}
	// ... and lower edge.
	if (position.y === 7 && offSet.y === 1) {
		return false;
	}

	// The step is not illegal, return true.
	return true;
}

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
		} else if (scoredMove.score == bestScore) {
			bestMoves.push(scoredMove.move);
		}
	}

	// Randomly pick one of the highest scoring moves.
	return randomArrayElement(bestMoves);
}

export function randomArrayElement<T>(array: ReadonlyArray<T>): T {
	if (!array.length) {
		throw new Error("Can't pick an element from an empty array.");
	}
	return array[Math.floor(Math.random() * array.length)];
}

function miniMax(
	board: Board,
	player: Player,
	moveListPlayer: ReadonlyArray<Coord>,
	searchDepth: number,
): ReadonlyArray<{ readonly move: Coord; readonly score: number }> {
	// Try the moves and score them.
	return moveListPlayer.map(movePosition => {
		const newBoard = move(movePosition, board, player);
		const score = evaluateBoard(newBoard, player, searchDepth);
		return {
			move: movePosition,
			score,
		};
	});
}

function getOpponent(player: Player): Player {
	return -player as Player;
}

function evaluateBoard(
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

	// The opponent has no legal moves, so don't switch player.
	const moveListPlayer = getLegalMoves(board, getOpponent(player));
	if (moveListPlayer) {
		// The player can move again.
		return getBestScore(
			miniMax(board, player, moveListPlayer, searchDepth - 1),
		);
	}

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
		// TODO: Return a high score, plus the piece count, so the AI prioritizes the greatest win, not just any win.
		return Infinity;
	} else if (playerCount < opponentCount) {
		// TODO: Return a LOW score, MINUS the opportunity count, so the AI prioritizes the smartest move, in case the opponent makes a mistake.
		return -Infinity;
	} else {
		return 0;
	}
}

function getBestScore(
	scoredMoves: ReadonlyArray<{ readonly move: Coord; readonly score: number }>,
): number {
	return Math.max(...scoredMoves.map(scoredMove => scoredMove.score));
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

function heuristicScore(board: Board, player: Player): number {
	let score = 0;

	// Reward the player if he has more (weighted) pieces than the opponent.
	for (let i = 0; i < 64; ++i) {
		score += heuristicScores[i] * player * board[i];
	}

	return score;
}

// Make shure you MAY move before you call this function.
export function move(position: Coord, board: Board, player: Player): Board {
	const newBoard = [...board];
	newBoard[coordToIndex(position)] = player;

	for (const offSet of offSets) {
		// Skip this direction if one may not step there.
		if (!stepIsLegal(position, offSet)) {
			continue;
		}

		// Start steping one square from position.
		let currentPosition = addCoord(position, offSet);

		let stepsMoved = 0;
		while (
			newBoard[coordToIndex(currentPosition)] == -player &&
			stepIsLegal(currentPosition, offSet)
		) {
			currentPosition = addCoord(currentPosition, offSet);
			stepsMoved++;
		}

		// If we found a row:
		if (stepsMoved > 0 && newBoard[coordToIndex(currentPosition)] == player) {
			// Flip
			for (; stepsMoved > 0; stepsMoved--) {
				currentPosition = subCoord(currentPosition, offSet);
				newBoard[coordToIndex(currentPosition)] = player;
			}
		}
	}

	return newBoard;
}

export const startBoard: Board = [
	...[0, 0, 0, 0, 0, 0, 0, 0],
	...[0, 0, 0, 0, 0, 0, 0, 0],
	...[0, 0, 0, 0, 0, 0, 0, 0],
	...[0, 0, 0, -1, 1, 0, 0, 0],
	...[0, 0, 0, 1, -1, 0, 0, 0],
	...[0, 0, 0, 0, 0, 0, 0, 0],
	...[0, 0, 0, 0, 0, 0, 0, 0],
	...[0, 0, 0, 0, 0, 0, 0, 0],
] as Board;

export async function play(
	getMove: (
		board: Board,
		player: Player,
		legalMoves: ReadonlyArray<Coord>,
	) => Promise<Coord>,
): Promise<{ readonly board: Board; readonly winner: Player | undefined }> {
	let player: Player = 1;
	let board = startBoard;

	for (;;) {
		let moveList = getLegalMoves(board, player);

		// If no legal moves, switch player.
		if (!moveList) {
			player = getOpponent(player);
			moveList = getLegalMoves(board, player);

			// If none of the players have lagal moves, game over.
			if (!moveList) {
				break;
			}
		}

		// Pick a move.
		let movePosition = await getMove(board, player, moveList);

		// Make the move.
		board = move(movePosition!, board, player);

		// Switch player.
		player = getOpponent(player);
		moveList = getLegalMoves(board, player);
	}

	const score = board.reduce<number>((sum, piece) => sum + piece, 0);
	const winner = score === 0 ? undefined : score > 0 ? 1 : -1;

	return {
		board,
		winner,
	};
}
