;; title: recurring-payment
;; version: 1.0.0
;; summary: Automated recurring payment processing with retry logic and refund support
;; description: Handles scheduled payment execution, failure handling, retry mechanisms, refunds, and payment method management for subscription-based services

;; ===================================
;; Constants
;; ===================================

(define-constant contract-owner tx-sender)

;; Error codes
(define-constant err-owner-only (err u800))
(define-constant err-not-found (err u801))
(define-constant err-unauthorized (err u802))
(define-constant err-insufficient-balance (err u803))
(define-constant err-invalid-amount (err u804))
(define-constant err-payment-failed (err u805))
(define-constant err-max-retries-exceeded (err u806))
(define-constant err-invalid-schedule (err u807))
(define-constant err-already-processed (err u808))
(define-constant err-invalid-status (err u809))
(define-constant err-invalid-payment-method (err u810))
(define-constant err-refund-not-allowed (err u811))

;; Payment statuses
(define-constant STATUS-PENDING u1)
(define-constant STATUS-PROCESSING u2)
(define-constant STATUS-SUCCESS u3)
(define-constant STATUS-FAILED u4)
(define-constant STATUS-REFUNDED u5)
(define-constant STATUS-CANCELLED u6)

;; Payment methods
(define-constant METHOD-STX u1)
(define-constant METHOD-ESCROW u2)
(define-constant METHOD-AUTO-DEBIT u3)

;; Retry configuration
(define-constant MAX-RETRY-ATTEMPTS u3)
(define-constant RETRY-DELAY u86400) ;; 24 hours in seconds

;; Refund window (30 days)
(define-constant REFUND-WINDOW u2592000)

;; ===================================
;; Data Variables
;; ===================================

(define-data-var payment-nonce uint u0)
(define-data-var refund-nonce uint u0)
(define-data-var total-payments-processed uint u0)
(define-data-var total-payment-volume uint u0)
(define-data-var total-refunds-processed uint u0)
(define-data-var total-refund-volume uint u0)
(define-data-var retry-enabled bool true)
(define-data-var platform-fee-bps uint u150) ;; 1.5%

;; ===================================
;; Data Maps
;; ===================================

;; Scheduled payments
(define-map scheduled-payments
    { payment-id: uint }
    {
        subscription-id: uint,
        payer: principal,
        payee: principal,
        amount: uint,
        payment-method: uint,
        scheduled-for: uint,
        status: uint,
        retry-count: uint,
        last-retry: uint,
        next-retry: uint,
        created-at: uint,
        processed-at: (optional uint),
        failure-reason: (optional (string-utf8 200))
    }
)

;; Payment execution history
(define-map payment-executions
    { payment-id: uint, execution-id: uint }
    {
        executed-at: uint,
        amount-charged: uint,
        fee-charged: uint,
        success: bool,
        error-code: (optional uint),
        error-message: (optional (string-utf8 200)),
        transaction-hash: (optional (buff 32))
    }
)

;; Payment methods registry
(define-map payment-methods
    { user: principal, method-id: uint }
    {
        method-type: uint,
        is-default: bool,
        is-active: bool,
        escrow-balance: uint,
        auto-recharge-enabled: bool,
        auto-recharge-threshold: uint,
        auto-recharge-amount: uint,
        created-at: uint,
        last-used: uint
    }
)

;; Refund records
(define-map refunds
    { refund-id: uint }
    {
        payment-id: uint,
        subscription-id: uint,
        requester: principal,
        original-amount: uint,
        refund-amount: uint,
        fee-refunded: uint,
        reason: (string-utf8 200),
        status: uint,
        requested-at: uint,
        processed-at: (optional uint),
        approved-by: (optional principal)
    }
)

;; Payment analytics per subscription
(define-map payment-analytics
    { subscription-id: uint }
    {
        total-payments: uint,
        successful-payments: uint,
        failed-payments: uint,
        total-amount-paid: uint,
        total-fees-paid: uint,
        total-refunds: uint,
        total-refunded-amount: uint,
        average-payment-amount: uint,
        success-rate: uint,
        last-payment-date: uint
    }
)

;; User payment statistics
(define-map user-payment-stats
    { user: principal }
    {
        total-payments-made: uint,
        total-amount-spent: uint,
        total-fees-paid: uint,
        total-refunds-received: uint,
        failed-payment-count: uint,
        default-payment-method: uint,
        payment-reliability-score: uint
    }
)

