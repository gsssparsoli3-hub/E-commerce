import 'package:flutter/material.dart';

import '../config.dart';
import '../models/app_settings.dart';

/// Payment method chooser for checkout. COD is fully supported; Razorpay
/// shows a note that the gateway payment is completed on the web store.
class PaymentOptions extends StatelessWidget {
  const PaymentOptions({
    super.key,
    required this.settings,
    required this.method,
    required this.onChanged,
  });

  final AppSettings? settings;
  final String method; // 'COD' | 'RAZORPAY'
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final codEnabled = settings?.codEnabled ?? true;
    final razorpayEnabled = settings?.razorpayEnabled ?? false;
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.payments_outlined, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Payment Method',
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ],
            ),
            if (!codEnabled && !razorpayEnabled)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'No payment methods are available right now. Please contact support.',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.hintColor),
                ),
              )
            else ...[
              if (codEnabled)
                RadioListTile<String>(
                  value: 'COD',
                  groupValue: method,
                  onChanged: (value) {
                    if (value != null) onChanged(value);
                  },
                  title: const Text('Cash on Delivery'),
                  subtitle: const Text('Pay in cash when your order arrives'),
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                ),
              if (razorpayEnabled)
                RadioListTile<String>(
                  value: 'RAZORPAY',
                  groupValue: method,
                  onChanged: (value) {
                    if (value != null) onChanged(value);
                  },
                  title: const Text('Razorpay (Online)'),
                  subtitle: const Text('Cards, UPI, netbanking and wallets'),
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                ),
              if (method == 'RAZORPAY')
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade200),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline, color: Colors.amber.shade900),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Online payments are completed on the web store for '
                          'now. After placing your order, finish the payment at '
                          '$storeUrl.',
                          style: theme.textTheme.bodySmall?.copyWith(height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
