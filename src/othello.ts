import { Coord, indexToCoord, coordToIndex, addCoord, subCoord } from "./coord";

export type Player = -1 | 1;
export type Cell = Player | 0;
export type Board = ReadonlyArray<Cell>;

export type GameState = {
	readonly board: Board;
	readonly player: Player;
	readonly legalMoves: ReadonlyArray<Coord> | undefined;
};

export function makeGameState({
	board,
	player,
}: Pick<GameState, "board" | "player">): GameState {
	let legalMoves = getLegalMoves(board, player);

	// If no legal moves, switch player.
	if (!legalMoves) {
		player = getOpponent(player);
		legalMoves = getLegalMoves(board, player);
	}

	return {
		board,
		player,
		legalMoves,
	};
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
		if (moveIsLegal(board, player, position)) {
			legalMoves.push(position);
		}
	}

	if (!legalMoves.length) {
		return undefined;
	}

	return legalMoves;
}

export function moveIsLegal(
	board: Board,
	player: Player,
	position: Coord,
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

export function heuristicScore({ board, player }: GameState): number {
	let score = 0;

	// Reward the player if he has more (weighted) pieces than the opponent.
	for (let i = 0; i < 64; ++i) {
		score += heuristicScores[i]! * player * board[i]!;
	}

	const moveListPlayer = getLegalMoves(board, player);

	const opponent = getOpponent(player);
	const moveListOpponent = getLegalMoves(board, opponent);

	return (
		score -
		(moveListOpponent ? moveListOpponent.length : 0) +
		(moveListPlayer ? moveListPlayer.length : 0)
	);
}

// Make shure you MAY move before you call this function.
export function doMove(
	{ board, player }: GameState,
	position: Coord,
): GameState {
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

	return makeGameState({
		board: newBoard,
		// Switch player.
		player: getOpponent(player),
	});
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

export type GetMoveFunction = (gameState: GameState) => Promise<Coord>;

export async function play(
	getMove: GetMoveFunction,
): Promise<{ readonly board: Board; readonly winner: Player | undefined }> {
	let gameState = makeGameState({
		board: startBoard,
		player: 1,
	});

	for (;;) {
		// If none of the players have lagal moves, game over.
		if (!gameState.legalMoves) {
			break;
		}

		// Pick a move.
		let movePosition = await getMove(gameState);

		// Make the move.
		gameState = doMove(gameState, movePosition);
	}

	const score = gameState.board.reduce<number>((sum, piece) => sum + piece, 0);
	const winner = score === 0 ? undefined : score > 0 ? 1 : -1;

	return {
		board: gameState.board,
		winner,
	};
}