;; Retry queue
(define-map retry-queue
    { queue-id: uint }
    {
        payment-id: uint,
        scheduled-retry: uint,
        retry-attempt: uint,
        processed: bool
    }
)

(define-data-var retry-queue-nonce uint u0)

;; Transaction history
(define-map transaction-history
    { user: principal, tx-id: uint }
    {
        payment-id: uint,
        transaction-type: (string-ascii 20), ;; "payment", "refund", "retry"
        amount: uint,
        timestamp: uint,
        status: uint
    }
)

(define-data-var transaction-nonce uint u0)

;; ===================================
;; Read-Only Functions
;; ===================================

(define-read-only (get-scheduled-payment (payment-id uint))
    (map-get? scheduled-payments { payment-id: payment-id })
)

(define-read-only (get-payment-execution (payment-id uint) (execution-id uint))
    (map-get? payment-executions { payment-id: payment-id, execution-id: execution-id })
)

(define-read-only (get-payment-method (user principal) (method-id uint))
    (map-get? payment-methods { user: user, method-id: method-id })
)

(define-read-only (get-refund (refund-id uint))
    (map-get? refunds { refund-id: refund-id })
)

(define-read-only (get-payment-analytics (subscription-id uint))
    (map-get? payment-analytics { subscription-id: subscription-id })
)

(define-read-only (get-user-payment-stats (user principal))
    (map-get? user-payment-stats { user: user })
)

(define-read-only (get-transaction-history (user principal) (tx-id uint))
    (map-get? transaction-history { user: user, tx-id: tx-id })
)

(define-read-only (is-payment-due (payment-id uint))
    (match (map-get? scheduled-payments { payment-id: payment-id })
        payment-data (and
            (<= (get scheduled-for payment-data) stacks-block-time)
            (is-eq (get status payment-data) STATUS-PENDING)
        )
        false
    )
)

(define-read-only (is-refund-eligible (payment-id uint))
    (match (map-get? scheduled-payments { payment-id: payment-id })
        payment-data (and
            (is-eq (get status payment-data) STATUS-SUCCESS)
            (match (get processed-at payment-data)
                processed-time (<= (- stacks-block-time processed-time) REFUND-WINDOW)
                false
            )
        )
        false
    )
)

(define-read-only (get-total-stats)
    (ok {
        total-payments: (var-get total-payments-processed),
        total-volume: (var-get total-payment-volume),
        total-refunds: (var-get total-refunds-processed),
        total-refund-volume: (var-get total-refund-volume)
    })
)

(define-read-only (calculate-payment-fee (amount uint))
    (ok (/ (* amount (var-get platform-fee-bps)) u10000))
)

;; ===================================
;; Private Functions
;; ===================================

(define-private (execute-stx-payment (amount uint) (from principal) (to principal))
    ;; In production, this would execute actual STX transfer
    ;; (try! (stx-transfer? amount from to))
    (ok true)
)

(define-private (record-payment-execution
    (payment-id uint)
    (execution-id uint)
    (amount uint)
    (fee uint)
    (success bool)
    (error-msg (optional (string-utf8 200)))
)
    (map-set payment-executions
        { payment-id: payment-id, execution-id: execution-id }
        {
            executed-at: stacks-block-time,
            amount-charged: amount,
            fee-charged: fee,
            success: success,
            error-code: none,
            error-message: error-msg,
            transaction-hash: none
        }
    )
)

(define-private (update-payment-analytics
    (subscription-id uint)
    (amount uint)
    (fee uint)
    (success bool)
)
    (let
        (
            (analytics (default-to
                {
                    total-payments: u0,
                    successful-payments: u0,
                    failed-payments: u0,
                    total-amount-paid: u0,
                    total-fees-paid: u0,
                    total-refunds: u0,
                    total-refunded-amount: u0,
                    average-payment-amount: u0,
                    success-rate: u0,
                    last-payment-date: u0
                }
                (map-get? payment-analytics { subscription-id: subscription-id })
            ))
            (new-total-payments (+ (get total-payments analytics) u1))
            (new-successful (if success (+ (get successful-payments analytics) u1) (get successful-payments analytics)))
            (new-failed (if success (get failed-payments analytics) (+ (get failed-payments analytics) u1)))
            (new-amount-paid (if success (+ (get total-amount-paid analytics) amount) (get total-amount-paid analytics)))
            (new-fees-paid (if success (+ (get total-fees-paid analytics) fee) (get total-fees-paid analytics)))
            (new-avg (if (> new-successful u0) (/ new-amount-paid new-successful) u0))
            (new-success-rate (if (> new-total-payments u0) (/ (* new-successful u10000) new-total-payments) u0))
        )
        (map-set payment-analytics
            { subscription-id: subscription-id }
            {
                total-payments: new-total-payments,
                successful-payments: new-successful,
                failed-payments: new-failed,
                total-amount-paid: new-amount-paid,
                total-fees-paid: new-fees-paid,
                total-refunds: (get total-refunds analytics),
                total-refunded-amount: (get total-refunded-amount analytics),
                average-payment-amount: new-avg,
                success-rate: new-success-rate,
                last-payment-date: stacks-block-time
            }
        )
    )
)

