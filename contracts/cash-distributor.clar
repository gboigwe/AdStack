;; cash-distributor.clar
;; Payout distribution for AdStack publisher earnings
;; Manages payout calculations, claim processing, and
;; distribution records for campaign ad revenue.

;; --- Constants ---

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u600))
(define-constant ERR_PAYOUT_NOT_FOUND (err u601))
(define-constant ERR_ALREADY_CLAIMED (err u602))
(define-constant ERR_NO_EARNINGS (err u603))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u604))
(define-constant ERR_INVALID_AMOUNT (err u605))
(define-constant ERR_PAYOUT_PAUSED (err u606))
(define-constant ERR_MIN_PAYOUT_NOT_MET (err u607))

;; Minimum payout threshold: 0.01 STX
(define-constant MIN_PAYOUT_AMOUNT u10000)
;; Platform fee: 5% (represented as 50 out of 1000)
(define-constant PLATFORM_FEE_BPS u50)
(define-constant FEE_DENOMINATOR u1000)

;; Payout status
(define-constant STATUS_PENDING u1)
(define-constant STATUS_COMPLETED u2)
(define-constant STATUS_FAILED u3)

;; --- Data Variables ---

(define-data-var payout-nonce uint u0)
(define-data-var total-payouts-processed uint u0)
(define-data-var total-distributed uint u0)
(define-data-var total-fees-collected uint u0)
(define-data-var payouts-paused bool false)

;; --- Data Maps ---

;; Publisher earnings per campaign
(define-map publisher-earnings
  { campaign-id: uint, publisher: principal }
  {
    gross-earnings: uint,
    fees-deducted: uint,
    net-earnings: uint,
    claimed: uint,
    last-updated: uint,
  }
)

;; Payout records
(define-map payouts
  { payout-id: uint }
  {
    publisher: principal,
    campaign-id: uint,
    amount: uint,
    fee: uint,
    status: uint,
    created-at: uint,
    completed-at: uint,
  }
)

;; Total earnings per publisher (across all campaigns)
(define-map publisher-totals
  { publisher: principal }
  {
    total-earned: uint,
    total-claimed: uint,
    total-fees: uint,
    payout-count: uint,
  }
)

;; --- Private Functions ---

(define-private (is-contract-owner)
  (is-eq tx-sender CONTRACT_OWNER)
)

(define-private (increment-payout-nonce)
  (let ((current (var-get payout-nonce)))
    (var-set payout-nonce (+ current u1))
    current
  )
)

(define-private (calculate-fee (amount uint))
  (/ (* amount PLATFORM_FEE_BPS) FEE_DENOMINATOR)
)

;; --- Read-Only Functions ---

(define-read-only (get-publisher-earnings (campaign-id uint) (publisher principal))
  (default-to
    {
      gross-earnings: u0,
      fees-deducted: u0,
      net-earnings: u0,
      claimed: u0,
      last-updated: u0,
    }
    (map-get? publisher-earnings { campaign-id: campaign-id, publisher: publisher })
  )
)

(define-read-only (get-payout (payout-id uint))
  (map-get? payouts { payout-id: payout-id })
)

(define-read-only (get-publisher-totals (publisher principal))
  (default-to
    {
      total-earned: u0,
      total-claimed: u0,
      total-fees: u0,
      payout-count: u0,
    }
    (map-get? publisher-totals { publisher: publisher })
  )
)

(define-read-only (get-claimable-amount (campaign-id uint) (publisher principal))
  (let ((earnings (get-publisher-earnings campaign-id publisher)))
    (- (get net-earnings earnings) (get claimed earnings))
  )
)

(define-read-only (get-total-distributed)
  (var-get total-distributed)
)

(define-read-only (get-total-fees-collected)
  (var-get total-fees-collected)
)

(define-read-only (get-payout-count)
  (var-get total-payouts-processed)
)

(define-read-only (are-payouts-paused)
  (var-get payouts-paused)
)

