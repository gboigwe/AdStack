;; kyc-registry.clar
;; Privacy-preserving KYC storage with third-party verifier integration

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u7000))
(define-constant ERR_KYC_NOT_FOUND (err u7001))
(define-constant ERR_ALREADY_VERIFIED (err u7002))
(define-constant ERR_INVALID_VERIFIER (err u7003))
(define-constant ERR_EXPIRED (err u7004))
(define-constant ERR_INVALID_LEVEL (err u7005))

;; KYC compliance levels
(define-constant LEVEL_NONE u0)
(define-constant LEVEL_BASIC u1)
(define-constant LEVEL_STANDARD u2)
(define-constant LEVEL_ENHANCED u3)

;; Data variables
(define-data-var kyc-nonce uint u0)

;; KYC records (privacy-preserving)
(define-map kyc-records
  { user: principal }
  {
    kyc-id: uint,
    compliance-level: uint,
    document-hash: (buff 32),
    verifier: principal,
    verified-at: uint,
    expires-at: uint,
    status: (string-ascii 32),
    country-code: (string-ascii 2),
    risk-score: uint
  }
)

;; Authorized verifiers
(define-map authorized-verifiers
  { verifier: principal }
  {
    name: (string-ascii 128),
    active: bool,
    verifications-count: uint,
    approved-at: uint
  }
)

;; Verification history
(define-map verification-history
  { kyc-id: uint, timestamp: uint }
  {
    verifier: principal,
    level: uint,
    action: (string-ascii 32),
    notes: (string-ascii 256)
  }
)

;; Regulatory reporting
(define-map regulatory-reports
  { report-id: uint }
  {
    period-start: uint,
    period-end: uint,
    total-verifications: uint,
    by-level: (list 4 uint),
    generated-at: uint,
    generated-by: principal
  }
)

;; Authorization
(define-read-only (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

(define-read-only (is-authorized-verifier (verifier principal))
  (match (map-get? authorized-verifiers { verifier: verifier })
    verifier-data (get active verifier-data)
    false
  )
)

;; Add authorized verifier
(define-public (add-verifier (verifier principal) (name (string-ascii 128)))
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set authorized-verifiers
      { verifier: verifier }
      {
        name: name,
        active: true,
        verifications-count: u0,
        approved-at: stacks-block-time
      }
    )

    (ok true)
  )
)

;; Remove verifier authorization
(define-public (deactivate-verifier (verifier principal))
  (let
    (
      (verifier-data (unwrap! (map-get? authorized-verifiers { verifier: verifier }) ERR_INVALID_VERIFIER))
    )
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set authorized-verifiers
      { verifier: verifier }
      (merge verifier-data { active: false })
    )

    (ok true)
  )
)

;; Submit KYC verification
(define-public (submit-kyc-verification
  (user principal)
  (compliance-level uint)
  (document-hash (buff 32))
  (country-code (string-ascii 2))
  (risk-score uint)
  (validity-days uint)
)
  (let
    (
      (kyc-id (+ (var-get kyc-nonce) u1))
      (existing (map-get? kyc-records { user: user }))
    )
    (asserts! (is-authorized-verifier tx-sender) ERR_UNAUTHORIZED)
    (asserts! (<= compliance-level LEVEL_ENHANCED) ERR_INVALID_LEVEL)

    ;; Create or update KYC record
    (map-set kyc-records
      { user: user }
      {
        kyc-id: kyc-id,
        compliance-level: compliance-level,
        document-hash: document-hash,
        verifier: tx-sender,
        verified-at: stacks-block-time,
        expires-at: (+ stacks-block-time (* validity-days u86400)),
        status: "verified",
        country-code: country-code,
        risk-score: risk-score
      }
    )

    ;; Record verification history
    (map-set verification-history
      { kyc-id: kyc-id, timestamp: stacks-block-time }
      {
        verifier: tx-sender,
        level: compliance-level,
        action: "verified",
        notes: "KYC verification completed"
      }
    )

    ;; Update verifier count
    (match existing
      old-record (ok true)
      (begin
        (let
          (
            (verifier-data (unwrap! (map-get? authorized-verifiers { verifier: tx-sender }) ERR_INVALID_VERIFIER))
          )
          (map-set authorized-verifiers
            { verifier: tx-sender }
            (merge verifier-data {
              verifications-count: (+ (get verifications-count verifier-data) u1)
            })
          )
        )
        (var-set kyc-nonce kyc-id)
        (ok kyc-id)
      )
    )
  )
)

