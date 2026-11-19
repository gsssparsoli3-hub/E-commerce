import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

import '../config.dart';
import '../models/address.dart';
import '../models/api_results.dart';
import '../models/app_settings.dart';
import '../models/cart_item.dart';
import '../models/category.dart';
import '../models/order.dart';
import '../models/product.dart';
import '../models/review.dart';
import '../models/user.dart';

/// Thrown for every API failure. [message] is safe to show to users.
class ApiException implements Exception {
  ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Single HTTP client wrapper for the whole Shoperic REST API.
///
/// The bearer token lives in memory and is injected by `AuthProvider`
/// (set after login/register, cleared on logout). All providers share one
/// instance of this class, so the token applies everywhere automatically.
class ApiService {
  ApiService({String? token}) : _token = token;

  String? _token;

  /// Set by AuthProvider whenever the session changes.
  set token(String? value) => _token = value;

  static const Duration _timeout = Duration(seconds: 25);
  static final NumberFormat _inr = NumberFormat('#,##,##0');
  static final NumberFormat _inrPaise = NumberFormat('#,##,##0.00');

  /// Formats integer paise as Indian rupees, e.g. 129900 -> ₹1,299.
  static String formatINR(int paise) {
    final value = paise / 100.0;
    final format = paise % 100 == 0 ? _inr : _inrPaise;
    return '₹${format.format(value)}';
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String path, Map<String, String>? query) {
    final uri = Uri.parse('$apiBaseUrl$path');
    if (query == null || query.isEmpty) return uri;
    return uri.replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? query,
  }) async {
    try {
      final request = http.Request(method, _uri(path, query));
      request.headers.addAll(_headers);
      if (body != null) request.body = jsonEncode(body);
      final stream = await request.send().timeout(_timeout);
      final response =
          await http.Response.fromStream(stream).timeout(_timeout);
      return _handleResponse(response);
    } on ApiException {
      rethrow;
    } on SocketException {
      throw ApiException(
          'No internet connection. Please check your network and try again.');
    } on TimeoutException {
      throw ApiException('The server took too long to respond. Try again.');
    } on http.ClientException {
      throw ApiException('Network error. Please try again.');
    } catch (_) {
      throw ApiException('Something went wrong. Please try again.');
    }
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    dynamic data;
    if (response.body.isNotEmpty) {
      try {
        data = jsonDecode(response.body);
      } catch (_) {
        data = null;
      }
    }
    final map = data is Map ? data.cast<String, dynamic>() : null;
    if (response.statusCode >= 400 || (map?['error'] != null)) {
      throw ApiException(
          map?['error']?.toString() ?? _messageFor(response.statusCode));
    }
    return map ?? <String, dynamic>{};
  }

  String _messageFor(int status) => switch (status) {
        400 => 'Invalid request. Please check the details and try again.',
        401 => 'Please sign in to continue.',
        403 => 'You do not have permission to do that.',
        404 => 'The requested resource was not found.',
        409 => 'That request conflicts with existing data.',
        >= 500 => 'Server error. Please try again later.',
        _ => 'Request failed (code $status).',
      };

  Map<String, dynamic> _sub(Map<String, dynamic> data, String key) {
    final value = data[key];
    return value is Map ? value.cast<String, dynamic>() : <String, dynamic>{};
  }

  List<T> _list<T>(dynamic data, T Function(Map<String, dynamic>) fromJson) {
    if (data is! List) return <T>[];
    return data
        .whereType<Map>()
        .map((e) => fromJson(e.cast<String, dynamic>()))
        .toList();
  }

  int _asInt(dynamic value) =>
      value is num ? value.toInt() : int.tryParse('$value') ?? 0;

  // ------------------------------------------------------------------- auth

