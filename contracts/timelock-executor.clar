;; timelock-executor.clar
;; Timelock execution contract for governance proposals with delay and cancellation

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u12000))
(define-constant ERR_OPERATION_NOT_FOUND (err u12001))
(define-constant ERR_OPERATION_ALREADY_QUEUED (err u12002))
(define-constant ERR_OPERATION_NOT_READY (err u12003))
(define-constant ERR_OPERATION_EXPIRED (err u12004))
(define-constant ERR_OPERATION_ALREADY_EXECUTED (err u12005))
(define-constant ERR_INVALID_PARAMS (err u12006))
(define-constant ERR_EXECUTION_FAILED (err u12007))

;; Timelock parameters
(define-data-var min-delay uint u1440) ;; ~10 days in blocks
(define-data-var max-delay uint u8640) ;; ~60 days in blocks
(define-data-var grace-period uint u2880) ;; ~20 days grace period after delay
(define-data-var paused bool false)

;; Data variables
(define-data-var operation-nonce uint u0)

;; Admin roles
(define-map admins principal bool)
(define-map proposers principal bool)

;; Queued operations
(define-map operations
  { operation-id: uint }
  {
    proposer: principal,
    target-contract: principal,
    function-name: (string-ascii 128),
    params-hash: (buff 32),
    value: uint,
    queued-at: uint,
    ready-at: uint,
    expires-at: uint,
    executed: bool,
    cancelled: bool,
    description: (string-utf8 512)
  }
)

;; Operation execution history
(define-map execution-history
  { operation-id: uint }
  {
    executed-at: uint,
    executor: principal,
    success: bool,
    result-hash: (optional (buff 32))
  }
)

;; Initialize contract owner as admin and proposer
(map-set admins CONTRACT_OWNER true)
(map-set proposers CONTRACT_OWNER true)

;; Admin functions
(define-public (add-admin (admin principal))
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (map-set admins admin true)
    (ok true)
  )
)

(define-public (remove-admin (admin principal))
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (asserts! (not (is-eq admin CONTRACT_OWNER)) ERR_UNAUTHORIZED)
    (map-delete admins admin)
    (ok true)
  )
)

(define-public (add-proposer (proposer principal))
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (map-set proposers proposer true)
    (ok true)
  )
)

(define-public (remove-proposer (proposer principal))
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (map-delete proposers proposer)
    (ok true)
  )
)

;; Timelock parameter management
(define-public (set-min-delay (new-delay uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (asserts! (and (> new-delay u0) (<= new-delay (var-get max-delay))) ERR_INVALID_PARAMS)
    (var-set min-delay new-delay)
    (ok true)
  )
)

(define-public (set-max-delay (new-delay uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (asserts! (>= new-delay (var-get min-delay)) ERR_INVALID_PARAMS)
    (var-set max-delay new-delay)
    (ok true)
  )
)

(define-public (set-grace-period (new-period uint))
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (asserts! (> new-period u0) ERR_INVALID_PARAMS)
    (var-set grace-period new-period)
    (ok true)
  )
)

;; Emergency pause
(define-public (pause)
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (var-set paused true)
    (ok true)
  )
)

(define-public (unpause)
  (begin
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (var-set paused false)
    (ok true)
  )
)

;; Queue operation for timelock
(define-public (queue-operation
  (target-contract principal)
  (function-name (string-ascii 128))
  (params-hash (buff 32))
  (value uint)
  (delay uint)
  (description (string-utf8 512))
)
  (let
    (
      (operation-id (+ (var-get operation-nonce) u1))
      (current-block stacks-block-height)
      (ready-at (+ current-block delay))
      (expires-at (+ ready-at (var-get grace-period)))
    )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (is-proposer tx-sender) ERR_UNAUTHORIZED)
    (asserts! (and (>= delay (var-get min-delay)) (<= delay (var-get max-delay))) ERR_INVALID_PARAMS)

    (map-set operations
      { operation-id: operation-id }
      {
        proposer: tx-sender,
        target-contract: target-contract,
        function-name: function-name,
        params-hash: params-hash,
        value: value,
        queued-at: current-block,
        ready-at: ready-at,
        expires-at: expires-at,
        executed: false,
        cancelled: false,
        description: description
      }
    )

    (var-set operation-nonce operation-id)
    (ok operation-id)
  )
)

