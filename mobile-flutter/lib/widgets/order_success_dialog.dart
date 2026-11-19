import 'package:flutter/material.dart';

import '../config.dart';
import '../models/api_results.dart';
import '../services/api_service.dart';

/// Post-order success dialog. COD orders confirm cash on delivery; Razorpay
/// orders point the user to the web store to complete the payment.
Future<void> showOrderSuccessDialog(
  BuildContext context, {
  required PlaceOrderResult result,
  required String method,
}) async {
  final total = ApiService.formatINR(result.order.total);
  final orderNumber = result.order.orderNumber;
  final message = method == 'COD'
      ? 'Your order #$orderNumber has been placed. Pay $total in cash on '
          'delivery.'
      : 'Your order #$orderNumber has been created. Complete the payment of '
          '$total on the web store at $storeUrl.';
  await showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) => AlertDialog(
      icon: Icon(Icons.check_circle, color: Colors.green.shade600, size: 52),
      title: const Text('Order placed!'),
      content: Text(message),
      actions: [
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('View my orders'),
        ),
      ],
    ),
  );
}
