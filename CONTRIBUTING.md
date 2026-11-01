# Contributing to Woobi

## Intern workflow
1. Read your assigned Work Deck task and its acceptance criteria.
2. Fork the repository if you have Read access, or create your own feature branch if you have Write access.
3. Use a branch name like `feature/WD-102-login-ui` or `fix/WD-108-nav-issue`.
4. Make focused commits and test the changes.
5. Open a PR targeting `main`, use the PR template, and include the task ID and screenshots where relevant.
6. Address reviewer comments; do not merge your own PR.
7. Paste your PR URL into your Work Deck task submission.

## Administrator review
- Validate scope against Work Deck acceptance criteria.
- Check the diff for bugs, security issues, accidental secrets, and unrelated changes.
- Ask for revisions when necessary.
- Only designated admins merge accepted PRs into `main`.

## Important permissions note
Documentation and CODEOWNERS do not by themselves restrict merging. GitHub repository/team access and (where supported) enforced branch protection must be configured by an organization owner. GitHub Free does not enforce branch protection on private repositories. For a private Free repo, give interns only Read access and have them propose changes from forks, subject to the organization's private-fork policy. Keep Write/Maintain/Admin permissions with trusted reviewers only.

## Security
Never commit credentials, `.env` files, API keys, private customer data, or production datasets. Obtain approval before adding new dependencies or changing authentication/security-sensitive code.
