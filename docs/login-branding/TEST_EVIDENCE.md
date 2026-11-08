# Login branding review — 6 November 2026

- Removed visible Sérén Studio branding from the active web login, Android login copy, design comparison page, and all three standalone login designs.
- Kept the Woobi wordmark and existing form behavior.
- Reviewed the reported console screenshot: the EventEmitter/ObjectMultiplex messages match a reported MetaMask extension issue. The inspector unload warning has an unconfirmed injected-script origin. No authentication fix or warning suppression was applied.
- Served the app with `PORT=5050` and checked `http://localhost:5050/login/` in an isolated Playwright browser.
- Confirmed the active page has no Sérén Studio signature and the Woobi home link is visible.
- Confirmed the mobile viewport and document bounds are 390 × 844, with no horizontal or vertical overflow.
- Captured fresh desktop (1440 × 1000) and mobile (390 × 844) screenshots with reduced motion enabled.
- The browser recorded one missing `/favicon.ico` resource (404) on initial load. The reported extension warnings did not appear during this isolated check.
- `git diff --check` passed. Static checks confirmed visible branding removal across all six edited HTML files and web/Android login header parity.
- Live Firebase sign-in and Android device behavior were not exercised for this markup-only change.

Console references: [MetaMask issue](https://github.com/MetaMask/metamask-extension/issues/43090), [Chrome unload documentation](https://developer.chrome.com/docs/web-platform/deprecating-unload).
