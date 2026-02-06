;; ad-creative-nft.clar
;; SIP-009 NFT contract for ad creative ownership and trading

;; SIP-009 NFT Trait
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u20000))
(define-constant ERR_NOT_FOUND (err u20001))
(define-constant ERR_ALREADY_EXISTS (err u20002))
(define-constant ERR_INVALID_PARAMS (err u20003))
(define-constant ERR_INSUFFICIENT_ROYALTY (err u20004))

;; NFT Definition
(define-non-fungible-token ad-creative uint)

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var royalty-percentage uint u10) ;; 10% royalty on secondary sales

;; Creative Metadata
(define-map creatives
  { token-id: uint }
  {
    creator: principal,
    name: (string-utf8 256),
    description: (string-utf8 1024),
    ipfs-hash: (string-ascii 64),
    media-type: (string-ascii 32),
    created-at: uint,
    minted-at: uint,
    total-impressions: uint,
    total-revenue: uint
  }
)

;; Royalty Tracking
(define-map royalty-info
  { token-id: uint }
  {
    creator-royalty: uint,
    total-secondary-sales: uint,
    last-sale-price: uint,
    total-royalties-paid: uint
  }
)

;; License Information
(define-map licenses
  { token-id: uint }
  {
    license-type: (string-ascii 32),
    commercial-use: bool,
    derivative-works: bool,
    attribution-required: bool
  }
)

;; Creative Categories
(define-map categories
  { token-id: uint }
  {
    category: (string-ascii 64),
    tags: (list 10 (string-ascii 32)),
    dimensions: (string-ascii 32),
    file-size: uint
  }
)

;; SIP-009 Required Functions

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (match (map-get? creatives { token-id: token-id })
    creative (ok (some (get ipfs-hash creative)))
    (ok none)
  )
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? ad-creative token-id))
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (asserts! (is-some (nft-get-owner? ad-creative token-id)) ERR_NOT_FOUND)
    (nft-transfer? ad-creative token-id sender recipient)
  )
)

;; Minting Functions

(define-public (mint-creative
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (ipfs-hash (string-ascii 64))
  (media-type (string-ascii 32))
  (license-type (string-ascii 32))
  (commercial-use bool)
  (category (string-ascii 64))
  (tags (list 10 (string-ascii 32)))
)
  (let
    (
      (token-id (+ (var-get last-token-id) u1))
    )
    (asserts! (> (len name) u0) ERR_INVALID_PARAMS)
    (asserts! (> (len ipfs-hash) u0) ERR_INVALID_PARAMS)

    ;; Mint NFT
    (try! (nft-mint? ad-creative token-id tx-sender))

    ;; Store metadata
    (map-set creatives
      { token-id: token-id }
      {
        creator: tx-sender,
        name: name,
        description: description,
        ipfs-hash: ipfs-hash,
        media-type: media-type,
        created-at: stacks-block-height,
        minted-at: stacks-block-height,
        total-impressions: u0,
        total-revenue: u0
      }
    )

    ;; Initialize royalty info
    (map-set royalty-info
      { token-id: token-id }
      {
        creator-royalty: (var-get royalty-percentage),
        total-secondary-sales: u0,
        last-sale-price: u0,
        total-royalties-paid: u0
      }
    )

    ;; Store license
    (map-set licenses
      { token-id: token-id }
      {
        license-type: license-type,
        commercial-use: commercial-use,
        derivative-works: false,
        attribution-required: true
      }
    )

    ;; Store category
    (map-set categories
      { token-id: token-id }
      {
        category: category,
        tags: tags,
        dimensions: "",
        file-size: u0
      }
    )

    (var-set last-token-id token-id)
    (ok token-id)
  )
)

;; Secondary Sale with Royalty

