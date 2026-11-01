# Woobi review team and access policy

## Repository owner
- `@04suriya07-spec` — organization owner and repository Admin. Retains full control.

## Designated PR reviewers and mergers (grant repository Write access)
- `@joyarnold21`
- `@nandhakumar1980`
- `@mohamedharizs`

These people are **designated** reviewers; this document does not grant permissions. Configure organization team `admins` with Write access to `Troyz-Solutions/Woobi` and add these accounts.

## Interns (future onboarding)
Create organization team `interns` with Read-only access to Woobi. Add interns as their usernames are collected. To contribute, they should fork Woobi when private forking is allowed, push a branch in their own fork, and open a pull request targeting `Troyz-Solutions/Woobi:main`. Do not grant interns Write access to Woobi.

## Required manual checks
1. Keep `@04suriya07-spec` as organization owner and repo Admin.
2. Ensure organization base repository permission is **None** or **Read**, never Write.
3. Give `admins` Write access, not organization Owner or repository Admin.
4. Enable private repository forking in the organization and repository settings, if available.
5. Test with a real intern account: can read, fork, and propose a PR; cannot merge into original Woobi.
6. GitHub Free private repositories do not enforce branch protection. Review-and-approval is a documented team policy, not a technical prerequisite to merging.

## Review process
Admins should check task scope, build/test results, security impact, and screenshot evidence before approval and merge. Record the Work Deck task ID in the PR template.

## CODEOWNERS note
`CODEOWNERS` currently lists `@04suriya07-spec`. Once the `admins` team exists and has Write access, it can be changed to `* @Troyz-Solutions/admins`. CODEOWNERS is advisory until supported branch protection enforces required code-owner reviews.
