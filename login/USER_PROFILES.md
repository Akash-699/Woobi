# User account storage — code-only handoff

No Firebase panel changes or rule deployments were performed for this feature.
`WOOBI_USER_PROFILES_ENABLED` is **false** in `firebase-config.js`. All three login
designs keep their current authentication/redirect behavior while it is false.

## Where credentials belong

Firebase Authentication owns email/password credentials, Google identities and
sessions. User profiles live separately at `users/{Firebase Auth UID}` in
Firestore. Never add passwords, password hashes, access/refresh tokens, OAuth
secrets, or private keys to a profile. Firebase UID is the document ID; email is
not the document ID.

## Profile contract

| Field | Firestore type | Purpose |
| --- | --- | --- |
| schemaVersion | integer, 1 | Identifies this contract |
| uid | string | Same UID as Auth identity and document path |
| displayName | string or null | Name from Auth; nullable for email signup |
| email | string or null | Account email, checked against the Auth token by rules |
| photoURL | HTTPS string or null | Optional Auth profile image |
| providers | list of strings | `password` and/or `google.com` |
| createdAt | timestamp | Server-generated on first profile creation; immutable |
| updatedAt | timestamp | Server-generated on profile synchronization |
| lastLoginAt | timestamp | Server-generated on successful login profile sync |

The machine-readable documentation is `user-profile.schema.json`. It represents
Firestore timestamps as date-time strings for JSON exports. Firestore stores
native Timestamp values; no strings are written for timestamps by this code.

Names, photos, provider labels and activity fields are profile information, not
authorization claims. In particular, lastLoginAt is not an authoritative audit
log: an account owner can synchronize their own profile outside a login. Roles,
paid plans and permissions must come from a trusted backend/custom claims, not
from client-writable profile fields. Other users' profiles are not readable.

## Files for the next developer

- `login/user-profile.js`: builds an explicit allowlist of profile fields and
  transactionally creates/updates a document after successful authentication.
  A transaction preserves createdAt if two login sessions create the same profile.
- `login/auth.js`: optional profile save before the homepage redirect, shared by
  all three designs. Password reset does not write a profile. Profile errors do
  not undo successful Auth sign-in; a pop-up offers Continue to wardrobe.
- `firestore.rules`: requires ownership for individual reads/writes, validates
  field names/types, forbids listing and deletion, preserves createdAt, and
  requires server timestamps for update/login times. All other paths are denied.
- `firebase.json`: points the Firebase CLI to the local rules file. Adding this
  file does not deploy anything.

## Activation — future authorized task

The assigned developer must review this before enabling it:

1. Provision a **default Firestore Standard database** in the approved Firebase
   project, choosing the team's required location.
2. Review `firestore.rules` alongside any existing rules. The included catch-all
   denies other collections, so deploying it wholesale to an existing database
   could block other features. Merge compatible rules first if necessary.
3. Verify the rules using the Firebase Emulator Suite: unauthenticated access,
   reading/writing another UID, collection listing, extra fields such as password
   or role, changing createdAt, and non-server update timestamps must be denied.
   Owner creation/update with the documented shape must be allowed.
4. Deploy the reviewed rules through the team's authorized release process.
   The CLI configuration is included; no deployment command has been run here.
5. Set `window.WOOBI_USER_PROFILES_ENABLED = true` and refresh the preview.
6. Test sign-up, email login and Google login. Confirm one `users/{uid}` document
   per Auth account, unchanged createdAt on subsequent logins, refreshed login
   timestamps, correct provider/profile values and no credential fields.
7. Deny writes or go offline and sign in: authentication should still be treated
   as successful when it succeeds; the profile-error pop-up must offer a route
   to the homepage. Restore database access and sign in again to retry saving.

The eight-second UI timeout does not cancel an already-running Firestore
transaction; it may still finish afterward. The operation is keyed by UID and
transactional, so retrying does not create duplicate user documents.

No live Firestore write or emulator rules test has been run. Database activation,
session-aware homepage handling, logout and account deletion remain separate
integration work. Do not claim stored profiles until the activation checks pass.

References:
- https://firebase.google.com/docs/firestore/quickstart
- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/firestore/security/rules-fields
