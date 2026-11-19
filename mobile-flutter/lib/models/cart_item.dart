import 'product.dart';

/// A line item in the customer's cart (from /api/cart).
class CartItem {
  const CartItem({
    required this.id,
    required this.quantity,
    required this.product,
  });

  /// Server-side cart item id (used to update/remove the line).
  final String id;
  final int quantity;
  final Product product;

  /// Line total in paise.
  int get lineTotal => product.price * quantity;

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        id: json['id']?.toString() ?? '',
        quantity: json['quantity'] is num ? (json['quantity'] as num).toInt() : 1,
        product: json['product'] is Map
            ? Product.fromJson((json['product'] as Map).cast<String, dynamic>())
            : Product.fromJson(const {}),
      );
}
