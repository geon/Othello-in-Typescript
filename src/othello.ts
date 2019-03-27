export type Board = ReadonlyArray<number>;

// list-format:
//  every list is a number[64] where the first element tells how long the list is.
//  for example, the first list generated will be: {4, 19, 29, 34, 44, ... }, where the rest of the list is irrelevant.

// player-format & the heuristicScores-values:
//  the number's named player can only be 1 or -1. to switch player I use a unary minus.

// defining offsets for the 8 directions. upp-left, upp, upp-right, ..., down-right. the order doesn't really matter.
const offSets = [-9, -8, -7, -1, 1, 7, 8, 9];

export function getLegalMoves(board: Board, player: number): number[] {
	// loop through all squares to find legal moves and add them to the list.
	const legalMoves = [];
	for (let i = 0; i <= 63; i++) {
		if (moveIsLegal(i, board, player)) {
			legalMoves.push(i);
		}
	}

	return legalMoves;
}

export function moveIsLegal(
	position: number,
	board: Board,
	player: number,
): boolean {
	if (board[position]) return false; // we may only put pieces in empty squares.

	for (let direction = 0; direction < 8; direction++) {
		// test every direction.
		if (!stepIsLegal(position, offSets[direction])) continue; // skip this direction if one may not step there.
		let currentPosition = position + offSets[direction]; // start steping one square from position.
		let stepsMoved = 0;

		while (
			board[currentPosition] == -player &&
			stepIsLegal(currentPosition, offSets[direction])
		) {
			// take a step in direction as long as it is legal (we may not step out of the board) and the pices belongs to opponent (-player).
			currentPosition += offSets[direction]; // step to the next square in direction.
			stepsMoved++;
		}
		if (stepsMoved > 0 && board[currentPosition] == player) return true; // if this is true, we have found a comlete row.
	}

	return false; // if no legal move is found in either direction, this move is illegal.
}

function stepIsLegal(position: number, offSet: number): boolean {
	// take care of left, ...
	if (position % 8 == 0 && (offSet == -9 || offSet == -1 || offSet == 7))
		return false;
	// ... right, ...
	if (position % 8 == 7 && (offSet == -7 || offSet == 1 || offSet == 9))
		return false;
	// ... upper, ...
	if (Math.floor(position / 8) == 0 && offSet < 0 && offSet != -1) return false;
	// ... and lower edge.
	if (Math.floor(position / 8) == 7 && offSet > 0 && offSet != 1) return false;

	// the step is not illegal, return true.
	return true;
}

export function getBestMove(
	board: Board,
	player: number,
	// 0 = easy, 1 = normal, 3 = hard, 4 = very hard.
	smartness: number = 4,
): number {
	const legalMoves = getLegalMoves(board, player);

	let score = -Infinity;
	let bestScore = -Infinity;
	let bestMove = legalMoves[0];

	for (const legalMove of legalMoves) {
		const newBoard = move(legalMove, board, player);

		score = -miniMax(newBoard, -player, smartness);

		if (score > bestScore) {
			bestScore = score;
			bestMove = legalMove;
		}
	}

	return bestMove;
}

function miniMax(board: Board, player: number, searchDepth: number): number {
	// check for game over.
	const moveListPlayer = getLegalMoves(board, player);
	const moveListOpponent = getLegalMoves(board, -player);
	if (!moveListPlayer.length && !moveListOpponent.length) {
		// count the pieces.
		let playerCount = 0;
		let opponentCount = 0;
		for (const piece of board) {
			if (piece == player) {
				playerCount++;
			} else if (piece == -player) {
				opponentCount++;
			}
		}
		// reward the winner.
		if (playerCount > opponentCount) {
			return Infinity;
		} else if (playerCount < opponentCount) {
			return -Infinity;
		} else {
			return 0;
		}
	}

	// switch player if player has no moves.
	if (!moveListPlayer.length) {
		return miniMax(board, -player, searchDepth);
	}

	// try the moves and return the best score.
	let bestScore = -Infinity;
	for (const movePosition of moveListPlayer) {
		const newBoard = move(movePosition, board, player);

		const score =
			searchDepth > 0
				? -miniMax(newBoard, -player, searchDepth - 1)
				: heuristicScore(newBoard, player) +
				  moveListPlayer.length -
				  moveListOpponent.length;

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

	// reward the player if he has more (weighted) pieces than the opponent.
	for (let i = 0; i < 64; ++i) {
		score += heuristicScores[i] * player * board[i];
	}

	return score;
}

// make shure you mAY move before you call this function.
export function move(position: number, board: Board, player: number): Board {
	const newBoard = [...board];
	newBoard[position] = player;

	for (const offSet of offSets) {
		if (!stepIsLegal(position, offSet)) {
			// skip this direction if one may not step there.
			continue;
		}
		let currentPosition = position + offSet; // start steping one square from position.
		let stepsMoved = 0;

		while (
			newBoard[currentPosition] == -player &&
			stepIsLegal(currentPosition, offSet)
		) {
			currentPosition += offSet;
			stepsMoved++;
		}
		// if we found a row:
		if (stepsMoved > 0 && newBoard[currentPosition] == player) {
			// flip
			for (; stepsMoved > 0; stepsMoved--) {
				currentPosition -= offSet;
				newBoard[currentPosition] = player;
			}
		}
	}

	return newBoard;
}
