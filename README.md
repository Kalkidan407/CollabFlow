# Who Would...?

A real-time multiplayer social game where friends answer **“Who would most likely...?”** questions about each other and reveal the group’s choices.

The goal is to create a simple, fast, and fun multiplayer experience that works through a shared game link or room code.

## Features

* Create and join game rooms
* Join without creating an account
* Real-time multiplayer gameplay
* “Who would...?” voting
* Server-controlled game state
* Live vote results
* Final game summary
* Shareable game rooms

## Architecture

```text
Next.js + TypeScript
        │
        │ REST + WebSocket
        ▼
NestJS + TypeScript
        │
        │ Prisma
        ▼
PostgreSQL
```

### Stack

**Frontend**

* Next.js
* TypeScript
* Tailwind CSS

**Backend**

* NestJS
* TypeScript
* REST API
* WebSockets / Socket.IO

**Database**

* PostgreSQL
* Prisma ORM

**Deployment**

* Vercel — Frontend
* Render — Backend
* Neon — PostgreSQL

## Core Game Flow

```text
Create Room
     ↓
Invite Friends
     ↓
Join Lobby
     ↓
Start Game
     ↓
Vote
     ↓
Reveal Results
     ↓
Next Question
     ↓
Final Results
```

## Design Decisions

* **No authentication in MVP** — players join using a display name.
* **Server-authoritative game state** — the backend controls game rules and voting.
* **REST + WebSockets** — REST handles standard operations while WebSockets provide real-time game updates.
* **PostgreSQL** — relational data fits rooms, players, questions, and votes.
* **NestJS** — chosen to build a structured, scalable TypeScript backend.

## MVP

The first version will focus on:

1. Room creation and joining
2. Multiplayer lobby
3. Starting a game
4. Question and voting system
5. Real-time vote completion
6. Results and next-question flow
7. Final results and sharing

## Project Structure

```text
who_whome/
├── frontend/
└── backend/
```

The backend will be organized around domain modules such as:

```text
rooms/
players/
games/
questions/
votes/
```



## Status

🚧 **In Development**
