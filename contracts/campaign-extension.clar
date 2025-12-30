;; Campaign Extension - Clarity v4
;; Manage budget top-ups, duration extensions, and mid-campaign updates

;; ===================================
;; Constants
;; ===================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u6000))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u6001))
(define-constant ERR_INVALID_AMOUNT (err u6002))
(define-constant ERR_CAMPAIGN_NOT_ACTIVE (err u6003))
(define-constant ERR_EXTENSION_LIMIT_REACHED (err u6004))
(define-constant ERR_INVALID_PARAMS (err u6005))

;; Extension limits
(define-constant MAX_EXTENSIONS u10)
(define-constant MAX_DURATION_EXTENSION u2592000) ;; 30 days in seconds

;; ===================================
;; Data Variables
;; ===================================

(define-data-var extension-nonce uint u0)

;; ===================================
;; Data Maps
;; ===================================

;; Extension records
(define-map extensions
  { extension-id: uint }
  {
    campaign-id: uint,
    extension-type: (string-ascii 20), ;; budget, duration, params
    requester: principal,
    previous-value: uint,
    new-value: uint,
    amount-added: uint, ;; For budget extensions
    created-at: uint,
    executed-at: (optional uint),
    status: (string-ascii 20) ;; pending, approved, executed, rejected
  }
)

;; Campaign extension count
(define-map campaign-extension-count
  { campaign-id: uint }
  { count: uint }
)

;; Budget top-up history
(define-map budget-topups
  { campaign-id: uint, topup-index: uint }
  {
    amount: uint,
    added-by: principal,
    timestamp: uint,
    tx-id: (optional (buff 32))
  }
)

;; Duration extension history
(define-map duration-extensions
  { campaign-id: uint, extension-index: uint }
  {
    additional-seconds: uint,
    new-end-time: uint,
    extended-by: principal,
    timestamp: uint
  }
)

;; Parameter update history
(define-map parameter-updates
  { campaign-id: uint, update-index: uint }
  {
    parameter: (string-ascii 50),
    old-value: (string-ascii 100),
    new-value: (string-ascii 100),
    updated-by: principal,
    timestamp: uint
  }
)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-extension (extension-id uint))
  (map-get? extensions { extension-id: extension-id })
)

(define-read-only (get-extension-count (campaign-id uint))
  (default-to
    { count: u0 }
    (map-get? campaign-extension-count { campaign-id: campaign-id })
  )
)

(define-read-only (get-budget-topup (campaign-id uint) (topup-index uint))
  (map-get? budget-topups { campaign-id: campaign-id, topup-index: topup-index })
)

(define-read-only (get-duration-extension (campaign-id uint) (extension-index uint))
  (map-get? duration-extensions { campaign-id: campaign-id, extension-index: extension-index })
)

(define-read-only (can-extend (campaign-id uint))
  (let
    (
      (ext-count (get count (get-extension-count campaign-id)))
    )
    (ok (< ext-count MAX_EXTENSIONS))
  )
)

;; ===================================
;; Public Functions
;; ===================================

;; Request budget top-up
(define-public (request-budget-topup
  (campaign-id uint)
  (additional-amount uint)
)
  (let
    (
      (extension-id (var-get extension-nonce))
      (ext-count (get count (get-extension-count campaign-id)))
    )
    ;; Validate
    (asserts! (> additional-amount u0) ERR_INVALID_AMOUNT)
    (asserts! (< ext-count MAX_EXTENSIONS) ERR_EXTENSION_LIMIT_REACHED)

    ;; Create extension request
    (map-set extensions
      { extension-id: extension-id }
      {
        campaign-id: campaign-id,
        extension-type: "budget",
        requester: tx-sender,
        previous-value: u0, ;; Will be filled on execution
        new-value: u0,
        amount-added: additional-amount,
        created-at: stacks-block-time,
        executed-at: none,
        status: "pending"
      }
    )

    ;; Increment counters
    (var-set extension-nonce (+ extension-id u1))
    (map-set campaign-extension-count
      { campaign-id: campaign-id }
      { count: (+ ext-count u1) }
    )

    (ok extension-id)
  )
)

;; Execute budget top-up
(define-public (execute-budget-topup (extension-id uint))
  (let
    (
      (extension (unwrap! (get-extension extension-id) ERR_CAMPAIGN_NOT_FOUND))
      (campaign-id (get campaign-id extension))
      (amount (get amount-added extension))
    )
    ;; Validate
    (asserts! (is-eq (get extension-type extension) "budget") ERR_INVALID_PARAMS)
    (asserts! (is-eq (get status extension) "pending") ERR_UNAUTHORIZED)
    (asserts! (is-eq tx-sender (get requester extension)) ERR_UNAUTHORIZED)

    ;; Transfer funds to escrow
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    ;; Update extension status
    (map-set extensions
      { extension-id: extension-id }
      (merge extension {
        executed-at: (some stacks-block-time),
        status: "executed"
      })
    )

    ;; Record top-up
    (record-budget-topup campaign-id amount)

    (ok true)
  )
)

;; Record budget top-up
(define-private (record-budget-topup (campaign-id uint) (amount uint))
  (let
    (
      (topup-index u0) ;; TODO: Track proper index
    )
    (map-set budget-topups
      { campaign-id: campaign-id, topup-index: topup-index }
      {
        amount: amount,
        added-by: tx-sender,
        timestamp: stacks-block-time,
        tx-id: none
      }
    )
    (ok true)
  )
)