  Future<AuthResult> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final data = await _request('POST', '/auth/register', body: {
      'name': name,
      'email': email,
      'password': password,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    });
    return AuthResult(
      user: User.fromJson(_sub(data, 'user')),
      token: data['token']?.toString() ?? '',
    );
  }

  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final data = await _request('POST', '/auth/login',
        body: {'email': email, 'password': password});
    return AuthResult(
      user: User.fromJson(_sub(data, 'user')),
      token: data['token']?.toString() ?? '',
    );
  }

  Future<User> fetchMe() async =>
      User.fromJson(_sub(await _request('GET', '/auth/me'), 'user'));

  Future<User> updateProfile({
    String? name,
    String? phone,
    String? currentPassword,
    String? newPassword,
  }) async {
    final data = await _request('PUT', '/auth/profile', body: {
      if (name != null && name.isNotEmpty) 'name': name,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      if (currentPassword != null && currentPassword.isNotEmpty)
        'currentPassword': currentPassword,
      if (newPassword != null && newPassword.isNotEmpty)
        'newPassword': newPassword,
    });
    return User.fromJson(_sub(data, 'user'));
  }

  // ---------------------------------------------------------------- catalog

  Future<AppSettings> fetchSettings() async =>
      AppSettings.fromJson(
          _sub(await _request('GET', '/settings'), 'settings'));

  Future<List<Category>> fetchCategories() async =>
      _list((await _request('GET', '/categories'))['categories'],
          Category.fromJson);

  Future<PaginatedProducts> fetchProducts({
    String? search,
    String? category,
    String? sort,
    bool featured = false,
    int page = 1,
    int limit = 12,
  }) async {
    final data = await _request('GET', '/products', query: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (category != null && category.isNotEmpty) 'category': category,
      if (sort != null && sort.isNotEmpty) 'sort': sort,
      if (featured) 'featured': '1',
      'page': '$page',
      'limit': '$limit',
    });
    final pagination = _sub(data, 'pagination');
    final products = _list(data['products'], Product.fromJson);
    return PaginatedProducts(
      products: products,
      page: pagination.isEmpty ? page : _asInt(pagination['page']),
      pages: pagination.isEmpty ? 1 : _asInt(pagination['pages']),
      total: pagination.isEmpty
          ? products.length
          : _asInt(pagination['total']),
    );
  }

  Future<ProductDetailResult> fetchProduct(String slug) async {
    final data = await _request('GET', '/products/$slug');
    return ProductDetailResult(
      product: Product.fromJson(_sub(data, 'product')),
      related: _list(data['related'], Product.fromJson),
    );
  }

  Future<List<Review>> fetchReviews(String productId) async => _list(
      (await _request('GET', '/reviews', query: {'productId': productId}))
          ['reviews'],
      Review.fromJson);

  Future<void> submitReview({
    required String productId,
    required int rating,
    String? title,
    required String comment,
  }) async {
    await _request('POST', '/reviews', body: {
      'productId': productId,
      'rating': rating,
      if (title != null && title.isNotEmpty) 'title': title,
      'comment': comment,
    });
  }

  // ------------------------------------------------------------------- cart

  Future<List<CartItem>> fetchCart() async =>
      _list((await _request('GET', '/cart'))['items'], CartItem.fromJson);

  Future<List<CartItem>> addToCart({
    required String productId,
    int quantity = 1,
  }) async =>
      _list(
          (await _request('POST', '/cart',
              body: {'productId': productId, 'quantity': quantity}))['items'],
          CartItem.fromJson);

  Future<List<CartItem>> updateCartItem({
    required String itemId,
    required int quantity,
  }) async =>
      _list(
          (await _request('PUT', '/cart',
              body: {'itemId': itemId, 'quantity': quantity}))['items'],
          CartItem.fromJson);

  Future<List<CartItem>> removeCartItem(String itemId) async => _list(
      (await _request('DELETE', '/cart', query: {'itemId': itemId}))['items'],
      CartItem.fromJson);

  // --------------------------------------------------------------- wishlist

  Future<List<Product>> fetchWishlist() async {
    final data = await _request('GET', '/wishlist');
    return _list(
        data['items'], (item) => Product.fromJson(_sub(item, 'product')));
  }

  /// Toggles a product in the wishlist; returns true when it was added.
  Future<bool> toggleWishlist(String productId) async =>
      ((await _request('POST', '/wishlist', body: {'productId': productId}))[
              'added'] ??
          false) ==
      true;

  // -------------------------------------------------------------- addresses

  Future<List<Address>> fetchAddresses() async => _list(
      (await _request('GET', '/addresses'))['addresses'], Address.fromJson);

  Future<Address> addAddress({
    required String fullName,
    required String phone,
    required String line1,
    String? line2,
    required String city,
    required String state,
    required String pincode,
  }) async {
    final data = await _request('POST', '/addresses', body: {
      'fullName': fullName,
      'phone': phone,
      'line1': line1,
      'line2': line2 ?? '',
      'city': city,
      'state': state,
      'pincode': pincode,
    });
    return Address.fromJson(_sub(data, 'address'));
  }

  Future<void> deleteAddress(String id) async {
    await _request('DELETE', '/addresses', query: {'id': id});
  }

  // ----------------------------------------------------- coupons and orders

  Future<CouponResult> validateCoupon({
    required String code,
    required int subtotal,
  }) async {
    final data = await _request('POST', '/coupons/validate',
        body: {'code': code, 'subtotal': subtotal});
    return CouponResult(
      code: data['code']?.toString() ?? code,
      discount: _asInt(data['discount']),
    );
  }

  Future<List<Order>> fetchOrders() async =>
      _list((await _request('GET', '/orders'))['orders'], Order.fromJson);

  Future<PlaceOrderResult> placeOrder({
    required String addressId,
    required String paymentMethod,
    String? couponCode,
  }) async {
    final data = await _request('POST', '/orders', body: {
      'addressId': addressId,
      'paymentMethod': paymentMethod,
      if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
    });
    return PlaceOrderResult(
      order: Order.fromJson(_sub(data, 'order')),
      razorpay: data['razorpay'] == null
          ? null
          : RazorpayInfo.fromJson(_sub(data, 'razorpay')),
    );
  }

  /// Customer cancels an order. Only PLACED/CONFIRMED orders may be cancelled.
  Future<Order?> cancelOrder(String id) async {
    final data = await _request('PATCH', '/orders/$id');
    final order = data['order'];
    return order is Map ? Order.fromJson(order.cast<String, dynamic>()) : null;
  }
}
