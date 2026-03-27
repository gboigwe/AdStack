;; user-profiles.clar
;; User registration and profile management for AdStack
;; Handles user roles, verification status, and reputation tracking.

;; --- Constants ---

(define-constant CONTRACT_VERSION "4.0.0")
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u200))
(define-constant ERR_ALREADY_REGISTERED (err u201))
(define-constant ERR_NOT_REGISTERED (err u202))
(define-constant ERR_INVALID_ROLE (err u203))
(define-constant ERR_INVALID_NAME (err u204))
(define-constant ERR_ACCOUNT_SUSPENDED (err u205))
(define-constant ERR_ALREADY_VERIFIED (err u206))
(define-constant ERR_VERIFICATION_PENDING (err u207))
(define-constant ERR_INVALID_SCORE (err u208))
(define-constant ERR_NOT_ACTIVE (err u209))

;; Role constants
(define-constant ROLE_ADVERTISER u1)
(define-constant ROLE_PUBLISHER u2)
(define-constant ROLE_VIEWER u3)

;; Status constants
(define-constant STATUS_ACTIVE u1)
(define-constant STATUS_INACTIVE u2)
(define-constant STATUS_SUSPENDED u3)

;; Verification constants
(define-constant VERIFICATION_UNVERIFIED u0)
(define-constant VERIFICATION_PENDING u1)
(define-constant VERIFICATION_VERIFIED u2)
(define-constant VERIFICATION_REJECTED u3)

;; Verification valid for ~30 days (4320 blocks)
(define-constant VERIFICATION_VALIDITY_BLOCKS u4320)

;; Maximum display name length
(define-constant MAX_NAME_LENGTH u48)

;; --- Data Variables ---

(define-data-var total-users uint u0)
(define-data-var total-advertisers uint u0)
(define-data-var total-publishers uint u0)
(define-data-var total-viewers uint u0)

;; --- Data Maps ---

(define-map profiles
  { user: principal }
  {
    display-name: (string-ascii 48),
    role: uint,
    status: uint,
    verification-status: uint,
    verification-expires: uint,
    reputation-score: uint,
    join-height: uint,
    last-active: uint,
    total-campaigns: uint,
    total-earnings: uint,
  }
)

;; Track whether an address has ever registered (prevents re-registration)
(define-map registered
  { user: principal }
  { is-registered: bool }
)

;; --- Private Functions ---

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

(define-private (is-valid-role (role uint))
  (or (is-eq role ROLE_ADVERTISER)
      (or (is-eq role ROLE_PUBLISHER)
          (is-eq role ROLE_VIEWER)))
)

(define-private (increment-role-counter (role uint))
  (if (is-eq role ROLE_ADVERTISER)
    (var-set total-advertisers (+ (var-get total-advertisers) u1))
    (if (is-eq role ROLE_PUBLISHER)
      (var-set total-publishers (+ (var-get total-publishers) u1))
      (var-set total-viewers (+ (var-get total-viewers) u1))
    )
  )
)

;; --- Read-Only Functions ---

(define-read-only (get-profile (user principal))
  (map-get? profiles { user: user })
)

(define-read-only (is-registered (user principal))
  (default-to false
    (get is-registered (map-get? registered { user: user }))
  )
)

(define-read-only (get-role (user principal))
  (match (map-get? profiles { user: user })
    profile (ok (get role profile))
    ERR_NOT_REGISTERED
  )
)

(define-read-only (is-verified (user principal))
  (match (map-get? profiles { user: user })
    profile (and
      (is-eq (get verification-status profile) VERIFICATION_VERIFIED)
      (< stacks-block-height (get verification-expires profile))
    )
    false
  )
)

(define-read-only (get-reputation (user principal))
  (match (map-get? profiles { user: user })
    profile (ok (get reputation-score profile))
    ERR_NOT_REGISTERED
  )
)

(define-read-only (get-total-users)
  (var-get total-users)
)

(define-read-only (get-user-counts)
  {
    total: (var-get total-users),
    advertisers: (var-get total-advertisers),
    publishers: (var-get total-publishers),
    viewers: (var-get total-viewers),
  }
)

(define-read-only (get-contract-version)
  CONTRACT_VERSION
)

;; --- Public Functions ---

