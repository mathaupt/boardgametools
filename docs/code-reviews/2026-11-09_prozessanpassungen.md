# Prozessanpassungen – 09.11.2026

- User instruction for remaining open features now explicitly permits assuming listed manual and Browser-E2E acceptance. Backlog and bug records distinguish those assumptions from checks actually run.
- FEAT-031 used RED/GREEN service/API tests, UI and projection tests, plus an isolated PostgreSQL migration test. Production schema changes remain separate from local implementation.
- Full coverage must complete before updating the tracked quality metrics. First run reached 79,99 % branches and failed the gate; a missing collection ownership case was added. Successful rerun: 1.435 tests, 80,01 % branches.
- Full ESLint `--max-warnings=0` currently fails on pre-existing bundled Impeccable-script warnings. Targeted ESLint on all changed application and test files passes; no broad suppression was added.
- Review evaluator needs registry access to distinguish the documented low development-only shadcn/deepmerge item from missing audit evidence. Sandbox run generated a false open SEC-45 record; the same evaluator was rerun with registry access and passed with no regression.
- Operating features remain gated by actual external state: no unmeasured WAF rule activation, invented spend limit, or unapproved production data cleanup.
- FEAT-031-Rollout separat autorisiert: konsistenter Produktionssnapshot (34 Tabellen/987 Zeilen, SHA-256 dokumentiert), vollständige isolierte Restoreprobe, Vorher-/Nachher-Readback; ausschließlich die additive Nullable-Migration angewendet. 2/2 vorhandene Links blieben bestehen. Code-Push/Deployment folgt nach dem Commit der aktualisierten Betriebsdokumentation.
