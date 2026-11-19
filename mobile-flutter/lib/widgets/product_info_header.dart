import 'package:flutter/material.dart';

import '../models/product.dart';
import 'price_text.dart';
import 'quantity_stepper.dart';
import 'star_rating.dart';

/// Product headline block: category, name, rating, price/MRP/discount,
/// stock status and the quantity stepper.
class ProductInfoHeader extends StatelessWidget {
  const ProductInfoHeader({
    super.key,
    required this.product,
    required this.quantity,
    required this.onQuantityChanged,
  });

  final Product product;
  final int quantity;
  final ValueChanged<int> onQuantityChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final product = this.product;
    final stockColor = product.inStock ? Colors.green : theme.colorScheme.error;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (product.category != null) ...[
            Text(
              product.category!.name.toUpperCase(),
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w700,
                letterSpacing: 1,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 4),
          ],
          Text(
            product.name,
            style: theme.textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w700, height: 1.3),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              StarRating(rating: product.rating, size: 16),
              const SizedBox(width: 6),
              Text(
                product.rating.toStringAsFixed(1),
                style: theme.textTheme.bodySmall
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(width: 4),
              Text(
                '(${product.reviewCount} reviews)',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.hintColor),
              ),
              if (product.soldCount > 0) ...[
                const SizedBox(width: 8),
                Text(
                  '· ${product.soldCount} sold',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.hintColor),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              PriceText(
                paise: product.price,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: theme.colorScheme.primary,
                ),
              ),
              if (product.mrp > product.price) ...[
                const SizedBox(width: 8),
                PriceText(
                  paise: product.mrp,
                  style: theme.textTheme.titleSmall?.copyWith(
                    decoration: TextDecoration.lineThrough,
                    color: theme.hintColor,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${product.discountPercent}% OFF',
                    style: TextStyle(
                      color: Colors.green.shade700,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                product.inStock ? Icons.check_circle : Icons.cancel,
                size: 18,
                color: stockColor,
              ),
              const SizedBox(width: 6),
              Text(
                product.inStock
                    ? (product.stock <= 5
                        ? 'Only ${product.stock} left in stock'
                        : 'In stock')
                    : 'Out of stock',
                style: theme.textTheme.bodyMedium
                    ?.copyWith(fontWeight: FontWeight.w600, color: stockColor),
              ),
            ],
          ),
          if (product.inStock)
            Padding(
              padding: const EdgeInsets.only(top: 14),
              child: Row(
                children: [
                  Text(
                    'Quantity',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(width: 16),
                  QuantityStepper(
                    value: quantity,
                    max: product.stock,
                    onChanged: onQuantityChanged,
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
