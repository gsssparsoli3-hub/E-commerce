import 'order.dart';
import 'product.dart';
import 'user.dart';

/// Result of a successful login/register: the user plus their bearer token.
class AuthResult {
  const AuthResult({required this.user, required this.token});

  final User user;
  final String token;
}

/// One page of products from /api/products, with pagination metadata.
class PaginatedProducts {
  const PaginatedProducts({
    required this.products,
    required this.page,
    required this.pages,
    required this.total,
  });

  final List<Product> products;
  final int page;
  final int pages;
  final int total;

  bool get hasMore => page < pages;
}

/// A product detail response: the product plus related products.
class ProductDetailResult {
  const ProductDetailResult({required this.product, required this.related});

  final Product product;
  final List<Product> related;
}

/// A validated coupon (from POST /api/coupons/validate).
class CouponResult {
  const CouponResult({required this.code, required this.discount});

  final String code;
  final int discount; // paise
}

/// Razorpay session info returned when placing a RAZORPAY order.
///
/// The app does not complete the gateway checkout natively yet; this is kept
/// so the flow can be wired to `razorpay_flutter` later.
class RazorpayInfo {
  const RazorpayInfo({
    required this.keyId,
    required this.orderId,
    required this.amount,
  });

  final String keyId;
  final String orderId;
  final int amount; // paise

  factory RazorpayInfo.fromJson(Map<String, dynamic> json) => RazorpayInfo(
        keyId: json['keyId']?.toString() ?? '',
        orderId: json['orderId']?.toString() ?? '',
        amount: json['amount'] is num
            ? (json['amount'] as num).toInt()
            : int.tryParse('${json['amount']}') ?? 0,
      );
}

/// Result of placing an order.
class PlaceOrderResult {
  const PlaceOrderResult({required this.order, this.razorpay});

  final Order order;
  final RazorpayInfo? razorpay;
}
