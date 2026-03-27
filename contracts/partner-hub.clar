;; partner-hub
;; Partnership management for AdStack platform.
;; Tracks advertiser-publisher partnerships, commission agreements,
;; and mutual opt-in for campaign collaborations.

;; ============================================================
;; Constants
;; ============================================================

(define-constant CONTRACT_ADMIN tx-sender)
(define-constant CONTRACT_VERSION "4.0.0")

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u900))
(define-constant ERR_NOT_FOUND (err u901))
(define-constant ERR_ALREADY_EXISTS (err u902))
(define-constant ERR_INVALID_INPUT (err u903))
(define-constant ERR_SELF_PARTNER (err u904))
(define-constant ERR_INACTIVE (err u905))
(define-constant ERR_WRONG_STATUS (err u906))

;; Partnership statuses
(define-constant STATUS_PENDING u1)
(define-constant STATUS_ACTIVE u2)
(define-constant STATUS_PAUSED u3)
(define-constant STATUS_TERMINATED u4)

;; Commission limits (basis points: 100 = 1%)
(define-constant MIN_COMMISSION u100)    ;; 1%
(define-constant MAX_COMMISSION u5000)   ;; 50%
(define-constant DEFAULT_COMMISSION u1500) ;; 15%

;; ============================================================
;; Data Variables
;; ============================================================

(define-data-var partnership-counter uint u0)
(define-data-var total-active-partnerships uint u0)
(define-data-var platform-paused bool false)

;; ============================================================
;; Data Maps
;; ============================================================

;; Core partnership record
(define-map partnerships
  { partnership-id: uint }
  {
    advertiser: principal,
    publisher: principal,
    commission-rate: uint,
    status: uint,
    campaigns-shared: uint,
    total-revenue: uint,
    created-at: uint,
    last-activity: uint
  }
)

;; Lookup: advertiser + publisher -> partnership-id
(define-map partner-lookup
  { advertiser: principal, publisher: principal }
  { partnership-id: uint }
)

;; Per-partnership campaign enrollment
(define-map partnership-campaigns
  { partnership-id: uint, campaign-id: uint }
  {
    enrolled-at: uint,
    is-active: bool,
    views-generated: uint,
    revenue-earned: uint
  }
)

;; Partnership invitations (advertiser invites publisher)
(define-map invitations
  { partnership-id: uint }
  {
    message: (string-ascii 128),
    invited-at: uint,
    expires-at: uint
  }
)

;; Partner reputation scores
(define-map partner-ratings
  { partnership-id: uint, rater: principal }
  { score: uint, rated-at: uint }
)

;; ============================================================
;; Private Helpers
;; ============================================================

(define-private (is-admin)
  (is-eq tx-sender CONTRACT_ADMIN)
)

(define-private (next-partnership-id)
  (let ((current (var-get partnership-counter)))
    (var-set partnership-counter (+ current u1))
    current
  )
)

(define-private (is-partner (pid uint) (caller principal))
  (match (map-get? partnerships { partnership-id: pid })
    p (or (is-eq caller (get advertiser p)) (is-eq caller (get publisher p)))
    false
  )
)

;; ============================================================
;; Public Functions -- Partnership Lifecycle
;; ============================================================

;; Advertiser proposes a partnership with a publisher
(define-public (propose-partnership
    (publisher principal)
    (commission-rate uint)
    (message (string-ascii 128)))
  (let (
    (pid (next-partnership-id))
    (existing (map-get? partner-lookup { advertiser: tx-sender, publisher: publisher }))
  )
    ;; Validate
    (asserts! (not (var-get platform-paused)) ERR_UNAUTHORIZED)
    (asserts! (not (is-eq tx-sender publisher)) ERR_SELF_PARTNER)
    (asserts! (is-none existing) ERR_ALREADY_EXISTS)
    (asserts! (>= commission-rate MIN_COMMISSION) ERR_INVALID_INPUT)
    (asserts! (<= commission-rate MAX_COMMISSION) ERR_INVALID_INPUT)
    (asserts! (> (len message) u0) ERR_INVALID_INPUT)

    ;; Create partnership in pending state
    (map-set partnerships
      { partnership-id: pid }
      {
        advertiser: tx-sender,
        publisher: publisher,
        commission-rate: commission-rate,
        status: STATUS_PENDING,
        campaigns-shared: u0,
        total-revenue: u0,
        created-at: stacks-block-height,
        last-activity: stacks-block-height
      }
    )

    ;; Store lookup
    (map-set partner-lookup
      { advertiser: tx-sender, publisher: publisher }
      { partnership-id: pid }
    )

    ;; Store invitation
    (map-set invitations
      { partnership-id: pid }
      {
        message: message,
        invited-at: stacks-block-height,
        expires-at: (+ stacks-block-height u4320) ;; ~30 days
      }
    )

    (print {
      event: "partnership-proposed",
      partnership-id: pid,
      advertiser: tx-sender,
      publisher: publisher,
      commission-rate: commission-rate,
      timestamp: stacks-block-time
    })

    (ok pid)
  )
)

