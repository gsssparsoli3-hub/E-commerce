import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/cart_item.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../utils.dart';
import 'app_image.dart';
import 'price_text.dart';
import 'quantity_stepper.dart';

/// One cart line: product image, name, unit price, quantity stepper and
/// remove button. Persists changes through [CartProvider].
class CartTile extends StatelessWidget {
  const CartTile({super.key, required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();
    final theme = Theme.of(context);
    final product = item.product;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 74,
                height: 74,
                child: AppImage(url: product.image),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  PriceText(
                    paise: product.price,
                    style: theme.textTheme.bodySmall
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      QuantityStepper(
                        value: item.quantity,
                        max: product.stock > 0 ? product.stock : 1,
                        onChanged: (quantity) => _guard(
                          context,
                          () => cart.updateQuantity(item.id, quantity),
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: Icon(Icons.delete_outline,
                            color: theme.colorScheme.error),
                        tooltip: 'Remove item',
                        onPressed: () =>
                            _guard(context, () => cart.remove(item.id)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Runs a cart mutation and surfaces API errors as a snackbar.
  Future<void> _guard(BuildContext context, Future<void> Function() action) async {
    try {
      await action();
    } on ApiException catch (e) {
      if (context.mounted) showSnack(context, e.message);
    }
  }
}
