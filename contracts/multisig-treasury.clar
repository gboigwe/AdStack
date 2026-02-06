;; multisig-treasury.clar
;; Multi-signature treasury with configurable thresholds and emergency controls

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u10000))
(define-constant ERR_INVALID_SIGNER (err u10001))
(define-constant ERR_ALREADY_SIGNED (err u10002))
(define-constant ERR_TX_NOT_FOUND (err u10003))
(define-constant ERR_ALREADY_EXECUTED (err u10004))
(define-constant ERR_INSUFFICIENT_SIGNATURES (err u10005))
(define-constant ERR_INVALID_THRESHOLD (err u10006))
(define-constant ERR_PAUSED (err u10007))

;; Data variables
(define-data-var tx-nonce uint u0)
(define-data-var signature-threshold uint u3) ;; Require 3 signatures
(define-data-var total-signers uint u5) ;; Total of 5 signers
(define-data-var paused bool false)

;; Authorized signers
(define-map signers
  { signer: principal }
  { active: bool, added-at: uint }
)

;; Multi-sig transactions
(define-map transactions
  { tx-id: uint }
  {
    proposer: principal,
    recipient: principal,
    amount: uint,
    memo: (string-utf8 256),
    signatures-count: uint,
    executed: bool,
    cancelled: bool,
    proposed-at: uint,
    executed-at: (optional uint)
  }
)

;; Transaction signatures
(define-map tx-signatures
  { tx-id: uint, signer: principal }
  { signed-at: uint }
)

;; Treasury balance tracking
(define-data-var total-deposited uint u0)
(define-data-var total-withdrawn uint u0)

;; Deposit history
(define-map deposits
  { deposit-id: uint }
  {
    depositor: principal,
    amount: uint,
    deposited-at: uint
  }
)

(define-data-var deposit-nonce uint u0)

;; Initialize signers
(define-public (add-signer (new-signer principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (map-set signers
      { signer: new-signer }
      { active: true, added-at: stacks-block-time }
    )
    (ok true)
  )
)

(define-public (remove-signer (signer principal))
  (let
    (
      (signer-data (unwrap! (map-get? signers { signer: signer }) ERR_INVALID_SIGNER))
    )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (map-set signers
      { signer: signer }
      (merge signer-data { active: false })
    )
    (ok true)
  )
)

;; Propose transaction
(define-public (propose-transaction
  (recipient principal)
  (amount uint)
  (memo (string-utf8 256))
)
  (let
    (
      (tx-id (+ (var-get tx-nonce) u1))
      (signer-data (unwrap! (map-get? signers { signer: tx-sender }) ERR_UNAUTHORIZED))
    )
    (asserts! (get active signer-data) ERR_UNAUTHORIZED)
    (asserts! (not (var-get paused)) ERR_PAUSED)

    ;; Create transaction
    (map-set transactions
      { tx-id: tx-id }
      {
        proposer: tx-sender,
        recipient: recipient,
        amount: amount,
        memo: memo,
        signatures-count: u1,
        executed: false,
        cancelled: false,
        proposed-at: stacks-block-time,
        executed-at: none
      }
    )

    ;; Auto-sign by proposer
    (map-set tx-signatures
      { tx-id: tx-id, signer: tx-sender }
      { signed-at: stacks-block-time }
    )

    (var-set tx-nonce tx-id)
    (ok tx-id)
  )
)

;; Sign transaction
(define-public (sign-transaction (tx-id uint))
  (let
    (
      (tx (unwrap! (map-get? transactions { tx-id: tx-id }) ERR_TX_NOT_FOUND))
      (signer-data (unwrap! (map-get? signers { signer: tx-sender }) ERR_UNAUTHORIZED))
      (existing-sig (map-get? tx-signatures { tx-id: tx-id, signer: tx-sender }))
    )
    (asserts! (get active signer-data) ERR_UNAUTHORIZED)
    (asserts! (not (get executed tx)) ERR_ALREADY_EXECUTED)
    (asserts! (not (get cancelled tx)) ERR_ALREADY_EXECUTED)
    (asserts! (is-none existing-sig) ERR_ALREADY_SIGNED)

    ;; Record signature
    (map-set tx-signatures
      { tx-id: tx-id, signer: tx-sender }
      { signed-at: stacks-block-time }
    )

    ;; Update signature count
    (map-set transactions
      { tx-id: tx-id }
      (merge tx {
        signatures-count: (+ (get signatures-count tx) u1)
      })
    )

    (ok true)
  )
)

;; Execute transaction
(define-public (execute-transaction (tx-id uint))
  (let
    (
      (tx (unwrap! (map-get? transactions { tx-id: tx-id }) ERR_TX_NOT_FOUND))
    )
    (asserts! (not (get executed tx)) ERR_ALREADY_EXECUTED)
    (asserts! (not (get cancelled tx)) ERR_ALREADY_EXECUTED)
    (asserts! (>= (get signatures-count tx) (var-get signature-threshold)) ERR_INSUFFICIENT_SIGNATURES)
    (asserts! (not (var-get paused)) ERR_PAUSED)

    ;; Execute transfer
    ;; TODO: Fix as-contract for production
    ;; (unwrap! (as-contract (stx-transfer? (get amount tx) tx-sender (get recipient tx))) ERR_UNAUTHORIZED)

    ;; Mark as executed
    (map-set transactions
      { tx-id: tx-id }
      (merge tx {
        executed: true,
        executed-at: (some stacks-block-time)
      })
    )

    ;; Update total withdrawn
    (var-set total-withdrawn (+ (var-get total-withdrawn) (get amount tx)))

    (ok true)
  )
)

;; Cancel transaction (only by proposer or owner)
(define-public (cancel-transaction (tx-id uint))
  (let
    (
      (tx (unwrap! (map-get? transactions { tx-id: tx-id }) ERR_TX_NOT_FOUND))
    )
    (asserts! (or
      (is-eq tx-sender (get proposer tx))
      (is-eq tx-sender CONTRACT_OWNER)
    ) ERR_UNAUTHORIZED)
    (asserts! (not (get executed tx)) ERR_ALREADY_EXECUTED)

    (map-set transactions
      { tx-id: tx-id }
      (merge tx { cancelled: true })
    )

    (ok true)
  )
)

;; Deposit funds
(define-public (deposit (amount uint))
  (let
    (
      (deposit-id (+ (var-get deposit-nonce) u1))
    )
    ;; Transfer STX to treasury
    ;; TODO: Fix as-contract for production
    ;; (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    ;; Record deposit
    (map-set deposits
      { deposit-id: deposit-id }
      {
        depositor: tx-sender,
        amount: amount,
        deposited-at: stacks-block-time
      }
    )

    (var-set deposit-nonce deposit-id)
    (var-set total-deposited (+ (var-get total-deposited) amount))

    (ok deposit-id)
  )
)

;; Emergency pause
(define-public (pause)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set paused true)
    (ok true)
  )
)