(define-private (update-user-stats
    (user principal)
    (amount uint)
    (fee uint)
    (success bool)
)
    (let
        (
            (stats (default-to
                {
                    total-payments-made: u0,
                    total-amount-spent: u0,
                    total-fees-paid: u0,
                    total-refunds-received: u0,
                    failed-payment-count: u0,
                    default-payment-method: METHOD-STX,
                    payment-reliability-score: u10000
                }
                (map-get? user-payment-stats { user: user })
            ))
            (new-total-payments (+ (get total-payments-made stats) u1))
            (new-failed (if success (get failed-payment-count stats) (+ (get failed-payment-count stats) u1)))
            (new-reliability (if (> new-total-payments u0)
                (/ (* (- new-total-payments new-failed) u10000) new-total-payments)
                u10000
            ))
        )
        (map-set user-payment-stats
            { user: user }
            {
                total-payments-made: new-total-payments,
                total-amount-spent: (if success (+ (get total-amount-spent stats) amount) (get total-amount-spent stats)),
                total-fees-paid: (if success (+ (get total-fees-paid stats) fee) (get total-fees-paid stats)),
                total-refunds-received: (get total-refunds-received stats),
                failed-payment-count: new-failed,
                default-payment-method: (get default-payment-method stats),
                payment-reliability-score: new-reliability
            }
        )
    )
)

(define-private (record-transaction
    (user principal)
    (payment-id uint)
    (tx-type (string-ascii 20))
    (amount uint)
    (status uint)
)
    (let
        (
            (tx-id (+ (var-get transaction-nonce) u1))
        )
        (map-set transaction-history
            { user: user, tx-id: tx-id }
            {
                payment-id: payment-id,
                transaction-type: tx-type,
                amount: amount,
                timestamp: stacks-block-time,
                status: status
            }
        )
        (var-set transaction-nonce tx-id)
        (ok tx-id)
    )
)

;; ===================================
;; Public Functions
;; ===================================

;; Schedule a recurring payment
(define-public (schedule-payment
    (subscription-id uint)
    (payee principal)
    (amount uint)
    (payment-method uint)
    (scheduled-for uint)
)
    (let
        (
            (payment-id (+ (var-get payment-nonce) u1))
        )
        ;; Validations
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (>= scheduled-for stacks-block-time) err-invalid-schedule)
        (asserts! (or
            (is-eq payment-method METHOD-STX)
            (or
                (is-eq payment-method METHOD-ESCROW)
                (is-eq payment-method METHOD-AUTO-DEBIT)
            )
        ) err-invalid-payment-method)

        ;; Create scheduled payment
        (map-set scheduled-payments
            { payment-id: payment-id }
            {
                subscription-id: subscription-id,
                payer: tx-sender,
                payee: payee,
                amount: amount,
                payment-method: payment-method,
                scheduled-for: scheduled-for,
                status: STATUS-PENDING,
                retry-count: u0,
                last-retry: u0,
                next-retry: u0,
                created-at: stacks-block-time,
                processed-at: none,
                failure-reason: none
            }
        )

        ;; Increment nonce
        (var-set payment-nonce payment-id)

        ;; Record transaction
        (try! (record-transaction tx-sender payment-id "payment" amount STATUS-PENDING))

        (ok payment-id)
    )
)