;; Publisher accepts a partnership proposal
(define-public (accept-partnership (partnership-id uint))
  (let (
    (partnership (unwrap! (map-get? partnerships { partnership-id: partnership-id }) ERR_NOT_FOUND))
    (invite (unwrap! (map-get? invitations { partnership-id: partnership-id }) ERR_NOT_FOUND))
  )
    ;; Only the invited publisher can accept
    (asserts! (is-eq tx-sender (get publisher partnership)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status partnership) STATUS_PENDING) ERR_WRONG_STATUS)
    ;; Check not expired
    (asserts! (<= stacks-block-height (get expires-at invite)) ERR_INACTIVE)

    ;; Activate partnership
    (map-set partnerships
      { partnership-id: partnership-id }
      (merge partnership {
        status: STATUS_ACTIVE,
        last-activity: stacks-block-height
      })
    )

    (var-set total-active-partnerships (+ (var-get total-active-partnerships) u1))

    (print {
      event: "partnership-accepted",
      partnership-id: partnership-id,
      publisher: tx-sender,
      timestamp: stacks-block-time
    })

    (ok true)
  )
)

;; Either partner can pause the partnership
(define-public (pause-partnership (partnership-id uint))
  (let (
    (partnership (unwrap! (map-get? partnerships { partnership-id: partnership-id }) ERR_NOT_FOUND))
  )
    (asserts! (is-partner partnership-id tx-sender) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status partnership) STATUS_ACTIVE) ERR_WRONG_STATUS)

    (map-set partnerships
      { partnership-id: partnership-id }
      (merge partnership {
        status: STATUS_PAUSED,
        last-activity: stacks-block-height
      })
    )

    ;; Guard against underflow when decrementing active count
    (if (> (var-get total-active-partnerships) u0)
      (var-set total-active-partnerships (- (var-get total-active-partnerships) u1))
      true
    )

    (print { event: "partnership-paused", partnership-id: partnership-id, paused-by: tx-sender, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Resume a paused partnership
(define-public (resume-partnership (partnership-id uint))
  (let (
    (partnership (unwrap! (map-get? partnerships { partnership-id: partnership-id }) ERR_NOT_FOUND))
  )
    (asserts! (is-partner partnership-id tx-sender) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status partnership) STATUS_PAUSED) ERR_WRONG_STATUS)

    (map-set partnerships
      { partnership-id: partnership-id }
      (merge partnership {
        status: STATUS_ACTIVE,
        last-activity: stacks-block-height
      })
    )

    (var-set total-active-partnerships (+ (var-get total-active-partnerships) u1))

    (print { event: "partnership-resumed", partnership-id: partnership-id, resumed-by: tx-sender, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Terminate a partnership (permanent)
(define-public (terminate-partnership (partnership-id uint))
  (let (
    (partnership (unwrap! (map-get? partnerships { partnership-id: partnership-id }) ERR_NOT_FOUND))
    (was-active (is-eq (get status partnership) STATUS_ACTIVE))
  )
    (asserts! (or (is-partner partnership-id tx-sender) (is-admin)) ERR_UNAUTHORIZED)
    (asserts! (not (is-eq (get status partnership) STATUS_TERMINATED)) ERR_WRONG_STATUS)

    (map-set partnerships
      { partnership-id: partnership-id }
      (merge partnership {
        status: STATUS_TERMINATED,
        last-activity: stacks-block-height
      })
    )

    (if (and was-active (> (var-get total-active-partnerships) u0))
      (var-set total-active-partnerships (- (var-get total-active-partnerships) u1))
      true
    )

    (print { event: "partnership-terminated", partnership-id: partnership-id, terminated-by: tx-sender, timestamp: stacks-block-time })
    (ok true)
  )
)

;; ============================================================
;; Public Functions -- Campaign Enrollment
;; ============================================================

;; Enroll a campaign into a partnership
(define-public (enroll-campaign (partnership-id uint) (campaign-id uint))
  (let (
    (partnership (unwrap! (map-get? partnerships { partnership-id: partnership-id }) ERR_NOT_FOUND))
  )
    (asserts! (is-eq tx-sender (get advertiser partnership)) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status partnership) STATUS_ACTIVE) ERR_INACTIVE)

    (map-set partnership-campaigns
      { partnership-id: partnership-id, campaign-id: campaign-id }
      {
        enrolled-at: stacks-block-height,
        is-active: true,
        views-generated: u0,
        revenue-earned: u0
      }
    )

    ;; Increment shared campaigns count
    (map-set partnerships
      { partnership-id: partnership-id }
      (merge partnership {
        campaigns-shared: (+ (get campaigns-shared partnership) u1),
        last-activity: stacks-block-height
      })
    )

    (print {
      event: "campaign-enrolled",
      partnership-id: partnership-id,
      campaign-id: campaign-id,
      timestamp: stacks-block-time
    })

    (ok true)
  )
)

;; Record campaign activity (admin/oracle updates revenue and views)
(define-public (record-activity
    (partnership-id uint)
    (campaign-id uint)
    (views uint)
    (revenue uint))
  (let (
    (enrollment (unwrap! (map-get? partnership-campaigns { partnership-id: partnership-id, campaign-id: campaign-id }) ERR_NOT_FOUND))
    (partnership (unwrap! (map-get? partnerships { partnership-id: partnership-id }) ERR_NOT_FOUND))
  )
    (asserts! (is-admin) ERR_UNAUTHORIZED)
    (asserts! (get is-active enrollment) ERR_INACTIVE)

    ;; Update campaign enrollment
    (map-set partnership-campaigns
      { partnership-id: partnership-id, campaign-id: campaign-id }
      (merge enrollment {
        views-generated: (+ (get views-generated enrollment) views),
        revenue-earned: (+ (get revenue-earned enrollment) revenue)
      })
    )

    ;; Update partnership total revenue
    (map-set partnerships
      { partnership-id: partnership-id }
      (merge partnership {
        total-revenue: (+ (get total-revenue partnership) revenue),
        last-activity: stacks-block-height
      })
    )

    (print {
      event: "partnership-activity-recorded",
      partnership-id: partnership-id,
      campaign-id: campaign-id,
      views: views,
      revenue: revenue,
      timestamp: stacks-block-time
    })

    (ok true)
  )
)

;; ============================================================
;; Public Functions -- Admin
;; ============================================================

(define-public (set-platform-paused (paused bool))
  (begin
    (asserts! (is-admin) ERR_UNAUTHORIZED)
    (var-set platform-paused paused)
    (print { event: "platform-pause-toggled", paused: paused, timestamp: stacks-block-time })
    (ok true)
  )
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

;; Deactivate a campaign enrollment within a partnership
(define-public (deactivate-campaign-enrollment (partnership-id uint) (campaign-id uint))
  (let (
    (enrollment (unwrap! (map-get? partnership-campaigns { partnership-id: partnership-id, campaign-id: campaign-id }) ERR_NOT_FOUND))
    (partnership (unwrap! (map-get? partnerships { partnership-id: partnership-id }) ERR_NOT_FOUND))
  )
    (asserts! (or (is-eq tx-sender (get advertiser partnership)) (is-admin)) ERR_UNAUTHORIZED)
    (asserts! (get is-active enrollment) ERR_INACTIVE)

    (map-set partnership-campaigns
      { partnership-id: partnership-id, campaign-id: campaign-id }
      (merge enrollment { is-active: false })
    )

    (print {
      event: "campaign-enrollment-deactivated",
      partnership-id: partnership-id,
      campaign-id: campaign-id,
      timestamp: stacks-block-time
    })

    (ok true)
  )
)

(define-read-only (get-partnership (partnership-id uint))
  (map-get? partnerships { partnership-id: partnership-id })
)

(define-read-only (get-partnership-by-parties (advertiser principal) (publisher principal))
  (match (map-get? partner-lookup { advertiser: advertiser, publisher: publisher })
    lookup (map-get? partnerships { partnership-id: (get partnership-id lookup) })
    none
  )
)

(define-read-only (get-partnership-id (advertiser principal) (publisher principal))
  (get partnership-id (map-get? partner-lookup { advertiser: advertiser, publisher: publisher }))
)

(define-read-only (get-invitation (partnership-id uint))
  (map-get? invitations { partnership-id: partnership-id })
)

(define-read-only (get-campaign-enrollment (partnership-id uint) (campaign-id uint))
  (map-get? partnership-campaigns { partnership-id: partnership-id, campaign-id: campaign-id })
)

(define-read-only (get-total-active-partnerships)
  (var-get total-active-partnerships)
)

(define-read-only (get-total-partnerships)
  (var-get partnership-counter)
)

(define-read-only (is-platform-paused)
  (var-get platform-paused)
)

(define-read-only (is-partnership-active (partnership-id uint))
  (match (map-get? partnerships { partnership-id: partnership-id })
    p (is-eq (get status p) STATUS_ACTIVE)
    false
  )
)

(define-read-only (get-commission-rate (partnership-id uint))
  (default-to DEFAULT_COMMISSION
    (get commission-rate (map-get? partnerships { partnership-id: partnership-id }))
  )
)

(define-read-only (get-contract-version)
  CONTRACT_VERSION
)
