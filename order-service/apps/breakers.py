import pybreaker
import logging

logger = logging.getLogger(__name__)

# Define custom listener to log state transitions of Circuit Breakers
class LogListener(pybreaker.CircuitBreakerListener):
    def __init__(self, name):
        self.name = name

    def state_change(self, cb, old_state, new_state):
        logger.warning(f"Circuit Breaker '{self.name}' state changed from {old_state.name} to {new_state.name}")

# Create Breaker instances with 5 failures max, and 30 seconds reset timeout
cart_breaker = pybreaker.CircuitBreaker(fail_max=5, reset_timeout=30, listeners=[LogListener("Cart Service")])
product_breaker = pybreaker.CircuitBreaker(fail_max=5, reset_timeout=30, listeners=[LogListener("Product Service")])
payment_breaker = pybreaker.CircuitBreaker(fail_max=5, reset_timeout=30, listeners=[LogListener("Payment Service")])
shipping_breaker = pybreaker.CircuitBreaker(fail_max=5, reset_timeout=30, listeners=[LogListener("Shipping Service")])
