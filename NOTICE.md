# Modifications notice

This is a **modified version** of
[harmonicabot/harmonica-web-app](https://github.com/harmonicabot/harmonica-web-app),
maintained at
[entangle-network/harmonica-web-app](https://github.com/entangle-network/harmonica-web-app).

It is distributed under the **GNU Affero General Public License v3.0**, the same
licence as the original. The full text is in [LICENSE](LICENSE), unchanged. The
original copyright of the upstream authors is retained.

This notice exists to satisfy AGPL-3.0 §5(a) — a modified work must carry
prominent notices stating that it was changed, and the date.

## What was changed

**Modified since 27 August 2026** by the entangle-network fork. The changes are
in the `cs` branch; `master` is kept as an unmodified mirror of upstream, so
`git diff master..cs` shows the complete set of modifications at any time.

| Area | Change |
|---|---|
| Localisation | Czech translation of the whole user interface, introduced through next-intl (`messages/`, `src/i18n/`) |
| Language handling | Participant conversation language and speech-to-text now follow the deployment locale instead of being pinned to English |
| Speech-to-text | OpenAI used as the transcription provider, with Deepgram retained as a fallback |
| Self-hosting | `Dockerfile`, `docker-entrypoint.sh` and standalone output; the container migrates its own database on start |
| Database | `POSTGRES_DRIVER=pg` to allow a self-hosted Postgres whose host is a container name |
| Fixes | Non-interactive migrations, visible form-validation errors, recording container format on Safari/iOS |

Details are in [docs/FORK.md](docs/FORK.md) and in the commit history of the
`cs` branch.

## Source of the running version

AGPL-3.0 §13 requires that anyone interacting with this software over a network
be offered the source of the version they are using. The deployed application
links to the exact commit it was built from — see `src/components/SourceLink.tsx`.

## Trademarks

"Harmonica", its logo and wordmark are not covered by the AGPL. This fork uses
them only to identify the upstream project it derives from; the licence grants
no trademark rights.
