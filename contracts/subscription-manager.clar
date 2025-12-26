;; title: subscription-manager
;; version: 1.0.0
;; summary: Recurring campaign automation and subscription management
;; description: Auto-renewal, payment schedules, subscription analytics, and failure handling

;; constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-unauthorized (err u102))
(define-constant err-inactive-subscription (err u103))
(define-constant err-insufficient-balance (err u104))
(define-constant err-invalid-interval (err u105))
(define-constant err-already-exists (err u106))
(define-constant err-max-retries (err u107))

;; Subscription statuses
(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-PAUSED u2)
(define-constant STATUS-CANCELLED u3)
(define-constant STATUS-EXPIRED u4)

;; Billing intervals (in seconds)
(define-constant INTERVAL-WEEKLY u604800)      ;; 7 days
(define-constant INTERVAL-MONTHLY u2592000)    ;; 30 days
(define-constant INTERVAL-QUARTERLY u7776000)  ;; 90 days
(define-constant INTERVAL-YEARLY u31536000)    ;; 365 days

;; data vars
(define-data-var subscription-nonce uint u0)
(define-data-var max-retry-attempts uint u3)
(define-data-var grace-period uint u259200) ;; 3 days
(define-data-var auto-renewal-enabled bool true)

;; data maps
(define-map subscriptions
    { subscription-id: uint }
    {
        campaign-id: uint,
        subscriber: principal,
        amount: uint,
        billing-interval: uint,
        status: uint,
        next-billing: uint,
        created-at: uint,
        last-payment: uint,
        total-payments: uint,
        failed-attempts: uint,
        auto-renew: bool
    }
)

(define-map subscription-plans
    { plan-id: uint }
    {
        name: (string-utf8 100),
        description: (string-utf8 500),
        price: uint,
        interval: uint,
        features: (list 10 (string-utf8 100)),
        active: bool,
        discount-percent: uint
    }
)

(define-map subscriber-to-subscription
    { subscriber: principal, campaign-id: uint }
    { subscription-id: uint }
)

(define-map payment-history
    { subscription-id: uint, payment-id: uint }
    {
        amount: uint,
        timestamp: uint,
        success: bool,
        failure-reason: (optional (string-utf8 200))
    }
)

(define-map subscription-analytics
    { subscription-id: uint }
    {
        total-revenue: uint,
        successful-payments: uint,
        failed-payments: uint,
        avg-payment-amount: uint,
        lifetime-value: uint,
        churn-risk-score: uint
    }
)

(define-map renewal-queue
    { queue-index: uint }
    {
        subscription-id: uint,
        scheduled-for: uint,
        processed: bool
    }
)

(define-map subscriber-preferences
    { subscriber: principal }
    {
        payment-method: uint,
        notification-enabled: bool,
        auto-renew-default: bool,
        spending-limit: uint
    }
)

;; read only functions
(define-read-only (get-subscription (subscription-id uint))
    (map-get? subscriptions { subscription-id: subscription-id })
)

(define-read-only (get-plan (plan-id uint))
    (map-get? subscription-plans { plan-id: plan-id })
)

(define-read-only (get-subscriber-subscription (subscriber principal) (campaign-id uint))
    (match (map-get? subscriber-to-subscription { subscriber: subscriber, campaign-id: campaign-id })
        mapping (map-get? subscriptions { subscription-id: (get subscription-id mapping) })
        none
    )
)

(define-read-only (get-payment-history (subscription-id uint) (payment-id uint))
    (map-get? payment-history { subscription-id: subscription-id, payment-id: payment-id })
)

(define-read-only (get-subscription-analytics (subscription-id uint))
    (map-get? subscription-analytics { subscription-id: subscription-id })
)

(define-read-only (get-subscriber-preferences (subscriber principal))
    (map-get? subscriber-preferences { subscriber: subscriber })
)

(define-read-only (is-subscription-active (subscription-id uint))
    (match (map-get? subscriptions { subscription-id: subscription-id })
        sub-data (is-eq (get status sub-data) STATUS-ACTIVE)
        false
    )
)

