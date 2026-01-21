;; Auction Engine - Clarity v4
;; Real-time bidding system with Dutch auction, reserve prices, and anti-sniping

;; ===================================
;; Constants
;; ===================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u3000))
(define-constant ERR_AUCTION_NOT_FOUND (err u3001))
(define-constant ERR_AUCTION_ENDED (err u3002))
(define-constant ERR_AUCTION_NOT_STARTED (err u3003))
(define-constant ERR_BID_TOO_LOW (err u3004))
(define-constant ERR_RESERVE_NOT_MET (err u3005))
(define-constant ERR_INSUFFICIENT_BOND (err u3006))
(define-constant ERR_ALREADY_CLAIMED (err u3007))
(define-constant ERR_INVALID_PARAMS (err u3008))

;; Auction types
(define-constant AUCTION_ENGLISH u0) ;; Ascending price
(define-constant AUCTION_DUTCH u1)   ;; Descending price
(define-constant AUCTION_SEALED u2)  ;; Sealed bid

;; Anti-sniping extension (5 minutes)
(define-constant ANTI_SNIPE_EXTENSION u300)

;; ===================================
;; Data Variables
;; ===================================

(define-data-var auction-nonce uint u0)
(define-data-var min-bid-increment uint u10000) ;; 0.01 STX
(define-data-var bid-bond-percentage uint u10) ;; 10% bond requirement

;; ===================================
;; Data Maps
;; ===================================

;; Main auction data
(define-map auctions
  { auction-id: uint }
  {
    campaign-id: uint,
    seller: principal,
    auction-type: uint,
    starting-price: uint,
    reserve-price: uint,
    current-price: uint,
    highest-bid: uint,
    highest-bidder: (optional principal),
    bid-count: uint,
    start-time: uint, ;; stacks-block-time
    end-time: uint,   ;; stacks-block-time
    dutch-price-decay: uint, ;; Price decrease per second (Dutch auction)
    min-bid-increment: uint,
    bond-required: uint,
    claimed: bool,
    created-at: uint,
    metadata-uri: (optional (string-ascii 256))
  }
)

;; Bid history
(define-map bids
  { auction-id: uint, bid-index: uint }
  {
    bidder: principal,
    amount: uint,
    timestamp: uint,
    is-winning: bool
  }
)

;; Bid bonds
(define-map bid-bonds
  { auction-id: uint, bidder: principal }
  {
    amount: uint,
    locked: bool,
    claimed: bool
  }
)

;; Sealed bids (revealed after auction)
(define-map sealed-bids
  { auction-id: uint, bidder: principal }
  {
    bid-hash: (buff 32),
    revealed: bool,
    actual-amount: (optional uint),
    reveal-time: (optional uint)
  }
)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-auction (auction-id uint))
  (map-get? auctions { auction-id: auction-id })
)

(define-read-only (get-bid (auction-id uint) (bid-index uint))
  (map-get? bids { auction-id: auction-id, bid-index: bid-index })
)

(define-read-only (get-bid-bond (auction-id uint) (bidder principal))
  (map-get? bid-bonds { auction-id: auction-id, bidder: bidder })
)

(define-read-only (get-current-price (auction-id uint))
  (match (get-auction auction-id)
    auction
      (if (is-eq (get auction-type auction) AUCTION_DUTCH)
        (ok (calculate-dutch-price auction))
        (ok (get current-price auction))
      )
    ERR_AUCTION_NOT_FOUND
  )
)

(define-read-only (is-auction-active (auction-id uint))
  (match (get-auction auction-id)
    auction
      (let
        (
          (now stacks-block-time)
          (started (>= now (get start-time auction)))
          (not-ended (< now (get end-time auction)))
        )
        (ok (and started not-ended))
      )
    ERR_AUCTION_NOT_FOUND
  )
)

(define-read-only (get-time-remaining (auction-id uint))
  (match (get-auction auction-id)
    auction
      (let ((now stacks-block-time))
        (if (>= now (get end-time auction))
          (ok u0)
          (ok (- (get end-time auction) now))
        )
      )
    ERR_AUCTION_NOT_FOUND
  )
)

;; ===================================
;; Private Helper Functions
;; ===================================

