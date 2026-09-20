export const directions=['up','right','down','left'] as const;
export type Direction=typeof directions[number];
export type Game={board:number[];score:number;moves:number;rng:number};
function random(seed:number){const next=(Math.imul(seed,1664525)+1013904223)>>>0;return {next,value:next/4294967296};}
export function slide(board:number[],direction:Direction){const result=board.slice();let gain=0;for(let line=0;line<4;line++){const indices=Array.from({length:4},(_,i)=>direction==='left'?line*4+i:direction==='right'?line*4+3-i:direction==='up'?i*4+line:(3-i)*4+line);const values=indices.map(i=>board[i]).filter(Boolean);const merged:number[]=[];for(let i=0;i<values.length;i++){if(values[i]===values[i+1]){const n=values[i]*2;merged.push(n);gain+=n;i++;}else merged.push(values[i]);}indices.forEach((index,i)=>result[index]=merged[i]||0);}return {board:result,gain,changed:result.some((n,i)=>n!==board[i])};}
export function legalMoves(board:number[]){return directions.filter(d=>slide(board,d).changed);}
function spawn(game:Game):Game{const empty=game.board.map((n,i)=>n===0?i:-1).filter(i=>i>=0);if(!empty.length)return game;const position=random(game.rng),tile=random(position.next);const board=game.board.slice();board[empty[Math.floor(position.value*empty.length)]]=tile.value<.9?2:4;return {...game,board,rng:tile.next};}
export function newGame(seed:number):Game{return spawn(spawn({board:Array(16).fill(0),score:0,moves:0,rng:seed>>>0}));}
export function move(game:Game,direction:Direction):Game{const next=slide(game.board,direction);if(!next.changed)return game;return spawn({...game,board:next.board,score:game.score+next.gain,moves:game.moves+1});}
export function finished(game:Game){return game.board.some(n=>n>=2048)||legalMoves(game.board).length===0;}
