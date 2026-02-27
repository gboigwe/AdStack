;; title: evidence-vault
;; version: 1.0.0
;; summary: Encrypted evidence storage with hash verification and access control

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u600))
(define-constant err-not-found (err u601))
(define-constant err-unauthorized (err u602))
(define-constant err-already-exists (err u603))
(define-constant err-invalid-hash (err u604))
(define-constant err-case-sealed (err u605))
(define-constant err-evidence-limit (err u606))
(define-constant err-invalid-type (err u607))
(define-constant err-access-denied (err u608))
(define-constant err-expired (err u609))
(define-constant err-tampered (err u610))
(define-constant err-not-sealed (err u611))

(define-constant EVIDENCE-DOCUMENT u1)
(define-constant EVIDENCE-SCREENSHOT u2)
(define-constant EVIDENCE-TRANSACTION u3)
(define-constant EVIDENCE-COMMUNICATION u4)
(define-constant EVIDENCE-ANALYTICS u5)
(define-constant EVIDENCE-WITNESS u6)

(define-constant ACCESS-PARTIES u1)
(define-constant ACCESS-ARBITRATOR u2)
(define-constant ACCESS-PUBLIC u3)

(define-data-var evidence-nonce uint u0)
(define-data-var total-submissions uint u0)
(define-data-var total-verified uint u0)
(define-data-var max-evidence-per-case uint u20)
(define-data-var max-file-size uint u10485760)
(define-data-var evidence-retention-blocks uint u525600)

(define-map evidence-items
    { evidence-id: uint }
    {
        case-id: uint,
        submitter: principal,
        evidence-type: uint,
        content-hash: (buff 32),
        encryption-key-hash: (buff 32),
        ipfs-cid: (string-ascii 64),
        file-size: uint,
        description: (string-utf8 300),
        submitted-at: uint,
        verified: bool,
        verified-by: (optional principal),
        verified-at: uint,
        access-level: uint
    }
)

(define-map case-evidence-index
    { case-id: uint }
    {
        total-items: uint,
        sealed: bool,
        sealed-at: uint,
        sealed-by: (optional principal)
    }
)

(define-map evidence-by-case
    { case-id: uint, index: uint }
    { evidence-id: uint }
)

(define-map access-grants
    { evidence-id: uint, grantee: principal }
    {
        granted-by: principal,
        granted-at: uint,
        expires-at: uint,
        revoked: bool
    }
)

(define-map evidence-challenges
    { evidence-id: uint }
    {
        challenger: principal,
        reason: (string-utf8 300),
        challenged-at: uint,
        resolved: bool,
        upheld: bool
    }
)

(define-map case-evidence-summary
    { case-id: uint }
    {
        documents: uint,
        screenshots: uint,
        transactions: uint,
        communications: uint,
        analytics-data: uint,
        witness-statements: uint,
        total-size: uint,
        last-submitted: uint
    }
)

(define-map integrity-checkpoints
    { evidence-id: uint, checkpoint: uint }
    {
        hash-at-checkpoint: (buff 32),
        checked-by: principal,
        checked-at: uint,
        matches-original: bool
    }
)

(define-map checkpoint-count
    { evidence-id: uint }
    { total: uint }
)

(define-private (is-valid-evidence-type (etype uint))
    (and (>= etype EVIDENCE-DOCUMENT) (<= etype EVIDENCE-WITNESS))
)

(define-private (is-valid-access-level (level uint))
    (and (>= level ACCESS-PARTIES) (<= level ACCESS-PUBLIC))
)

(define-private (increment-type-count (case-id uint) (etype uint))
    (let
        (
            (summary (default-to
                { documents: u0, screenshots: u0, transactions: u0, communications: u0, analytics-data: u0, witness-statements: u0, total-size: u0, last-submitted: u0 }
                (map-get? case-evidence-summary { case-id: case-id })))
        )
        (map-set case-evidence-summary
            { case-id: case-id }
            (merge summary
                (if (is-eq etype EVIDENCE-DOCUMENT)
                    { documents: (+ (get documents summary) u1), last-submitted: stacks-block-time }
                    (if (is-eq etype EVIDENCE-SCREENSHOT)
                        { screenshots: (+ (get screenshots summary) u1), last-submitted: stacks-block-time }
                        (if (is-eq etype EVIDENCE-TRANSACTION)
                            { transactions: (+ (get transactions summary) u1), last-submitted: stacks-block-time }
                            (if (is-eq etype EVIDENCE-COMMUNICATION)
                                { communications: (+ (get communications summary) u1), last-submitted: stacks-block-time }
                                (if (is-eq etype EVIDENCE-ANALYTICS)
                                    { analytics-data: (+ (get analytics-data summary) u1), last-submitted: stacks-block-time }
                                    { witness-statements: (+ (get witness-statements summary) u1), last-submitted: stacks-block-time }
                                )
                            )
                        )
                    )
                )
            )
        )
    )
)

