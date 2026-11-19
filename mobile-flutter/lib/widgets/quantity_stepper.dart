import 'package:flutter/material.dart';

/// Compact −/+ stepper. Calls [onChanged] with the new value; callers decide
/// how to persist it (cart update, buy quantity, ...).
class QuantityStepper extends StatelessWidget {
  const QuantityStepper({
    super.key,
    required this.value,
    required this.onChanged,
    this.min = 1,
    this.max,
  });

  final int value;
  final ValueChanged<int> onChanged;
  final int min;
  final int? max;

  @override
  Widget build(BuildContext context) {
    final canDecrement = value > min;
    final canIncrement = max == null || value < max!;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _button(
          icon: Icons.remove,
          onPressed: canDecrement ? () => onChanged(value - 1) : null,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            '$value',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        _button(
          icon: Icons.add,
          onPressed: canIncrement ? () => onChanged(value + 1) : null,
        ),
      ],
    );
  }

  Widget _button({required IconData icon, required VoidCallback? onPressed}) {
    return SizedBox(
      width: 32,
      height: 32,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          padding: EdgeInsets.zero,
          minimumSize: const Size(32, 32),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: Icon(icon, size: 16),
      ),
    );
  }
}
