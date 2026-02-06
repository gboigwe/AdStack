;; governance-token.clar
;; SIP-010 compliant governance token with voting power and delegation

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u11000))
(define-constant ERR_INSUFFICIENT_BALANCE (err u11001))
(define-constant ERR_INVALID_PARAMS (err u11002))

;; Token definition
(define-fungible-token adstack-gov)

;; Token metadata
(define-data-var token-name (string-ascii 32) "AdStack Governance")
(define-data-var token-symbol (string-ascii 10) "ADSGOV")
(define-data-var token-decimals uint u6)
(define-data-var token-uri (optional (string-utf8 256)) none)

;; Total supply
(define-data-var total-supply uint u0)
(define-constant MAX_SUPPLY u1000000000000) ;; 1M tokens with 6 decimals

;; Voting power delegation
(define-map delegations
  { delegator: principal }
  { delegate: principal, delegated-at: uint }
)

;; Voting power snapshots
(define-map voting-power-at-block
  { voter: principal, block-height: uint }
  { voting-power: uint }
)

;; SIP-010 functions
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR_UNAUTHORIZED)
    (try! (ft-transfer? adstack-gov amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

(define-read-only (get-name)
  (ok (var-get token-name))
)

(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
  (ok (var-get token-decimals))
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance adstack-gov account))
)

(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Mint (only owner)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (<= (+ (var-get total-supply) amount) MAX_SUPPLY) ERR_INVALID_PARAMS)
    (try! (ft-mint? adstack-gov amount recipient))
    (var-set total-supply (+ (var-get total-supply) amount))
    (ok true)
  )
)

;; Delegation functions
(define-public (delegate (delegate-to principal))
  (begin
    (map-set delegations
      { delegator: tx-sender }
      { delegate: delegate-to, delegated-at: stacks-block-time }
    )
    (ok true)
  )
)

(define-public (revoke-delegation)
  (begin
    (map-delete delegations { delegator: tx-sender })
    (ok true)
  )
)

;; Get voting power
(define-read-only (get-voting-power (voter principal))
  (let
    (
      (balance (ft-get-balance adstack-gov voter))
      (delegation (map-get? delegations { delegator: voter }))
    )
    ;; If delegated, return 0, otherwise return balance
    (ok (if (is-some delegation) u0 balance))
  )
)

;; Get delegated voting power
(define-read-only (get-delegated-power (delegate principal))
  ;; TODO: Implement delegated power calculation
  (ok u0)
)

(define-read-only (get-delegation (delegator principal))
  (map-get? delegations { delegator: delegator })
)