(define-read-only (get-evidence (evidence-id uint))
    (map-get? evidence-items { evidence-id: evidence-id })
)

(define-read-only (get-case-evidence-index (case-id uint))
    (default-to
        { total-items: u0, sealed: false, sealed-at: u0, sealed-by: none }
        (map-get? case-evidence-index { case-id: case-id })
    )
)

(define-read-only (get-evidence-by-case (case-id uint) (index uint))
    (map-get? evidence-by-case { case-id: case-id, index: index })
)

(define-read-only (get-access-grant (evidence-id uint) (grantee principal))
    (map-get? access-grants { evidence-id: evidence-id, grantee: grantee })
)

(define-read-only (get-evidence-challenge (evidence-id uint))
    (map-get? evidence-challenges { evidence-id: evidence-id })
)

(define-read-only (get-case-evidence-summary (case-id uint))
    (default-to
        { documents: u0, screenshots: u0, transactions: u0, communications: u0, analytics-data: u0, witness-statements: u0, total-size: u0, last-submitted: u0 }
        (map-get? case-evidence-summary { case-id: case-id })
    )
)

(define-read-only (get-integrity-checkpoint (evidence-id uint) (checkpoint uint))
    (map-get? integrity-checkpoints { evidence-id: evidence-id, checkpoint: checkpoint })
)

(define-read-only (get-checkpoint-count (evidence-id uint))
    (default-to { total: u0 } (map-get? checkpoint-count { evidence-id: evidence-id }))
)

(define-read-only (get-evidence-nonce)
    (var-get evidence-nonce)
)

(define-read-only (get-total-submissions)
    (var-get total-submissions)
)

(define-read-only (get-total-verified)
    (var-get total-verified)
)

(define-read-only (is-case-sealed (case-id uint))
    (get sealed (get-case-evidence-index case-id))
)

(define-read-only (has-access (evidence-id uint) (who principal))
    (match (map-get? evidence-items { evidence-id: evidence-id })
        ev (if (is-eq (get access-level ev) ACCESS-PUBLIC)
            true
            (if (is-eq (get submitter ev) who)
                true
                (match (map-get? access-grants { evidence-id: evidence-id, grantee: who })
                    grant (and (not (get revoked grant)) (< stacks-block-time (get expires-at grant)))
                    false
                )
            )
        )
        false
    )
)

(define-public (submit-evidence
    (case-id uint)
    (evidence-type uint)
    (content-hash (buff 32))
    (encryption-key-hash (buff 32))
    (ipfs-cid (string-ascii 64))
    (file-size uint)
    (description (string-utf8 300))
    (access-level uint)
)
    (let
        (
            (ev-id (+ (var-get evidence-nonce) u1))
            (case-index (get-case-evidence-index case-id))
        )
        (asserts! (is-valid-evidence-type evidence-type) err-invalid-type)
        (asserts! (is-valid-access-level access-level) err-access-denied)
        (asserts! (not (get sealed case-index)) err-case-sealed)
        (asserts! (< (get total-items case-index) (var-get max-evidence-per-case)) err-evidence-limit)
        (asserts! (<= file-size (var-get max-file-size)) err-evidence-limit)
        (asserts! (> (len content-hash) u0) err-invalid-hash)

        (map-set evidence-items
            { evidence-id: ev-id }
            {
                case-id: case-id,
                submitter: tx-sender,
                evidence-type: evidence-type,
                content-hash: content-hash,
                encryption-key-hash: encryption-key-hash,
                ipfs-cid: ipfs-cid,
                file-size: file-size,
                description: description,
                submitted-at: stacks-block-time,
                verified: false,
                verified-by: none,
                verified-at: u0,
                access-level: access-level
            }
        )

        (map-set evidence-by-case
            { case-id: case-id, index: (get total-items case-index) }
            { evidence-id: ev-id }
        )

        (map-set case-evidence-index
            { case-id: case-id }
            (merge case-index { total-items: (+ (get total-items case-index) u1) })
        )

        (let
            (
                (summary (get-case-evidence-summary case-id))
            )
            (map-set case-evidence-summary
                { case-id: case-id }
                (merge summary { total-size: (+ (get total-size summary) file-size) })
            )
        )
        (increment-type-count case-id evidence-type)

        (var-set evidence-nonce ev-id)
        (var-set total-submissions (+ (var-get total-submissions) u1))
        (ok ev-id)
    )
)

