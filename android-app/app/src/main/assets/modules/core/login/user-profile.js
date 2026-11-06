// Optional Firestore profile storage. Passwords and sessions belong to Firebase
// Authentication, not this document. See USER_PROFILES.md before enabling.
export function profileFields(user) {
  if (!user?.uid) throw new Error('A signed-in user is required.');
  const providers = [...new Set(user.providerData.map(item => item.providerId))]
    .filter(id => ['password', 'google.com'].includes(id));
  return {
    schemaVersion: 1,
    uid: user.uid,
    displayName: user.displayName ? user.displayName.slice(0, 120) : null,
    email: user.email || null,
    photoURL: user.photoURL?.startsWith('https://') ? user.photoURL.slice(0, 2048) : null,
    providers
  };
}

export async function saveUserProfile(app, user) {
  const { getFirestore, doc, runTransaction, serverTimestamp } =
    await import('https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js');
  const reference = doc(getFirestore(app), 'users', user.uid);
  const fields = profileFields(user);
  await runTransaction(getFirestore(app), async transaction => {
    const existing = await transaction.get(reference);
    transaction.set(reference, {
      ...fields,
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  });
}
