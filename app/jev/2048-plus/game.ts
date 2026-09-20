export {newGame,move,legalMoves,directions} from '../2048/game.ts';
export type {Direction,Game} from '../2048/game.ts';
import {legalMoves,type Game} from '../2048/game.ts';
export function finished(game:Game){return legalMoves(game.board).length===0;}