;; Register a new user with a role and display name
(define-public (register (role uint) (display-name (string-ascii 48)))
  (begin
    ;; Validations
    (asserts! (not (is-registered tx-sender)) ERR_ALREADY_REGISTERED)
    (asserts! (is-valid-role role) ERR_INVALID_ROLE)
    (asserts! (> (len display-name) u0) ERR_INVALID_NAME)
    (asserts! (<= (len display-name) MAX_NAME_LENGTH) ERR_INVALID_NAME)

    ;; Create profile
    (map-set profiles
      { user: tx-sender }
      {
        display-name: display-name,
        role: role,
        status: STATUS_ACTIVE,
        verification-status: VERIFICATION_UNVERIFIED,
        verification-expires: u0,
        reputation-score: u50,
        join-height: stacks-block-height,
        last-active: stacks-block-height,
        total-campaigns: u0,
        total-earnings: u0,
      }
    )

    ;; Mark as registered
    (map-set registered { user: tx-sender } { is-registered: true })

    ;; Update counters
    (var-set total-users (+ (var-get total-users) u1))
    (increment-role-counter role)

    (print {
      event: "user-registered",
      user: tx-sender,
      role: role,
      display-name: display-name,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; Update display name
(define-public (update-display-name (new-name (string-ascii 48)))
  (let ((profile (unwrap! (map-get? profiles { user: tx-sender }) ERR_NOT_REGISTERED)))
    (asserts! (not (is-eq (get status profile) STATUS_SUSPENDED)) ERR_ACCOUNT_SUSPENDED)
    (asserts! (> (len new-name) u0) ERR_INVALID_NAME)
    (asserts! (<= (len new-name) MAX_NAME_LENGTH) ERR_INVALID_NAME)

    (map-set profiles
      { user: tx-sender }
      (merge profile {
        display-name: new-name,
        last-active: stacks-block-height,
      })
    )

    (print { event: "name-updated", user: tx-sender, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Request verification (sets status to pending)
(define-public (request-verification)
  (let ((profile (unwrap! (map-get? profiles { user: tx-sender }) ERR_NOT_REGISTERED)))
    (asserts! (not (is-eq (get status profile) STATUS_SUSPENDED)) ERR_ACCOUNT_SUSPENDED)
    (asserts! (is-eq (get status profile) STATUS_ACTIVE) ERR_ACCOUNT_SUSPENDED)
    (asserts! (or
      (is-eq (get verification-status profile) VERIFICATION_UNVERIFIED)
      (is-eq (get verification-status profile) VERIFICATION_REJECTED)
    ) ERR_ALREADY_VERIFIED)

    (map-set profiles
      { user: tx-sender }
      (merge profile {
        verification-status: VERIFICATION_PENDING,
        last-active: stacks-block-height,
      })
    )

    (print { event: "verification-requested", user: tx-sender, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Update activity timestamp (called by other contracts)
(define-public (update-activity (user principal))
  (let ((profile (unwrap! (map-get? profiles { user: user }) ERR_NOT_REGISTERED)))
    (map-set profiles
      { user: user }
      (merge profile { last-active: stacks-block-height })
    )
    (ok true)
  )
)

;; Increment campaign count for a user (called by promo-manager)
(define-public (increment-campaigns (user principal))
  (let ((profile (unwrap! (map-get? profiles { user: user }) ERR_NOT_REGISTERED)))
    (map-set profiles
      { user: user }
      (merge profile {
        total-campaigns: (+ (get total-campaigns profile) u1),
        last-active: stacks-block-height,
      })
    )
    (ok true)
  )
)

;; --- Admin Functions ---

;; Approve or reject verification (admin only)
(define-public (set-verification (user principal) (status uint))
  (let ((profile (unwrap! (map-get? profiles { user: user }) ERR_NOT_REGISTERED)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (or (is-eq status VERIFICATION_VERIFIED) (is-eq status VERIFICATION_REJECTED)) ERR_NOT_AUTHORIZED)

    (map-set profiles
      { user: user }
      (merge profile {
        verification-status: status,
        verification-expires: (if (is-eq status VERIFICATION_VERIFIED)
          (+ stacks-block-height VERIFICATION_VALIDITY_BLOCKS)
          u0
        ),
      })
    )

    (print { event: "verification-updated", user: user, status: status, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Suspend a user account (admin only)
(define-public (suspend-user (user principal))
  (let ((profile (unwrap! (map-get? profiles { user: user }) ERR_NOT_REGISTERED)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)

    (map-set profiles
      { user: user }
      (merge profile { status: STATUS_SUSPENDED })
    )

    (print { event: "user-suspended", user: user, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Reinstate a suspended user (admin only)
(define-public (reinstate-user (user principal))
  (let ((profile (unwrap! (map-get? profiles { user: user }) ERR_NOT_REGISTERED)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status profile) STATUS_SUSPENDED) ERR_NOT_AUTHORIZED)

    (map-set profiles
      { user: user }
      (merge profile { status: STATUS_ACTIVE })
    )

    (print { event: "user-reinstated", user: user, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Update reputation score (admin or authorized contract)
(define-public (update-reputation (user principal) (new-score uint))
  (let ((profile (unwrap! (map-get? profiles { user: user }) ERR_NOT_REGISTERED)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    ;; Clamp reputation to 0-100
    (let ((clamped-score (if (> new-score u100) u100 new-score)))
      (map-set profiles
        { user: user }
        (merge profile { reputation-score: clamped-score })
      )

      (print { event: "reputation-updated", user: user, score: clamped-score, timestamp: stacks-block-time })
      (ok true)
    )
  )
)