(define-public (verify-evidence (evidence-id uint) (expected-hash (buff 32)))
    (let
        (
            (ev (unwrap! (map-get? evidence-items { evidence-id: evidence-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-eq (get content-hash ev) expected-hash) err-tampered)

        (map-set evidence-items
            { evidence-id: evidence-id }
            (merge ev {
                verified: true,
                verified-by: (some tx-sender),
                verified-at: stacks-block-time
            })
        )

        (var-set total-verified (+ (var-get total-verified) u1))
        (ok true)
    )
)

(define-public (grant-access (evidence-id uint) (grantee principal) (duration-blocks uint))
    (let
        (
            (ev (unwrap! (map-get? evidence-items { evidence-id: evidence-id }) err-not-found))
        )
        (asserts! (or
            (is-eq tx-sender (get submitter ev))
            (is-eq tx-sender contract-owner)
        ) err-unauthorized)

        (map-set access-grants
            { evidence-id: evidence-id, grantee: grantee }
            {
                granted-by: tx-sender,
                granted-at: stacks-block-time,
                expires-at: (+ stacks-block-time duration-blocks),
                revoked: false
            }
        )

        (ok true)
    )
)

(define-public (revoke-access (evidence-id uint) (grantee principal))
    (let
        (
            (ev (unwrap! (map-get? evidence-items { evidence-id: evidence-id }) err-not-found))
            (grant (unwrap! (map-get? access-grants { evidence-id: evidence-id, grantee: grantee }) err-not-found))
        )
        (asserts! (or
            (is-eq tx-sender (get submitter ev))
            (is-eq tx-sender contract-owner)
        ) err-unauthorized)

        (map-set access-grants
            { evidence-id: evidence-id, grantee: grantee }
            (merge grant { revoked: true })
        )

        (ok true)
    )
)

(define-public (seal-case-evidence (case-id uint))
    (let
        (
            (case-index (get-case-evidence-index case-id))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (not (get sealed case-index)) err-case-sealed)

        (map-set case-evidence-index
            { case-id: case-id }
            (merge case-index {
                sealed: true,
                sealed-at: stacks-block-time,
                sealed-by: (some tx-sender)
            })
        )

        (ok true)
    )
)

(define-public (unseal-case-evidence (case-id uint))
    (let
        (
            (case-index (get-case-evidence-index case-id))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (get sealed case-index) err-not-sealed)

        (map-set case-evidence-index
            { case-id: case-id }
            (merge case-index {
                sealed: false,
                sealed-at: u0,
                sealed-by: none
            })
        )

        (ok true)
    )
)

(define-public (challenge-evidence (evidence-id uint) (reason (string-utf8 300)))
    (let
        (
            (ev (unwrap! (map-get? evidence-items { evidence-id: evidence-id }) err-not-found))
        )
        (asserts! (not (is-eq tx-sender (get submitter ev))) err-unauthorized)
        (asserts! (is-none (map-get? evidence-challenges { evidence-id: evidence-id })) err-already-exists)

        (map-set evidence-challenges
            { evidence-id: evidence-id }
            {
                challenger: tx-sender,
                reason: reason,
                challenged-at: stacks-block-time,
                resolved: false,
                upheld: false
            }
        )

        (ok true)
    )
)

(define-public (resolve-challenge (evidence-id uint) (upheld bool))
    (let
        (
            (challenge (unwrap! (map-get? evidence-challenges { evidence-id: evidence-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (not (get resolved challenge)) err-already-exists)

        (map-set evidence-challenges
            { evidence-id: evidence-id }
            (merge challenge {
                resolved: true,
                upheld: upheld
            })
        )

        (ok upheld)
    )
)

(define-public (create-integrity-checkpoint (evidence-id uint) (current-hash (buff 32)))
    (let
        (
            (ev (unwrap! (map-get? evidence-items { evidence-id: evidence-id }) err-not-found))
            (count-data (get-checkpoint-count evidence-id))
            (cp (+ (get total count-data) u1))
            (matches (is-eq (get content-hash ev) current-hash))
        )

        (map-set integrity-checkpoints
            { evidence-id: evidence-id, checkpoint: cp }
            {
                hash-at-checkpoint: current-hash,
                checked-by: tx-sender,
                checked-at: stacks-block-time,
                matches-original: matches
            }
        )

        (map-set checkpoint-count
            { evidence-id: evidence-id }
            { total: cp }
        )

        (ok matches)
    )
)

(define-public (set-max-evidence-per-case (max-val uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set max-evidence-per-case max-val)
        (ok true)
    )
)

(define-public (set-max-file-size (size uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set max-file-size size)
        (ok true)
    )
)

(define-public (set-evidence-retention (blocks uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set evidence-retention-blocks blocks)
        (ok true)
    )
)
