/** Response from POST /match/create */
export interface CreateMatchResult {
  matchId: string;
  actionsDestination: string;
  updatesDestination: string;
}

/** Response from POST /match/join on success */
export interface JoinMatchResult {
  matchId: string;
  playerId: 1 | 2;
  actionsDestination: string;
  updatesDestination: string;
  gameStarted: boolean;
}

/** Error response shape from match endpoints */
export interface MatchErrorResponse {
  error: string;
}
