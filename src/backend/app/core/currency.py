from decimal import Decimal
from typing import Optional
from datetime import date
from app.core.config import settings

class CurrencyConverter:
    def __init__(self):
        self.base_currency = settings.BASE_CURRENCY
    
    def convert(self, amount: Decimal, from_currency: str, to_currency: str, rate: Decimal) -> Decimal:
        """
        Convert an amount between currencies using the given rate.
        Rate should always be expressed as: 1 from_currency = X to_currency
        """
        if from_currency == to_currency:
            return amount
            
        if from_currency == self.base_currency:
            # Converting from base (EUR) to another currency
            # If 1 EUR = 1.05 CHF, multiply by rate
            return amount * rate
        else:
            # Converting to base currency (EUR)
            # If 1 CHF = 0.95 EUR, divide by rate
            return amount / rate
    
    def get_inverse_rate(self, rate: Decimal) -> Decimal:
        """
        Get the inverse of a currency rate.
        If rate is 1 CHF = 0.95 EUR, returns 1 EUR = 1.0526 CHF
        """
        return Decimal('1') / rate

# Example usage:
# converter = CurrencyConverter()
# chf_amount = Decimal('100')
# chf_to_eur_rate = Decimal('0.95')  # 1 CHF = 0.95 EUR
# 
# # Convert CHF to EUR
# eur_amount = converter.convert(chf_amount, 'CHF', 'EUR', chf_to_eur_rate)
# 
# # Convert back to CHF
# original_amount = converter.convert(eur_amount, 'EUR', 'CHF', converter.get_inverse_rate(chf_to_eur_rate)) 