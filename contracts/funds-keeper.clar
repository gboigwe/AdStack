;; funds-keeper.clar
;; Escrow and fund management for AdStack campaigns -- Clarity 4
;; Holds campaign budgets in escrow, manages releases to publishers,
;; and handles refund flows on campaign cancellation or expiry.
;;
;; Clarity 4 changes:
;; - as-contract removed: STX releases issued by CONTRACT_OWNER admin wallet
;; - stacks-block-time added to print events for Unix timestamp indexing

;; --- Constants ---

(define-constant CONTRACT_VERSION "4.0.0")
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u500))
(define-constant ERR_ESCROW_NOT_FOUND (err u501))
(define-constant ERR_INSUFFICIENT_BALANCE (err u502))
(define-constant ERR_ALREADY_EXISTS (err u503))
(define-constant ERR_ESCROW_CLOSED (err u504))
(define-constant ERR_INVALID_AMOUNT (err u505))
(define-constant ERR_INVALID_RECIPIENT (err u506))
(define-constant ERR_COOLDOWN_ACTIVE (err u507))
(define-constant ERR_ZERO_CAMPAIGN_ID (err u508))

;; Escrow status
(define-constant STATUS_ACTIVE u1)
(define-constant STATUS_COMPLETED u2)
(define-constant STATUS_REFUNDED u3)

;; Minimum escrow amount: 0.1 STX
(define-constant MIN_ESCROW_AMOUNT u100000)
;; Withdrawal cooldown: ~12 blocks (~2 hours)
(define-constant WITHDRAWAL_COOLDOWN u12)

;; --- Data Variables ---

(define-data-var total-escrowed uint u0)
(define-data-var total-released uint u0)
(define-data-var total-refunded uint u0)

;; --- Data Maps ---

;; Campaign escrow accounts
(define-map escrows
  { campaign-id: uint }
  {
    advertiser: principal,
    deposited: uint,
    released: uint,
    refunded: uint,
    status: uint,
    created-at: uint,
    last-release-block: uint,
  }
)

;; Per-publisher release tracking
(define-map publisher-releases
  { campaign-id: uint, publisher: principal }
  {
    total-released: uint,
    release-count: uint,
    last-release-block: uint,
  }
)

;; --- Private Functions ---

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

;; --- Read-Only Functions ---

(define-read-only (get-escrow (campaign-id uint))
  (map-get? escrows { campaign-id: campaign-id })
)

(define-read-only (get-escrow-balance (campaign-id uint))
  (match (map-get? escrows { campaign-id: campaign-id })
    escrow (ok (- (get deposited escrow) (+ (get released escrow) (get refunded escrow))))
    ERR_ESCROW_NOT_FOUND
  )
)

(define-read-only (get-publisher-release (campaign-id uint) (publisher principal))
  (default-to
    { total-released: u0, release-count: u0, last-release-block: u0 }
    (map-get? publisher-releases { campaign-id: campaign-id, publisher: publisher })
  )
)

(define-read-only (get-total-escrowed)
  (var-get total-escrowed)
)

(define-read-only (get-total-released)
  (var-get total-released)
)

(define-read-only (get-total-refunded)
  (var-get total-refunded)
)

(define-read-only (get-platform-stats)
  {
    escrowed: (var-get total-escrowed),
    released: (var-get total-released),
    refunded: (var-get total-refunded),
  }
)

(define-read-only (get-contract-version)
  CONTRACT_VERSION
)

;; --- Public Functions ---

