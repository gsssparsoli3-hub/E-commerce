import 'package:flutter/material.dart';

import '../providers/cart_provider.dart';

/// Coupon code text field with Apply button and error text; reads/writes the
/// coupon state held by [CartProvider].
class CouponInput extends StatefulWidget {
  const CouponInput({super.key, required this.cart});

  final CartProvider cart;

  @override
  State<CouponInput> createState() => _CouponInputState();
}

class _CouponInputState extends State<CouponInput> {
  final _controller = TextEditingController();
  bool _applying = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _apply() async {
    final code = _controller.text.trim();
    if (code.isEmpty || _applying) return;
    setState(() => _applying = true);
    final ok = await widget.cart.applyCoupon(code);
    if (!mounted) return;
    setState(() => _applying = false);
    if (ok) _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  hintText: 'Enter coupon code',
                  isDense: true,
                  border: OutlineInputBorder(),
                ),
                onSubmitted: (_) => _apply(),
              ),
            ),
            const SizedBox(width: 10),
            FilledButton.tonal(
              onPressed: _applying ? null : _apply,
              child: _applying
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Apply'),
            ),
          ],
        ),
        if (widget.cart.couponError != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              widget.cart.couponError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
      ],
    );
  }
}
