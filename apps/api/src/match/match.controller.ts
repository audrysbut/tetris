import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { MatchService, CreateMatchResult, JoinMatchResult } from "./match.service.ts";

@Controller("match")
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post("create")
  async create(): Promise<CreateMatchResult> {
    return this.matchService.createMatch();
  }

  @Post("join")
  async join(@Body("matchId") matchId: string): Promise<JoinMatchResult | { error: string }> {
    if (!matchId) return { error: "matchId required" };
    const result = await this.matchService.joinMatch(matchId);
    if (!result) return { error: "Match not found or full" };
    return result;
  }
}
