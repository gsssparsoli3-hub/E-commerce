import 'package:flutter/material.dart';

/// Label + formatted money value row used in order and summary cards.
/// [credit] renders the value in green (discounts / FREE shipping);
/// [emphasized] renders the bold total row.
class MoneyRow extends StatelessWidget {
  const MoneyRow({
    super.key,
    required this.label,
    required this.value,
    this.credit = false,
    this.emphasized = false,
  });

  final String label;
  final String value;
  final bool credit;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = credit
        ? Colors.green.shade700
        : (emphasized ? theme.colorScheme.primary : null);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style:
                  theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
            ),
          ),
          Text(
            value,
            style: (emphasized ? theme.textTheme.titleSmall : theme.textTheme.bodySmall)
                ?.copyWith(
              fontWeight: emphasized ? FontWeight.w800 : FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
