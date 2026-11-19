import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/app_settings.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'app_image.dart';
import 'money_row.dart';
import 'price_text.dart';

/// Order summary for checkout: cart line items plus the money breakdown
/// (subtotal, coupon discount, shipping, total).
class OrderSummaryCard extends StatelessWidget {
  const OrderSummaryCard({super.key, required this.settings});

  final AppSettings? settings;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cart = context.watch<CartProvider>();
    final shipping = cart.shippingFor(settings);
    final total = cart.discountedSubtotal + shipping;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.receipt_long_outlined,
                    color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Order Summary',
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ],
            ),
            const SizedBox(height: 8),
            for (final item in cart.items)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: SizedBox(
                        width: 44,
                        height: 44,
                        child: AppImage(url: item.product.image),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        item.product.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'x${item.quantity}',
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.hintColor),
                    ),
                    const SizedBox(width: 10),
                    PriceText(
                      paise: item.lineTotal,
                      style: theme.textTheme.bodySmall
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            const Divider(height: 24),
            MoneyRow(
                label: 'Subtotal', value: ApiService.formatINR(cart.subtotal)),
            if (cart.couponDiscount > 0)
              MoneyRow(
                label: 'Coupon discount',
                value: '-${ApiService.formatINR(cart.couponDiscount)}',
                credit: true,
              ),
            MoneyRow(
              label: 'Shipping',
              value:
                  shipping == 0 ? 'FREE' : ApiService.formatINR(shipping),
              credit: shipping == 0,
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
}