;; Execute a scheduled payment
(define-public (execute-payment (payment-id uint))
    (let
        (
            (payment (unwrap! (map-get? scheduled-payments { payment-id: payment-id }) err-not-found))
            (fee (unwrap! (calculate-payment-fee (get amount payment)) err-invalid-amount))
            (total-amount (+ (get amount payment) fee))
            (execution-id (+ (get retry-count payment) u1))
        )
        ;; Validations
        (asserts! (is-eq (get status payment) STATUS-PENDING) err-invalid-status)
        (asserts! (<= (get scheduled-for payment) stacks-block-time) err-invalid-schedule)
        (asserts! (< (get retry-count payment) MAX-RETRY-ATTEMPTS) err-max-retries-exceeded)

        ;; Update status to processing
        (map-set scheduled-payments
            { payment-id: payment-id }
            (merge payment { status: STATUS-PROCESSING })
        )

        ;; Attempt payment execution
        (match (execute-stx-payment total-amount (get payer payment) (get payee payment))
            success (begin
                ;; Payment successful
                (map-set scheduled-payments
                    { payment-id: payment-id }
                    (merge payment {
                        status: STATUS-SUCCESS,
                        processed-at: (some stacks-block-time)
                    })
                )

                ;; Record execution
                (record-payment-execution payment-id execution-id (get amount payment) fee true none)

                ;; Update analytics
                (update-payment-analytics (get subscription-id payment) (get amount payment) fee true)
                (update-user-stats (get payer payment) (get amount payment) fee true)

                ;; Update global stats
                (var-set total-payments-processed (+ (var-get total-payments-processed) u1))
                (var-set total-payment-volume (+ (var-get total-payment-volume) (get amount payment)))

                ;; Record transaction
                (try! (record-transaction (get payer payment) payment-id "payment" (get amount payment) STATUS-SUCCESS))

                (ok { success: true, payment-id: payment-id, amount: (get amount payment), fee: fee })
            )
            error (begin
                ;; Payment failed - handle retry
                (try! (handle-payment-failure payment-id (some u"Payment execution failed")))
                err-payment-failed
            )
        )
    )
)

;; Handle payment failure and schedule retry if applicable
(define-public (handle-payment-failure
    (payment-id uint)
    (failure-reason (optional (string-utf8 200)))
)
    (let
        (
            (payment (unwrap! (map-get? scheduled-payments { payment-id: payment-id }) err-not-found))
            (new-retry-count (+ (get retry-count payment) u1))
            (execution-id new-retry-count)
        )
        ;; Record failed execution
        (record-payment-execution payment-id execution-id (get amount payment) u0 false failure-reason)

        ;; Update analytics
        (update-payment-analytics (get subscription-id payment) (get amount payment) u0 false)
        (update-user-stats (get payer payment) (get amount payment) u0 false)

        ;; Check if we should retry
        (if (and
            (< new-retry-count MAX-RETRY-ATTEMPTS)
            (var-get retry-enabled)
        )
            (let
                (
                    (next-retry-time (+ stacks-block-time RETRY-DELAY))
                    (queue-id (+ (var-get retry-queue-nonce) u1))
                )
                ;; Update payment with retry info
                (map-set scheduled-payments
                    { payment-id: payment-id }
                    (merge payment {
                        status: STATUS-PENDING,
                        retry-count: new-retry-count,
                        last-retry: stacks-block-time,
                        next-retry: next-retry-time,
                        failure-reason: failure-reason
                    })
                )

                ;; Add to retry queue
                (map-set retry-queue
                    { queue-id: queue-id }
                    {
                        payment-id: payment-id,
                        scheduled-retry: next-retry-time,
                        retry-attempt: new-retry-count,
                        processed: false
                    }
                )
                (var-set retry-queue-nonce queue-id)

                ;; Record transaction
                (try! (record-transaction (get payer payment) payment-id "retry" (get amount payment) STATUS-PENDING))

                (ok { retry-scheduled: true, next-retry: next-retry-time, attempt: new-retry-count })
            )
            (begin
                ;; Max retries exceeded - mark as failed
                (map-set scheduled-payments
                    { payment-id: payment-id }
                    (merge payment {
                        status: STATUS-FAILED,
                        retry-count: new-retry-count,
                        failure-reason: failure-reason,
                        processed-at: (some stacks-block-time)
                    })
                )

                ;; Record transaction
                (try! (record-transaction (get payer payment) payment-id "payment" (get amount payment) STATUS-FAILED))

                (ok { retry-scheduled: false, next-retry: u0, attempt: new-retry-count })
            )
        )
    )
)

