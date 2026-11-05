import { GameState } from './GameState';

/** The single live game session shared by scenes. */
export const session = {
  gs: new GameState(),
};
