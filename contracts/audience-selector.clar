;; audience-selector
;; Audience targeting and segment management for AdStack campaigns.
;; Advertisers define audience segments with tag-based criteria,
;; publishers register their audience profiles, and the contract
;; provides on-chain matching for decentralized ad targeting.

;; ============================================================
;; Constants
;; ============================================================

(define-constant CONTRACT_ADMIN tx-sender)
(define-constant CONTRACT_VERSION "4.0.0")

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u800))
(define-constant ERR_NOT_FOUND (err u801))
(define-constant ERR_ALREADY_EXISTS (err u802))
(define-constant ERR_INVALID_INPUT (err u803))
(define-constant ERR_SEGMENT_FULL (err u804))
(define-constant ERR_CAMPAIGN_MISMATCH (err u805))

;; Limits
(define-constant MAX_TAGS_PER_SEGMENT u10)
(define-constant MAX_SEGMENTS_PER_CAMPAIGN u5)
(define-constant MAX_TAG_LENGTH u32)
(define-constant MAX_SEGMENT_NAME_LENGTH u64)

;; ============================================================
;; Data Variables
;; ============================================================

(define-data-var segment-counter uint u0)
(define-data-var total-segments uint u0)
(define-data-var total-publisher-profiles uint u0)

;; ============================================================
;; Data Maps
;; ============================================================

;; Audience segment definition
(define-map segments
  { segment-id: uint }
  {
    campaign-id: uint,
    creator: principal,
    name: (string-ascii 64),
    min-reputation: uint,
    require-verified: bool,
    tag-count: uint,
    created-at: uint,
    is-active: bool
  }
)

;; Tags within a segment (up to MAX_TAGS_PER_SEGMENT per segment)
(define-map segment-tags
  { segment-id: uint, tag-index: uint }
  { tag: (string-ascii 32) }
)

;; How many segments a campaign has
(define-map campaign-segment-count
  { campaign-id: uint }
  { count: uint }
)

;; Campaign -> segment ID mapping (index-based)
(define-map campaign-segments
  { campaign-id: uint, index: uint }
  { segment-id: uint }
)

;; Publisher audience profile
(define-map publisher-profiles
  { publisher: principal }
  {
    category: (string-ascii 32),
    region: (string-ascii 32),
    language: (string-ascii 16),
    audience-size: uint,
    tag-count: uint,
    registered-at: uint,
    last-updated: uint
  }
)

;; Publisher self-declared tags (up to 10)
(define-map publisher-tags
  { publisher: principal, tag-index: uint }
  { tag: (string-ascii 32) }
)

;; Pre-computed match scores (cached by admin/oracle)
(define-map match-scores
  { segment-id: uint, publisher: principal }
  { score: uint, computed-at: uint }
)

;; ============================================================
;; Private Helpers
;; ============================================================

(define-private (is-admin)
  (is-eq tx-sender CONTRACT_ADMIN)
)

(define-private (next-segment-id)
  (let ((current (var-get segment-counter)))
    (var-set segment-counter (+ current u1))
    current
  )
)

;; ============================================================
;; Public Functions -- Segment Management
;; ============================================================

;; Create a new audience segment for a campaign
(define-public (create-segment
    (campaign-id uint)
    (name (string-ascii 64))
    (min-reputation uint)
    (require-verified bool))
  (let (
    (seg-count-entry (default-to { count: u0 } (map-get? campaign-segment-count { campaign-id: campaign-id })))
    (current-count (get count seg-count-entry))
    (seg-id (next-segment-id))
  )
    ;; Validate inputs
    (asserts! (> (len name) u0) ERR_INVALID_INPUT)
    (asserts! (<= min-reputation u100) ERR_INVALID_INPUT)
    (asserts! (< current-count MAX_SEGMENTS_PER_CAMPAIGN) ERR_SEGMENT_FULL)

    ;; Store segment
    (map-set segments
      { segment-id: seg-id }
      {
        campaign-id: campaign-id,
        creator: tx-sender,
        name: name,
        min-reputation: min-reputation,
        require-verified: require-verified,
        tag-count: u0,
        created-at: stacks-block-height,
        is-active: true
      }
    )

    ;; Update campaign segment count and index
    (map-set campaign-segment-count
      { campaign-id: campaign-id }
      { count: (+ current-count u1) }
    )
    (map-set campaign-segments
      { campaign-id: campaign-id, index: current-count }
      { segment-id: seg-id }
    )

    (var-set total-segments (+ (var-get total-segments) u1))

    (print {
      event: "segment-created",
      segment-id: seg-id,
      campaign-id: campaign-id,
      creator: tx-sender,
      name: name,
      timestamp: stacks-block-time
    })

    (ok seg-id)
  )
)

;; Add a tag to an existing segment
(define-public (add-segment-tag (segment-id uint) (tag (string-ascii 32)))
  (let (
    (segment (unwrap! (map-get? segments { segment-id: segment-id }) ERR_NOT_FOUND))
    (current-tags (get tag-count segment))
  )
    ;; Only creator or admin can modify
    (asserts! (or (is-eq tx-sender (get creator segment)) (is-admin)) ERR_UNAUTHORIZED)
    (asserts! (get is-active segment) ERR_NOT_FOUND)
    (asserts! (> (len tag) u0) ERR_INVALID_INPUT)
    (asserts! (< current-tags MAX_TAGS_PER_SEGMENT) ERR_SEGMENT_FULL)

    ;; Store the tag
    (map-set segment-tags
      { segment-id: segment-id, tag-index: current-tags }
      { tag: tag }
    )

    ;; Update tag count
    (map-set segments
      { segment-id: segment-id }
      (merge segment { tag-count: (+ current-tags u1) })
    )

    (ok true)
  )
)