;; Cancel queued operation
(define-public (cancel-operation (operation-id uint))
  (let
    (
      (operation (unwrap! (map-get? operations { operation-id: operation-id }) ERR_OPERATION_NOT_FOUND))
    )
    (asserts! (or
      (is-admin tx-sender)
      (is-eq tx-sender (get proposer operation))
    ) ERR_UNAUTHORIZED)
    (asserts! (not (get executed operation)) ERR_OPERATION_ALREADY_EXECUTED)

    (map-set operations
      { operation-id: operation-id }
      (merge operation { cancelled: true })
    )
    (ok true)
  )
)

;; Execute operation after timelock
(define-public (execute-operation (operation-id uint))
  (let
    (
      (operation (unwrap! (map-get? operations { operation-id: operation-id }) ERR_OPERATION_NOT_FOUND))
      (current-block stacks-block-height)
    )
    (asserts! (not (var-get paused)) ERR_UNAUTHORIZED)
    (asserts! (not (get executed operation)) ERR_OPERATION_ALREADY_EXECUTED)
    (asserts! (not (get cancelled operation)) ERR_UNAUTHORIZED)
    (asserts! (>= current-block (get ready-at operation)) ERR_OPERATION_NOT_READY)
    (asserts! (<= current-block (get expires-at operation)) ERR_OPERATION_EXPIRED)

    ;; Mark as executed
    (map-set operations
      { operation-id: operation-id }
      (merge operation { executed: true })
    )

    ;; Record execution history
    (map-set execution-history
      { operation-id: operation-id }
      {
        executed-at: current-block,
        executor: tx-sender,
        success: true,
        result-hash: none
      }
    )

    ;; TODO: Actual contract call execution would go here
    ;; This would require dynamic contract calling which is complex in Clarity
    (ok true)
  )
)

;; Emergency execution (admin only, bypasses delay)
(define-public (emergency-execute (operation-id uint))
  (let
    (
      (operation (unwrap! (map-get? operations { operation-id: operation-id }) ERR_OPERATION_NOT_FOUND))
    )
    (asserts! (is-admin tx-sender) ERR_UNAUTHORIZED)
    (asserts! (not (get executed operation)) ERR_OPERATION_ALREADY_EXECUTED)
    (asserts! (not (get cancelled operation)) ERR_UNAUTHORIZED)

    ;; Mark as executed
    (map-set operations
      { operation-id: operation-id }
      (merge operation { executed: true })
    )

    ;; Record execution
    (map-set execution-history
      { operation-id: operation-id }
      {
        executed-at: stacks-block-height,
        executor: tx-sender,
        success: true,
        result-hash: none
      }
    )

    (ok true)
  )
)

;; Read-only functions
(define-read-only (is-admin (user principal))
  (default-to false (map-get? admins user))
)

(define-read-only (is-proposer (user principal))
  (default-to false (map-get? proposers user))
)

(define-read-only (get-operation (operation-id uint))
  (map-get? operations { operation-id: operation-id })
)

(define-read-only (get-execution-history (operation-id uint))
  (map-get? execution-history { operation-id: operation-id })
)

(define-read-only (is-operation-ready (operation-id uint))
  (match (map-get? operations { operation-id: operation-id })
    operation
      (and
        (not (get executed operation))
        (not (get cancelled operation))
        (>= stacks-block-height (get ready-at operation))
        (<= stacks-block-height (get expires-at operation))
      )
    false
  )
)

(define-read-only (get-operation-status (operation-id uint))
  (match (map-get? operations { operation-id: operation-id })
    operation
      (ok {
        executed: (get executed operation),
        cancelled: (get cancelled operation),
        ready: (>= stacks-block-height (get ready-at operation)),
        expired: (> stacks-block-height (get expires-at operation))
      })
    ERR_OPERATION_NOT_FOUND
  )
)

(define-read-only (get-timelock-params)
  (ok {
    min-delay: (var-get min-delay),
    max-delay: (var-get max-delay),
    grace-period: (var-get grace-period),
    paused: (var-get paused)
  })
)

(define-read-only (get-operation-count)
  (ok (var-get operation-nonce))
)
