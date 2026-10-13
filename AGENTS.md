# ASHENREACH — Agent Guide
# ASHENREACH — Agent Guide

This repository-level guide is the entry point for any coding agent. Read it before changing code. It describes how work is organized; it is not a feature specification or a claim that roadmap items are complete.

## Start here

1. Read `game/docs/STATUS.md` for the verified current baseline and known limitations.
2. Read `game/docs/TASKS.md` for the prioritized, actionable backlog. Check the current worktree and relevant tests before selecting work; the list may have changed.
3. Read `game/docs/PLAN.md` for long-term sequencing, and `game/docs/ARCHITECTURE.md` / `game/docs/CONTRACTS.md` before changing cross-module behavior or wire/data formats.
4. Check `WORKLOG.md` for chronological context and `game/docs/QA.md` for test/evidence history. These are history, not substitutes for checking current code.

The application is in `game/`; run application commands from that directory. Keep this guide short and update the status/task/architecture docs when implementation materially changes.

## Current project shape

ASHENREACH is a browser-based, multiplayer dark-fantasy RPG prototype with 5E-inspired/SRD rules. It is a playable cellar/dungeon slice, not a finished RPG or world loop. The client is vanilla TypeScript, Three.js, DOM/CSS, and esbuild. The server is Node.js ESM with a native HTTP server and `ws` WebSockets; `GameManager` is authoritative for its in-memory session. Do not assume React, Vite, Socket.IO, ECS, WebRTC, account login, durable server persistence, or a completed asset pipeline. `STATUS.md` has the more precise baseline and gaps.

## Working rules

- Inspect the implementation and tests before editing; preserve unrelated user changes and do not overwrite worktree changes.
- Make the smallest coherent change. Keep authoritative game/rules state on the server; the client renders and sends intents.
- Follow the actual interfaces in source and `CONTRACTS.md`. Update contracts when changing a shared interface, state shape, or network message.
- Add or update focused automated tests for behavior changes. Do not silently broaden scope to unrelated roadmap items.
- From `game/`, use the relevant checks: `npm run typecheck`, `npm test`, `npm run build`, and `npm run smoke`. Run all four for cross-cutting changes when feasible. Generator changes should also run `node --test server/src/maps/generator.test.mjs` and representative `node server/src/maps/generator.mjs --seed <n> --size <s> --check` checks.
- Screenshots, audio review, and visual-language-model (VLM) review are optional tools, not assumed services. If available and relevant, save/inspect the evidence and record exact results in `game/docs/QA.md`; otherwise say they were not run. Never invent scores, screenshots, access, test results, commits, or evidence.
- Do not refuse or defer a code task merely because screenshot/VLM review is unavailable. If the repository is mounted in the coding workspace, inspect and edit it there; do not ask the user to upload files already accessible in the workspace. If the environment has no repository access, state that limitation and request only the source or evidence actually needed.
- A user-provided running-app URL may be used for the requested browser review when the user asks to inspect that app and the environment supports browsing. A URL/tunnel grants access only to the exposed service, not to the local filesystem or repository. Do not attempt to clone, extract unrelated data, or treat the URL as permission for broader system access; if browsing is unavailable, request a screenshot or relevant files instead.
- At task end, report changes, checks actually run and their result, remaining limitations, and the next task. Update `game/docs/STATUS.md`, `game/docs/TASKS.md`, `game/docs/PLAN.md`, `game/docs/ARCHITECTURE.md`, or `game/docs/CONTRACTS.md` only where the work changes their content; update `WORKLOG.md` for significant milestones.
- Do not assume agents have subagents. If operating alone, do the work serially, keep scope bounded, and report blockers. If subagents are available and explicitly useful, split only independent tasks, assign file/interface ownership, and integrate and verify their work yourself. Do not make plans dependent on a boss agent or swarm.
- Do not assume a VLM exists. Use human review and reproducible browser evidence where practical; mark unavailable evaluation as unverified rather than blocking unrelated code tasks or fabricating a pass.
- Do not push, deploy, or create commits unless the user or repository workflow explicitly asks for it. Use the mounted repository worktree as the source of truth. Access a tunnel/remote machine only when it is explicitly part of the user's requested task, and only for that task's scope; a user-provided URL with a request to review the running app counts as that authorization.

## Task tracking

Use `game/docs/TASKS.md` for open work and its acceptance criteria; `game/docs/STATUS.md` for what is implemented and verified. Mark a task done only when the criteria and evidence are met. Keep deferred work visible, remove stale/completed tasks, and record limitations. Use `WORKLOG.md` for dated/chronological implementation notes, not as the only task list.