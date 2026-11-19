import 'package:flutter/foundation.dart';

import '../models/app_settings.dart';
import '../models/cart_item.dart';
import '../services/api_service.dart';

/// Cart state: line items, coupon and money math (all amounts in paise).
///
/// Mutations throw [ApiException] up to the UI so screens can show a
/// friendly message; the in-memory state only changes on success.
class CartProvider extends ChangeNotifier {
  CartProvider(this._api);

  final ApiService _api;

  List<CartItem> _items = [];
  bool _loading = false;
  String? _error;
  String? _couponCode;
  int _couponDiscount = 0; // paise
  String? _couponError;

  List<CartItem> get items => _items;
  bool get loading => _loading;
  String? get error => _error;
  String? get couponCode => _couponCode;
  int get couponDiscount => _couponDiscount;
  String? get couponError => _couponError;

  bool get isEmpty => _items.isEmpty;

  /// Total number of units (for the bottom-nav badge).
  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  /// Sum of line totals in paise, before coupon and shipping.
  int get subtotal => _items.fold(0, (sum, item) => sum + item.lineTotal);

  /// Subtotal minus the coupon discount (paise).
  int get discountedSubtotal => subtotal - _couponDiscount;

  /// Shipping for the current cart, honouring free-shipping threshold rules.
  int shippingFor(AppSettings? settings) {
    if (_items.isEmpty) return 0;
    final threshold = settings?.freeShippingAbove ?? 0;
    if (threshold > 0 && discountedSubtotal >= threshold) return 0;
    return settings?.shippingFee ?? 0;
  }

  /// Grand total for the current cart (paise).
  int totalFor(AppSettings? settings) =>
      discountedSubtotal + shippingFor(settings);

  // ---- Server sync ----------------------------------------------------------

  Future<void> fetch() async {
    _loading = true;
    notifyListeners();
    try {
      await _applyItems(await _api.fetchCart());
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> add(String productId, {int quantity = 1}) async =>
      _applyItems(await _api.addToCart(
        productId: productId,
        quantity: quantity,
      ));

  Future<void> updateQuantity(String itemId, int quantity) async =>
      _applyItems(await _api.updateCartItem(itemId: itemId, quantity: quantity));

  Future<void> remove(String itemId) async =>
      _applyItems(await _api.removeCartItem(itemId));

  Future<void> _applyItems(List<CartItem> items) async {
    _items = items;
    await _revalidateCoupon();
    notifyListeners();
  }

  /// Re-checks the applied coupon against the new subtotal; drops it when it
  /// no longer applies.
  Future<void> _revalidateCoupon() async {
    if (_couponCode == null) return;
    try {
      final result =
          await _api.validateCoupon(code: _couponCode!, subtotal: subtotal);
      _couponDiscount = result.discount;
    } catch (_) {
      _couponCode = null;
      _couponDiscount = 0;
    }
  }

  // ---- Coupon -----------------------------------------------------------------

  /// Returns true when the coupon was applied successfully.
  Future<bool> applyCoupon(String code) async {
    try {
      final result =
          await _api.validateCoupon(code: code.trim(), subtotal: subtotal);
      _couponCode = result.code;
      _couponDiscount = result.discount;
      _couponError = null;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _couponError = e.message;
      notifyListeners();
      return false;
    }
  }

  void removeCoupon() {
    _couponCode = null;
    _couponDiscount = 0;
    _couponError = null;
    notifyListeners();
  }

  // ---- Lifecycle --------------------------------------------------------------

  /// Clears local state (called on logout).
  void reset() {
    _items = [];
    _error = null;
    _couponCode = null;
    _couponDiscount = 0;
    _couponError = null;
    _loading = false;
    notifyListeners();
  }

  /// Called right after an order was placed: the server consumed the cart.
  Future<void> refreshAfterOrder() async {
    reset();
    try {
      await fetch();
    } catch (_) {
      // Cart state was already reset; a background sync failure is fine.
    }
  }
}