(define-read-only (get-distribution-stats)
  {
    total-distributed: (var-get total-distributed),
    total-fees: (var-get total-fees-collected),
    total-payouts: (var-get total-payouts-processed),
    paused: (var-get payouts-paused),
  }
)

;; --- Public Functions ---

;; Record publisher earnings for a campaign (admin or authorized contract)
(define-public (record-earnings
    (campaign-id uint)
    (publisher principal)
    (amount uint))
  (let (
    (current (get-publisher-earnings campaign-id publisher))
    (fee (calculate-fee amount))
    (net (- amount fee))
    (totals (get-publisher-totals publisher))
  )
    (asserts! (or (is-contract-owner) (is-eq contract-caller CONTRACT_OWNER)) ERR_NOT_AUTHORIZED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)

    ;; Update per-campaign earnings
    (map-set publisher-earnings
      { campaign-id: campaign-id, publisher: publisher }
      {
        gross-earnings: (+ (get gross-earnings current) amount),
        fees-deducted: (+ (get fees-deducted current) fee),
        net-earnings: (+ (get net-earnings current) net),
        claimed: (get claimed current),
        last-updated: stacks-block-height,
      }
    )

    ;; Update publisher totals
    (map-set publisher-totals
      { publisher: publisher }
      {
        total-earned: (+ (get total-earned totals) net),
        total-claimed: (get total-claimed totals),
        total-fees: (+ (get total-fees totals) fee),
        payout-count: (get payout-count totals),
      }
    )

    (var-set total-fees-collected (+ (var-get total-fees-collected) fee))

    (print {
      event: "earnings-recorded",
      campaign-id: campaign-id,
      publisher: publisher,
      gross: amount,
      fee: fee,
      net: net,
    })

    (ok net)
  )
)

;; Claim payout for a specific campaign
(define-public (claim-payout (campaign-id uint))
  (let (
    (publisher tx-sender)
    (earnings (get-publisher-earnings campaign-id publisher))
    (claimable (- (get net-earnings earnings) (get claimed earnings)))
    (payout-id (increment-payout-nonce))
    (totals (get-publisher-totals publisher))
  )
    (asserts! (not (var-get payouts-paused)) ERR_PAYOUT_PAUSED)
    (asserts! (> claimable u0) ERR_NO_EARNINGS)
    (asserts! (>= claimable MIN_PAYOUT_AMOUNT) ERR_MIN_PAYOUT_NOT_MET)

    ;; Transfer STX to publisher
    (try! (as-contract (stx-transfer? claimable tx-sender publisher)))

    ;; Update earnings claimed amount
    (map-set publisher-earnings
      { campaign-id: campaign-id, publisher: publisher }
      (merge earnings { claimed: (+ (get claimed earnings) claimable) })
    )

    ;; Create payout record
    (map-set payouts
      { payout-id: payout-id }
      {
        publisher: publisher,
        campaign-id: campaign-id,
        amount: claimable,
        fee: u0,
        status: STATUS_COMPLETED,
        created-at: stacks-block-height,
        completed-at: stacks-block-height,
      }
    )

    ;; Update publisher totals
    (map-set publisher-totals
      { publisher: publisher }
      (merge totals {
        total-claimed: (+ (get total-claimed totals) claimable),
        payout-count: (+ (get payout-count totals) u1),
      })
    )

    (var-set total-distributed (+ (var-get total-distributed) claimable))
    (var-set total-payouts-processed (+ (var-get total-payouts-processed) u1))

    (print {
      event: "payout-claimed",
      payout-id: payout-id,
      publisher: publisher,
      campaign-id: campaign-id,
      amount: claimable,
    })

    (ok payout-id)
  )
)

;; --- Admin Functions ---

;; Pause/unpause payouts
(define-public (set-payouts-paused (paused bool))
  (begin
    (asserts! (is-contract-owner) ERR_NOT_AUTHORIZED)
    (var-set payouts-paused paused)
    (print { event: "payouts-pause-toggled", paused: paused })
    (ok true)
  )
)
