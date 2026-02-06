;; creative-marketplace.clar
;; Marketplace for buying, selling, and licensing ad creative NFTs

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u21000))
(define-constant ERR_NOT_FOUND (err u21001))
(define-constant ERR_ALREADY_LISTED (err u21002))
(define-constant ERR_INVALID_PRICE (err u21003))
(define-constant ERR_AUCTION_ACTIVE (err u21004))
(define-constant ERR_AUCTION_EXPIRED (err u21005))
(define-constant ERR_BID_TOO_LOW (err u21006))
(define-constant ERR_LISTING_EXPIRED (err u21007))

;; Marketplace fee (2.5%)
(define-data-var marketplace-fee-percentage uint u25) ;; 2.5% = 25/1000
(define-data-var total-volume uint u0)
(define-data-var total-listings uint u0)
(define-data-var total-sales uint u0)

;; Fixed Price Listings
(define-map listings
  { token-id: uint }
  {
    seller: principal,
    price: uint,
    listed-at: uint,
    expires-at: uint,
    active: bool
  }
)

;; Auction Listings
(define-map auctions
  { token-id: uint }
  {
    seller: principal,
    min-bid: uint,
    current-bid: uint,
    current-bidder: (optional principal),
    started-at: uint,
    ends-at: uint,
    active: bool
  }
)

;; License Offers (temporary usage rights)
(define-map license-offers
  { token-id: uint }
  {
    licensor: principal,
    price-per-day: uint,
    max-duration: uint,
    commercial-allowed: bool,
    active: bool
  }
)

;; Active Licenses
(define-map active-licenses
  { token-id: uint, licensee: principal }
  {
    start-block: uint,
    end-block: uint,
    price-paid: uint,
    commercial: bool
  }
)

;; Sales History
(define-map sales-history
  { token-id: uint, sale-id: uint }
  {
    seller: principal,
    buyer: principal,
    price: uint,
    timestamp: uint,
    sale-type: (string-ascii 16) ;; "fixed", "auction", "license"
  }
)

(define-data-var sale-nonce uint u0)

;; Fixed Price Listing Functions

(define-public (list-for-sale (token-id uint) (price uint) (duration uint))
  (let
    (
      (nft-owner (unwrap! (contract-call? .ad-creative-nft get-owner token-id) ERR_NOT_FOUND))
    )
    (asserts! (is-eq tx-sender (unwrap! nft-owner ERR_UNAUTHORIZED)) ERR_UNAUTHORIZED)
    (asserts! (> price u0) ERR_INVALID_PRICE)
    (asserts! (is-none (map-get? listings { token-id: token-id })) ERR_ALREADY_LISTED)

    (map-set listings
      { token-id: token-id }
      {
        seller: tx-sender,
        price: price,
        listed-at: stacks-block-height,
        expires-at: (+ stacks-block-height duration),
        active: true
      }
    )

    (var-set total-listings (+ (var-get total-listings) u1))
    (ok true)
  )
)

(define-public (cancel-listing (token-id uint))
  (let
    (
      (listing (unwrap! (map-get? listings { token-id: token-id }) ERR_NOT_FOUND))
    )
    (asserts! (is-eq tx-sender (get seller listing)) ERR_UNAUTHORIZED)
    (asserts! (get active listing) ERR_NOT_FOUND)

    (map-set listings
      { token-id: token-id }
      (merge listing { active: false })
    )
    (ok true)
  )
)

