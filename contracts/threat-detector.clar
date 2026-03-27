;; threat-detector.clar
;; Fraud detection and threat monitoring for AdStack
;; Tracks suspicious activity patterns, maintains fraud scores,
;; and provides on-chain evidence for dispute resolution.

;; --- Constants ---

(define-constant CONTRACT_OWNER tx-sender)
(define-constant CONTRACT_VERSION "4.0.0")
(define-constant ERR_NOT_AUTHORIZED (err u700))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u701))
(define-constant ERR_ALREADY_FLAGGED (err u702))
(define-constant ERR_NOT_FLAGGED (err u703))
(define-constant ERR_NOT_BLOCKED (err u706))
(define-constant ERR_INVALID_SCORE (err u704))
(define-constant ERR_ACCOUNT_NOT_FOUND (err u705))

;; Threat levels
(define-constant THREAT_NONE u0)
(define-constant THREAT_LOW u1)
(define-constant THREAT_MEDIUM u2)
(define-constant THREAT_HIGH u3)
(define-constant THREAT_CRITICAL u4)

;; Flag types
(define-constant FLAG_CLICK_FRAUD u1)
(define-constant FLAG_VIEW_SPAM u2)
(define-constant FLAG_SYBIL_ATTACK u3)
(define-constant FLAG_BUDGET_DRAIN u4)
(define-constant FLAG_SUSPICIOUS_PATTERN u5)

;; Score thresholds for threat levels
(define-constant THRESHOLD_LOW u25)
(define-constant THRESHOLD_MEDIUM u50)
(define-constant THRESHOLD_HIGH u75)
(define-constant THRESHOLD_CRITICAL u90)

;; Rate limiting for flag submissions
(define-constant FLAG_COOLDOWN_BLOCKS u12) ;; ~2 hours between flags from same reporter
(define-constant ERR_FLAG_COOLDOWN (err u707))

;; --- Data Variables ---

(define-data-var total-flags uint u0)
(define-data-var total-investigations uint u0)

;; --- Data Maps ---

;; Campaign fraud scores
(define-map campaign-scores
  { campaign-id: uint }
  {
    fraud-score: uint,
    flag-count: uint,
    last-checked: uint,
    threat-level: uint,
    suspicious-views: uint,
    total-views-at-check: uint,
  }
)

;; Individual fraud flags
(define-map fraud-flags
  { campaign-id: uint, flag-index: uint }
  {
    reporter: principal,
    flag-type: uint,
    evidence-hash: (buff 32),
    reported-at: uint,
    resolved: bool,
  }
)

;; Per-account suspicious activity tracking
(define-map account-threats
  { account: principal }
  {
    total-flags-received: uint,
    total-flags-resolved: uint,
    threat-level: uint,
    last-flagged: uint,
    is-blocked: bool,
  }
)

;; Campaign flag counter for indexing
(define-map campaign-flag-counts
  { campaign-id: uint }
  { count: uint }
)

;; Track last flag submission per reporter per campaign
(define-map reporter-last-flag
  { campaign-id: uint, reporter: principal }
  { last-flag-block: uint }
)

;; --- Private Functions ---

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

(define-private (score-to-threat-level (score uint))
  (if (>= score THRESHOLD_CRITICAL)
    THREAT_CRITICAL
    (if (>= score THRESHOLD_HIGH)
      THREAT_HIGH
      (if (>= score THRESHOLD_MEDIUM)
        THREAT_MEDIUM
        (if (>= score THRESHOLD_LOW)
          THREAT_LOW
          THREAT_NONE
        )
      )
    )
  )
)

;; --- Read-Only Functions ---

(define-read-only (get-campaign-score (campaign-id uint))
  (default-to
    {
      fraud-score: u0,
      flag-count: u0,
      last-checked: u0,
      threat-level: u0,
      suspicious-views: u0,
      total-views-at-check: u0,
    }
    (map-get? campaign-scores { campaign-id: campaign-id })
  )
)

(define-read-only (get-threat-level (campaign-id uint))
  (get threat-level (get-campaign-score campaign-id))
)

(define-read-only (get-fraud-flag (campaign-id uint) (flag-index uint))
  (map-get? fraud-flags { campaign-id: campaign-id, flag-index: flag-index })
)

(define-read-only (get-account-threats (account principal))
  (default-to
    {
      total-flags-received: u0,
      total-flags-resolved: u0,
      threat-level: u0,
      last-flagged: u0,
      is-blocked: false,
    }
    (map-get? account-threats { account: account })
  )
)

(define-read-only (is-account-blocked (account principal))
  (get is-blocked (get-account-threats account))
)

(define-read-only (get-total-flags)
  (var-get total-flags)
)

(define-read-only (get-total-investigations)
  (var-get total-investigations)
)

(define-read-only (get-campaign-flag-count (campaign-id uint))
  (default-to { count: u0 } (map-get? campaign-flag-counts { campaign-id: campaign-id }))
)

(define-read-only (get-contract-version)
  CONTRACT_VERSION
)

;; --- Public Functions ---

