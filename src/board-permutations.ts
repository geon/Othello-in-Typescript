import { Coord, coordToIndex } from "./coord";
import { Board, Cell } from "./othello";

export function invertBoard(board: Board): Board {
	return board.map((cell) => (cell * -1) as Cell);
}

function range<N extends number>(
	//
	length: N,
	from: number = 0,
): number[] {
	return Array(length)
		.fill(undefined)
		.map((_, index) => index + from);
}

type CoordPair = readonly [Coord, Coord];

const verticalCoordPairs: readonly CoordPair[] = range(4).flatMap((x) =>
	range(8).map((y) => [
		{ x, y },
		{ x: 7 - x, y },
	]),
);

const horizontalCoordPairs: readonly CoordPair[] = range(4).flatMap((y) =>
	range(8).map((x) => [
		{ x, y },
		{ x, y: 7 - y },
	]),
);

const diagonalCoordPairs: readonly CoordPair[] = range(8).flatMap((y) =>
	range(7 - y).map((x) => [
		{ x: 7 - x, y },
		{ x: y, y: 7 - x },
	]),
);

function mirrorBoard(board: Board, coordPairs: readonly CoordPair[]): Board {
	const mirrored: Cell[] = [...board];

	for (const [a, b] of coordPairs) {
		const indexA = coordToIndex(a);
		const indexB = coordToIndex(b);
		[mirrored[indexB], mirrored[indexA]] = [board[indexA]!, board[indexB]!];
	}

	return mirrored;
}

function mirrorBoardHorizontally(board: Board): Board {
	return mirrorBoard(board, horizontalCoordPairs);
}

function mirrorBoardVertically(board: Board): Board {
	return mirrorBoard(board, verticalCoordPairs);
}

function mirrorBoardDiagonally(board: Board): Board {
	return mirrorBoard(board, diagonalCoordPairs);
}

export function getMirrorPermutations(board: Board): Board[] {
	let boards = [board];

	const mirrors = [
		mirrorBoardHorizontally,
		mirrorBoardVertically,
		mirrorBoardDiagonally,
	];

	for (const mirror of mirrors) {
		boards = [boards, boards.map(mirror)].flat();
	}

	return boards;
}