;; Update KYC status
(define-public (update-kyc-status
  (user principal)
  (new-status (string-ascii 32))
  (notes (string-ascii 256))
)
  (let
    (
      (kyc-record (unwrap! (map-get? kyc-records { user: user }) ERR_KYC_NOT_FOUND))
    )
    (asserts! (is-authorized-verifier tx-sender) ERR_UNAUTHORIZED)

    ;; Update status
    (map-set kyc-records
      { user: user }
      (merge kyc-record { status: new-status })
    )

    ;; Record in history
    (map-set verification-history
      { kyc-id: (get kyc-id kyc-record), timestamp: stacks-block-time }
      {
        verifier: tx-sender,
        level: (get compliance-level kyc-record),
        action: "status_update",
        notes: notes
      }
    )

    (ok true)
  )
)

;; Renew KYC verification
(define-public (renew-kyc (user principal) (additional-days uint))
  (let
    (
      (kyc-record (unwrap! (map-get? kyc-records { user: user }) ERR_KYC_NOT_FOUND))
    )
    (asserts! (is-authorized-verifier tx-sender) ERR_UNAUTHORIZED)

    ;; Extend expiration
    (map-set kyc-records
      { user: user }
      (merge kyc-record {
        expires-at: (+ (get expires-at kyc-record) (* additional-days u86400)),
        verified-at: stacks-block-time
      })
    )

    ;; Record renewal
    (map-set verification-history
      { kyc-id: (get kyc-id kyc-record), timestamp: stacks-block-time }
      {
        verifier: tx-sender,
        level: (get compliance-level kyc-record),
        action: "renewed",
        notes: "KYC verification renewed"
      }
    )

    (ok true)
  )
)

;; Flag KYC for review
(define-public (flag-kyc-for-review
  (user principal)
  (reason (string-ascii 256))
)
  (let
    (
      (kyc-record (unwrap! (map-get? kyc-records { user: user }) ERR_KYC_NOT_FOUND))
    )
    (asserts! (is-authorized-verifier tx-sender) ERR_UNAUTHORIZED)

    ;; Update status
    (map-set kyc-records
      { user: user }
      (merge kyc-record { status: "under_review" })
    )

    ;; Record flag
    (map-set verification-history
      { kyc-id: (get kyc-id kyc-record), timestamp: stacks-block-time }
      {
        verifier: tx-sender,
        level: (get compliance-level kyc-record),
        action: "flagged",
        notes: reason
      }
    )

    (ok true)
  )
)

;; Generate regulatory report
(define-public (generate-regulatory-report
  (report-id uint)
  (period-start uint)
  (period-end uint)
  (total-verifications uint)
  (by-level (list 4 uint))
)
  (begin
    (asserts! (is-contract-owner) ERR_UNAUTHORIZED)

    (map-set regulatory-reports
      { report-id: report-id }
      {
        period-start: period-start,
        period-end: period-end,
        total-verifications: total-verifications,
        by-level: by-level,
        generated-at: stacks-block-time,
        generated-by: tx-sender
      }
    )

    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-kyc-record (user principal))
  (map-get? kyc-records { user: user })
)

(define-read-only (get-verifier (verifier principal))
  (map-get? authorized-verifiers { verifier: verifier })
)

(define-read-only (get-verification-history (kyc-id uint) (timestamp uint))
  (map-get? verification-history { kyc-id: kyc-id, timestamp: timestamp })
)

(define-read-only (get-regulatory-report (report-id uint))
  (map-get? regulatory-reports { report-id: report-id })
)

(define-read-only (is-kyc-valid (user principal))
  (match (map-get? kyc-records { user: user })
    kyc-record
      (and
        (is-eq (get status kyc-record) "verified")
        (> (get expires-at kyc-record) stacks-block-time)
      )
    false
  )
)

(define-read-only (get-compliance-level (user principal))
  (match (map-get? kyc-records { user: user })
    kyc-record (ok (get compliance-level kyc-record))
    ERR_KYC_NOT_FOUND
  )
)

(define-read-only (get-risk-score (user principal))
  (match (map-get? kyc-records { user: user })
    kyc-record (ok (get risk-score kyc-record))
    ERR_KYC_NOT_FOUND
  )
)