(define-public (buy-now (token-id uint))
  (let
    (
      (listing (unwrap! (map-get? listings { token-id: token-id }) ERR_NOT_FOUND))
      (price (get price listing))
      (seller (get seller listing))
      (marketplace-fee (/ (* price (var-get marketplace-fee-percentage)) u1000))
      (seller-proceeds (- price marketplace-fee))
    )
    (asserts! (get active listing) ERR_NOT_FOUND)
    (asserts! (<= stacks-block-height (get expires-at listing)) ERR_LISTING_EXPIRED)

    ;; Transfer marketplace fee to contract owner
    (try! (stx-transfer? marketplace-fee tx-sender CONTRACT_OWNER))

    ;; Transfer proceeds to seller
    (try! (stx-transfer? seller-proceeds tx-sender seller))

    ;; Transfer NFT to buyer (with royalty handled by NFT contract)
    (try! (contract-call? .ad-creative-nft sell-with-royalty token-id tx-sender price))

    ;; Deactivate listing
    (map-set listings
      { token-id: token-id }
      (merge listing { active: false })
    )

    ;; Record sale
    (record-sale token-id seller tx-sender price "fixed")

    ;; Update stats
    (var-set total-volume (+ (var-get total-volume) price))
    (var-set total-sales (+ (var-get total-sales) u1))

    (ok true)
  )
)

;; Auction Functions

(define-public (create-auction (token-id uint) (min-bid uint) (duration uint))
  (let
    (
      (nft-owner (unwrap! (contract-call? .ad-creative-nft get-owner token-id) ERR_NOT_FOUND))
    )
    (asserts! (is-eq tx-sender (unwrap! nft-owner ERR_UNAUTHORIZED)) ERR_UNAUTHORIZED)
    (asserts! (> min-bid u0) ERR_INVALID_PRICE)
    (asserts! (is-none (map-get? auctions { token-id: token-id })) ERR_ALREADY_LISTED)

    (map-set auctions
      { token-id: token-id }
      {
        seller: tx-sender,
        min-bid: min-bid,
        current-bid: u0,
        current-bidder: none,
        started-at: stacks-block-height,
        ends-at: (+ stacks-block-height duration),
        active: true
      }
    )

    (ok true)
  )
)

(define-public (place-bid (token-id uint) (bid-amount uint))
  (let
    (
      (auction (unwrap! (map-get? auctions { token-id: token-id }) ERR_NOT_FOUND))
      (current-bid (get current-bid auction))
      (current-bidder (get current-bidder auction))
    )
    (asserts! (get active auction) ERR_NOT_FOUND)
    (asserts! (<= stacks-block-height (get ends-at auction)) ERR_AUCTION_EXPIRED)
    (asserts! (>= bid-amount (get min-bid auction)) ERR_BID_TOO_LOW)
    (asserts! (> bid-amount current-bid) ERR_BID_TOO_LOW)

    ;; Return previous bid if exists
    (match current-bidder
      prev-bidder (try! (stx-transfer? current-bid tx-sender prev-bidder))
      true
    )

    ;; Hold new bid in contract
    (try! (stx-transfer? bid-amount tx-sender (as-contract tx-sender)))

    ;; Update auction
    (map-set auctions
      { token-id: token-id }
      (merge auction {
        current-bid: bid-amount,
        current-bidder: (some tx-sender)
      })
    )

    (ok true)
  )
)

(define-public (complete-auction (token-id uint))
  (let
    (
      (auction (unwrap! (map-get? auctions { token-id: token-id }) ERR_NOT_FOUND))
      (winner (unwrap! (get current-bidder auction) ERR_NOT_FOUND))
      (winning-bid (get current-bid auction))
      (seller (get seller auction))
      (marketplace-fee (/ (* winning-bid (var-get marketplace-fee-percentage)) u1000))
      (seller-proceeds (- winning-bid marketplace-fee))
    )
    (asserts! (get active auction) ERR_NOT_FOUND)
    (asserts! (> stacks-block-height (get ends-at auction)) ERR_AUCTION_ACTIVE)
    (asserts! (> winning-bid u0) ERR_NOT_FOUND)

    ;; Transfer marketplace fee
    (try! (as-contract (stx-transfer? marketplace-fee tx-sender CONTRACT_OWNER)))

    ;; Transfer proceeds to seller
    (try! (as-contract (stx-transfer? seller-proceeds tx-sender seller)))

    ;; Transfer NFT to winner
    (try! (contract-call? .ad-creative-nft sell-with-royalty token-id winner winning-bid))

    ;; Deactivate auction
    (map-set auctions
      { token-id: token-id }
      (merge auction { active: false })
    )

    ;; Record sale
    (record-sale token-id seller winner winning-bid "auction")

    ;; Update stats
    (var-set total-volume (+ (var-get total-volume) winning-bid))
    (var-set total-sales (+ (var-get total-sales) u1))

    (ok true)
  )
)

