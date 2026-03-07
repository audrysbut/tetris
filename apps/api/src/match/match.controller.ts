import { Controller, Post, Body } from "@nestjs/common";
import { MatchService } from "./match.service.ts";
import type { CreateMatchResult, JoinMatchResult, MatchErrorResponse } from "shared";

@Controller("match")
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post("create")
  async create(): Promise<CreateMatchResult> {
    return this.matchService.createMatch();
  }

  @Post("join")
  async join(@Body("matchId") matchId: string): Promise<JoinMatchResult | MatchErrorResponse> {
    if (!matchId) return { error: "matchId required" };
    const result = await this.matchService.joinMatch(matchId);
    if (!result) return { error: "Match not found or full" };
    return result;
  }
}