;; Process a refund
(define-public (process-refund
    (payment-id uint)
    (refund-amount uint)
    (reason (string-utf8 200))
)
    (let
        (
            (payment (unwrap! (map-get? scheduled-payments { payment-id: payment-id }) err-not-found))
            (refund-id (+ (var-get refund-nonce) u1))
            (analytics (unwrap! (map-get? payment-analytics { subscription-id: (get subscription-id payment) }) err-not-found))
            (fee (unwrap! (calculate-payment-fee (get amount payment)) err-invalid-amount))
            (fee-refund (/ (* fee refund-amount) (get amount payment)))
        )
        ;; Validations
        (asserts! (is-eq tx-sender (get payer payment)) err-unauthorized)
        (asserts! (is-refund-eligible payment-id) err-refund-not-allowed)
        (asserts! (<= refund-amount (get amount payment)) err-invalid-amount)

        ;; Execute refund transfer
        ;; In production: (try! (stx-transfer? refund-amount (get payee payment) (get payer payment)))

        ;; Create refund record
        (map-set refunds
            { refund-id: refund-id }
            {
                payment-id: payment-id,
                subscription-id: (get subscription-id payment),
                requester: tx-sender,
                original-amount: (get amount payment),
                refund-amount: refund-amount,
                fee-refunded: fee-refund,
                reason: reason,
                status: STATUS-SUCCESS,
                requested-at: stacks-block-time,
                processed-at: (some stacks-block-time),
                approved-by: (some contract-owner)
            }
        )

        ;; Update payment status
        (map-set scheduled-payments
            { payment-id: payment-id }
            (merge payment { status: STATUS-REFUNDED })
        )

        ;; Update analytics
        (map-set payment-analytics
            { subscription-id: (get subscription-id payment) }
            (merge analytics {
                total-refunds: (+ (get total-refunds analytics) u1),
                total-refunded-amount: (+ (get total-refunded-amount analytics) refund-amount)
            })
        )

        ;; Update user stats
        (let
            (
                (user-stats (unwrap! (map-get? user-payment-stats { user: (get payer payment) }) err-not-found))
            )
            (map-set user-payment-stats
                { user: (get payer payment) }
                (merge user-stats {
                    total-refunds-received: (+ (get total-refunds-received user-stats) u1)
                })
            )
        )

        ;; Update global stats
        (var-set refund-nonce refund-id)
        (var-set total-refunds-processed (+ (var-get total-refunds-processed) u1))
        (var-set total-refund-volume (+ (var-get total-refund-volume) refund-amount))

        ;; Record transaction
        (try! (record-transaction (get payer payment) payment-id "refund" refund-amount STATUS-SUCCESS))

        (ok refund-id)
    )
)

;; Register a payment method
(define-public (register-payment-method
    (method-type uint)
    (is-default bool)
    (auto-recharge-enabled bool)
    (auto-recharge-threshold uint)
    (auto-recharge-amount uint)
)
    (let
        (
            (method-id u1) ;; Simplified - in production would generate unique ID
        )
        (asserts! (or
            (is-eq method-type METHOD-STX)
            (or
                (is-eq method-type METHOD-ESCROW)
                (is-eq method-type METHOD-AUTO-DEBIT)
            )
        ) err-invalid-payment-method)

        (map-set payment-methods
            { user: tx-sender, method-id: method-id }
            {
                method-type: method-type,
                is-default: is-default,
                is-active: true,
                escrow-balance: u0,
                auto-recharge-enabled: auto-recharge-enabled,
                auto-recharge-threshold: auto-recharge-threshold,
                auto-recharge-amount: auto-recharge-amount,
                created-at: stacks-block-time,
                last-used: u0
            }
        )

        (ok method-id)
    )
)

;; Cancel a scheduled payment
(define-public (cancel-payment (payment-id uint))
    (let
        (
            (payment (unwrap! (map-get? scheduled-payments { payment-id: payment-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get payer payment)) err-unauthorized)
        (asserts! (is-eq (get status payment) STATUS-PENDING) err-invalid-status)

        (map-set scheduled-payments
            { payment-id: payment-id }
            (merge payment { status: STATUS-CANCELLED })
        )

        ;; Record transaction
        (try! (record-transaction tx-sender payment-id "payment" (get amount payment) STATUS-CANCELLED))

        (ok true)
    )
)

;; Admin: Set platform fee
(define-public (set-platform-fee (new-fee-bps uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (<= new-fee-bps u1000) err-invalid-amount) ;; Max 10%
        (var-set platform-fee-bps new-fee-bps)
        (ok true)
    )
)

;; Admin: Toggle retry system
(define-public (toggle-retry-system (enabled bool))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set retry-enabled enabled)
        (ok true)
    )
)