;; Deactivate a segment
(define-public (deactivate-segment (segment-id uint))
  (let (
    (segment (unwrap! (map-get? segments { segment-id: segment-id }) ERR_NOT_FOUND))
  )
    (asserts! (or (is-eq tx-sender (get creator segment)) (is-admin)) ERR_UNAUTHORIZED)
    (asserts! (get is-active segment) ERR_NOT_FOUND)

    (map-set segments
      { segment-id: segment-id }
      (merge segment { is-active: false })
    )

    (print { event: "segment-deactivated", segment-id: segment-id, timestamp: stacks-block-time })
    (ok true)
  )
)

;; ============================================================
;; Public Functions -- Publisher Profiles
;; ============================================================

;; Register or update a publisher's audience profile
(define-public (set-publisher-profile
    (category (string-ascii 32))
    (region (string-ascii 32))
    (language (string-ascii 16))
    (audience-size uint))
  (let (
    (existing (map-get? publisher-profiles { publisher: tx-sender }))
    (is-new (is-none existing))
  )
    (asserts! (> (len category) u0) ERR_INVALID_INPUT)
    (asserts! (> (len region) u0) ERR_INVALID_INPUT)

    (map-set publisher-profiles
      { publisher: tx-sender }
      {
        category: category,
        region: region,
        language: language,
        audience-size: audience-size,
        tag-count: (if is-new u0 (get tag-count (unwrap-panic existing))),
        registered-at: (if is-new stacks-block-height (get registered-at (unwrap-panic existing))),
        last-updated: stacks-block-height
      }
    )

    (if is-new
      (var-set total-publisher-profiles (+ (var-get total-publisher-profiles) u1))
      true
    )

    (print {
      event: "publisher-profile-updated",
      publisher: tx-sender,
      category: category,
      region: region,
      timestamp: stacks-block-time
    })

    (ok true)
  )
)

;; Add a tag to the publisher's profile
(define-public (add-publisher-tag (tag (string-ascii 32)))
  (let (
    (profile (unwrap! (map-get? publisher-profiles { publisher: tx-sender }) ERR_NOT_FOUND))
    (current-tags (get tag-count profile))
  )
    (asserts! (> (len tag) u0) ERR_INVALID_INPUT)
    (asserts! (< current-tags MAX_TAGS_PER_SEGMENT) ERR_SEGMENT_FULL)

    (map-set publisher-tags
      { publisher: tx-sender, tag-index: current-tags }
      { tag: tag }
    )

    (map-set publisher-profiles
      { publisher: tx-sender }
      (merge profile { tag-count: (+ current-tags u1), last-updated: stacks-block-height })
    )

    (ok true)
  )
)

;; ============================================================
;; Public Functions -- Match Scoring (Admin/Oracle)
;; ============================================================

;; Record a pre-computed match score between a segment and publisher
(define-public (record-match-score
    (segment-id uint)
    (publisher principal)
    (score uint))
  (begin
    (asserts! (is-admin) ERR_UNAUTHORIZED)
    (asserts! (<= score u100) ERR_INVALID_INPUT)
    (asserts! (is-some (map-get? segments { segment-id: segment-id })) ERR_NOT_FOUND)

    (map-set match-scores
      { segment-id: segment-id, publisher: publisher }
      { score: score, computed-at: stacks-block-height }
    )

    (ok true)
  )
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

(define-read-only (get-segment (segment-id uint))
  (map-get? segments { segment-id: segment-id })
)

(define-read-only (get-segment-tag (segment-id uint) (tag-index uint))
  (map-get? segment-tags { segment-id: segment-id, tag-index: tag-index })
)

(define-read-only (get-campaign-segment-count (campaign-id uint))
  (default-to u0 (get count (map-get? campaign-segment-count { campaign-id: campaign-id })))
)

(define-read-only (get-campaign-segment-id (campaign-id uint) (index uint))
  (get segment-id (map-get? campaign-segments { campaign-id: campaign-id, index: index }))
)

(define-read-only (get-publisher-profile (publisher principal))
  (map-get? publisher-profiles { publisher: publisher })
)

(define-read-only (get-publisher-tag (publisher principal) (tag-index uint))
  (map-get? publisher-tags { publisher: publisher, tag-index: tag-index })
)

(define-read-only (get-match-score (segment-id uint) (publisher principal))
  (default-to { score: u0, computed-at: u0 }
    (map-get? match-scores { segment-id: segment-id, publisher: publisher })
  )
)

(define-read-only (get-total-segments)
  (var-get total-segments)
)

(define-read-only (get-total-publisher-profiles)
  (var-get total-publisher-profiles)
)

(define-read-only (get-contract-version)
  CONTRACT_VERSION
)

;; Check if a publisher meets the basic requirements of a segment
;; (reputation threshold and verification). Tag matching is done off-chain.
(define-read-only (meets-segment-requirements
    (segment-id uint)
    (publisher principal)
    (publisher-reputation uint)
    (publisher-is-verified bool))
  (match (map-get? segments { segment-id: segment-id })
    segment
      (and
        (get is-active segment)
        (>= publisher-reputation (get min-reputation segment))
        (or (not (get require-verified segment)) publisher-is-verified)
      )
    false
  )
)