(define-public (sell-with-royalty (token-id uint) (buyer principal) (sale-price uint))
  (let
    (
      (creative (unwrap! (map-get? creatives { token-id: token-id }) ERR_NOT_FOUND))
      (royalty-data (unwrap! (map-get? royalty-info { token-id: token-id }) ERR_NOT_FOUND))
      (current-owner (unwrap! (nft-get-owner? ad-creative token-id) ERR_NOT_FOUND))
      (creator (get creator creative))
      (royalty-amount (/ (* sale-price (get creator-royalty royalty-data)) u100))
      (seller-amount (- sale-price royalty-amount))
    )
    (asserts! (is-eq tx-sender current-owner) ERR_UNAUTHORIZED)
    (asserts! (> sale-price u0) ERR_INVALID_PARAMS)

    ;; Transfer royalty to creator
    (if (> royalty-amount u0)
      (try! (stx-transfer? royalty-amount buyer creator))
      true
    )

    ;; Transfer payment to seller
    (try! (stx-transfer? seller-amount buyer current-owner))

    ;; Transfer NFT to buyer
    (try! (nft-transfer? ad-creative token-id current-owner buyer))

    ;; Update royalty tracking
    (map-set royalty-info
      { token-id: token-id }
      (merge royalty-data {
        total-secondary-sales: (+ (get total-secondary-sales royalty-data) u1),
        last-sale-price: sale-price,
        total-royalties-paid: (+ (get total-royalties-paid royalty-data) royalty-amount)
      })
    )

    (ok true)
  )
)

;; Update Creative Metrics

(define-public (update-creative-metrics (token-id uint) (impressions uint) (revenue uint))
  (let
    (
      (creative (unwrap! (map-get? creatives { token-id: token-id }) ERR_NOT_FOUND))
      (owner (unwrap! (nft-get-owner? ad-creative token-id) ERR_NOT_FOUND))
    )
    ;; Only owner or contract admin can update
    (asserts! (or (is-eq tx-sender owner) (is-eq tx-sender CONTRACT_OWNER)) ERR_UNAUTHORIZED)

    (map-set creatives
      { token-id: token-id }
      (merge creative {
        total-impressions: (+ (get total-impressions creative) impressions),
        total-revenue: (+ (get total-revenue creative) revenue)
      })
    )
    (ok true)
  )
)

;; Update License

(define-public (update-license
  (token-id uint)
  (commercial-use bool)
  (derivative-works bool)
  (attribution-required bool)
)
  (let
    (
      (owner (unwrap! (nft-get-owner? ad-creative token-id) ERR_NOT_FOUND))
      (license (unwrap! (map-get? licenses { token-id: token-id }) ERR_NOT_FOUND))
    )
    (asserts! (is-eq tx-sender owner) ERR_UNAUTHORIZED)

    (map-set licenses
      { token-id: token-id }
      (merge license {
        commercial-use: commercial-use,
        derivative-works: derivative-works,
        attribution-required: attribution-required
      })
    )
    (ok true)
  )
)

;; Read-only Functions

(define-read-only (get-creative-info (token-id uint))
  (map-get? creatives { token-id: token-id })
)

(define-read-only (get-royalty-info (token-id uint))
  (map-get? royalty-info { token-id: token-id })
)

(define-read-only (get-license (token-id uint))
  (map-get? licenses { token-id: token-id })
)

(define-read-only (get-category-info (token-id uint))
  (map-get? categories { token-id: token-id })
)

(define-read-only (get-creatives-by-creator (creator principal))
  ;; Returns list of token IDs owned by creator
  ;; Note: In production, use helper contract for efficient querying
  (ok (list))
)

(define-read-only (calculate-royalty (sale-price uint) (token-id uint))
  (match (map-get? royalty-info { token-id: token-id })
    royalty-data
      (ok (/ (* sale-price (get creator-royalty royalty-data)) u100))
    (ok u0)
  )
)

;; Admin Functions

(define-public (set-royalty-percentage (new-percentage uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (<= new-percentage u100) ERR_INVALID_PARAMS)
    (var-set royalty-percentage new-percentage)
    (ok true)
  )
)

(define-public (burn (token-id uint))
  (let
    (
      (owner (unwrap! (nft-get-owner? ad-creative token-id) ERR_NOT_FOUND))
    )
    (asserts! (is-eq tx-sender owner) ERR_UNAUTHORIZED)
    (nft-burn? ad-creative token-id owner)
  )
)