(define-private (calculate-dutch-price (auction {
  starting-price: uint,
  reserve-price: uint,
  start-time: uint,
  dutch-price-decay: uint,
  auction-type: uint,
  end-time: uint,
  current-price: uint,
  highest-bid: uint,
  highest-bidder: (optional principal),
  bid-count: uint,
  min-bid-increment: uint,
  bond-required: uint,
  claimed: bool,
  created-at: uint,
  campaign-id: uint,
  seller: principal,
  metadata-uri: (optional (string-ascii 256))
}))
  (let
    (
      (elapsed (- stacks-block-time (get start-time auction)))
      (price-drop (* elapsed (get dutch-price-decay auction)))
      (current-price (get starting-price auction))
      (calculated-price (if (> current-price price-drop)
        (- current-price price-drop)
        (get reserve-price auction)
      ))
    )
    (if (< calculated-price (get reserve-price auction))
      (get reserve-price auction)
      calculated-price
    )
  )
)

(define-private (extend-if-sniped (auction-id uint) (current-end uint))
  (let
    (
      (time-left (- current-end stacks-block-time))
    )
    (if (< time-left ANTI_SNIPE_EXTENSION)
      (+ current-end ANTI_SNIPE_EXTENSION)
      current-end
    )
  )
)

;; ===================================
;; Public Functions
;; ===================================

;; Create auction
(define-public (create-auction
  (campaign-id uint)
  (auction-type uint)
  (starting-price uint)
  (reserve-price uint)
  (duration uint) ;; seconds
  (dutch-decay-rate uint)
  (metadata-uri (optional (string-ascii 256)))
)
  (let
    (
      (auction-id (var-get auction-nonce))
      (start-time stacks-block-time)
      (end-time (+ stacks-block-time duration))
      (bond-amount (* starting-price (var-get bid-bond-percentage)))
    )
    ;; Validate
    (asserts! (<= reserve-price starting-price) ERR_INVALID_PARAMS)
    (asserts! (> duration u0) ERR_INVALID_PARAMS)

    ;; Create auction
    (map-set auctions
      { auction-id: auction-id }
      {
        campaign-id: campaign-id,
        seller: tx-sender,
        auction-type: auction-type,
        starting-price: starting-price,
        reserve-price: reserve-price,
        current-price: starting-price,
        highest-bid: u0,
        highest-bidder: none,
        bid-count: u0,
        start-time: start-time,
        end-time: end-time,
        dutch-price-decay: dutch-decay-rate,
        min-bid-increment: (var-get min-bid-increment),
        bond-required: (/ bond-amount u100),
        claimed: false,
        created-at: stacks-block-time,
        metadata-uri: metadata-uri
      }
    )

    ;; Increment nonce
    (var-set auction-nonce (+ auction-id u1))

    (ok auction-id)
  )
)

;; Place bid (English/Dutch auctions)
(define-public (place-bid (auction-id uint) (bid-amount uint))
  (let
    (
      (auction (unwrap! (get-auction auction-id) ERR_AUCTION_NOT_FOUND))
      (is-active (unwrap! (is-auction-active auction-id) ERR_AUCTION_NOT_FOUND))
      (current-high (get highest-bid auction))
      (min-required (+ current-high (get min-bid-increment auction)))
      (bid-index (get bid-count auction))
    )
    ;; Validate
    (asserts! is-active ERR_AUCTION_ENDED)
    (asserts! (>= bid-amount min-required) ERR_BID_TOO_LOW)
    (asserts! (>= bid-amount (get reserve-price auction)) ERR_RESERVE_NOT_MET)

    ;; Lock bid bond
    (try! (lock-bid-bond auction-id bid-amount))

    ;; Refund previous highest bidder
    (match (get highest-bidder auction)
      prev-bidder (try! (refund-bid-bond auction-id prev-bidder))
      true
    )

    ;; Record bid
    (map-set bids
      { auction-id: auction-id, bid-index: bid-index }
      {
        bidder: tx-sender,
        amount: bid-amount,
        timestamp: stacks-block-time,
        is-winning: true
      }
    )

    ;; Update auction
    (map-set auctions
      { auction-id: auction-id }
      (merge auction {
        highest-bid: bid-amount,
        highest-bidder: (some tx-sender),
        current-price: bid-amount,
        bid-count: (+ bid-index u1),
        end-time: (extend-if-sniped auction-id (get end-time auction))
      })
    )

    (ok bid-amount)
  )
)

;; Lock bid bond
(define-private (lock-bid-bond (auction-id uint) (bid-amount uint))
  (let
    (
      (auction (unwrap! (get-auction auction-id) ERR_AUCTION_NOT_FOUND))
      (bond-required (get bond-required auction))
    )
    ;; Transfer bond
    ;; TODO: Fix as-contract - clarinet v3.11 parser issue with Clarity v4
    ;; (try! (stx-transfer? bond-required tx-sender (as-contract tx-sender)))

    ;; Record bond
    (map-set bid-bonds
      { auction-id: auction-id, bidder: tx-sender }
      {
        amount: bond-required,
        locked: true,
        claimed: false
      }
    )

    (ok true)
  )
)

