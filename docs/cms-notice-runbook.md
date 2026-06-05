# CMS Notice Runbook

> Status: CURRENT GUIDE
> Last verified: 2026-06-06
> Code readback: 2026-06-06

This runbook is for site notices managed in CMS `공지 / FAQ` (`/notices`).
Product-level author notices use separate routes and must not be confused with
site notices.

## Code-Readback Anchors

- CMS page: `cms/app/notices/page.tsx`
- CMS add page: `cms/app/notices/add/page.tsx`
- CMS edit page: `cms/app/notices/[noticeId]/page.tsx`
- CMS table: `cms/app/notices/DataTable.tsx`
- CMS API client: `cms/api/notice/index.ts`
- CMS types: `cms/types/notice.ts`
- Backend query routes:
  - `GET /v1/query/admins/general-notices`
  - `GET /v1/query/admins/general-notices/{notice_id}`
- Backend command routes:
  - `POST /v1/command/admins/general-notices`
  - `PUT /v1/command/admins/general-notices/{id}`
  - `DELETE /v1/command/admins/general-notices/{id}`
- Public notice query routes:
  - `GET /v1/query/notices`
  - `GET /v1/query/notices/{notice_id}`
- Backend schema allows free `subject`, `content`, `primary_yn`, `use_yn`:
  `likenovel-service-api/likenovel-service-api/fastapi_be_server/app/schemas/notice.py`

The title prefix rules below are operational conventions, not backend-enforced
enum validation. Keep them unless code or an explicit user instruction changes
the notice policy.

## Preflight

1. Read the current notice list before drafting:

```bash
curl -s "https://api.likenovel.net/v1/query/notices?page=1&limit=30"
```

2. Check whether a primary `(서비스 장애)` notice already exists without a
matching `(장애해결)` follow-up.
3. If quoting UI text in the notice, read the actual component/route first.
Do not invent button, menu, tab, or modal labels from memory.
4. Separate DB/API save evidence from CMS/browser UI evidence in the report.
If only API/DB was checked, do not say the CMS screen already shows it.

## Title Rules

Use one of these prefixes:

| Prefix | Use |
|---|---|
| `(서비스 장애)` | Active incident or degradation |
| `(장애해결)` | Incident resolved follow-up |
| `(이용개선)` | UX or usability improvement |
| `(신규 업데이트)` | New feature or release |
| `(운영안내)` | Maintenance, policy, or general operation |

For date suffixes, use `[MM-DD]`; for maintenance windows, use
`[MM-DD HH:MM~HH:MM]`.

## Incident Pair Rule

- If a primary `(서비스 장애)` notice is posted, a matching `(장애해결)` notice is
required after recovery.
- Before creating a new notice, scan the latest list for unresolved primary
incident notices.
- Do not leave stale incident notices as primary after recovery unless the user
explicitly instructs it.

## Body Style

- Opening: `안녕하세요, 라이크노벨 운영팀입니다.`
- State the impact scope and recovery or action plan.
- Use concise HTML such as `<p>`, `<strong>`, and `◼` bullets when writing CMS
HTML content.
- Closing can use:
  - `이용에 불편을 드려 죄송합니다.`
  - `감사합니다.`
  - `라이크노벨 운영팀 드림`

## Primary Flag

- Use `primary_yn=Y` for active incidents, important policy changes, and major
service-impact notices.
- Use `primary_yn=N` for ordinary improvements or routine updates.
- The CMS table renders `primary_yn === "Y"` as a check mark in
`cms/app/notices/DataTable.tsx`; stale browser state may require refresh before
the UI reflects an API/DB change.

## Verification Report

Report the layers separately:

- API/DB layer: route called, notice id, `subject`, `primary_yn`, `use_yn`.
- CMS UI layer: CMS URL, visible title, primary check mark after refresh.
- Public UI layer, when relevant: `GET /v1/query/notices` or actual user-facing
notice page/readback.

Do not collapse these into "posted and visible" unless each layer was actually
checked.