(define-read-only (get-renewal-status (subscription-id uint))
    (match (map-get? subscriptions { subscription-id: subscription-id })
        sub-data {
            active: (is-eq (get status sub-data) STATUS-ACTIVE),
            next-billing: (get next-billing sub-data),
            auto-renew: (get auto-renew sub-data),
            failed-attempts: (get failed-attempts sub-data)
        }
        { active: false, next-billing: u0, auto-renew: false, failed-attempts: u0 }
    )
)

(define-read-only (calculate-next-billing (current-time uint) (interval uint))
    (+ current-time interval)
)

;; public functions
(define-public (create-subscription
    (campaign-id uint)
    (amount uint)
    (billing-interval uint)
    (auto-renew bool)
)
    (let
        (
            (subscription-id (+ (var-get subscription-nonce) u1))
            (next-billing-time (calculate-next-billing stacks-block-time billing-interval))
        )
        (asserts! (is-valid-interval billing-interval) err-invalid-interval)
        (asserts! (is-none (map-get? subscriber-to-subscription { subscriber: tx-sender, campaign-id: campaign-id })) err-already-exists)

        (map-set subscriptions
            { subscription-id: subscription-id }
            {
                campaign-id: campaign-id,
                subscriber: tx-sender,
                amount: amount,
                billing-interval: billing-interval,
                status: STATUS-ACTIVE,
                next-billing: next-billing-time,
                created-at: stacks-block-time,
                last-payment: stacks-block-time,
                total-payments: u1,
                failed-attempts: u0,
                auto-renew: auto-renew
            }
        )

        (map-set subscriber-to-subscription
            { subscriber: tx-sender, campaign-id: campaign-id }
            { subscription-id: subscription-id }
        )

        (map-set subscription-analytics
            { subscription-id: subscription-id }
            {
                total-revenue: amount,
                successful-payments: u1,
                failed-payments: u0,
                avg-payment-amount: amount,
                lifetime-value: amount,
                churn-risk-score: u0
            }
        )

        (var-set subscription-nonce subscription-id)
        (ok subscription-id)
    )
)

(define-public (cancel-subscription (subscription-id uint))
    (let
        (
            (sub-data (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get subscriber sub-data)) err-unauthorized)
        (asserts! (is-eq (get status sub-data) STATUS-ACTIVE) err-inactive-subscription)

        (map-set subscriptions
            { subscription-id: subscription-id }
            (merge sub-data { status: STATUS-CANCELLED })
        )

        (ok true)
    )
)

(define-public (pause-subscription (subscription-id uint))
    (let
        (
            (sub-data (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get subscriber sub-data)) err-unauthorized)
        (asserts! (is-eq (get status sub-data) STATUS-ACTIVE) err-inactive-subscription)

        (map-set subscriptions
            { subscription-id: subscription-id }
            (merge sub-data { status: STATUS-PAUSED })
        )

        (ok true)
    )
)

(define-public (resume-subscription (subscription-id uint))
    (let
        (
            (sub-data (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get subscriber sub-data)) err-unauthorized)
        (asserts! (is-eq (get status sub-data) STATUS-PAUSED) err-inactive-subscription)

        (map-set subscriptions
            { subscription-id: subscription-id }
            (merge sub-data { status: STATUS-ACTIVE })
        )

        (ok true)
    )
)

(define-public (process-renewal (subscription-id uint))
    (let
        (
            (sub-data (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) err-not-found))
            (analytics (unwrap! (map-get? subscription-analytics { subscription-id: subscription-id }) err-not-found))
        )
        (asserts! (is-eq (get status sub-data) STATUS-ACTIVE) err-inactive-subscription)
        (asserts! (<= (get next-billing sub-data) stacks-block-time) err-unauthorized)
        (asserts! (get auto-renew sub-data) err-unauthorized)

        ;; In production, process payment
        ;; (try! (stx-transfer? (get amount sub-data) (get subscriber sub-data) contract-owner))

        (let
            (
                (new-total-payments (+ (get total-payments sub-data) u1))
                (new-revenue (+ (get total-revenue analytics) (get amount sub-data)))
                (new-successful (+ (get successful-payments analytics) u1))
                (new-avg (/ new-revenue new-total-payments))
            )
            (map-set subscriptions
                { subscription-id: subscription-id }
                (merge sub-data {
                    next-billing: (calculate-next-billing stacks-block-time (get billing-interval sub-data)),
                    last-payment: stacks-block-time,
                    total-payments: new-total-payments,
                    failed-attempts: u0
                })
            )

            (map-set subscription-analytics
                { subscription-id: subscription-id }
                (merge analytics {
                    total-revenue: new-revenue,
                    successful-payments: new-successful,
                    avg-payment-amount: new-avg,
                    lifetime-value: new-revenue
                })
            )

            (ok true)
        )
    )
)

