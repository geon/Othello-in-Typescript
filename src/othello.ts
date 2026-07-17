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

export function addCoord(a: Coord, b: Coord): Coord {
	return { x: a.x + b.x, y: a.y + b.y };
}

export function subCoord(a: Coord, b: Coord): Coord {
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
			board[coordToIndex(currentPosition)] === -player &&
			stepIsLegal(currentPosition, offSet)
		) {
			// Step to the next square in direction.
			currentPosition = addCoord(currentPosition, offSet);
			stepsMoved++;
		}

		if (stepsMoved > 0 && board[coordToIndex(currentPosition)] === player) {
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

export function getOpponent(player: Player): Player {
	return -player as Player;
}

export function getBestScore(
	scoredMoves: ReadonlyArray<{ readonly move: Coord; readonly score: number }>,
): number {
	return Math.max(...scoredMoves.map((scoredMove) => scoredMove.score));
}

//  The heuristicScores-values describes how valuable the pieces on these positions are.
const heuristicScores: ReadonlyArray<number> = [
	...[8, -4, 6, 4, 4, 6, -4, 8],
	...[-4, -4, 0, 0, 0, 0, -4, -4],
	...[6, 0, 2, 2, 2, 2, 0, 6],
	...[4, 0, 2, 1, 1, 2, 0, 4],
	...[4, 0, 2, 1, 1, 2, 0, 4],
	...[6, 0, 2, 2, 2, 2, 0, 6],
	...[-4, -4, 0, 0, 0, 0, -4, -4],
	...[8, -4, 6, 4, 4, 6, -4, 8],
];

export function heuristicScore(board: Board, player: Player): number {
	let score = 0;

	// Reward the player if he has more (weighted) pieces than the opponent.
	for (let i = 0; i < 64; ++i) {
		score += heuristicScores[i]! * player * board[i]!;
	}

	return score;
}

// Make shure you MAY move before you call this function.
export function doMove(position: Coord, board: Board, player: Player): Board {
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
			newBoard[coordToIndex(currentPosition)] === -player &&
			stepIsLegal(currentPosition, offSet)
		) {
			currentPosition = addCoord(currentPosition, offSet);
			stepsMoved++;
		}

		// If we found a row:
		if (stepsMoved > 0 && newBoard[coordToIndex(currentPosition)] === player) {
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

export type GetMoveFunction = (
	board: Board,
	player: Player,
	legalMoves: ReadonlyArray<Coord>,
) => Promise<Coord>;

export async function play(
	getMove: GetMoveFunction,
): Promise<{ readonly board: Board; readonly winner: Player | undefined }> {
	let player: Player = 1;
	let board = startBoard;

	for (;;) {
		let legalMoves = getLegalMoves(board, player);

		// If no legal moves, switch player.
		if (!legalMoves) {
			player = getOpponent(player);
			legalMoves = getLegalMoves(board, player);

			// If none of the players have lagal moves, game over.
			if (!legalMoves) {
				break;
			}
		}

		// Pick a move.
		let movePosition = await getMove(board, player, legalMoves);

		// Make the move.
		board = doMove(movePosition, board, player);

		// Switch player.
		player = getOpponent(player);
		legalMoves = getLegalMoves(board, player);
	}

	const score = board.reduce<number>((sum, piece) => sum + piece, 0);
	const winner = score === 0 ? undefined : score > 0 ? 1 : -1;

	return {
		board,
		winner,
	};
}
