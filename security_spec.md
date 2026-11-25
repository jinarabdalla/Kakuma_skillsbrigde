# Kakuma SkillsBridge — Security Rules Specification

## 1. Data Invariants
1. **Strict Ownership**: Every document in `skillsProfiles`, `certificates`, `assessmentRequests`, `trainingEnrollments`, and `organizationConnections` must carry `ownerId == request.auth.uid` on creation and never change `ownerId` on update.
2. **Skills Profile Key Alignment**: A user's `skillsProfiles/{profileId}` document ID must match `request.auth.uid` (`profileId == request.auth.uid`) so each user owns at most one authoritative Skills Passport and PII (`contactPhone`) is strictly isolated to the owner or verified admin.
3. **No Self-Verification / Status Forging**: Users creating `certificates` can only initialize `verificationStatus == 'Uploaded for Review'`; users creating `assessmentRequests` can only initialize `status == 'Requested'` and `assessorFeedback == ''`; users creating `organizationConnections` can only initialize `status == 'Sent'`.
4. **Terminal State Locking**: Once an `assessmentRequest` reaches `'Certified'` or `'Withdrawn'`, non-admin users cannot update it. Once an `organizationConnection` reaches `'Closed'`, non-admin users cannot update it.
5. **Temporal & Schema Integrity**: Every create validates `createdAt == request.time && updatedAt == request.time`, strict `keys().hasAll(...)` + `keys().hasOnly(...)`, string length bounds, array size limits (`<= 12`), and valid document IDs (`^[a-zA-Z0-9_\-]+$`).

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Create**: Creating a `skillsProfiles/{uid}` without `request.auth`.
2. **Unverified Email Write**: Creating a `certificates/{id}` with `email_verified: false`.
3. **Identity Spoofing**: Creating a `skillsProfiles/{attackerUid}` with `ownerId: victimUid`.
4. **Path/Owner Mismatch**: Creating `skillsProfiles/{victimUid}` as `attackerUid` even with `ownerId: attackerUid`.
5. **Self-Verification Escalation**: Creating `certificates/{id}` with `verificationStatus: 'Verified'`.
6. **Shadow Field Injection**: Creating `assessmentRequests/{id}` with extra field `approvedByAdmin: true`.
7. **Owner Reassignment Update**: Updating `assessmentRequests/{id}` to change `ownerId` to another user.
8. **Assessor Feedback Forgery**: Updating `assessmentRequests/{id}` as owner to inject `assessorFeedback: 'Passed'`.
9. **Terminal State Bypass**: Updating an `assessmentRequests/{id}` whose existing status is `'Certified'` as non-admin.
10. **Denial-of-Wallet String Bomb**: Creating `certificates/{id}` with a 2MB `notes` or `previewDataUrl` string.
11. **ID Poisoning**: Creating `certificates/bad$id!!` with invalid characters or >128 chars.
12. **Blanket List Query**: Listing `skillsProfiles` or `certificates` without filtering by `ownerId == request.auth.uid` as a non-admin.