(define-public (handle-payment-failure
    (subscription-id uint)
    (failure-reason (string-utf8 200))
)
    (let
        (
            (sub-data (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) err-not-found))
            (analytics (unwrap! (map-get? subscription-analytics { subscription-id: subscription-id }) err-not-found))
            (new-failed-attempts (+ (get failed-attempts sub-data) u1))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set subscription-analytics
            { subscription-id: subscription-id }
            (merge analytics {
                failed-payments: (+ (get failed-payments analytics) u1),
                churn-risk-score: (* new-failed-attempts u20)
            })
        )

        (if (>= new-failed-attempts (var-get max-retry-attempts))
            (begin
                (map-set subscriptions
                    { subscription-id: subscription-id }
                    (merge sub-data {
                        status: STATUS-CANCELLED,
                        failed-attempts: new-failed-attempts
                    })
                )
                (ok false)
            )
            (begin
                (map-set subscriptions
                    { subscription-id: subscription-id }
                    (merge sub-data {
                        failed-attempts: new-failed-attempts,
                        next-billing: (+ (get next-billing sub-data) (var-get grace-period))
                    })
                )
                (ok true)
            )
        )
    )
)

(define-public (update-subscription-amount (subscription-id uint) (new-amount uint))
    (let
        (
            (sub-data (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get subscriber sub-data)) err-unauthorized)

        (map-set subscriptions
            { subscription-id: subscription-id }
            (merge sub-data { amount: new-amount })
        )

        (ok true)
    )
)

(define-public (toggle-auto-renew (subscription-id uint))
    (let
        (
            (sub-data (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender (get subscriber sub-data)) err-unauthorized)

        (map-set subscriptions
            { subscription-id: subscription-id }
            (merge sub-data { auto-renew: (not (get auto-renew sub-data)) })
        )

        (ok (not (get auto-renew sub-data)))
    )
)

(define-public (create-subscription-plan
    (name (string-utf8 100))
    (description (string-utf8 500))
    (price uint)
    (interval uint)
    (features (list 10 (string-utf8 100)))
    (discount-percent uint)
)
    (let
        (
            (plan-id (+ (var-get subscription-nonce) u1))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (is-valid-interval interval) err-invalid-interval)

        (map-set subscription-plans
            { plan-id: plan-id }
            {
                name: name,
                description: description,
                price: price,
                interval: interval,
                features: features,
                active: true,
                discount-percent: discount-percent
            }
        )

        (ok plan-id)
    )
)

(define-public (set-subscriber-preferences
    (payment-method uint)
    (notification-enabled bool)
    (auto-renew-default bool)
    (spending-limit uint)
)
    (begin
        (map-set subscriber-preferences
            { subscriber: tx-sender }
            {
                payment-method: payment-method,
                notification-enabled: notification-enabled,
                auto-renew-default: auto-renew-default,
                spending-limit: spending-limit
            }
        )

        (ok true)
    )
)

;; Admin functions
(define-public (set-max-retry-attempts (new-max uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set max-retry-attempts new-max)
        (ok true)
    )
)

(define-public (set-grace-period (new-period uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set grace-period new-period)
        (ok true)
    )
)

(define-public (expire-subscription (subscription-id uint))
    (let
        (
            (sub-data (unwrap! (map-get? subscriptions { subscription-id: subscription-id }) err-not-found))
        )
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)

        (map-set subscriptions
            { subscription-id: subscription-id }
            (merge sub-data { status: STATUS-EXPIRED })
        )

        (ok true)
    )
)

;; private functions
(define-private (is-valid-interval (interval uint))
    (or
        (is-eq interval INTERVAL-WEEKLY)
        (or
            (is-eq interval INTERVAL-MONTHLY)
            (or
                (is-eq interval INTERVAL-QUARTERLY)
                (is-eq interval INTERVAL-YEARLY)
            )
        )
    )
)
