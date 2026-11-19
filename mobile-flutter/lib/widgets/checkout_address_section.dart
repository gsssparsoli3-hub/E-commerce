import 'package:flutter/material.dart';

import '../models/address.dart';

/// Radio list of delivery addresses with add/delete actions for the
/// checkout page. All mutations are delegated through callbacks.
class CheckoutAddressSection extends StatelessWidget {
  const CheckoutAddressSection({
    super.key,
    required this.addresses,
    required this.selected,
    required this.onSelected,
    required this.onAddPressed,
    required this.onDeletePressed,
  });

  final List<Address> addresses;
  final Address? selected;
  final ValueChanged<Address> onSelected;
  final VoidCallback onAddPressed;
  final ValueChanged<Address> onDeletePressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.location_on_outlined,
                    color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Delivery Address',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
                TextButton.icon(
                  onPressed: onAddPressed,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add new'),
                ),
              ],
            ),
            if (addresses.isEmpty)
              Text(
                'No saved addresses yet. Add one to place your order.',
                style:
                    theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
              )
            else
              Column(
                children: [
                  for (final address in addresses)
                    _addressTile(context, address),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _addressTile(BuildContext context, Address address) {
    final theme = Theme.of(context);
    final isSelected = selected?.id == address.id;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      leading: Radio<Address>(
        value: address,
        groupValue: selected,
        onChanged: (value) {
          if (value != null) onSelected(value);
        },
      ),
      title: Row(
        children: [
          Flexible(
            child: Text(
              address.fullName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodyMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          if (address.isDefault) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.10),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                'Default',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: theme.colorScheme.primary,
                ),
              ),
            ),
          ],
        ],
      ),
      subtitle: Text(
        '${address.phone}\n${address.fullAddress}',
        style: theme.textTheme.bodySmall,
      ),
      isThreeLine: true,
      trailing: IconButton(
        icon: Icon(Icons.delete_outline,
            size: 20, color: theme.colorScheme.error),
        tooltip: 'Delete address',
        onPressed: () => onDeletePressed(address),
      ),
    );
  }
}