;; Request duration extension
(define-public (request-duration-extension
  (campaign-id uint)
  (additional-seconds uint)
)
  (let
    (
      (extension-id (var-get extension-nonce))
      (ext-count (get count (get-extension-count campaign-id)))
    )
    ;; Validate
    (asserts! (> additional-seconds u0) ERR_INVALID_AMOUNT)
    (asserts! (<= additional-seconds MAX_DURATION_EXTENSION) ERR_INVALID_AMOUNT)
    (asserts! (< ext-count MAX_EXTENSIONS) ERR_EXTENSION_LIMIT_REACHED)

    ;; Create extension request
    (map-set extensions
      { extension-id: extension-id }
      {
        campaign-id: campaign-id,
        extension-type: "duration",
        requester: tx-sender,
        previous-value: u0, ;; Current end time
        new-value: additional-seconds,
        amount-added: u0,
        created-at: stacks-block-time,
        executed-at: none,
        status: "pending"
      }
    )

    ;; Increment counters
    (var-set extension-nonce (+ extension-id u1))
    (map-set campaign-extension-count
      { campaign-id: campaign-id }
      { count: (+ ext-count u1) }
    )

    (ok extension-id)
  )
)

;; Execute duration extension
(define-public (execute-duration-extension
  (extension-id uint)
  (current-end-time uint)
)
  (let
    (
      (extension (unwrap! (get-extension extension-id) ERR_CAMPAIGN_NOT_FOUND))
      (campaign-id (get campaign-id extension))
      (additional-seconds (get new-value extension))
      (new-end-time (+ current-end-time additional-seconds))
    )
    ;; Validate
    (asserts! (is-eq (get extension-type extension) "duration") ERR_INVALID_PARAMS)
    (asserts! (is-eq (get status extension) "pending") ERR_UNAUTHORIZED)
    (asserts! (is-eq tx-sender (get requester extension)) ERR_UNAUTHORIZED)

    ;; Update extension
    (map-set extensions
      { extension-id: extension-id }
      (merge extension {
        previous-value: current-end-time,
        executed-at: (some stacks-block-time),
        status: "executed"
      })
    )

    ;; Record extension
    (record-duration-extension campaign-id additional-seconds new-end-time)

    (ok new-end-time)
  )
)

;; Record duration extension
(define-private (record-duration-extension
  (campaign-id uint)
  (additional-seconds uint)
  (new-end-time uint)
)
  (let
    (
      (extension-index u0) ;; TODO: Track proper index
    )
    (map-set duration-extensions
      { campaign-id: campaign-id, extension-index: extension-index }
      {
        additional-seconds: additional-seconds,
        new-end-time: new-end-time,
        extended-by: tx-sender,
        timestamp: stacks-block-time
      }
    )
    (ok true)
  )
)

;; Update campaign parameters
(define-public (update-campaign-parameter
  (campaign-id uint)
  (parameter (string-ascii 50))
  (old-value (string-ascii 100))
  (new-value (string-ascii 100))
)
  (let
    (
      (update-index u0) ;; TODO: Track proper index
    )
    ;; TODO: Add campaign owner authorization

    ;; Record update
    (map-set parameter-updates
      { campaign-id: campaign-id, update-index: update-index }
      {
        parameter: parameter,
        old-value: old-value,
        new-value: new-value,
        updated-by: tx-sender,
        timestamp: stacks-block-time
      }
    )

    (ok true)
  )
)

;; Batch update multiple parameters
(define-public (batch-update-parameters
  (campaign-id uint)
  (updates (list 10 {
    parameter: (string-ascii 50),
    old-value: (string-ascii 100),
    new-value: (string-ascii 100)
  }))
)
  (begin
    ;; TODO: Add campaign owner authorization

    ;; Apply all updates
    (ok (map apply-parameter-update updates campaign-id))
  )
)

;; Helper to apply parameter update
(define-private (apply-parameter-update
  (update {
    parameter: (string-ascii 50),
    old-value: (string-ascii 100),
    new-value: (string-ascii 100)
  })
  (campaign-id uint)
)
  (let
    (
      (update-index u0) ;; TODO: Track proper index
    )
    (map-set parameter-updates
      { campaign-id: campaign-id, update-index: update-index }
      {
        parameter: (get parameter update),
        old-value: (get old-value update),
        new-value: (get new-value update),
        updated-by: tx-sender,
        timestamp: stacks-block-time
      }
    )
    true
  )
)

;; Seamless transition for extended campaigns
(define-public (transition-extended-campaign
  (campaign-id uint)
  (extension-id uint)
)
  (let
    (
      (extension (unwrap! (get-extension extension-id) ERR_CAMPAIGN_NOT_FOUND))
    )
    ;; Validate
    (asserts! (is-eq (get campaign-id extension) campaign-id) ERR_UNAUTHORIZED)
    (asserts! (is-eq (get status extension) "executed") ERR_UNAUTHORIZED)

    ;; TODO: Implement seamless state transition logic
    ;; This would coordinate with campaign-lifecycle contract

    (ok true)
  )
)

;; Approve extension (for multi-sig scenarios)
(define-public (approve-extension (extension-id uint))
  (let
    (
      (extension (unwrap! (get-extension extension-id) ERR_CAMPAIGN_NOT_FOUND))
    )
    ;; TODO: Add approval logic for multi-sig campaigns

    (map-set extensions
      { extension-id: extension-id }
      (merge extension { status: "approved" })
    )

    (ok true)
  )
)

;; Reject extension
(define-public (reject-extension (extension-id uint) (reason (string-ascii 200)))
  (let
    (
      (extension (unwrap! (get-extension extension-id) ERR_CAMPAIGN_NOT_FOUND))
    )
    ;; Only contract owner
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)

    (map-set extensions
      { extension-id: extension-id }
      (merge extension { status: "rejected" })
    )

    (ok true)
  )
)
