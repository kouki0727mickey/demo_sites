import json

def quote(data):
    price = data.get("unit_price")
    quantity = data.get("quantity")
    coupon = data.get("coupon", "")
    if type(price) is not int or not 0 <= price <= 1000000:
        raise ValueError("unit_price must be an integer from 0 to 1000000")
    if type(quantity) is not int or not 1 <= quantity <= 100:
        raise ValueError("quantity must be an integer from 1 to 100")
    if coupon not in ("", "DEMO10"):
        raise ValueError("unknown coupon")
    subtotal = price * quantity
    discount = subtotal // 10 if coupon == "DEMO10" else 0
    return {"subtotal": subtotal, "discount": discount,
            "total": subtotal - discount, "currency": "JPY"}