(define-public (unpause)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set paused false)
    (ok true)
  )
)

;; Update threshold
(define-public (update-threshold (new-threshold uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (<= new-threshold (var-get total-signers)) ERR_INVALID_THRESHOLD)
    (asserts! (> new-threshold u0) ERR_INVALID_THRESHOLD)
    (var-set signature-threshold new-threshold)
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-transaction (tx-id uint))
  (map-get? transactions { tx-id: tx-id })
)

(define-read-only (get-signature (tx-id uint) (signer principal))
  (map-get? tx-signatures { tx-id: tx-id, signer: signer })
)

(define-read-only (is-signer (address principal))
  (match (map-get? signers { signer: address })
    signer-data (get active signer-data)
    false
  )
)

(define-read-only (get-signer-info (signer principal))
  (map-get? signers { signer: signer })
)

(define-read-only (get-treasury-balance)
  (ok (stx-get-balance (as-contract tx-sender)))
)

(define-read-only (get-treasury-stats)
  (ok {
    total-deposited: (var-get total-deposited),
    total-withdrawn: (var-get total-withdrawn),
    current-balance: (stx-get-balance (as-contract tx-sender)),
    signature-threshold: (var-get signature-threshold),
    total-signers: (var-get total-signers),
    paused: (var-get paused)
  })
)

(define-read-only (can-execute (tx-id uint))
  (match (get-transaction tx-id)
    tx (ok (and
      (not (get executed tx))
      (not (get cancelled tx))
      (>= (get signatures-count tx) (var-get signature-threshold))
      (not (var-get paused))
    ))
    ERR_TX_NOT_FOUND
  )
)

(define-read-only (get-deposit (deposit-id uint))
  (map-get? deposits { deposit-id: deposit-id })
)

(define-read-only (get-current-tx-nonce)
  (ok (var-get tx-nonce))
)