;; Create a new escrow for a campaign (called during campaign creation)
(define-public (create-escrow (campaign-id uint) (advertiser principal) (amount uint))
  (begin
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (is-none (map-get? escrows { campaign-id: campaign-id })) ERR_ALREADY_EXISTS)
    (asserts! (>= amount MIN_ESCROW_AMOUNT) ERR_INVALID_AMOUNT)

    (map-set escrows
      { campaign-id: campaign-id }
      {
        advertiser: advertiser,
        deposited: amount,
        released: u0,
        refunded: u0,
        status: STATUS_ACTIVE,
        created-at: stacks-block-height,
        last-release-block: u0,
      }
    )

    (var-set total-escrowed (+ (var-get total-escrowed) amount))

    (print {
      event: "escrow-created",
      campaign-id: campaign-id,
      advertiser: advertiser,
      amount: amount,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; Release funds to a publisher for ad performance
(define-public (release-to-publisher
    (campaign-id uint)
    (publisher principal)
    (amount uint))
  (let (
    (escrow (unwrap! (map-get? escrows { campaign-id: campaign-id }) ERR_ESCROW_NOT_FOUND))
    (available (- (get deposited escrow) (+ (get released escrow) (get refunded escrow))))
    (pub-release (get-publisher-release campaign-id publisher))
  )
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status escrow) STATUS_ACTIVE) ERR_ESCROW_CLOSED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (asserts! (<= amount available) ERR_INSUFFICIENT_BALANCE)
    ;; Prevent release to self (advertiser cannot be publisher)
    (asserts! (not (is-eq publisher (get advertiser escrow))) ERR_INVALID_RECIPIENT)
    ;; Cooldown check: prevent rapid successive withdrawals
    (asserts! (or
      (is-eq (get last-release-block escrow) u0)
      (>= (- stacks-block-height (get last-release-block escrow)) WITHDRAWAL_COOLDOWN)
    ) ERR_COOLDOWN_ACTIVE)

    ;; Update escrow state BEFORE transfer to prevent reentrancy
    (map-set escrows
      { campaign-id: campaign-id }
      (merge escrow {
        released: (+ (get released escrow) amount),
        last-release-block: stacks-block-height,
      })
    )

    ;; Update publisher release record BEFORE transfer
    (map-set publisher-releases
      { campaign-id: campaign-id, publisher: publisher }
      {
        total-released: (+ (get total-released pub-release) amount),
        release-count: (+ (get release-count pub-release) u1),
        last-release-block: stacks-block-height,
      }
    )

    (var-set total-released (+ (var-get total-released) amount))

    ;; Clarity 4: CONTRACT_OWNER admin wallet issues the transfer
    ;; Transfer AFTER state updates to prevent reentrancy attacks
    (try! (stx-transfer? amount tx-sender publisher))

    (print {
      event: "funds-released",
      campaign-id: campaign-id,
      publisher: publisher,
      amount: amount,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)

;; Refund remaining funds to advertiser (campaign cancellation/expiry)
(define-public (refund-advertiser (campaign-id uint))
  (let (
    (escrow (unwrap! (map-get? escrows { campaign-id: campaign-id }) ERR_ESCROW_NOT_FOUND))
    (remaining (- (get deposited escrow) (+ (get released escrow) (get refunded escrow))))
  )
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status escrow) STATUS_ACTIVE) ERR_ESCROW_CLOSED)

    (if (> remaining u0)
      (begin
        ;; Update escrow state BEFORE transfer to prevent reentrancy
        (map-set escrows
          { campaign-id: campaign-id }
          (merge escrow {
            refunded: (+ (get refunded escrow) remaining),
            status: STATUS_REFUNDED,
          })
        )

        (var-set total-refunded (+ (var-get total-refunded) remaining))

        ;; Clarity 4: CONTRACT_OWNER admin wallet issues the refund transfer
        ;; Transfer AFTER state updates to prevent reentrancy attacks
        (try! (stx-transfer? remaining tx-sender (get advertiser escrow)))

        (print {
          event: "funds-refunded",
          campaign-id: campaign-id,
          advertiser: (get advertiser escrow),
          amount: remaining,
          timestamp: stacks-block-time,
        })

        (ok remaining)
      )
      (begin
        ;; No remaining funds, just close the escrow
        (map-set escrows
          { campaign-id: campaign-id }
          (merge escrow { status: STATUS_COMPLETED })
        )
        (ok u0)
      )
    )
  )
)

;; Mark escrow as completed (all funds distributed)
(define-public (complete-escrow (campaign-id uint))
  (let (
    (escrow (unwrap! (map-get? escrows { campaign-id: campaign-id }) ERR_ESCROW_NOT_FOUND))
  )
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (asserts! (is-eq (get status escrow) STATUS_ACTIVE) ERR_ESCROW_CLOSED)

    (map-set escrows
      { campaign-id: campaign-id }
      (merge escrow { status: STATUS_COMPLETED })
    )

    (print {
      event: "escrow-completed",
      campaign-id: campaign-id,
      timestamp: stacks-block-time,
    })

    (ok true)
  )
)
