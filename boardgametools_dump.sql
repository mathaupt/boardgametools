--
-- PostgreSQL database dump
--

\restrict 6SYgrTEKoxufD7DCiceCLZUhj7L9gfOyiTIqBpssawhdhWPfABbBhBVVWuWw2cZ

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Event; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "eventDate" timestamp(3) without time zone NOT NULL,
    location text,
    status text DEFAULT 'draft'::text NOT NULL,
    "createdById" text NOT NULL,
    "groupId" text,
    "selectedGameId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Event" OWNER TO mha;

--
-- Name: EventInvite; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."EventInvite" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "userId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "invitedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EventInvite" OWNER TO mha;

--
-- Name: Game; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."Game" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bggId" text,
    description text,
    "minPlayers" integer NOT NULL,
    "maxPlayers" integer NOT NULL,
    "playTimeMinutes" integer,
    complexity integer,
    "imageUrl" text,
    "ownerId" text NOT NULL
);


ALTER TABLE public."Game" OWNER TO mha;

--
-- Name: GameProposal; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."GameProposal" (
    id text NOT NULL,
    "gameId" text NOT NULL,
    "eventId" text NOT NULL,
    "proposedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."GameProposal" OWNER TO mha;

--
-- Name: GameSession; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."GameSession" (
    id text NOT NULL,
    "playedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "createdById" text NOT NULL,
    "gameId" text NOT NULL
);


ALTER TABLE public."GameSession" OWNER TO mha;

--
-- Name: Group; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."Group" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Group" OWNER TO mha;

--
-- Name: GroupMember; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."GroupMember" (
    id text NOT NULL,
    "groupId" text NOT NULL,
    "userId" text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."GroupMember" OWNER TO mha;

--
-- Name: SessionPlayer; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."SessionPlayer" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "sessionId" text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SessionPlayer" OWNER TO mha;

--
-- Name: User; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'USER'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO mha;

--
-- Name: Vote; Type: TABLE; Schema: public; Owner: mha
--

CREATE TABLE public."Vote" (
    id text NOT NULL,
    "proposalId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Vote" OWNER TO mha;

--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."Event" (id, title, description, "eventDate", location, status, "createdById", "groupId", "selectedGameId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EventInvite; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."EventInvite" (id, "eventId", "userId", status, "invitedAt") FROM stdin;
\.


--
-- Data for Name: Game; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."Game" (id, name, "createdAt", "updatedAt", "bggId", description, "minPlayers", "maxPlayers", "playTimeMinutes", complexity, "imageUrl", "ownerId") FROM stdin;
\.


--
-- Data for Name: GameProposal; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."GameProposal" (id, "gameId", "eventId", "proposedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: GameSession; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."GameSession" (id, "playedAt", notes, "createdById", "gameId") FROM stdin;
\.


--
-- Data for Name: Group; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."Group" (id, name, description, "ownerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GroupMember; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."GroupMember" (id, "groupId", "userId", role, "joinedAt") FROM stdin;
\.


--
-- Data for Name: SessionPlayer; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."SessionPlayer" (id, "userId", "sessionId", "joinedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."User" (id, email, "passwordHash", name, role, "isActive", "createdAt", "updatedAt") FROM stdin;
admin-001	soulsaver83@gmail.com	$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFUpO	Admin User	ADMIN	t	2026-02-18 21:21:27.292	2026-02-18 21:21:27.292
\.


--
-- Data for Name: Vote; Type: TABLE DATA; Schema: public; Owner: mha
--

COPY public."Vote" (id, "proposalId", "userId", "createdAt") FROM stdin;
\.


--
-- Name: EventInvite EventInvite_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."EventInvite"
    ADD CONSTRAINT "EventInvite_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: GameProposal GameProposal_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GameProposal"
    ADD CONSTRAINT "GameProposal_pkey" PRIMARY KEY (id);


--
-- Name: GameSession GameSession_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GameSession"
    ADD CONSTRAINT "GameSession_pkey" PRIMARY KEY (id);


--
-- Name: Game Game_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Game"
    ADD CONSTRAINT "Game_pkey" PRIMARY KEY (id);


--
-- Name: GroupMember GroupMember_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GroupMember"
    ADD CONSTRAINT "GroupMember_pkey" PRIMARY KEY (id);


--
-- Name: Group Group_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_pkey" PRIMARY KEY (id);


--
-- Name: SessionPlayer SessionPlayer_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."SessionPlayer"
    ADD CONSTRAINT "SessionPlayer_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vote Vote_pkey; Type: CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Vote"
    ADD CONSTRAINT "Vote_pkey" PRIMARY KEY (id);


--
-- Name: EventInvite_eventId_userId_key; Type: INDEX; Schema: public; Owner: mha
--

CREATE UNIQUE INDEX "EventInvite_eventId_userId_key" ON public."EventInvite" USING btree ("eventId", "userId");


--
-- Name: GroupMember_groupId_userId_key; Type: INDEX; Schema: public; Owner: mha
--

CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON public."GroupMember" USING btree ("groupId", "userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: mha
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Vote_proposalId_userId_key; Type: INDEX; Schema: public; Owner: mha
--

CREATE UNIQUE INDEX "Vote_proposalId_userId_key" ON public."Vote" USING btree ("proposalId", "userId");


--
-- Name: EventInvite EventInvite_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."EventInvite"
    ADD CONSTRAINT "EventInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventInvite EventInvite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."EventInvite"
    ADD CONSTRAINT "EventInvite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Event Event_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Event Event_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Group"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Event Event_selectedGameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_selectedGameId_fkey" FOREIGN KEY ("selectedGameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GameProposal GameProposal_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GameProposal"
    ADD CONSTRAINT "GameProposal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameProposal GameProposal_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GameProposal"
    ADD CONSTRAINT "GameProposal_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameProposal GameProposal_proposedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GameProposal"
    ADD CONSTRAINT "GameProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameSession GameSession_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GameSession"
    ADD CONSTRAINT "GameSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GameSession GameSession_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GameSession"
    ADD CONSTRAINT "GameSession_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Game Game_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Game"
    ADD CONSTRAINT "Game_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupMember GroupMember_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GroupMember"
    ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."Group"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GroupMember GroupMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."GroupMember"
    ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Group Group_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Group"
    ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SessionPlayer SessionPlayer_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."SessionPlayer"
    ADD CONSTRAINT "SessionPlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."GameSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SessionPlayer SessionPlayer_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."SessionPlayer"
    ADD CONSTRAINT "SessionPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Vote Vote_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Vote"
    ADD CONSTRAINT "Vote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public."GameProposal"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Vote Vote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mha
--

ALTER TABLE ONLY public."Vote"
    ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 6SYgrTEKoxufD7DCiceCLZUhj7L9gfOyiTIqBpssawhdhWPfABbBhBVVWuWw2cZ

