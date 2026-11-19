import 'package:flutter/material.dart';

import '../services/api_service.dart';

/// Renders an integer-paise amount as Indian rupees, e.g. 129900 → ₹1,299.
/// Pass a [style] with `decoration: TextDecoration.lineThrough` for MRP.
class PriceText extends StatelessWidget {
  const PriceText({super.key, required this.paise, this.style});

  final int paise;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    return Text(ApiService.formatINR(paise), style: style);
  }
}
