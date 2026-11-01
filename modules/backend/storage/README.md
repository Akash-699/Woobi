# Backend Storage Submodule (`modules/backend/storage`)

## Responsibility
Manages user media uploads, binary validation, tenant isolation, and image retrieval:
- **Magic Number Sniffing**: Inspects the true binary byte header to guarantee only genuine JPEG, PNG, or WebP files are admitted, preventing executable extension spoofing (`.exe` renamed to `.png`).
- **User Scoping & Isolation**: User-uploaded wardrobe photos are partitioned by authenticated `userId` in dedicated directories (`uploads/<userId>/`), strictly preventing cross-user access.
- **Path Traversal Guards**: Rejects directory traversal tokens (`../`, slashes, null bytes) in file download requests.
- **Decoupled 3D Studio Assets**: Keeps private user photos strictly separated from tracked public 3D Studio models (`.glb` assets).

## Key APIs
- `sniffMimeType(buffer)`: Determines actual MIME type from file header.
- `validateUpload(buffer, declaredMime)`: Verifies file size and true format.
- `saveUserFile(userId, originalName, buffer)`: Validates and stores user photo.
- `getFile(userId, filename)`: Authorized retrieval of user file.
- `deleteFile(userId, filename)`: Authorized deletion of user file.
