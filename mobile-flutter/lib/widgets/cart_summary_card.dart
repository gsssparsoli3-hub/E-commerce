import 'package:flutter/material.dart';

import '../models/app_settings.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'coupon_input.dart';
import 'price_text.dart';

/// Coupon field + totals card (subtotal, discount, shipping, total) with a
/// free-shipping progress hint. Shown on the cart page.
class CartSummaryCard extends StatelessWidget {
  const CartSummaryCard({super.key, required this.cart, required this.settings});

  final CartProvider cart;
  final AppSettings? settings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final shipping = cart.shippingFor(settings);
    final total = cart.discountedSubtotal + shipping;
    final freeAbove = settings?.freeShippingAbove ?? 0;
    final couponsEnabled = settings?.couponsEnabled ?? true;
    final green = Colors.green.shade700;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (couponsEnabled) ...[
              if (cart.couponCode != null)
                Row(
                  children: [
                    Icon(Icons.check_circle, color: green, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Coupon ${cart.couponCode} applied — you save '
                        '${ApiService.formatINR(cart.couponDiscount)}',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: green, fontWeight: FontWeight.w600),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: cart.removeCoupon,
                      tooltip: 'Remove coupon',
                    ),
                  ],
                )
              else
                CouponInput(cart: cart),
              const Divider(height: 24),
            ],
            _row(
              context,
              'Subtotal',
              PriceText(paise: cart.subtotal, style: theme.textTheme.bodyMedium),
            ),
            if (cart.couponDiscount > 0)
              _row(
                context,
                'Coupon discount',
                Text(
                  '-${ApiService.formatINR(cart.couponDiscount)}',
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(color: green, fontWeight: FontWeight.w600),
                ),
              ),
            _row(
              context,
              'Shipping',
              shipping == 0
                  ? Text(
                      'FREE',
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(color: green, fontWeight: FontWeight.w700),
                    )
                  : PriceText(paise: shipping, style: theme.textTheme.bodyMedium),
            ),
            if (freeAbove > 0 && cart.items.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    Icon(
                      Icons.local_shipping_outlined,
                      size: 18,
                      color: cart.discountedSubtotal >= freeAbove
                          ? green
                          : theme.hintColor,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        cart.discountedSubtotal >= freeAbove
                            ? 'You have unlocked FREE delivery'
                            : 'Add ${ApiService.formatINR(freeAbove - cart.discountedSubtotal)} '
                                'more to get FREE delivery',
                        style: theme.textTheme.bodySmall
                            ?.copyWith(color: theme.hintColor),
                      ),
                    ),
                  ],
                ),
              ),
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Total',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                ),
                PriceText(
                  paise: total,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(BuildContext context, String label, Widget value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: Theme.of(context).hintColor),
            ),
          ),
          value,
        ],
      ),
    );
  }
}