;; Submit a fraud flag against a campaign
(define-public (submit-flag
    (campaign-id uint)
    (flag-type uint)
    (evidence-hash (buff 32)))
  (let (
    (flag-count (get count (get-campaign-flag-count campaign-id)))
    (current-score (get-campaign-score campaign-id))
  )
    ;; Validate flag type (1-5)
    (asserts! (and (>= flag-type u1) (<= flag-type u5)) ERR_INVALID_SCORE)
    ;; Validate evidence hash is not empty (all zeros)
    (asserts! (not (is-eq evidence-hash 0x0000000000000000000000000000000000000000000000000000000000000000)) ERR_INVALID_SCORE)

    ;; Rate limit: check cooldown period for this reporter on this campaign
    (let ((last-flag (default-to { last-flag-block: u0 }
            (map-get? reporter-last-flag { campaign-id: campaign-id, reporter: tx-sender }))))
      (asserts! (or
        (is-eq (get last-flag-block last-flag) u0)
        (>= (- stacks-block-height (get last-flag-block last-flag)) FLAG_COOLDOWN_BLOCKS)
      ) ERR_FLAG_COOLDOWN)
    )

    ;; Update reporter last flag time
    (map-set reporter-last-flag
      { campaign-id: campaign-id, reporter: tx-sender }
      { last-flag-block: stacks-block-height }
    )

    ;; Record the flag
    (map-set fraud-flags
      { campaign-id: campaign-id, flag-index: flag-count }
      {
        reporter: tx-sender,
        flag-type: flag-type,
        evidence-hash: evidence-hash,
        reported-at: stacks-block-height,
        resolved: false,
      }
    )

    ;; Update campaign flag count
    (map-set campaign-flag-counts
      { campaign-id: campaign-id }
      { count: (+ flag-count u1) }
    )

    ;; Update campaign score (each flag adds 10 points, capped at 100)
    (let ((new-score (if (> (+ (get fraud-score current-score) u10) u100)
            u100
            (+ (get fraud-score current-score) u10))))
      (map-set campaign-scores
        { campaign-id: campaign-id }
        (merge current-score {
          fraud-score: new-score,
          flag-count: (+ (get flag-count current-score) u1),
          last-checked: stacks-block-height,
          threat-level: (score-to-threat-level new-score),
        })
      )
    )

    (var-set total-flags (+ (var-get total-flags) u1))

    (print {
      event: "fraud-flag-submitted",
      campaign-id: campaign-id,
      reporter: tx-sender,
      flag-type: flag-type,
      timestamp: stacks-block-time,
    })

    (ok flag-count)
  )
)

;; Update campaign fraud score (admin/oracle only)
(define-public (update-campaign-score
    (campaign-id uint)
    (new-score uint)
    (suspicious-views uint)
    (total-views uint))
  (let ((current (get-campaign-score campaign-id)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (<= new-score u100) ERR_INVALID_SCORE)

    (map-set campaign-scores
      { campaign-id: campaign-id }
      (merge current {
        fraud-score: new-score,
        last-checked: stacks-block-height,
        threat-level: (score-to-threat-level new-score),
        suspicious-views: suspicious-views,
        total-views-at-check: total-views,
      })
    )

    (var-set total-investigations (+ (var-get total-investigations) u1))

    (print {
      event: "fraud-score-updated",
      campaign-id: campaign-id,
      score: new-score,
      threat-level: (score-to-threat-level new-score),
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; Block a suspicious account (admin only)
(define-public (block-account (account principal))
  (let ((threats (get-account-threats account)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)

    (map-set account-threats
      { account: account }
      (merge threats { is-blocked: true })
    )

    (print { event: "account-blocked", account: account, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Unblock an account (admin only)
(define-public (unblock-account (account principal))
  (let ((threats (get-account-threats account)))
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (get is-blocked threats) ERR_NOT_BLOCKED)

    (map-set account-threats
      { account: account }
      (merge threats { is-blocked: false })
    )

    (print { event: "account-unblocked", account: account, timestamp: stacks-block-time })
    (ok true)
  )
)

;; Resolve a fraud flag (admin only)
(define-public (resolve-flag (campaign-id uint) (flag-index uint))
  (let (
    (flag (unwrap! (map-get? fraud-flags { campaign-id: campaign-id, flag-index: flag-index }) ERR_NOT_FLAGGED))
    (current-score (get-campaign-score campaign-id))
  )
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (not (get resolved flag)) ERR_ALREADY_FLAGGED)

    ;; Mark flag as resolved
    (map-set fraud-flags
      { campaign-id: campaign-id, flag-index: flag-index }
      (merge flag { resolved: true })
    )

    ;; Reduce fraud score by 10 (min 0)
    (let ((reduced-score (if (>= (get fraud-score current-score) u10)
            (- (get fraud-score current-score) u10)
            u0)))
      (map-set campaign-scores
        { campaign-id: campaign-id }
        (merge current-score {
          fraud-score: reduced-score,
          threat-level: (score-to-threat-level reduced-score),
        })
      )
    )

    (print {
      event: "flag-resolved",
      campaign-id: campaign-id,
      flag-index: flag-index,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)