;; License Functions

(define-public (offer-license
  (token-id uint)
  (price-per-day uint)
  (max-duration uint)
  (commercial-allowed bool)
)
  (let
    (
      (nft-owner (unwrap! (contract-call? .ad-creative-nft get-owner token-id) ERR_NOT_FOUND))
    )
    (asserts! (is-eq tx-sender (unwrap! nft-owner ERR_UNAUTHORIZED)) ERR_UNAUTHORIZED)
    (asserts! (> price-per-day u0) ERR_INVALID_PRICE)

    (map-set license-offers
      { token-id: token-id }
      {
        licensor: tx-sender,
        price-per-day: price-per-day,
        max-duration: max-duration,
        commercial-allowed: commercial-allowed,
        active: true
      }
    )

    (ok true)
  )
)

(define-public (purchase-license (token-id uint) (duration uint) (commercial bool))
  (let
    (
      (offer (unwrap! (map-get? license-offers { token-id: token-id }) ERR_NOT_FOUND))
      (price-per-day (get price-per-day offer))
      (total-price (* price-per-day duration))
      (licensor (get licensor offer))
    )
    (asserts! (get active offer) ERR_NOT_FOUND)
    (asserts! (<= duration (get max-duration offer)) ERR_INVALID_PRICE)
    (asserts! (or (not commercial) (get commercial-allowed offer)) ERR_UNAUTHORIZED)

    ;; Transfer license fee
    (try! (stx-transfer? total-price tx-sender licensor))

    ;; Create active license
    (map-set active-licenses
      { token-id: token-id, licensee: tx-sender }
      {
        start-block: stacks-block-height,
        end-block: (+ stacks-block-height (* duration u144)), ;; ~144 blocks per day
        price-paid: total-price,
        commercial: commercial
      }
    )

    ;; Record as sale
    (record-sale token-id licensor tx-sender total-price "license")

    (ok true)
  )
)

;; Helper Functions

(define-private (record-sale
  (token-id uint)
  (seller principal)
  (buyer principal)
  (price uint)
  (sale-type (string-ascii 16))
)
  (let
    (
      (sale-id (+ (var-get sale-nonce) u1))
    )
    (map-set sales-history
      { token-id: token-id, sale-id: sale-id }
      {
        seller: seller,
        buyer: buyer,
        price: price,
        timestamp: stacks-block-height,
        sale-type: sale-type
      }
    )
    (var-set sale-nonce sale-id)
    true
  )
)

;; Read-only Functions

(define-read-only (get-listing (token-id uint))
  (map-get? listings { token-id: token-id })
)

(define-read-only (get-auction (token-id uint))
  (map-get? auctions { token-id: token-id })
)

(define-read-only (get-license-offer (token-id uint))
  (map-get? license-offers { token-id: token-id })
)

(define-read-only (get-active-license (token-id uint) (licensee principal))
  (map-get? active-licenses { token-id: token-id, licensee: licensee })
)

(define-read-only (get-marketplace-stats)
  (ok {
    total-volume: (var-get total-volume),
    total-listings: (var-get total-listings),
    total-sales: (var-get total-sales),
    marketplace-fee: (var-get marketplace-fee-percentage)
  })
)

(define-read-only (get-sale-history (token-id uint) (sale-id uint))
  (map-get? sales-history { token-id: token-id, sale-id: sale-id })
)

;; Admin Functions

(define-public (set-marketplace-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (<= new-fee u100) ERR_INVALID_PRICE) ;; Max 10%
    (var-set marketplace-fee-percentage new-fee)
    (ok true)
  )
)
