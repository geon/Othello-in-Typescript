import { Board, Cell, Coord, coordToIndex } from "./othello";
import { range } from "./range";

export const allCells = [-1, 0, 1] as const satisfies Cell[];

export const allCellPairs = allCells.flatMap((a) =>
	allCells.map((b) => [a, b] as const),
);

// function isCell(cell: number): cell is Cell {
// 	return (allCells as number[]).includes(cell);
// }

// function parseCell(cell: number): Cell {
// 	if (!isCell(cell)) {
// 		throw new Error(`Not a Cell: ${cell}`);
// 	}

// 	return cell;
// }

type NumberPair = readonly [number, number];

// -1, -1
// -1,  0
// -1,  1
//  0, -1
//  0,  0
//  0,  1
//  1, -1
//  1,  0
//  1,  1

export function foldCellPair([a, b]: NumberPair): NumberPair {
	return [a + b, a - b];
}

export function unfoldCellPair([A, B]: NumberPair): NumberPair {
	return [(A + B) / 2, (A - B) / 2];
}

type CoordPair = readonly [Coord, Coord];

export function foldOrUnfoldBoard(
	board: readonly number[],
	coordPairs: readonly CoordPair[],
	foldOrUnfold: (pair: NumberPair) => NumberPair,
): number[] {
	const folded: number[] = [...board];

	for (const [a, b] of coordPairs) {
		const indexA = coordToIndex(a);
		const indexB = coordToIndex(b);
		[folded[indexA], folded[indexB]] = foldOrUnfold(
			//
			[board[indexA]!, board[indexB]!],
		);
	}

	return folded;
}

const foldVerticallyCoordPairs: readonly CoordPair[] = range(4).flatMap((x) =>
	range(8).map((y) => [
		{ x, y },
		{ x: 7 - x, y },
	]),
);
export function foldVertically(board: readonly number[]): number[] {
	return foldOrUnfoldBoard(board, foldVerticallyCoordPairs, foldCellPair);
}
export function unfoldVertically(board: readonly number[]): readonly number[] {
	return foldOrUnfoldBoard(board, foldVerticallyCoordPairs, unfoldCellPair);
}

const foldHorizontallyCoordPairs: readonly CoordPair[] = range(4).flatMap((y) =>
	range(8).map((x) => [
		{ x, y },
		{ x, y: 7 - y },
	]),
);
export function foldHorizontally(board: readonly number[]): number[] {
	return foldOrUnfoldBoard(board, foldHorizontallyCoordPairs, foldCellPair);
}
export function unfoldHorizontally(
	board: readonly number[],
): readonly number[] {
	return foldOrUnfoldBoard(board, foldHorizontallyCoordPairs, unfoldCellPair);
}

const foldDiagonallyCoordPairs: readonly CoordPair[] = range(8).flatMap((y) =>
	range(7 - y).map((x) => [
		{ x: 7 - x, y },
		{ x: y, y: 7 - x },
	]),
);
export function foldDiagonally(board: readonly number[]): number[] {
	return foldOrUnfoldBoard(board, foldDiagonallyCoordPairs, foldCellPair);
}
export function unfoldDiagonally(board: readonly number[]): readonly number[] {
	return foldOrUnfoldBoard(board, foldDiagonallyCoordPairs, unfoldCellPair);
}

export function foldAll(board: Board): number[] {
	return foldDiagonally(foldHorizontally(foldVertically(board)));
}
export function unfoldAll(board: readonly number[]): Board {
	return unfoldVertically(unfoldHorizontally(unfoldDiagonally(board))) as Board;
}

// function printBoard(board: readonly number[]): void {
// 	console.log("  +--+--+--+--+--+--+--+--+");
// 	for (let y = 0; y < 8; y++) {
// 		let row = "  |";
// 		for (let x = 0; x < 8; x++) {
// 			const value = board[x + y * 8]!;

// 			row += (value < 0 ? "" : " ") + value + "|";
// 		}
// 		console.log(row);
// 		console.log("  +--+--+--+--+--+--+--+--+");
// 	}

// 	console.log("\n");
// }

// const board: Board = [
// 	...[0, 0, 0, 0, 0, 0, 0, 0],
// 	...[0, 0, -1, 0, -1, 0, 0, 0],
// 	...[0, 0, 0, -1, 1, 1, 1, 0],
// 	...[0, 0, 0, 1, -1, 1, 0, 0],
// 	...[0, 0, 0, -1, -1, 0, 0, 0],
// 	...[0, 0, 0, 0, -1, 0, 0, 0],
// 	...[0, 0, 0, 0, 0, 0, 0, 0],
// 	...[0, 0, 0, 0, 0, 0, 0, 0],
// ] as const;

// printBoard(board);
// printBoard(foldAll(board));
