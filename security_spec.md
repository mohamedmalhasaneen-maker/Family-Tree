# Family Tree Firestore Security Specification

## 1. Data Invariants
1. A family member must have a valid non-empty string name with length between 1 and 80 characters.
2. `parentId` must be a string up to 128 characters (empty string `""` for root ancestors or a valid document ID).
3. `createdBy` must match the authenticated user's UID (`request.auth.uid`).
4. Timestamps (`createdAt`, `updatedAt`) must be valid string timestamps.
5. All reads (get and list) on `/members/{memberId}` are permitted so family members can view the family tree.
6. Writes (create, update, delete) require an authenticated user with verified email.

## 2. The "Dirty Dozen" Payloads (Anti-Patterns Blocked)
1. Unauthenticated write: anonymous or unauthenticated user attempting to create a member without auth.
2. Unverified email write: user with `email_verified == false` attempting to create a member.
3. Empty name: `{ name: "", parentId: "", createdBy: "user123" }` - fails length check.
4. Excessive name length: name exceeding 80 characters.
5. Extra ghost/shadow field: `{ name: "أحمد", parentId: "", createdBy: "user123", isAdmin: true }` - fails strict keys `hasOnly` check.
6. Identity spoofing on create: `createdBy` set to someone other than `request.auth.uid`.
7. Non-string name: `{ name: 12345 }` - fails type check.
8. Non-string parentId: `{ parentId: ["invalid"] }` - fails type check.
9. Oversized parentId: `parentId` string with more than 128 characters.
10. Modifying immutable field `createdBy`: update attempting to change creator UID.
11. Modifying immutable field `createdAt`: update attempting to rewrite creation timestamp.
12. Malicious document ID: document ID containing invalid characters or oversized path variable.
