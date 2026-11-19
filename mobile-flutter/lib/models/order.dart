import 'package:flutter/material.dart';

import 'address.dart';

/// A snapshot of an ordered product (name/image/price frozen at order time).
class OrderItem {
  const OrderItem({
    required this.name,
    this.image,
    required this.price,
    required this.quantity,
  });

  final String name;
  final String? image;
  final int price; // paise
  final int quantity;

  int get lineTotal => price * quantity;

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        name: json['name'] as String? ?? '',
        image: json['image'] as String?,
        price: _toInt(json['price']),
        quantity: _toInt(json['quantity']),
      );
}

/// A customer order (from /api/orders). All money fields are paise.
class Order {
  const Order({
    required this.id,
    required this.orderNumber,
    required this.subtotal,
    required this.discount,
    required this.shipping,
    required this.total,
    this.couponCode,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.status,
    required this.createdAt,
    required this.items,
    this.address,
  });

  final String id;
  final String orderNumber;
  final int subtotal;
  final int discount;
  final int shipping;
  final int total;
  final String? couponCode;
  final String paymentMethod;
  final String paymentStatus;
  final String status; // PLACED | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
  final DateTime createdAt;
  final List<OrderItem> items;
  final Address? address;

  /// Customers may only cancel orders that have not shipped yet.
  bool get canCancel => status == 'PLACED' || status == 'CONFIRMED';

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id']?.toString() ?? '',
        orderNumber: json['orderNumber'] as String? ?? '',
        subtotal: _toInt(json['subtotal']),
        discount: _toInt(json['discount']),
        shipping: _toInt(json['shipping']),
        total: _toInt(json['total']),
        couponCode: json['couponCode'] as String?,
        paymentMethod: json['paymentMethod'] as String? ?? 'COD',
        paymentStatus: json['paymentStatus'] as String? ?? '',
        status: json['status'] as String? ?? 'PLACED',
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
            DateTime.now(),
        items: (json['items'] as List?)
                ?.whereType<Map>()
                .map((e) => OrderItem.fromJson(e.cast<String, dynamic>()))
                .toList() ??
            const [],
        address: json['address'] is Map
            ? Address.fromJson((json['address'] as Map).cast<String, dynamic>())
            : null,
      );
}

/// Color coding for order status chips.
Color orderStatusColor(String status) {
  switch (status) {
    case 'PLACED':
      return Colors.blue;
    case 'CONFIRMED':
      return Colors.deepPurple;
    case 'SHIPPED':
      return Colors.amber.shade800;
    case 'DELIVERED':
      return Colors.green;
    case 'CANCELLED':
      return Colors.red;
    default:
      return Colors.blueGrey;
  }
}

int _toInt(dynamic value) =>
    value is num ? value.toInt() : int.tryParse('$value') ?? 0;