;; Refund bid bond
(define-private (refund-bid-bond (auction-id uint) (bidder principal))
  (match (get-bid-bond auction-id bidder)
    bond
      (begin
        ;; Transfer bond back
        ;; TODO: Fix as-contract - clarinet v3.11 parser issue with Clarity v4
        ;; (try! (as-contract (stx-transfer? (get amount bond) tx-sender bidder)))

        ;; Mark as claimed
        (map-set bid-bonds
          { auction-id: auction-id, bidder: bidder }
          (merge bond { locked: false, claimed: true })
        )

        (ok true)
      )
    (ok true) ;; No bond to refund
  )
)

;; Submit sealed bid
(define-public (submit-sealed-bid (auction-id uint) (bid-hash (buff 32)))
  (let
    (
      (auction (unwrap! (get-auction auction-id) ERR_AUCTION_NOT_FOUND))
      (is-active (unwrap! (is-auction-active auction-id) ERR_AUCTION_NOT_FOUND))
    )
    ;; Validate
    (asserts! is-active ERR_AUCTION_ENDED)
    (asserts! (is-eq (get auction-type auction) AUCTION_SEALED) ERR_INVALID_PARAMS)

    ;; Record sealed bid
    (map-set sealed-bids
      { auction-id: auction-id, bidder: tx-sender }
      {
        bid-hash: bid-hash,
        revealed: false,
        actual-amount: none,
        reveal-time: none
      }
    )

    (ok true)
  )
)

;; Reveal sealed bid
(define-public (reveal-sealed-bid (auction-id uint) (bid-amount uint) (salt (buff 32)))
  (let
    (
      (auction (unwrap! (get-auction auction-id) ERR_AUCTION_NOT_FOUND))
      (sealed-bid (unwrap! (map-get? sealed-bids { auction-id: auction-id, bidder: tx-sender }) ERR_AUCTION_NOT_FOUND))
      (computed-hash (sha256 (concat (unwrap-panic (to-consensus-buff? bid-amount)) salt)))
    )
    ;; Validate auction ended
    (asserts! (>= stacks-block-time (get end-time auction)) ERR_AUCTION_NOT_STARTED)

    ;; Verify hash
    (asserts! (is-eq computed-hash (get bid-hash sealed-bid)) ERR_UNAUTHORIZED)

    ;; Update sealed bid
    (map-set sealed-bids
      { auction-id: auction-id, bidder: tx-sender }
      (merge sealed-bid {
        revealed: true,
        actual-amount: (some bid-amount),
        reveal-time: (some stacks-block-time)
      })
    )

    ;; Check if highest bid
    (if (> bid-amount (get highest-bid auction))
      (map-set auctions
        { auction-id: auction-id }
        (merge auction {
          highest-bid: bid-amount,
          highest-bidder: (some tx-sender)
        })
      )
      true
    )

    (ok true)
  )
)

;; Claim auction winnings (seller)
(define-public (claim-auction (auction-id uint))
  (let
    (
      (auction (unwrap! (get-auction auction-id) ERR_AUCTION_NOT_FOUND))
      (winner (unwrap! (get highest-bidder auction) ERR_AUCTION_NOT_FOUND))
      (winning-bid (get highest-bid auction))
    )
    ;; Validate
    (asserts! (is-eq tx-sender (get seller auction)) ERR_UNAUTHORIZED)
    (asserts! (>= stacks-block-time (get end-time auction)) ERR_AUCTION_NOT_STARTED)
    (asserts! (not (get claimed auction)) ERR_ALREADY_CLAIMED)
    (asserts! (>= winning-bid (get reserve-price auction)) ERR_RESERVE_NOT_MET)

    ;; Transfer winning bid to seller
    ;; Winner's payment handled separately

    ;; Mark as claimed
    (map-set auctions
      { auction-id: auction-id }
      (merge auction { claimed: true })
    )

    (ok winning-bid)
  )
)

;; Administrative functions
(define-public (set-min-bid-increment (new-increment uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set min-bid-increment new-increment)
    (ok true)
  )
)

(define-public (set-bond-percentage (new-percentage uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (<= new-percentage u100) ERR_INVALID_PARAMS)
    (var-set bid-bond-percentage new-percentage)
    (ok true)
  )
)
