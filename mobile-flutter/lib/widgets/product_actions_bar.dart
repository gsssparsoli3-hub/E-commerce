import 'package:flutter/material.dart';

/// Bottom action bar with "Add to Cart" and "Buy Now" buttons.
class ProductActionsBar extends StatelessWidget {
  const ProductActionsBar({
    super.key,
    required this.onAddToCart,
    required this.onBuyNow,
  });

  final VoidCallback onAddToCart;
  final VoidCallback onBuyNow;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onAddToCart,
                icon: const Icon(Icons.add_shopping_cart),
                label: const Text('Add to Cart'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton.icon(
                onPressed: onBuyNow,
                icon: const Icon(Icons.bolt),
                label: const Text('Buy Now'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
